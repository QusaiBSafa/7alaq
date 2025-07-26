const express = require('express');
const { body, validationResult } = require('express-validator');
const Availability = require('../models/Availability');
const Shop = require('../models/Shop');
const { auth, requireBarber } = require('../middleware/auth');

const router = express.Router();

// Set barber availability
router.post('/', auth, requireBarber, [
  body('shopId').isMongoId(),
  body('dayOfWeek').isInt({ min: 0, max: 6 }),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shopId, dayOfWeek, startTime, endTime } = req.body;

    // Check if shop exists and user is a barber in the shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    if (!shop.barbers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to set availability for this shop' });
    }

    // Validate time range
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    // Check for existing availability for same barber, shop, and day
    const existingAvailability = await Availability.findOne({
      barberId: req.user._id,
      shopId,
      dayOfWeek
    });

    if (existingAvailability) {
      // Update existing availability
      existingAvailability.startTime = startTime;
      existingAvailability.endTime = endTime;
      existingAvailability.isActive = true;
      await existingAvailability.save();

      res.json({
        message: 'Availability updated successfully',
        availability: existingAvailability
      });
    } else {
      // Create new availability
      const availability = new Availability({
        barberId: req.user._id,
        shopId,
        dayOfWeek,
        startTime,
        endTime
      });

      await availability.save();

      res.status(201).json({
        message: 'Availability created successfully',
        availability
      });
    }
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get barber availability
router.get('/barber/:barberId', async (req, res) => {
  try {
    const availability = await Availability.find({ 
      barberId: req.params.barberId,
      isActive: true 
    }).populate('shopId', 'name');

    res.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my availability (for logged-in barber)
router.get('/my', auth, requireBarber, async (req, res) => {
  try {
    const availability = await Availability.find({ 
      barberId: req.user._id 
    }).populate('shopId', 'name');

    res.json({ availability });
  } catch (error) {
    console.error('Get my availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update availability
router.put('/:id', auth, requireBarber, [
  body('dayOfWeek').optional().isInt({ min: 0, max: 6 }),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const availability = await Availability.findById(req.params.id);
    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Check if user owns this availability
    if (availability.barberId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this availability' });
    }

    const { dayOfWeek, startTime, endTime, isActive } = req.body;
    const updateData = {};

    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate time range if both times are provided
    const newStartTime = startTime || availability.startTime;
    const newEndTime = endTime || availability.endTime;
    if (newStartTime >= newEndTime) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const updatedAvailability = await Availability.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('shopId', 'name');

    res.json({
      message: 'Availability updated successfully',
      availability: updatedAvailability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete availability
router.delete('/:id', auth, requireBarber, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);
    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Check if user owns this availability
    if (availability.barberId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this availability' });
    }

    await Availability.findByIdAndDelete(req.params.id);

    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a barber on a specific date
router.get('/slots/:barberId/:date', async (req, res) => {
  try {
    const { barberId, date } = req.params;
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Get barber's availability for the day
    const availability = await Availability.findOne({
      barberId,
      dayOfWeek,
      isActive: true
    });

    if (!availability) {
      return res.json({ slots: [] });
    }

    // Get existing appointments for the barber on that date
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({
      barberId,
      appointmentDate: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Generate available slots (30-minute intervals)
    const slots = [];
    const startHour = parseInt(availability.startTime.split(':')[0]);
    const startMinute = parseInt(availability.startTime.split(':')[1]);
    const endHour = parseInt(availability.endTime.split(':')[0]);
    const endMinute = parseInt(availability.endTime.split(':')[1]);

    let currentTime = startHour * 60 + startMinute; // Convert to minutes
    const endTime = endHour * 60 + endMinute;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Check if this slot is available (not booked)
      const isBooked = appointments.some(appointment => {
        const appointmentStart = appointment.startTime;
        const appointmentEnd = appointment.endTime;
        return timeString >= appointmentStart && timeString < appointmentEnd;
      });

      if (!isBooked) {
        slots.push(timeString);
      }

      currentTime += 30; // 30-minute intervals
    }

    res.json({ slots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

