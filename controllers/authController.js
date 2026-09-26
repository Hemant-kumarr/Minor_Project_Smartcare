const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new patient
// @route   POST /api/auth/register
// @access  Public
const registerPatient = async (req, res) => {
  try {
    const { name, email, phone, password, dateOfBirth, gender } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      role: 'patient'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register patient error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// @desc    Register a new doctor
// @route   POST /api/auth/register-doctor
// @access  Public
const registerDoctor = async (req, res) => {
  try {
    const {
      name, email, phone, password,
      specialization, qualification, experience,
      medicalRegistrationNumber, consultationFee,
      clinicName, about
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !specialization || !qualification || !medicalRegistrationNumber) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check for duplicate medical registration number
    const existingReg = await Doctor.findOne({ medicalRegistrationNumber });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'A doctor with this registration number already exists.' });
    }

    // Create the user account
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'doctor'
    });

    // Create the doctor profile
    // Determine profile image path if uploaded
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    await Doctor.create({
      userId: user._id,
      specialization,
      qualification,
      experience: Number(experience) || 0,
      medicalRegistrationNumber,
      consultationFee: Number(consultationFee) || 0,
      clinicName: clinicName || '',
      about: about || '',
      profileImage,
      verificationStatus: 'approved' // Auto-approve for demo; change to 'pending' for real use
    });

    res.status(201).json({
      success: true,
      message: 'Doctor account created. You can now log in.',
    });
  } catch (error) {
    console.error('Register doctor error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// @desc    Login user (patient, doctor, admin)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If doctor, check approval status
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        return res.status(401).json({ success: false, message: 'Doctor profile not found.' });
      }
      if (doctor.verificationStatus === 'pending') {
        return res.status(401).json({ success: false, message: 'Your account is pending approval by admin.' });
      }
      if (doctor.verificationStatus === 'rejected') {
        return res.status(401).json({ success: false, message: 'Your account registration was rejected. Please contact support.' });
      }
    }

    const token = generateToken(user._id);

    // Determine redirect URL based on role
    let redirectUrl = '/patient/dashboard';
    if (user.role === 'doctor') redirectUrl = '/doctor/dashboard';
    if (user.role === 'admin') redirectUrl = '/admin/dashboard';

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      redirectUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        age: user.age,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
      doctorProfile
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// @desc    Update patient profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

module.exports = { registerPatient, registerDoctor, login, getMe, updateProfile, changePassword };
