const express = require('express');
const router = express.Router();
const { Student, Enrollment, Course } = require('../models');

// @desc    Get all students
// @route   GET /api/students
// @access  Public
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a student
// @route   POST /api/students
// @access  Public
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    console.log(`Updating student with ID: ${req.params.id}`);
    console.log('Update data received:', JSON.stringify(req.body, null, 2));
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.log(`Student with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('Current student data:', JSON.stringify(student, null, 2));
    
    // Track which fields were updated
    const updates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (student[key] !== value) {
        updates[key] = {
          from: student[key],
          to: value
        };
      }
    }
    
    Object.assign(student, req.body);
    console.log('Modified student data (before save):', JSON.stringify(student, null, 2));
    console.log('Changes made:', JSON.stringify(updates, null, 2));
    
    const updatedStudent = await student.save();
    console.log('Student saved successfully:', JSON.stringify(updatedStudent, null, 2));
    
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get enrollments for a student
// @route   GET /api/students/:id/enrollments
// @access  Public
router.get('/:id/enrollments', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.params.id })
      .populate('course');
    
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Enroll student in a course
// @route   POST /api/students/:id/enroll
// @access  Public
router.post('/:id/enroll', async (req, res) => {
  try {
    console.log('Enrollment request received:', {
      studentId: req.params.id,
      body: req.body
    });
    
    const { courseId, totalAmount, amountPaid, notes, enrollmentDate } = req.body;
    
    // Check if required fields are present
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }
    
    if (totalAmount === undefined) {
      return res.status(400).json({ message: 'totalAmount is required' });
    }
    
    // Check if student exists
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.params.id,
      course: courseId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student already enrolled in this course' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: req.params.id,
      course: courseId,
      totalAmount,
      amountPaid: amountPaid || 0,
      paymentStatus: amountPaid >= totalAmount ? 'Paid' : (amountPaid > 0 ? 'Partial' : 'Pending'),
      notes: notes || '',
      enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date()
    });
    
    const savedEnrollment = await enrollment.save();
    
    // Update the course's totalStudent count
    course.totalStudent = (course.totalStudent || 0) + 1;
    await course.save();
    
    console.log(`Incremented totalStudent for course ${courseId} to ${course.totalStudent}`);
    
    res.status(201).json(savedEnrollment);
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Withdraw student from a course or update enrollment status
// @route   POST /api/students/:id/withdraw
// @access  Public
router.post('/:id/withdraw', async (req, res) => {
  try {
    const { enrollmentId, newStatus } = req.body;
    
    console.log('Enrollment status update request:', {
      studentId: req.params.id,
      enrollmentId,
      newStatus
    });
    
    // Find the enrollment
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Get the course ID first (needed for adjusting student count)
    const courseId = enrollment.course;
    console.log(`Found enrollment for course: ${courseId}`);
    
    // Get the previous enrollment status
    const previousStatus = enrollment.status;
    
    // Update enrollment status
    enrollment.status = newStatus || 'Withdrawn';
    
    // If we're updating any other fields, set them too
    if (req.body.totalAmount !== undefined) {
      enrollment.totalAmount = req.body.totalAmount;
    }
    
    if (req.body.amountPaid !== undefined) {
      enrollment.amountPaid = req.body.amountPaid;
      
      // Update payment status based on amount paid
      if (enrollment.amountPaid >= enrollment.totalAmount) {
        enrollment.paymentStatus = 'Paid';
      } else if (enrollment.amountPaid > 0) {
        enrollment.paymentStatus = 'Partial';
      } else {
        enrollment.paymentStatus = 'Pending';
      }
    }
    
    if (req.body.notes) {
      enrollment.notes = req.body.notes;
    }
    
    await enrollment.save();
    
    // Update the course's student count based on status changes
    const course = await Course.findById(courseId);
    if (course) {
      // Case 1: Student is being withdrawn - decrement count
      if (enrollment.status === 'Withdrawn' && previousStatus === 'Active') {
        course.totalStudent = Math.max(0, (course.totalStudent || 0) - 1);
        console.log(`Decremented totalStudent for course ${courseId} to ${course.totalStudent}`);
      } 
      // Case 2: Student is being reactivated - increment count
      else if (enrollment.status === 'Active' && previousStatus === 'Withdrawn') {
        course.totalStudent = (course.totalStudent || 0) + 1;
        console.log(`Incremented totalStudent for course ${courseId} to ${course.totalStudent}`);
      }
      
      await course.save();
    }
    
    res.status(200).json(enrollment);
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 