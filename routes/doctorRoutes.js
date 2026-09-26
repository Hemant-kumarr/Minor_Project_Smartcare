const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getDoctors, getDoctorById, getDoctorSlots,
  updateDoctorProfile, getMyAvailability, setAvailability,
  deleteAvailability, getDoctorDashboard, getMyPatients
} = require('../controllers/doctorController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => {
    cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Public routes
router.get('/', getDoctors);
router.get('/:id/slots', getDoctorSlots);
router.get('/:id', getDoctorById);

// Protected doctor routes
router.get('/me/dashboard', protect, authorize('doctor'), getDoctorDashboard);
router.get('/me/patients', protect, authorize('doctor'), getMyPatients);
router.put('/me/profile', protect, authorize('doctor'), upload.single('profileImage'), updateDoctorProfile);
router.get('/me/availability', protect, authorize('doctor'), getMyAvailability);
router.post('/me/availability', protect, authorize('doctor'), setAvailability);
router.delete('/me/availability/:day', protect, authorize('doctor'), deleteAvailability);

module.exports = router;
