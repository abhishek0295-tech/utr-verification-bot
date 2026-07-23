const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Critical: Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {

  // Create Payment Request
  async createPaymentRequest(utr, amount, regFee) {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          utr: utr,
          amount: amount,
          reg_fee: regFee,
          status: 'Pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update Payment Status
  async updatePaymentStatus(utr, status) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: status
      })
      .eq('utr', utr)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check Payment Status
  async getPaymentStatus(utr) {
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('utr', utr)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get All Pending Payments
  async getPendingPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'Pending')
      .order('id', { ascending: false });

    if (error) throw error;
    return data;
  }

};
