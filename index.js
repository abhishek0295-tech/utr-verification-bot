const express = require('express');
const db = require('./database');
const telegram = require('./telegram');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// Body Parsers
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// Submit Payment
// =========================
app.post('/submit-payment', async (req, res) => {

  const utr = req.body.utr || req.body["utr"];

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

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

  const utr = req.query.utr;

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

  console.log("===== APPROVE =====");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  let utr = req.body.utr || req.body["utr"];

  // Kodular JSON fallback
  if (!utr) {
    const keys = Object.keys(req.body);

    if (keys.length > 0) {
      try {
        const parsed = JSON.parse(keys[0]);
        utr = parsed.utr;
      } catch (err) {
        console.log("JSON Parse Error:", err.message);
      }
    }
  }

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

    await db.updatePaymentStatus(utr, "Approved");

    return res.json({
      success: true,
      message: "Payment approved successfully"
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

  console.log("===== REJECT =====");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  let utr = req.body.utr || req.body["utr"];

  // Kodular JSON fallback
  if (!utr) {
    const keys = Object.keys(req.body);

    if (keys.length > 0) {
      try {
        const parsed = JSON.parse(keys[0]);
        utr = parsed.utr;
      } catch (err) {
        console.log("JSON Parse Error:", err.message);
      }
    }
  }

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  try {

    await db.updatePaymentStatus(utr, "Rejected");

    return res.json({
  success: true,
  message: "Payment rejected successfully"
});

} catch (e) {

  return res.status(500).json({
    error: e.message
  });

}

});

// =========================
// Start Server
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
