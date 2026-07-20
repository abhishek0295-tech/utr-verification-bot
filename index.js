const express = require('express');
const db = require('./database');
const telegram = require('./telegram');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/submit-payment', async (expressReq, expressRes) => {
  const { utr, amount, regFee } = expressReq.body;

  if (!utr || amount === undefined || regFee === undefined) {
    return expressRes.status(400).json({ error: 'Missing required parameters: utr, amount, regFee' });
  }

  try {
    // 1. Write data to database first
    await db.createPaymentRequest(utr, amount, regFee);
    
    // 2. Wrap Telegram broadcast inside its own try/catch block.
    // If the Telegram API fails, the user request does not throw a 500 error leaving the DB state orphaned/un-retryable.
    try {
      await telegram.sendPaymentNotification(utr, amount, regFee);
    } catch (telegramError) {
      console.error('Non-blocking Alert Error: Failed to send Telegram notification:', telegramError);
    }

    return expressRes.status(201).json({ success: true, message: 'Payment submitted for approval.' });
  } catch (error) {
    console.error('Submission Error:', error);
    if (error.code === '23505') { 
      return expressRes.status(409).json({ error: 'This UTR has already been submitted.' });
    }
    return expressRes.status(500).json({ error: 'Internal server error processing payment request.' });
  }
});

app.get('/check-status', async (expressReq, expressRes) => {
  const { utr } = expressReq.query;

  if (!utr) {
    return expressRes.status(400).json({ error: 'UTR parameter is required.' });
  }

  try {
    const payment = await db.getPaymentStatus(utr);

    if (!payment) {
      return expressRes.status(404).json({ error: 'UTR not found.' });
    }

    return expressRes.json({ status: payment.status });
  } catch (error) {
    console.error('Status Check Error:', error);
    return expressRes.status(500).json({ error: 'Internal server error checking status.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

