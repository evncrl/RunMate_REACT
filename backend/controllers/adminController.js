const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendOrderStatusUpdate } = require('../utils/emailService');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      {
        $match: { paymentStatus: 'paid' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenue,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      recentOrders,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard stats'
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, isAdmin } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        photo: user.photo,
        displayName: user.name,
        photoURL: user.photo,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user'
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user'
    });
  }
};

// Get all orders (admin only)
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name photos price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching orders'
    });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updateData = {};

    if (status) {
      updateData.status = status;
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('user', 'name email')
      .populate('items.product', 'name photos price');

    if (status) {
      try {
        await sendOrderStatusUpdate({
          to: updatedOrder.user.email,
          order: updatedOrder
        });
      } catch (emailError) {
        console.error('Failed to send order update email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating order status'
    });
  }
};

// Get all products (admin only - with all details)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
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

// Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Product.aggregate([
      { $match: { reviews: { $exists: true, $ne: [] } } },

      { $unwind: '$reviews' },

      {
        $project: {
          _id: '$reviews._id', // Review ID
          comment: '$reviews.comment',
          rating: '$reviews.rating',
          createdAt: '$reviews.createdAt',
          userId: '$reviews.user',
          productId: '$_id', // Product ID
          productName: '$name'
        }
      },

      {
        $lookup: {
          from: 'users', // Pangalan ng collection
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },

      { $unwind: '$user' },

      {
        $project: {
          _id: 1,
          comment: 1,
          rating: 1,
          createdAt: 1,
          productId: 1,
          productName: 1,
          user: { name: '$user.name', email: '$user.email' }
        }
      },

      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      reviews
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reviews'
    });
  }
};

// Get sales data for charts with date range filter
exports.getSalesChartData = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Determine the grouping format for MongoDB aggregation
    let dateFormat;
    switch (groupBy) {
      case 'weekly':
        dateFormat = { $week: '$createdAt' };
        break;
      case 'monthly':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'daily':
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: dateFormat,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get product-wise sales
    const productSalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          paymentStatus: 'paid'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get revenue by status
    const revenueByStatus = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailySales: salesData,
        productSales: productSalesData,
        revenueByStatus,
        dateRange: {
          start,
          end
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sales data'
    });
  }
};