const express = require('express');
const router = express.Router();
const { createCheckoutSession, confirmCheckout } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/confirm', protect, confirmCheckout);

module.exports = router;


