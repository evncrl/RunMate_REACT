const User = require('../models/User');

// Protect admin routes
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.user.isAdmin === true) {
      return next();
    }

    const userId = req.user._id || req.user.id;
    if (!userId) {
      console.error('isAdmin middleware - No user ID found:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Invalid user data'
      });
    }

    const user = await User.findById(userId).select('isAdmin email name');

    if (!user) {
      console.error('isAdmin middleware - User not found in database:', userId);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('isAdmin middleware - User check:', {
      email: user.email,
      isAdmin: user.isAdmin,
      isAdminType: typeof user.isAdmin
    });

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.user.isAdmin = user.isAdmin;
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

