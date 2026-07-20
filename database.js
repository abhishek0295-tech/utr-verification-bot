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
  async createPaymentRequest(utr, amount, regFee) {
    const { data, error } = await supabase
      .from('payments')
      .insert([{ utr, amount, reg_fee: regFee, status: 'Pending' }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(utr, status) {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('utr', utr)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentStatus(utr) {
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('utr', utr)
      .maybeSingle(); // Prevents PGRST116 throw on empty results, returning null cleanly

    if (error) throw error;
    return data;
  }
};
