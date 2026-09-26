const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');

// @desc    Get all approved doctors (with optional filters)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const { specialization, search, available } = req.query;

    // Build query
    const query = { verificationStatus: 'approved' };
    if (specialization) query.specialization = { $regex: specialization, $options: 'i' };

    let doctors = await Doctor.find(query).populate('userId', 'name email phone profileImage');

    // Filter by name search
    if (search) {
      const s = search.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.userId?.name?.toLowerCase().includes(s) ||
          d.specialization?.toLowerCase().includes(s) ||
          d.qualification?.toLowerCase().includes(s)
      );
    }

    // Format response
    const result = doctors.map((d) => ({
      id: d._id,
      userId: d.userId?._id,
      name: d.userId?.name,
      email: d.userId?.email,
      phone: d.userId?.phone,
      profileImage: d.profileImage || d.userId?.profileImage,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
      consultationFee: d.consultationFee,
      clinicName: d.clinicName,
      about: d.about,
      rating: d.rating,
      totalReviews: d.totalReviews,
      isAvailable: d.isAvailable
    }));

    res.status(200).json({ success: true, count: result.length, doctors: result });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
  }
};

// @desc    Get single doctor profile
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone');
    if (!doctor || doctor.verificationStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Get availability
    const availability = await Availability.find({ doctorId: doctor._id, isActive: true });

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        userId: doctor.userId?._id,
        name: doctor.userId?.name,
        email: doctor.userId?.email,
        phone: doctor.userId?.phone,
        profileImage: doctor.profileImage,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        medicalRegistrationNumber: doctor.medicalRegistrationNumber,
        consultationFee: doctor.consultationFee,
        clinicName: doctor.clinicName,
        about: doctor.about,
        rating: doctor.rating,
        totalReviews: doctor.totalReviews,
        isAvailable: doctor.isAvailable,
        availability
      }
    });
  } catch (error) {
    console.error('Get doctor by id error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor profile.' });
  }
};

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
// @access  Public
const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const availability = await Availability.findOne({
      doctorId: req.params.id,
      day: dayOfWeek,
      isActive: true
    });

    if (!availability) {
      return res.status(200).json({ success: true, slots: [], message: 'Doctor is not available on this day.' });
    }

    // Find already booked slots for this date
    const booked = await Appointment.find({
      doctorId: req.params.id,
      date,
      status: { $nin: ['cancelled'] }
    }).select('time');

    const bookedTimes = booked.map((a) => a.time);

    const slots = availability.slots.map((s) => ({
      time: s.time,
      isBooked: bookedTimes.includes(s.time)
    }));

    res.status(200).json({ success: true, day: dayOfWeek, slots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch slots.' });
  }
};

// @desc    Update doctor profile (by the doctor themselves)
// @route   PUT /api/doctors/profile
// @access  Private (doctor)
const updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, qualification, experience, consultationFee, clinicName, about, phone } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = Number(experience);
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
    if (clinicName) doctor.clinicName = clinicName;
    if (about) doctor.about = about;
    if (req.file) doctor.profileImage = `/uploads/${req.file.filename}`;

    await doctor.save();

    // Update phone in user model if provided
    if (phone) await User.findByIdAndUpdate(req.user._id, { phone });

    res.status(200).json({ success: true, message: 'Profile updated successfully.', doctor });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// @desc    Get doctor's own availability
// @route   GET /api/doctors/availability
// @access  Private (doctor)
const getMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const availability = await Availability.find({ doctorId: doctor._id });
    res.status(200).json({ success: true, availability });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability.' });
  }
};

// @desc    Set/update doctor availability for a day
// @route   POST /api/doctors/availability
// @access  Private (doctor)
const setAvailability = async (req, res) => {
  try {
    const { day, slots } = req.body;
    if (!day || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Day and slots array are required.' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    // Upsert availability for this day
    const availability = await Availability.findOneAndUpdate(
      { doctorId: doctor._id, day },
      { doctorId: doctor._id, day, slots: slots.map((t) => ({ time: t, isBooked: false })), isActive: true },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: `Availability for ${day} saved.`, availability });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to save availability.' });
  }
};

// @desc    Delete availability for a day
// @route   DELETE /api/doctors/availability/:day
// @access  Private (doctor)
const deleteAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    await Availability.findOneAndDelete({ doctorId: doctor._id, day: req.params.day });
    res.status(200).json({ success: true, message: `Availability for ${req.params.day} removed.` });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete availability.' });
  }
};

// @desc    Get doctor dashboard stats
// @route   GET /api/doctors/dashboard
// @access  Private (doctor)
const getDoctorDashboard = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const today = new Date().toISOString().split('T')[0];

    const [todayAppts, totalAppts, completedAppts, pendingAppts] = await Promise.all([
      Appointment.find({ doctorId: doctor._id, date: today, status: { $ne: 'cancelled' } })
        .populate('patientId', 'name dateOfBirth gender'),
      Appointment.countDocuments({ doctorId: doctor._id, status: { $ne: 'cancelled' } }),
      Appointment.countDocuments({ doctorId: doctor._id, status: 'completed' }),
      Appointment.countDocuments({ doctorId: doctor._id, status: { $in: ['pending', 'confirmed'] } })
    ]);

    // Count unique patients
    const uniquePatients = await Appointment.distinct('patientId', {
      doctorId: doctor._id,
      status: { $ne: 'cancelled' }
    });

    res.status(200).json({
      success: true,
      stats: {
        todayAppointments: todayAppts.length,
        totalAppointments: totalAppts,
        completedConsultations: completedAppts,
        pendingAppointments: pendingAppts,
        totalPatients: uniquePatients.length
      },
      todayAppointments: todayAppts
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};

// @desc    Get doctor's patients
// @route   GET /api/doctors/patients
// @access  Private (doctor)
const getMyPatients = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      status: { $ne: 'cancelled' }
    }).populate('patientId', 'name email phone dateOfBirth gender');

    // Unique patients
    const seen = new Set();
    const patients = [];
    appointments.forEach((a) => {
      if (a.patientId && !seen.has(String(a.patientId._id))) {
        seen.add(String(a.patientId._id));
        patients.push({
          id: a.patientId._id,
          name: a.patientId.name,
          email: a.patientId.email,
          phone: a.patientId.phone,
          dateOfBirth: a.patientId.dateOfBirth,
          gender: a.patientId.gender,
          lastAppointment: a.date
        });
      }
    });

    res.status(200).json({ success: true, count: patients.length, patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patients.' });
  }
};

module.exports = {
  getDoctors, getDoctorById, getDoctorSlots,
  updateDoctorProfile, getMyAvailability, setAvailability,
  deleteAvailability, getDoctorDashboard, getMyPatients
};
