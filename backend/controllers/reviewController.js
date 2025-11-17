const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { cleanComment } = require('../utils/filterService');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (kailangan naka-login)
exports.createReview = async (req, res) => {
  // 1. Kunin ang data galing sa frontend at sa user
  const { rating, comment, productId, orderId, itemId } = req.body;
  const userId = req.user.id; // Ito ay galing sa 'authMiddleware' natin

  // 2. I-validate ang data
  if (!mongoose.Types.ObjectId.isValid(productId) || 
      !mongoose.Types.ObjectId.isValid(orderId) || 
      !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ success: false, message: 'Invalid IDs' });
  }

  try {
    // 3. Hanapin ang Product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 4. Hanapin ang Order at i-check kung "delivered"
    // Gagawin din natin 'to para sigurado na 'yung user ang may-ari ng order
    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId, 
      status: 'delivered' 
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Delivered order not found or you are not the owner' });
    }

    // 5. I-check kung 'yung item ay nasa order at kung na-review na
    const itemToReview = order.items.find(item => item._id.toString() === itemId);

    if (!itemToReview) {
      return res.status(404).json({ success: false, message: 'Item not found in this order' });
    }

    if (itemToReview.isReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this item' });
    }

    // 6. Filter bad words from comment
    const filteredComment = cleanComment(comment);

    // 7. Gawin ang bagong review object
    const review = {
      user: userId,
      rating: Number(rating),
      comment: filteredComment,
    };

    // 8. Idagdag ang review sa Product
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    // I-calculate ang average rating
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    // 9. I-marka ang item sa Order bilang "reviewed"
    itemToReview.isReviewed = true;
    await order.save();

    // 10. Magpadala ng success response
    res.status(201).json({ success: true, message: 'Review submitted successfully' });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private (user can only update their own review)
exports.updateReview = async (req, res) => {
  try {
    console.log('Update review endpoint hit:', req.params.reviewId);
    const { rating, comment, productId } = req.body;
    const userId = req.user._id || req.user.id;
    const reviewId = req.params.reviewId;

    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find the review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if user owns the review
    const reviewUserId = review.user._id || review.user;
    if (reviewUserId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this review' 
      });
    }

    // Filter bad words from comment
    const filteredComment = cleanComment(comment.trim());

    // Update the review
    review.rating = Number(rating);
    review.comment = filteredComment;
    review.createdAt = new Date(); // Update timestamp

    // Recalculate product rating
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.length > 0
      ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
      : 0;

    await product.save();

    res.status(200).json({ 
      success: true, 
      message: 'Review updated successfully',
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        user: review.user,
        createdAt: review.createdAt
      },
      productRating: product.rating,
      numReviews: product.numReviews
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};