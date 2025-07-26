const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const Shop = require('../models/Shop');
const { auth, requireBarber } = require('../middleware/auth');

const router = express.Router();

// Create service (barber only)
router.post('/', auth, requireBarber, [
  body('shopId').isMongoId(),
  body('name').trim().isLength({ min: 2 }),
  body('price').isFloat({ gt: 0 }),
  body('duration').isInt({ min: 15 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { shopId, name, description, price, duration } = req.body;

    // Check if shop exists and user is the owner
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this shop' });
    }

    const service = new Service({
      shopId,
      name,
      description,
      price,
      duration
    });

    await service.save();

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shop services
router.get('/shop/:shopId', async (req, res) => {
  try {
    const services = await Service.find({ shopId: req.params.shopId });
    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service
router.put('/:id', auth, requireBarber, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('price').optional().isFloat({ gt: 0 }),
  body('duration').optional().isInt({ min: 15 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = await Service.findById(req.params.id).populate('shopId');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user is the owner of the shop
    if (service.shopId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    const { name, description, price, duration } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = price;
    if (duration) updateData.duration = duration;

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service
router.delete('/:id', auth, requireBarber, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('shopId');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user is the owner of the shop
    if (service.shopId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

