const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const otpStorage = new Map();
const verifiedEmails = new Set();

class AuthController {
  /**
   * Register a new user.
   */
  static async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields (name, email, password, role) are required' });
      }

      const emailKey = email.toLowerCase().trim();
      if (!verifiedEmails.has(emailKey)) {
        return res.status(400).json({ error: 'Email verification required. Please verify OTP first.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const user = await User.create({ name, email, password, role });
      
      // Consume verification token
      verifiedEmails.delete(emailKey);

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ error: error.message || 'Registration failed' });
    }
  }

  /**
   * Generate and send a mock 6-digit OTP.
   */
  static sendOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required to send OTP' });
      }

      const emailKey = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = User.findByEmail(emailKey);
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered' });
      }

      // Generate 6-digit random code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save to cache
      otpStorage.set(emailKey, otp);
      console.log(`[OTP DEBUG LOG] Email: ${emailKey} -> OTP: ${otp}`);

      return res.json({
        message: 'Mock OTP sent successfully!',
        otp // Return for display in alert popup mockups
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

  /**
   * Verify the OTP sent to user.
   */
  static verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

      const emailKey = email.toLowerCase().trim();
      const storedOtp = otpStorage.get(emailKey);

      if (!storedOtp) {
        return res.status(400).json({ error: 'No OTP requested for this email' });
      }

      if (storedOtp !== otp.trim()) {
        return res.status(400).json({ error: 'OTP does not match' });
      }

      // Mark verified and clear pending OTP
      otpStorage.delete(emailKey);
      verifiedEmails.add(emailKey);

      return res.json({ message: 'OTP verified successfully!' });
    } catch (error) {
      console.error('Verify OTP error:', error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }

  /**
   * Log in an existing user.
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordMatch = await User.verifyPassword(user, password);
      if (!isPasswordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const { password: _, ...userWithoutPassword } = user;
      return res.json({ message: 'Login successful', user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * Log out the current user by clearing the token cookie.
   */
  static logout(req, res) {
    res.clearCookie('token');
    return res.json({ message: 'Logout successful' });
  }

  /**
   * Get the current user profile.
   */
  static getProfile(req, res) {
    if (!req.user) {
      return res.json({ user: null });
    }
    return res.json({ user: req.user });
  }
}

module.exports = AuthController;
