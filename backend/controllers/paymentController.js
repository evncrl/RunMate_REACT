const Stripe = require('stripe');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { generateReceiptPdf } = require('../utils/pdfService');
const { sendOrderReceipt } = require('../utils/emailService');

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const parseOrderMetadata = (metadata = {}) => {
  try {
    if (!metadata.orderData) return null;
    return JSON.parse(metadata.orderData);
  } catch (error) {
    console.error('Failed to parse order metadata', error);
    return null;
  }
};

exports.createCheckoutSession = async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.'
    });
  }

  const { items = [], shippingAddress } = req.body;

  if (!items.length) {
    return res.status(400).json({
      success: false,
      message: 'At least one item is required to start checkout'
    });
  }

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required'
    });
  }

  try {
    const userId = req.user.id;
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const lineItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      const product = products.find(
        (p) => p._id.toString() === item.productId
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      lineItems.push({
        price_data: {
          currency: process.env.CHECKOUT_CURRENCY || 'usd',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name
          }
        },
        quantity: item.quantity
      });
    }

    const metadataPayload = {
      userId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      shippingAddress
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/checkout-cancelled`,
      metadata: {
        orderData: JSON.stringify(metadataPayload)
      }
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session'
    });
  }
};

exports.confirmCheckout = async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.'
    });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'sessionId is required'
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Checkout session not found'
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed yet'
      });
    }

    const metadata = parseOrderMetadata(session.metadata);

    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: 'Missing order metadata'
      });
    }

    if (metadata.userId !== req.user.id && req.user.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this payment'
      });
    }

    const alreadyProcessed = await Order.findOne({ stripeSessionId: session.id });
    if (alreadyProcessed) {
      return res.status(200).json({
        success: true,
        order: alreadyProcessed
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of metadata.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;

      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      user: metadata.userId,
      items: orderItems,
      totalAmount,
      shippingAddress: metadata.shippingAddress,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      status: 'processing',
      stripeSessionId: session.id
    });

    try {
      const pdfBuffer = await generateReceiptPdf(order, {
        email: session.customer_email,
        name: session.customer_details?.name || req.user.name || req.user.email
      });

      await sendOrderReceipt({
        to: session.customer_email,
        order,
        pdfBuffer
      });
    } catch (receiptError) {
      console.error('Failed to send receipt email:', receiptError);
      // Continue without failing the request
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name photos price')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      order: populatedOrder
    });
  } catch (error) {
    console.error('Error confirming checkout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm checkout'
    });
  }
};


