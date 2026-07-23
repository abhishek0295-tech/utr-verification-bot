const express = require('express');
const db = require('./database');
const telegram = require('./telegram');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// =========================
// Submit Payment
// =========================
app.post('/submit-payment', async (req, res) => {

  const { utr } = req.body;

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

    // Amount aur Registration Fee fix hai
    const amount = "499";
    const regFee = "499";

    await db.createPaymentRequest(
      utr,
      amount,
      regFee
    );

    try {
      await telegram.sendPaymentNotification(
        utr,
        amount,
        regFee
      );
    } catch (e) {
      console.log(e);
    }

    return res.status(201).json({
      success: true,
      message: "Payment submitted successfully."
    });

  } catch (error) {

    if (error.code === "23505") {
      return res.status(409).json({
        error: "UTR already exists."
      });
    }

    return res.status(500).json({
      error: error.message
    });

  }

});


// =========================
// Check Status
// =========================
app.get('/check-status', async (req, res) => {

  const { utr } = req.query;

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

    const payment = await db.getPaymentStatus(utr);

    if (!payment) {
      return res.status(404).json({
        error: "UTR not found."
      });
    }

    return res.json(payment);

  } catch (e) {

    return res.status(500).json({
      error: e.message
    });

  }

});


// =========================
// Pending Payments
// =========================
app.get('/pending-payments', async (req, res) => {

  try {

    const data = await db.getPendingPayments();

    return res.json(data);

  } catch (e) {

    return res.status(500).json({
      error: e.message
    });

  }

});


// =========================
// Approve Payment
// =========================
app.post('/approve', async (req, res) => {

  const { utr } = req.body;

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

    await db.updatePaymentStatus(
      utr,
      "Approved"
    );

    return res.json({
      success: true
    });

  } catch (e) {

    return res.status(500).json({
      error: e.message
    });

  }

});


// =========================
// Reject Payment
// =========================
app.post('/reject', async (req, res) => {

  const { utr } = req.body;

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

    await db.updatePaymentStatus(
      utr,
      "Rejected"
    );

    return res.json({
      success: true
    });

  } catch (e) {

    return res.status(500).json({
      error: e.message
    });

  }

});

app.listen(PORT, () => {

  console.log(`🚀 Server listening on port ${PORT}`);

});
