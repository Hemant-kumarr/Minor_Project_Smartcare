const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
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
    date: {
      type: String, // Store as "YYYY-MM-DD" string for easy slot matching
      required: [true, 'Appointment date is required']
    },
    time: {
      type: String, // e.g., "10:00 AM"
      required: [true, 'Appointment time is required']
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    reason: {
      type: String,
      required: [true, 'Reason for consultation is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', null],
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Prevent double booking: same doctor, same date, same time
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
