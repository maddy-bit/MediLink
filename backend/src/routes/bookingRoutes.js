const express = require('express');
const BookingController = require('../controllers/bookingController');
const { authenticate, requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, requireAuth, BookingController.create);
router.post('/confirm-payment', authenticate, requireAuth, BookingController.confirmPayment);
router.get('/patient', authenticate, requireAuth, BookingController.getPatientHistory);
router.get('/hospital/:hospitalId', authenticate, requireRole('admin'), BookingController.getHospitalFeed);
router.get('/hospital', authenticate, requireRole('admin'), BookingController.getHospitalFeed); // default endpoint for logged-in admin

module.exports = router;
