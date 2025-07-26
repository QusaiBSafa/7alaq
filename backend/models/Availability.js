const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure no overlapping availability for same barber on same day
availabilitySchema.index({ barberId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);

