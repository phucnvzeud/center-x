const express = require('express');
const router = express.Router();
const { Region, School } = require('../models');

// Get all regions
router.get('/', async (req, res) => {
  try {
    const regions = await Region.find().sort({ name: 1 });
    res.json(regions);
  } catch (err) {
    console.error('Error getting regions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single region by ID
router.get('/:id', async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    res.json(region);
  } catch (err) {
    console.error('Error getting region:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new region
router.post('/', async (req, res) => {
  try {
    const region = new Region(req.body);
    await region.save();
    res.status(201).json(region);
  } catch (err) {
    console.error('Error creating region:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a region
router.put('/:id', async (req, res) => {
  try {
    const region = await Region.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    res.json(region);
  } catch (err) {
    console.error('Error updating region:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a region
router.delete('/:id', async (req, res) => {
  try {
    // Check if region has any schools
    const schools = await School.find({ region: req.params.id });
    if (schools.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete region with associated schools. Please delete schools first.' 
      });
    }
    
    const region = await Region.findByIdAndDelete(req.params.id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    res.json({ message: 'Region deleted successfully' });
  } catch (err) {
    console.error('Error deleting region:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all schools in a region
router.get('/:id/schools', async (req, res) => {
  try {
    const schools = await School.find({ region: req.params.id }).sort({ name: 1 });
    res.json(schools);
  } catch (err) {
    console.error('Error getting schools for region:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 