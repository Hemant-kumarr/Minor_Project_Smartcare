const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getStats, getAllDoctors, verifyDoctor, getAllPatients, getAllAppointments
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/doctors', getAllDoctors);
router.patch('/doctors/:id/verify', verifyDoctor);
router.get('/patients', getAllPatients);
router.get('/appointments', getAllAppointments);

module.exports = router;
