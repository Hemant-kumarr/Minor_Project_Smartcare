const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (patient)
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time || !reason) {
      return res.status(400).json({ success: false, message: 'Doctor, date, time, and reason are required.' });
    }

    // Validate doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.verificationStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check if slot is already booked
    const existing = await Appointment.findOne({
      doctorId, date, time, status: { $nin: ['cancelled'] }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This appointment slot is no longer available. Please choose another time.' });
    }

    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date,
      time,
      dayOfWeek,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This appointment slot is no longer available.' });
    }
    res.status(500).json({ success: false, message: 'Failed to book appointment.' });
  }
};

// @desc    Get all appointments for the logged-in patient
// @route   GET /api/appointments/patient
// @access  Private (patient)
const getPatientAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { patientId: req.user._id };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ date: -1, time: 1 });

    const result = appointments.map((a) => ({
      id: a._id,
      doctorName: a.doctorId?.userId?.name,
      doctorId: a.doctorId?._id,
      specialization: a.doctorId?.specialization,
      qualification: a.doctorId?.qualification,
      profileImage: a.doctorId?.profileImage,
      date: a.date,
      time: a.time,
      reason: a.reason,
      status: a.status,
      createdAt: a.createdAt
    }));

    res.status(200).json({ success: true, count: result.length, appointments: result });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
};

// @desc    Get all appointments for the logged-in doctor
// @route   GET /api/appointments/doctor
// @access  Private (doctor)
const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const { status, date } = req.query;
    const query = { doctorId: doctor._id };
    if (status) query.status = status;
    if (date) query.date = date;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone dateOfBirth gender')
      .sort({ date: 1, time: 1 });

    const result = appointments.map((a) => ({
      id: a._id,
      patientId: a.patientId?._id,
      patientName: a.patientId?.name,
      patientEmail: a.patientId?.email,
      patientPhone: a.patientId?.phone,
      patientDob: a.patientId?.dateOfBirth,
      patientGender: a.patientId?.gender,
      date: a.date,
      time: a.time,
      reason: a.reason,
      status: a.status,
      notes: a.notes,
      createdAt: a.createdAt
    }));

    res.status(200).json({ success: true, count: result.length, appointments: result });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (doctor or patient for cancellation)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, cancellationReason, notes } = req.body;
    const validStatuses = ['confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Authorization check
    const doctor = req.user.role === 'doctor' ? await Doctor.findOne({ userId: req.user._id }) : null;

    const isPatient = String(appointment.patientId) === String(req.user._id);
    const isDoctor = doctor && String(appointment.doctorId) === String(doctor._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment.' });
    }

    // Patients can only cancel their own appointments
    if (isPatient && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Patients can only cancel appointments.' });
    }

    // Cannot update a completed or already cancelled appointment
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Appointment is already ${appointment.status}.` });
    }

    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancelledBy = isPatient ? 'patient' : 'doctor';
      appointment.cancellationReason = cancellationReason || null;
    }
    if (notes) appointment.notes = notes;

    await appointment.save();

    res.status(200).json({ success: true, message: `Appointment ${status} successfully.`, appointment });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment.' });
  }
};

// @desc    Get patient dashboard stats
// @route   GET /api/appointments/patient/stats
// @access  Private (patient)
const getPatientStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [upcoming, completed, cancelled, prescriptions] = await Promise.all([
      Appointment.countDocuments({ patientId: req.user._id, status: { $in: ['pending', 'confirmed'] }, date: { $gte: today } }),
      Appointment.countDocuments({ patientId: req.user._id, status: 'completed' }),
      Appointment.countDocuments({ patientId: req.user._id, status: 'cancelled' }),
      require('../models/Prescription').countDocuments({ patientId: req.user._id })
    ]);

    // Next upcoming appointment
    const nextAppt = await Appointment.findOne({
      patientId: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: today }
    })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      stats: { upcoming, completed, cancelled, totalConsultations: completed, prescriptions },
      nextAppointment: nextAppt ? {
        id: nextAppt._id,
        doctorName: nextAppt.doctorId?.userId?.name,
        specialization: nextAppt.doctorId?.specialization,
        profileImage: nextAppt.doctorId?.profileImage,
        date: nextAppt.date,
        time: nextAppt.time,
        status: nextAppt.status
      } : null
    });
  } catch (error) {
    console.error('Patient stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone dateOfBirth gender')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const doctor = req.user.role === 'doctor' ? await Doctor.findOne({ userId: req.user._id }) : null;
    const isPatient = String(appointment.patientId._id) === String(req.user._id);
    const isDoctor = doctor && String(appointment.doctorId._id) === String(doctor._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment.' });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment.' });
  }
};

module.exports = {
  bookAppointment, getPatientAppointments, getDoctorAppointments,
  updateAppointmentStatus, getPatientStats, getAppointmentById
};
