const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getMe,
  updateProfile,
  uploadPhoto,
  socialLogin 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.post('/signup', signup);
router.post('/login', login);
router.post('/social-login', socialLogin); 


router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-photo', protect, upload.single('photo'), uploadPhoto);

module.exports = router;