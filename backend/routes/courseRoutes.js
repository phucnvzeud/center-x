const express = require('express');
const router = express.Router();
const { Course, Enrollment, Student } = require('../models');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name')
      .populate('branch', 'name')
      .populate('enrollments');
    
    // Ensure totalStudent is set for all courses
    const coursesWithTotalStudent = courses.map(course => {
      const courseObj = course.toObject({ virtuals: true });
      
      // If totalStudent isn't set yet, use the enrollment count
      if (courseObj.totalStudent === undefined || courseObj.totalStudent === null) {
        // Update the course in the database (in background)
        Course.updateOne(
          { _id: course._id, totalStudent: { $exists: false } },
          { totalStudent: courseObj.enrollmentCount || 0 }
        ).catch(err => console.error(`Failed to update totalStudent for course ${course._id}:`, err));
        
        // Set it in the response
        courseObj.totalStudent = courseObj.enrollmentCount || 0;
      }
      
      return courseObj;
    });
    
    res.json(coursesWithTotalStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email phone')
      .populate('branch', 'name address')
      .populate('previousCourse', 'name level')
      .populate('enrollments');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Ensure totalStudent is set
    const courseObj = course.toObject({ virtuals: true });
    
    // If totalStudent isn't set yet, use the enrollment count
    if (courseObj.totalStudent === undefined || courseObj.totalStudent === null) {
      // Update the course in the database (in background)
      Course.updateOne(
        { _id: course._id, totalStudent: { $exists: false } },
        { totalStudent: courseObj.enrollmentCount || 0 }
      ).catch(err => console.error(`Failed to update totalStudent for course ${course._id}:`, err));
      
      // Set it in the response
      courseObj.totalStudent = courseObj.enrollmentCount || 0;
    }
    
    res.json(courseObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Public
router.post('/', async (req, res) => {
  try {
    const courseData = req.body;
    
    // Ensure totalStudent is set as a number
    courseData.totalStudent = parseInt(courseData.totalStudent || 0);
    console.log(`Creating course with totalStudent: ${courseData.totalStudent}`);
    
    const course = new Course(courseData);
    const savedCourse = await course.save();
    
    // Force fetch the saved course to ensure all fields are present
    const populatedCourse = await Course.findById(savedCourse._id)
      .populate('branch')
      .populate('teacher');
      
    console.log(`Course saved successfully with totalStudent: ${populatedCourse.totalStudent}`);
    console.log(`Direct access of totalStudent: ${populatedCourse.get('totalStudent')}`);
    
    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = req.body;
    
    console.log(`Updating course ${courseId} with data:`, JSON.stringify(updateData, null, 2));
    
    // Ensure weekly schedule is properly formatted
    if (updateData.weeklySchedule && Array.isArray(updateData.weeklySchedule)) {
      console.log(`Processing weekly schedule update with ${updateData.weeklySchedule.length} items`);
      
      // Validate each schedule item
      updateData.weeklySchedule = updateData.weeklySchedule.map(item => {
        // Ensure each item has the required fields
        if (!item.day || !item.startTime || !item.endTime) {
          console.error('Invalid schedule item:', item);
          throw new Error('Weekly schedule items must have day, startTime, and endTime');
        }
        
        return {
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime
        };
      });
    }
    
    // Ensure totalStudent is set as a number
    if (updateData.totalStudent !== undefined) {
      updateData.totalStudent = parseInt(updateData.totalStudent);
    } else {
      // Get current value if not provided
      const currentCourse = await Course.findById(courseId);
      updateData.totalStudent = currentCourse.totalStudent || 0;
    }
    
    console.log(`Updating course with totalStudent: ${updateData.totalStudent}`);
    
    // Use findByIdAndUpdate with returnDocument: 'after' to get updated document
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId, 
      updateData,
      { new: true, runValidators: true }
    ).populate('branch').populate('teacher');
    
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log(`Course updated successfully. WeeklySchedule: ${JSON.stringify(updatedCourse.weeklySchedule, null, 2)}`);
    
    // If sessions need to be regenerated (e.g., schedule changed)
    if (updateData.weeklySchedule) {
      console.log('Weekly schedule updated, regenerating sessions...');
      
      // Preserve session status for existing sessions
      const existingSessionsMap = {};
      if (updatedCourse.sessions && updatedCourse.sessions.length > 0) {
        updatedCourse.sessions.forEach(session => {
          const dateKey = new Date(session.date).toISOString().split('T')[0];
          existingSessionsMap[dateKey] = {
            status: session.status,
            notes: session.notes
          };
        });
      }
      
      // Regenerate sessions based on new schedule
      updatedCourse.generateSessions();
      
      // Restore status for existing sessions
      updatedCourse.sessions.forEach(session => {
        const dateKey = new Date(session.date).toISOString().split('T')[0];
        if (existingSessionsMap[dateKey]) {
          session.status = existingSessionsMap[dateKey].status;
          session.notes = existingSessionsMap[dateKey].notes;
        }
      });
      
      // Save the updated course with new sessions
      await updatedCourse.save();
      
      console.log(`Sessions regenerated. Total sessions: ${updatedCourse.sessions.length}`);
    }
    
    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get sessions for a course
// @route   GET /api/courses/:id/sessions
// @access  Public
router.get('/:id/sessions', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course.sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a session status
// @route   PUT /api/courses/:id/sessions/:sessionIndex
// @access  Public
router.put('/:id/sessions/:sessionIndex', async (req, res) => {
  try {
    const { id, sessionIndex } = req.params;
    const { status, notes, addCompensatory } = req.body;
    
    console.log(`Updating session ${id}/${sessionIndex}:`, {
      newStatus: status,
      addCompensatory: addCompensatory
    });
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (!course.sessions[sessionIndex]) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Get previous status
    const previousStatus = course.sessions[sessionIndex].status;
    console.log(`Previous status: ${previousStatus}`);
    
    // Update session
    course.sessions[sessionIndex].status = status;
    if (notes !== undefined) {
      course.sessions[sessionIndex].notes = notes;
    }
    
    // Check if we need to add a compensatory session
    // Use the explicit flag if provided, otherwise use the status change logic
    const isAbsenceStatus = (status) => status.startsWith('Absent');
    const needsCompensatory = addCompensatory !== undefined 
      ? addCompensatory 
      : (!isAbsenceStatus(previousStatus) && isAbsenceStatus(status));
    
    console.log(`Compensatory session needed: ${needsCompensatory}`);
    
    let compensatorySession = null;
    if (needsCompensatory) {
      // Add compensatory session
      compensatorySession = course.addCompensatorySession(parseInt(sessionIndex));
      console.log('Added compensatory session:', {
        date: compensatorySession.date,
        status: compensatorySession.status,
        notes: compensatorySession.notes
      });
    }
    
    // Update course status
    course.updateStatus();
    
    await course.save();
    console.log(`Course saved. Total sessions: ${course.sessions.length}`);
    
    // Return sessions along with compensatory session info
    res.json({
      sessions: course.sessions,
      compensatorySessionAdded: !!compensatorySession,
      compensatorySession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get enrollments for a course
// @route   GET /api/courses/:id/enrollments
// @access  Public
router.get('/:id/enrollments', async (req, res) => {
  try {
    console.log(`Getting enrollments for course ${req.params.id}`);
    
    // Find course first to validate it exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find all enrollments for this course and populate student details
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email phone dateOfBirth address')
      .sort({ enrollmentDate: -1 });
    
    // Count active enrollments (not withdrawn)
    const activeEnrollments = enrollments.filter(e => e.status !== 'Withdrawn');
    
    // Update the course's totalStudent if it doesn't match active enrollment count
    if (course.totalStudent !== activeEnrollments.length) {
      course.totalStudent = activeEnrollments.length;
      await course.save();
      console.log(`Updated course ${req.params.id} totalStudent to ${course.totalStudent}`);
    }
    
    console.log(`Found ${enrollments.length} enrollments (${activeEnrollments.length} active) for course ${req.params.id}`);
    
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new enrollment to a course
// @route   POST /api/courses/:id/enrollments
// @access  Public
router.post('/:id/enrollments', async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if we already have max students
    if (course.totalStudent >= course.maxStudents) {
      return res.status(400).json({ 
        message: `Cannot enroll: Course already has maximum number of students (${course.maxStudents})`
      });
    }
    
    // Extract enrollment data
    const { student, enrollmentDate, status } = req.body;
    
    // Check if this is existing student or new student data
    let studentId;
    if (typeof student === 'string') {
      // Existing student ID provided
      studentId = student;
    } else {
      // Create a new student with the provided data
      const newStudent = new Student({
        name: student.name,
        email: student.email,
        phone: student.phone,
        languageLevel: student.languageLevel || 'Beginner',
        notes: student.notes,
        active: true
      });
      
      const savedStudent = await newStudent.save();
      studentId = savedStudent._id;
    }
    
    // Create new enrollment
    const newEnrollment = new Enrollment({
      student: studentId,
      course: courseId,
      enrollmentDate: enrollmentDate || new Date(),
      status: status || 'Active',
      totalAmount: course.price // Use course price as default
    });
    
    const savedEnrollment = await newEnrollment.save();
    
    // Increment course student count
    course.totalStudent = (course.totalStudent || 0) + 1;
    await course.save();
    
    // Fetch and return the populated enrollment
    const populatedEnrollment = await Enrollment.findById(savedEnrollment._id)
      .populate('student', 'name email phone languageLevel active');
    
    res.status(201).json(populatedEnrollment);
  } catch (error) {
    console.error('Error enrolling student:', error);
    
    // Handle duplicate enrollment
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }
    
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update an enrollment
// @route   PUT /api/courses/:courseId/enrollments/:enrollmentId
// @access  Public
router.put('/:courseId/enrollments/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const updateData = req.body;
    
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Update enrollment fields
    if (updateData.status) enrollment.status = updateData.status;
    if (updateData.enrollmentDate) enrollment.enrollmentDate = updateData.enrollmentDate;
    if (updateData.notes) enrollment.notes = updateData.notes;
    
    // Update student if data provided
    if (updateData.student && typeof updateData.student === 'object') {
      const student = await Student.findById(enrollment.student);
      if (student) {
        if (updateData.student.name) student.name = updateData.student.name;
        if (updateData.student.email) student.email = updateData.student.email;
        if (updateData.student.phone) student.phone = updateData.student.phone;
        if (updateData.student.languageLevel) student.languageLevel = updateData.student.languageLevel;
        if (updateData.student.active !== undefined) student.active = updateData.student.active;
        
        await student.save();
      }
    }
    
    // Save the enrollment
    const updatedEnrollment = await enrollment.save();
    
    // Return the updated enrollment with student data
    const populatedEnrollment = await Enrollment.findById(updatedEnrollment._id)
      .populate('student', 'name email phone languageLevel active');
    
    res.json(populatedEnrollment);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Remove an enrollment
// @route   DELETE /api/courses/:courseId/enrollments/:enrollmentId
// @access  Public
router.delete('/:courseId/enrollments/:enrollmentId', async (req, res) => {
  try {
    const { courseId, enrollmentId } = req.params;
    
    // Find the enrollment
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Delete the enrollment
    await Enrollment.findByIdAndDelete(enrollmentId);
    
    // Decrement the course student count
    const course = await Course.findById(courseId);
    if (course) {
      course.totalStudent = Math.max(0, (course.totalStudent || 0) - 1);
      await course.save();
    }
    
    res.json({ message: 'Enrollment removed successfully' });
  } catch (error) {
    console.error('Error removing enrollment:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Export course enrollments to CSV
// @route   GET /api/courses/:id/enrollments/export
// @access  Public
router.get('/:id/enrollments/export', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Get the course with all enrollments
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get all enrollments with student data
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email phone languageLevel active');
    
    // Create CSV header
    const csvHeader = 'Name,Email,Phone,Enrollment Date,Status,Active\n';
    
    // Create CSV rows
    const csvRows = enrollments.map(enrollment => {
      const student = enrollment.student;
      const enrollmentDate = enrollment.enrollmentDate 
        ? new Date(enrollment.enrollmentDate).toLocaleDateString() 
        : 'N/A';
      
      return `${student.name || ''},${student.email || ''},${student.phone || ''},${enrollmentDate},${enrollment.status},${student.active ? 'Yes' : 'No'}`;
    });
    
    // Combine header and rows
    const csv = csvHeader + csvRows.join('\n');
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${course.name.replace(/\s+/g, '_')}_Students.csv`);
    
    // Send CSV data
    res.send(csv);
  } catch (error) {
    console.error('Error exporting enrollments:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get course progress summary
// @route   GET /api/courses/:id/progress
// @access  Public
router.get('/:id/progress', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('branch', 'name')
      .populate({
        path: 'enrollments',
        populate: {
          path: 'student',
          select: 'name'
        }
      });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const completedSessions = course.sessions.filter(s => s.status === 'Taught').length;
    const pendingSessions = course.sessions.filter(s => s.status === 'Pending').length;
    const absenceSessions = course.sessions.filter(s => s.status.startsWith('Absent')).length;
    
    const progress = {
      courseName: course.name,
      branch: course.branch?.name || 'Unknown Branch',
      teacher: course.teacher ? course.teacher.name : 'Unassigned',
      totalSessions: course.totalSessions,
      completedSessions,
      pendingSessions,
      absenceSessions,
      progressPercentage: course.progress,
      enrollmentCount: course.enrollmentCount,
      status: course.status,
      startDate: course.startDate,
      estimatedEndDate: course.estimatedEndDate
    };
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Force update totalStudent field for all courses
// @route   POST /api/courses/update-total-students
// @access  Public
router.post('/update-total-students', async (req, res) => {
  try {
    // Get all courses with their enrollments
    const courses = await Course.find().populate('enrollments');
    
    let updatedCount = 0;
    
    // Update each course
    for (const course of courses) {
      const enrollmentCount = course.enrollments ? course.enrollments.length : 0;
      
      // Update the course
      await Course.updateOne(
        { _id: course._id },
        { $set: { totalStudent: enrollmentCount } }
      );
      
      updatedCount++;
    }
    
    res.json({ 
      message: `Successfully updated totalStudent for ${updatedCount} courses`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error in force update endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Increment totalStudent when a student enrolls
// @route   PUT /api/courses/:id/increment-student
// @access  Public
router.put('/:id/increment-student', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Find course and increment the totalStudent field
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Increment the totalStudent field by 1
    course.totalStudent = (course.totalStudent || 0) + 1;
    const savedCourse = await course.save();
    
    console.log(`Incremented totalStudent for ${courseId}: new value ${savedCourse.totalStudent}`);
    
    res.json({ 
      message: 'Student count incremented',
      totalStudent: savedCourse.totalStudent
    });
  } catch (error) {
    console.error('Error incrementing totalStudent:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Decrement totalStudent when a student withdraws
// @route   PUT /api/courses/:id/decrement-student
// @access  Public
router.put('/:id/decrement-student', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Find course and decrement the totalStudent field
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Decrement, but don't go below 0
    course.totalStudent = Math.max(0, (course.totalStudent || 0) - 1);
    const savedCourse = await course.save();
    
    console.log(`Decremented totalStudent for ${courseId}: new value ${savedCourse.totalStudent}`);
    
    res.json({ 
      message: 'Student count decremented',
      totalStudent: savedCourse.totalStudent
    });
  } catch (error) {
    console.error('Error decrementing totalStudent:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 