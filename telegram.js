const { Telegraf, Markup } = require('telegraf');
const db = require('./database');
require('dotenv').config();

if (!process.env.BOT_TOKEN || !process.env.ADMIN_CHAT_ID) {
  console.error("Critical: Missing Telegram credentials in environment variables.");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

async function sendPaymentNotification(utr, amount, regFee) {
  const message = `⚠️ <b>New Payment Request</b>\n\n` +
                  `• <b>UTR:</b> <code>${utr}</code>\n` +
                  `• <b>Amount:</b> ₹${amount}\n` +
                  `• <b>Reg. Fee:</b> ₹${regFee}\n` +
                  `• <b>Status:</b> Pending`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Approve', `approve_${utr}`),
      Markup.button.callback('❌ Reject', `reject_${utr}`)
    ]
  ]);

  await bot.telegram.sendMessage(ADMIN_CHAT_ID, message, {
    parse_mode: 'HTML',
    ...keyboard
  });
}

bot.action(/^approve_(.+)$/, async (ctx) => {
  const utr = ctx.match[1];
  try {
    await db.updatePaymentStatus(utr, 'Approved');
    
    const baseText = ctx.callbackQuery.message.text || '';
    await ctx.editMessageText(
      `${baseText}\n\n✅ <b>Action:</b> Approved by Admin`,
      { parse_mode: 'HTML' }
    );
    await ctx.answerCbQuery('Payment Approved Successfully!');
  } catch (error) {
    console.error('Error approving payment via callback:', error);
    await ctx.answerCbQuery('Database update failed.', { show_alert: true });
  }
});

bot.action(/^reject_(.+)$/, async (ctx) => {
  const utr = ctx.match[1];
  try {
    await db.updatePaymentStatus(utr, 'Rejected');
    
    const baseText = ctx.callbackQuery.message.text || '';
    await ctx.editMessageText(
      `${baseText}\n\n❌ <b>Action:</b> Rejected by Admin`,
      { parse_mode: 'HTML' }
    );
    await ctx.answerCbQuery('Payment Rejected.');
  } catch (error) {
    console.error('Error rejecting payment via callback:', error);
    await ctx.answerCbQuery('Database update failed.', { show_alert: true });
  }
});

bot.launch()
  .then(() => console.log('🤖 Telegram bot initialized successfully.'))
  .catch((err) => console.error('Failed to start Telegram bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { sendPaymentNotification };
