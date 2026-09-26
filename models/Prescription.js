const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
    // e.g., "1 Tablet", "5ml"
  },
  frequency: {
    type: String,
    required: true,
    trim: true
    // e.g., "Once Daily", "Twice Daily", "Three times a day"
  },
  duration: {
    type: String,
    required: true,
    trim: true
    // e.g., "3 Days", "1 Week", "2 Weeks"
  },
  instructions: {
    type: String,
    trim: true
    // e.g., "After Food", "Before Food", "With Water"
  }
}, { _id: true });

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true
    },
    medicines: {
      type: [medicineSchema],
      default: []
    },
    doctorNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    followUpDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
