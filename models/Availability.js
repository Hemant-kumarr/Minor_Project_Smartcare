const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
    // Format: "10:00 AM"
  },
  isBooked: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [timeSlotSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate day entries per doctor
availabilitySchema.index({ doctorId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
