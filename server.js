require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));

// Serve HTML views - Public pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/doctor-register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor-register.html')));

// Patient pages
app.get('/patient/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'dashboard.html')));
app.get('/patient/doctors', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'doctors.html')));
app.get('/patient/doctor-profile', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'doctor-profile.html')));
app.get('/patient/appointments', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'appointments.html')));
app.get('/patient/symptom-checker', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'symptom-checker.html')));
app.get('/patient/health-assistant', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'health-assistant.html')));
app.get('/patient/prescriptions', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'prescriptions.html')));
app.get('/patient/medical-history', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'medical-history.html')));
app.get('/patient/profile', (req, res) => res.sendFile(path.join(__dirname, 'views', 'patient', 'profile.html')));

// Doctor pages
app.get('/doctor/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor', 'dashboard.html')));
app.get('/doctor/appointments', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor', 'appointments.html')));
app.get('/doctor/patients', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor', 'patients.html')));
app.get('/doctor/prescription', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor', 'prescription.html')));
app.get('/doctor/availability', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor', 'availability.html')));
app.get('/doctor/profile', (req, res) => res.sendFile(path.join(__dirname, 'views', 'doctor', 'profile.html')));

// Admin pages
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html')));
app.get('/admin/doctors', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin', 'doctors.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin', 'users.html')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SmartCare AI server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
