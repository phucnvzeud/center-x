const express = require('express');
const router = express.Router();
const { Holiday, KindergartenClass } = require('../models');

// Get all holidays
router.get('/', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ startDate: 1 });
    res.json(holidays);
  } catch (err) {
    console.error('Error getting holidays:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single holiday by ID
router.get('/:id', async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    res.json(holiday);
  } catch (err) {
    console.error('Error getting holiday:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new holiday
router.post('/', async (req, res) => {
  try {
    const holiday = new Holiday(req.body);
    await holiday.save();
    
    // Update all active classes to apply this holiday
    const activeClasses = await KindergartenClass.find({ status: 'Active' });
    for (const kClass of activeClasses) {
      await kClass.checkHolidays([holiday]);
    }
    
    res.status(201).json(holiday);
  } catch (err) {
    console.error('Error creating holiday:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a holiday
router.put('/:id', async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    // Update all active classes to apply the updated holiday
    const activeClasses = await KindergartenClass.find({ status: 'Active' });
    for (const kClass of activeClasses) {
      await kClass.checkHolidays([holiday]);
    }
    
    res.json(holiday);
  } catch (err) {
    console.error('Error updating holiday:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a holiday
router.delete('/:id', async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    // For now, we don't reset the holiday break status on classes
    // This decision is to maintain the integrity of the session history
    
    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply holidays to all active classes
router.post('/apply-all', async (req, res) => {
  try {
    const holidays = await Holiday.find();
    const activeClasses = await KindergartenClass.find({ status: 'Active' });
    
    let updatedCount = 0;
    
    for (const kClass of activeClasses) {
      const updated = await kClass.checkHolidays(holidays);
      if (updated) updatedCount++;
    }
    
    res.json({
      message: `Holidays applied to ${updatedCount} classes`,
      totalClasses: activeClasses.length
    });
  } catch (err) {
    console.error('Error applying holidays:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if a specific date range has any holidays
router.post('/check-dates', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const holidays = await Holiday.find({
      $or: [
        // Holiday falls within the date range
        {
          $and: [
            { startDate: { $gte: start } },
            { startDate: { $lte: end } }
          ]
        },
        // Date range falls within the holiday
        {
          $and: [
            { startDate: { $lte: start } },
            { endDate: { $gte: end } }
          ]
        },
        // Holiday starts before and ends within the date range
        {
          $and: [
            { startDate: { $lte: start } },
            { endDate: { $gte: start } },
            { endDate: { $lte: end } }
          ]
        },
        // Holiday starts within and ends after the date range
        {
          $and: [
            { startDate: { $gte: start } },
            { startDate: { $lte: end } },
            { endDate: { $gte: end } }
          ]
        }
      ]
    });
    
    res.json(holidays);
  } catch (err) {
    console.error('Error checking dates for holidays:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 