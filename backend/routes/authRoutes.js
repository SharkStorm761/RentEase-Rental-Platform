const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/profile', auth, async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { mobileNumber },
      { returnDocument: 'after' }
    ).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'User identity fault' });
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/admin-contact', auth, async (req, res) => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) return res.json({ name: 'RentEase Team', mobileNumber: '9876543210' });
    res.json({ name: adminUser.name, mobileNumber: adminUser.mobileNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FIXED: Secure password override handler for forgot password loops
router.put('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // 1. Trace if this email is registered in the database collections
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ message: 'No registered account found matching this email address.' });
    }

    // 2. Hash the newly provided password securely via bcrypt
    const salt = await bcrypt.genSalt(10);
    const updatedHashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Commit the fresh security signature securely down to MongoDB Compass disk
    targetUser.password = updatedHashedPassword;
    await targetUser.save();

    console.log(`Security Notice: Password reset performed successfully for user account: ${email}`);
    res.json({ success: true, message: 'Your password was securely updated inside database records!' });
  } catch (err) {
    console.error("Forgot-password runtime exception caught:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;