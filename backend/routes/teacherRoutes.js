const express = require('express');
const router = express.Router();
const { Teacher } = require('../models');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Handle GET /api/teachers/new specifically
// @route   GET /api/teachers/new
// @access  Public
router.get('/new', (req, res) => {
  // "new" is not a valid ObjectId, so this prevents a 500 error from findById("new")
  // Typically, creating a new teacher would be a POST to /api/teachers
  // and the UI route /teachers/new would display a form, not fetch a teacher with ID "new".
  res.status(400).json({
    message: "The path GET /api/teachers/new is not for fetching a teacher. Did you mean to navigate to a 'create teacher' page, or POST to /api/teachers?",
    note: "This route is handled to prevent a 500 error from Mongoose trying to cast 'new' to an ObjectId."
  });
});

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a teacher
// @route   POST /api/teachers
// @access  Public
router.post('/', async (req, res) => {
  try {
    const teacher = new Teacher(req.body);
    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a teacher
// @route   PUT /api/teachers/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    Object.assign(teacher, req.body);
    const updatedTeacher = await teacher.save();
    res.json(updatedTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a teacher
// @route   DELETE /api/teachers/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Teacher removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get courses taught by a teacher
// @route   GET /api/teachers/:id/courses
// @access  Public
router.get('/:id/courses', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('courses');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json(teacher.courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get kindergarten classes taught by a teacher
// @route   GET /api/teachers/:id/kindergarten-classes
// @access  Public
router.get('/:id/kindergarten-classes', async (req, res) => {
  try {
    // First, check if the teacher exists
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Instead of using the virtual property, directly query for the kindergarten classes
    // This ensures we get all classes that have this teacher assigned
    const { KindergartenClass } = require('../models');
    
    // Add debug logging
    console.log(`Fetching kindergarten classes for teacher ID: ${req.params.id}`);
    
    const kindergartenClasses = await KindergartenClass.find({ 
      teacher: req.params.id 
    })
    .populate('school', 'name')
    .select('name school teacher teacherName studentCount ageGroup status startDate endDate totalSessions weeklySchedule');
    
    console.log(`Found ${kindergartenClasses.length} kindergarten classes for teacher ${req.params.id}`);
    
    // Log the weekly schedule for each class to help debug
    kindergartenClasses.forEach(kClass => {
      console.log(`Class ${kClass.name} has weeklySchedule: ${JSON.stringify(kClass.weeklySchedule || [])}`);
    });
    
    res.json(kindergartenClasses);
  } catch (error) {
    console.error('Error fetching kindergarten classes for teacher:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 