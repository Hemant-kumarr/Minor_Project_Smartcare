const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Create a prescription
// @route   POST /api/prescriptions
// @access  Private (doctor)
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medicines, doctorNotes, followUpDate } = req.body;

    if (!appointmentId || !diagnosis) {
      return res.status(400).json({ success: false, message: 'Appointment ID and diagnosis are required.' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || String(appointment.doctorId) !== String(doctor._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to prescribe for this appointment.' });
    }

    // Prevent duplicate prescription for same appointment
    const existing = await Prescription.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A prescription already exists for this appointment.' });
    }

    const prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: doctor._id,
      diagnosis,
      medicines: medicines || [],
      doctorNotes: doctorNotes || '',
      followUpDate: followUpDate || null
    });

    // Mark appointment as completed
    appointment.status = 'completed';
    await appointment.save();

    res.status(201).json({ success: true, message: 'Prescription saved successfully.', prescription });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ success: false, message: 'Failed to save prescription.' });
  }
};

// @desc    Get all prescriptions for the logged-in patient
// @route   GET /api/prescriptions/patient
// @access  Private (patient)
const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'date time reason')
      .sort({ createdAt: -1 });

    const result = prescriptions.map((p) => ({
      id: p._id,
      doctorName: p.doctorId?.userId?.name,
      doctorSpecialization: p.doctorId?.specialization,
      doctorQualification: p.doctorId?.qualification,
      doctorClinic: p.doctorId?.clinicName,
      doctorRegNo: p.doctorId?.medicalRegistrationNumber,
      appointmentDate: p.appointmentId?.date,
      appointmentTime: p.appointmentId?.time,
      diagnosis: p.diagnosis,
      medicines: p.medicines,
      doctorNotes: p.doctorNotes,
      followUpDate: p.followUpDate,
      createdAt: p.createdAt
    }));

    res.status(200).json({ success: true, count: result.length, prescriptions: result });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions.' });
  }
};

// @desc    Get all prescriptions written by the logged-in doctor
// @route   GET /api/prescriptions/doctor
// @access  Private (doctor)
const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const prescriptions = await Prescription.find({ doctorId: doctor._id })
      .populate('patientId', 'name email phone dateOfBirth gender')
      .populate('appointmentId', 'date time reason')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions.' });
  }
};

// @desc    Get a single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (patient who owns it, or doctor who wrote it)
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } })
      .populate('patientId', 'name email phone dateOfBirth gender')
      .populate('appointmentId', 'date time reason');

    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    const doctor = req.user.role === 'doctor' ? await Doctor.findOne({ userId: req.user._id }) : null;
    const isPatient = String(prescription.patientId._id) === String(req.user._id);
    const isDoctor = doctor && String(prescription.doctorId._id) === String(doctor._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this prescription.' });
    }

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescription.' });
  }
};

module.exports = { createPrescription, getPatientPrescriptions, getDoctorPrescriptions, getPrescriptionById };
