const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  bookAppointment, getPatientAppointments, getDoctorAppointments,
  updateAppointmentStatus, getPatientStats, getAppointmentById
} = require('../controllers/appointmentController');

router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/patient', protect, authorize('patient'), getPatientAppointments);
router.get('/patient/stats', protect, authorize('patient'), getPatientStats);
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/status', protect, updateAppointmentStatus);

module.exports = router;
