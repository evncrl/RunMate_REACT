const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  deleteProductPhoto,
  deleteReview 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth'); // <-- 2. Idagdag si 'admin'
const { uploadMultiple } = require('../utils/cloudinary');

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Protected routes (require authentication)
router.post('/', protect, uploadMultiple.array('photos', 10), createProduct);
router.put('/:id', protect, uploadMultiple.array('photos', 10), updateProduct);
router.delete('/:id', protect, deleteProduct);
router.delete('/:id/photo', protect, deleteProductPhoto);

router.delete('/:id/reviews/:reviewId', protect, deleteReview);

module.exports = router;