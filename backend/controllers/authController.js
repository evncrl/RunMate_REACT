const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name: name || ''
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
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
      message: error.message || 'Error creating user'
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password - explicitly select all fields we need
    const user = await User.findOne({ email }).select('+password email name photo isAdmin createdAt');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Explicitly get isAdmin value (handle potential undefined)
    const isAdminValue = user.isAdmin === true;

    // Log for debugging
    console.log('Login - User isAdmin:', user.isAdmin, 'Type:', typeof user.isAdmin, 'Email:', user.email);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        photo: user.photo,
        displayName: user.name,
        photoURL: user.photo,
        isAdmin: isAdminValue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Explicitly get isAdmin value (handle potential undefined)
    const isAdminValue = user.isAdmin === true;

    // Log for debugging
    console.log('getMe - User isAdmin:', user.isAdmin, 'Type:', typeof user.isAdmin, 'Email:', user.email);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        photo: user.photo,
        displayName: user.name,
        photoURL: user.photo,
        isAdmin: isAdminValue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user'
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, photo } = req.body;
    const fieldsToUpdate = {};

    if (name !== undefined) fieldsToUpdate.name = name;
    if (photo !== undefined) fieldsToUpdate.photo = photo;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

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
      message: error.message || 'Error updating profile'
    });
  }
};

// Upload photo
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo'
      });
    }

    let photoUrl;

    // If Cloudinary is configured, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudinary = require('../utils/cloudinary').cloudinary;
      const { Readable } = require('stream');

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'runmate/profile-photos',
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(req.file.buffer).pipe(uploadStream);
      });

      photoUrl = uploadResult.secure_url;
    } else {
      // Fallback: store as base64 (not recommended for production)
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { photo: photoUrl },
      {
        new: true,
        runValidators: true
      }
    );

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
      message: error.message || 'Error uploading photo'
    });
  }
};

