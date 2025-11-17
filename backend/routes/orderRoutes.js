const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All order routes require authentication
router.post('/', protect, createOrder);
router.get('/', protect, getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);

module.exports = router;

