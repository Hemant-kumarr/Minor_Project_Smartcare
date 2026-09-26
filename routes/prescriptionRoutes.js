const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createPrescription, getPatientPrescriptions,
  getDoctorPrescriptions, getPrescriptionById
} = require('../controllers/prescriptionController');

router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/patient', protect, authorize('patient'), getPatientPrescriptions);
router.get('/doctor', protect, authorize('doctor'), getDoctorPrescriptions);
router.get('/:id', protect, getPrescriptionById);

module.exports = router;
