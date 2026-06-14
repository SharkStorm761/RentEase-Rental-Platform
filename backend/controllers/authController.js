const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // SAFE FACTORY: Ensures every new profile instantly gets an operational string block
    user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role, 
      mobileNumber: '9999999999' 
    });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email, role, mobileNumber: user.mobileNumber } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    
    // FIXED: Uses safe string fallback evaluations to shield pre-existing legacy rows from null crashes
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        mobileNumber: user.mobileNumber || '9999999999' // CRITICAL GRACE GUARD
      } 
    });
  } catch (err) {
    console.error("Critical pointer exception caught inside auth controller login routing:", err);
    res.status(500).json({ message: "Internal server authentication exception handled safely." });
  }
};