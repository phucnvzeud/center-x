const express = require('express');
const router = express.Router();
const { Branch } = require('../models');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Public
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get branch by ID
// @route   GET /api/branches/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a branch
// @route   POST /api/branches
// @access  Public
router.post('/', async (req, res) => {
  try {
    const branch = new Branch(req.body);
    const savedBranch = await branch.save();
    res.status(201).json(savedBranch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    Object.assign(branch, req.body);
    const updatedBranch = await branch.save();
    res.json(updatedBranch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Branch removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 