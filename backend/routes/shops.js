const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { auth, requireBarber } = require('../middleware/auth');

const router = express.Router();

// Create shop (barber only)
router.post('/', auth, requireBarber, [
  body('name').trim().isLength({ min: 2 }),
  body('address').trim().isLength({ min: 5 }),
  body('city').isIn([
    'Ramallah', 'Nablus', 'Hebron', 'Bethlehem', 'Jenin',
    'Tulkarm', 'Qalqilya', 'Salfit', 'Jericho', 'Tubas'
  ]),
  body('phone').trim().isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, address, city, phone } = req.body;

    const shop = new Shop({
      name,
      description,
      address,
      city,
      phone,
      owner: req.user._id
    });

    await shop.save();
    await shop.populate('owner', 'name email');

    res.status(201).json({
      message: 'Shop created successfully',
      shop
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get barber's shops
router.get('/my', auth, requireBarber, async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user._id })
      .populate('owner', 'name email')
      .populate('barbers', 'name email');

    res.json({ shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shop by ID
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('barbers', 'name email');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shop
router.put('/:id', auth, requireBarber, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('address').optional().trim().isLength({ min: 5 }),
  body('city').optional().isIn([
    'Ramallah', 'Nablus', 'Hebron', 'Bethlehem', 'Jenin',
    'Tulkarm', 'Qalqilya', 'Salfit', 'Jericho', 'Tubas'
  ]),
  body('phone').optional().trim().isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user is the owner
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this shop' });
    }

    const { name, description, address, city, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (phone) updateData.phone = phone;

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email').populate('barbers', 'name email');

    res.json({
      message: 'Shop updated successfully',
      shop: updatedShop
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shop
router.delete('/:id', auth, requireBarber, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user is the owner
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this shop' });
    }

    await Shop.findByIdAndDelete(req.params.id);

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add barber to shop
router.post('/:id/barbers', auth, requireBarber, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user is the owner
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this shop' });
    }

    const { email } = req.body;

    // Find the barber user
    const barber = await User.findOne({ email, role: 'barber' });
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found with this email' });
    }

    // Check if barber is already in the shop
    if (shop.barbers.includes(barber._id)) {
      return res.status(400).json({ message: 'Barber is already part of this shop' });
    }

    shop.barbers.push(barber._id);
    await shop.save();
    await shop.populate('barbers', 'name email');

    res.json({
      message: 'Barber added to shop successfully',
      shop
    });
  } catch (error) {
    console.error('Add barber error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove barber from shop
router.delete('/:shopId/barbers/:barberId', auth, requireBarber, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user is the owner
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this shop' });
    }

    // Can't remove the owner
    if (req.params.barberId === shop.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove shop owner' });
    }

    shop.barbers = shop.barbers.filter(
      barberId => barberId.toString() !== req.params.barberId
    );

    await shop.save();
    await shop.populate('barbers', 'name email');

    res.json({
      message: 'Barber removed from shop successfully',
      shop
    });
  } catch (error) {
    console.error('Remove barber error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search all shops (public endpoint)
router.get('/search', async (req, res) => {
  try {
    const { city, name } = req.query;
    const query = {};

    if (city) {
      query.city = city;
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const shops = await Shop.find(query)
      .populate('owner', 'name')
      .populate('barbers', 'name')
      .select('-__v');

    res.json({ shops });
  } catch (error) {
    console.error('Search shops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search shops by city (public endpoint)
router.get('/search/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    const shops = await Shop.find({ city })
      .populate('owner', 'name')
      .populate('barbers', 'name')
      .select('-__v');

    res.json({ shops });
  } catch (error) {
    console.error('Search shops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

