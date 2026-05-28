const express = require('express');
const ReviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, ReviewController.create);
router.get('/hospital/:hospitalId', ReviewController.getByHospital);

module.exports = router;
