const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Availability = require('../models/Availability');
const { auth, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate end time based on start time and duration
const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Book appointment (customer only)
router.post('/', auth, requireCustomer, [
  body('barberId').isMongoId(),
  body('shopId').isMongoId(),
  body('serviceId').isMongoId(),
  body('appointmentDate').isISO8601(),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { barberId, shopId, serviceId, appointmentDate, startTime, notes } = req.body;

    // Get service details to calculate duration and end time
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const endTime = calculateEndTime(startTime, service.duration);
    const date = new Date(appointmentDate);
    const dayOfWeek = date.getDay();

    // Check if barber is available at this time
    const availability = await Availability.findOne({
      barberId,
      shopId,
      dayOfWeek,
      isActive: true
    });

    if (!availability) {
      return res.status(400).json({ message: 'Barber is not available on this day' });
    }

    // Check if the requested time is within availability hours
    if (startTime < availability.startTime || endTime > availability.endTime) {
      return res.status(400).json({ message: 'Requested time is outside barber availability hours' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      barberId,
      appointmentDate: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      },
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } }
          ]
        },
        {
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } }
          ]
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Create appointment
    const appointment = new Appointment({
      customerId: req.user._id,
      barberId,
      shopId,
      serviceId,
      appointmentDate: date,
      startTime,
      endTime,
      notes
    });

    await appointment.save();

    // Populate appointment details
    await appointment.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'barberId', select: 'name email' },
      { path: 'shopId', select: 'name address city phone' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer appointments
router.get('/my', auth, requireCustomer, async (req, res) => {
  try {
    const appointments = await Appointment.find({ customerId: req.user._id })
      .populate('barberId', 'name email')
      .populate('shopId', 'name address city phone')
      .populate('serviceId', 'name price duration')
      .sort({ appointmentDate: 1, startTime: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get customer appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get barber appointments
router.get('/barber/my', auth, async (req, res) => {
  try {
    // Check if user is a barber
    if (req.user.role !== 'barber') {
      return res.status(403).json({ message: 'Access denied. Barber role required.' });
    }

    const appointments = await Appointment.find({ barberId: req.user._id })
      .populate('customerId', 'name email phone')
      .populate('shopId', 'name address city phone')
      .populate('serviceId', 'name price duration')
      .sort({ appointmentDate: 1, startTime: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get barber appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status (barber only)
router.put('/:id/status', auth, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization - barber can update their appointments, customer can cancel their own
    const isBarber = req.user.role === 'barber' && appointment.barberId.toString() === req.user._id.toString();
    const isCustomerCancelling = req.user.role === 'customer' && 
                                appointment.customerId.toString() === req.user._id.toString() && 
                                req.body.status === 'cancelled';

    if (!isBarber && !isCustomerCancelling) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    appointment.status = req.body.status;
    await appointment.save();

    await appointment.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'barberId', select: 'name email' },
      { path: 'shopId', select: 'name address city phone' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment (customer only)
router.delete('/:id', auth, requireCustomer, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if customer owns this appointment
    if (appointment.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    // Check if appointment can be cancelled (not already completed)
    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get appointment details
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('barberId', 'name email')
      .populate('shopId', 'name address city phone')
      .populate('serviceId', 'name price duration');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization - customer or barber involved in the appointment
    const isAuthorized = appointment.customerId._id.toString() === req.user._id.toString() ||
                        appointment.barberId._id.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

