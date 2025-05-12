const express = require('express');
const router = express.Router();
const { School, KindergartenClass, Region } = require('../models');

// Get all schools
router.get('/', async (req, res) => {
  try {
    // Check if we should filter by region
    const filter = {};
    if (req.query.region) {
      filter.region = req.query.region;
    }
    
    const schools = await School.find(filter)
      .populate('region', 'name')
      .sort({ name: 1 });
    res.json(schools);
  } catch (err) {
    console.error('Error getting schools:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single school by ID
router.get('/:id', async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('region', 'name');
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (err) {
    console.error('Error getting school:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new school
router.post('/', async (req, res) => {
  try {
    // Verify that the region exists
    const region = await Region.findById(req.body.region);
    if (!region) {
      return res.status(400).json({ message: 'Invalid region' });
    }
    
    const school = new School(req.body);
    await school.save();
    res.status(201).json(school);
  } catch (err) {
    console.error('Error creating school:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a school
router.put('/:id', async (req, res) => {
  try {
    // Verify that the region exists if it's being updated
    if (req.body.region) {
      const region = await Region.findById(req.body.region);
      if (!region) {
        return res.status(400).json({ message: 'Invalid region' });
      }
    }
    
    const school = await School.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (err) {
    console.error('Error updating school:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a school
router.delete('/:id', async (req, res) => {
  try {
    // Check if school has any classes
    const classes = await KindergartenClass.find({ school: req.params.id });
    if (classes.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete school with associated classes. Please delete classes first.' 
      });
    }
    
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    console.error('Error deleting school:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classes in a school
router.get('/:id/classes', async (req, res) => {
  try {
    // Check if we should filter by status
    const filter = { school: req.params.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const classes = await KindergartenClass.find(filter).sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    console.error('Error getting classes for school:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 