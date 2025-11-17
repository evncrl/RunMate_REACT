const express = require('express');
const router = express.Router();
const { createReview, updateReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Routes
router.post('/', protect, createReview);
router.put('/:reviewId', protect, updateReview);

module.exports = router;