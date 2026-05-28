const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

module.exports = router;
