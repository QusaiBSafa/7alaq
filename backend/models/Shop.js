const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    enum: [
      'Ramallah',
      'Nablus', 
      'Hebron',
      'Bethlehem',
      'Jenin',
      'Tulkarm',
      'Qalqilya',
      'Salfit',
      'Jericho',
      'Tubas'
    ]
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barbers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Add owner to barbers array automatically
shopSchema.pre('save', function(next) {
  if (this.isNew && !this.barbers.includes(this.owner)) {
    this.barbers.push(this.owner);
  }
  next();
});

module.exports = mongoose.model('Shop', shopSchema);

