const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
const getStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, pendingDoctors, totalAppointments] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ verificationStatus: 'approved' }),
      Doctor.countDocuments({ verificationStatus: 'pending' }),
      Appointment.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      stats: { totalPatients, totalDoctors, pendingDoctors, totalAppointments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

// @desc    Get all doctors (for admin)
// @route   GET /api/admin/doctors
// @access  Private (admin)
const getAllDoctors = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { verificationStatus: status } : {};
    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
  }
};

// @desc    Approve or reject a doctor
// @route   PATCH /api/admin/doctors/:id/verify
// @access  Private (admin)
const verifyDoctor = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('userId', 'name email');

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    res.status(200).json({ success: true, message: `Doctor ${status}.`, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update doctor status.' });
  }
};

// @desc    Get all patients
// @route   GET /api/admin/patients
// @access  Private (admin)
const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: patients.length, patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patients.' });
  }
};

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private (admin)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'name email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
};

module.exports = { getStats, getAllDoctors, verifyDoctor, getAllPatients, getAllAppointments };
