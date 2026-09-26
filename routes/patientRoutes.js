const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// @desc    Get patient medical history (all appointments + prescriptions)
// @route   GET /api/patients/history
// @access  Private (patient)
router.get('/history', protect, authorize('patient'), async (req, res) => {
  try {
    const [appointments, prescriptions] = await Promise.all([
      Appointment.find({ patientId: req.user._id })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ date: -1 }),
      Prescription.find({ patientId: req.user._id })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({ success: true, appointments, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch medical history.' });
  }
});

module.exports = router;
