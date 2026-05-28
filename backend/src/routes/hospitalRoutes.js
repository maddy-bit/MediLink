const express = require('express');
const HospitalController = require('../controllers/hospitalController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', HospitalController.search);
router.get('/admin-hospital', authenticate, requireRole('admin'), HospitalController.getAdminHospital);
router.get('/:id', HospitalController.getDetails);
router.put('/:hospitalId/service', authenticate, requireRole('admin'), HospitalController.updateService);

module.exports = router;
