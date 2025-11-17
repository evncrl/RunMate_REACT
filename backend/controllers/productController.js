const Product = require('../models/Product');
const { uploadMultipleToCloudinary } = require('../utils/cloudinary');

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    let photos = [];

    // Upload photos if provided
    if (req.files && req.files.length > 0) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        photos = await uploadMultipleToCloudinary(req.files, 'runmate/products');
      } else {
        // Fallback: base64 encoding
        photos = req.files.map(file => 
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        );
      }
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      photos,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      minRating
    } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (
      (minPrice !== undefined && minPrice !== '') ||
      (maxPrice !== undefined && maxPrice !== '')
    ) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    if (minRating !== undefined && minRating !== '') {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching products'
    });
  }
};

// Get Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email') 
      .populate({
          path: 'reviews.user', 
          select: 'name'        
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching product'
    });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.isAdmin === true;
    const isOwner =
      product.createdBy &&
      product.createdBy.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const { name, description, price, category, stock } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);

    // Handle photo updates
    if (req.files && req.files.length > 0) {
      let newPhotos = [];
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        newPhotos = await uploadMultipleToCloudinary(req.files, 'runmate/products');
      } else {
        newPhotos = req.files.map(file => 
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        );
      }

      if (req.body.replacePhotos === 'true') {
        updateData.photos = newPhotos;
      } else {
        updateData.photos = [...product.photos, ...newPhotos];
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.isAdmin === true;
    const isOwner =
      product.createdBy &&
      product.createdBy.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting product'
    });
  }
};

// Delete Product Photo
exports.deleteProductPhoto = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.isAdmin === true;
    const isOwner =
      product.createdBy &&
      product.createdBy.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this photo'
      });
    }

    const { photoUrl } = req.body;
    product.photos = product.photos.filter((photo) => photo !== photoUrl);

    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting photo'
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); 

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = product.reviews.find(
      (r) => r._id.toString() === req.params.reviewId
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if user owns the review or is an admin
    const userId = req.user._id || req.user.id;
    const reviewUserId = review.user._id || review.user;
    const isAdmin = req.user.isAdmin === true;
    const isOwner = reviewUserId.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    product.reviews.pull(review._id);

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
        : 0; 

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted',
      rating: product.rating,
      numReviews: product.numReviews
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting review'
    });
  }
};