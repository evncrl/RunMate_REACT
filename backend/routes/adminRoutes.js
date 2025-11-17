const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllOrdersAdmin,
  getAllProductsAdmin,
  updateOrderStatus,
  getAllReviews,
  getSalesChartData
} = require('../controllers/adminController');
const { deleteOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin'); 

router.use(protect);
router.use(isAdmin); 

router.get('/dashboard', getDashboardStats);
router.get('/sales-chart', getSalesChartData);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/orders', getAllOrdersAdmin);
router.put('/orders/:id', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);
router.get('/products', getAllProductsAdmin);
router.get('/reviews', getAllReviews);

module.exports = router;