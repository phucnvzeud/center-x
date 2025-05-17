const express = require('express');
const router = express.Router();
const { KindergartenClass, School, Teacher, Holiday } = require('../models');

// Get all kindergarten classes
router.get('/', async (req, res) => {
  try {
    // Parse query filters
    const filter = {};
    if (req.query.school) {
      filter.school = req.query.school;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.teacherName) {
      filter.teacherName = { $regex: req.query.teacherName, $options: 'i' };
    }
    if (req.query.teacher) {
      filter.teacher = req.query.teacher;
    }
    
    console.log('Fetching kindergarten classes with filter:', filter);
    
    const classes = await KindergartenClass.find(filter)
      .populate('school', 'name')
      .populate('teacher', 'name email phone')
      .select('name school teacher teacherName studentCount ageGroup status startDate endDate totalSessions weeklySchedule')
      .sort({ name: 1 });
    
    console.log(`Found ${classes.length} kindergarten classes`);
    
    // Log the weeklySchedule for each class to help debug
    classes.forEach(kClass => {
      if (!kClass.weeklySchedule || kClass.weeklySchedule.length === 0) {
        console.warn(`Class ${kClass.name} (${kClass._id}) has no weeklySchedule`);
      } else {
        console.log(`Class ${kClass.name} has ${kClass.weeklySchedule.length} schedule entries`);
      }
    });
    
    res.json(classes);
  } catch (err) {
    console.error('Error getting kindergarten classes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single kindergarten class by ID
router.get('/:id', async (req, res) => {
  try {
    const kClass = await KindergartenClass.findById(req.params.id)
      .populate({
        path: 'school',
        select: 'name',
        populate: {
          path: 'region',
          select: 'name'
        }
      })
      .populate('teacher', 'name email phone specialization');
    
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    res.json(kClass);
  } catch (err) {
    console.error('Error getting kindergarten class:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new kindergarten class
router.post('/', async (req, res) => {
  try {
    // Verify that the school exists
    const school = await School.findById(req.body.school);
    if (!school) {
      return res.status(400).json({ message: 'Invalid school' });
    }
    
    // Verify that the teacher exists
    const teacher = await Teacher.findById(req.body.teacher);
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid teacher' });
    }
    
    // If teacherName is not provided, use the teacher's name from the database
    if (!req.body.teacherName && teacher) {
      req.body.teacherName = teacher.name;
    }
    
    const kClass = new KindergartenClass(req.body);
    await kClass.save();
    
    // Check for global holidays and mark sessions accordingly
    const holidays = await Holiday.find();
    if (holidays.length > 0) {
      await kClass.checkHolidays(holidays);
    }
    
    res.status(201).json(kClass);
  } catch (err) {
    console.error('Error creating kindergarten class:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a kindergarten class
router.put('/:id', async (req, res) => {
  try {
    // Verify that the class exists
    const kClass = await KindergartenClass.findById(req.params.id);
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    // Verify that the school exists
    if (req.body.school) {
      const school = await School.findById(req.body.school);
      if (!school) {
        return res.status(400).json({ message: 'Invalid school' });
      }
    }
    
    // Verify that the teacher exists
    if (req.body.teacher) {
      const teacher = await Teacher.findById(req.body.teacher);
      if (!teacher) {
        return res.status(400).json({ message: 'Invalid teacher' });
      }
      
      // If teacherName is not provided, use the teacher's name from the database
      if (!req.body.teacherName && teacher) {
        req.body.teacherName = teacher.name;
      }
    }
    
    // Update the class
    const updatedClass = await KindergartenClass.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('school', 'name').populate('teacher', 'name');
    
    // Re-check for global holidays if schedule changed
    if (req.body.weeklySchedule || req.body.startDate || req.body.totalSessions) {
      const holidays = await Holiday.find();
      if (holidays.length > 0) {
        await updatedClass.checkHolidays(holidays);
      }
    }
    
    res.json(updatedClass);
  } catch (err) {
    console.error('Error updating kindergarten class:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a kindergarten class
router.delete('/:id', async (req, res) => {
  try {
    const kClass = await KindergartenClass.findById(req.params.id);
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    await KindergartenClass.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kindergarten class deleted successfully' });
  } catch (err) {
    console.error('Error deleting kindergarten class:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a session status
router.put('/:id/sessions/:sessionIndex', async (req, res) => {
  try {
    const { id, sessionIndex } = req.params;
    const { status, notes, addCompensatory } = req.body;
    
    // Find the class
    const kClass = await KindergartenClass.findById(id);
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    // Check if the session exists
    if (!kClass.sessions || !kClass.sessions[sessionIndex]) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Update the session status
    kClass.sessions[sessionIndex].status = status;
    
    // Update notes if provided
    if (notes !== undefined) {
      kClass.sessions[sessionIndex].notes = notes;
    }
    
    // Add compensatory session if requested and the session is being canceled
    if (addCompensatory && status === 'Canceled') {
      await kClass.addCompensatorySession(sessionIndex);
    }
    
    await kClass.save();
    
    res.json(kClass);
  } catch (err) {
    console.error('Error updating session status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Permanently delete a session by its index
router.delete('/:id/sessions/:sessionIndex', async (req, res) => {
  try {
    const { id, sessionIndex } = req.params;
    const kClass = await KindergartenClass.findById(id);

    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }

    const sessionIdx = parseInt(sessionIndex, 10);
    if (isNaN(sessionIdx) || sessionIdx < 0 || sessionIdx >= kClass.sessions.length) {
      return res.status(404).json({ message: 'Session not found at the specified index' });
    }

    // Remove the session from the array
    kClass.sessions.splice(sessionIdx, 1);

    // Recalculate session stats if necessary (or ensure your model hooks handle this)
    // For example, if totalSessions on the kClass model itself needs updating
    // kClass.totalSessions = kClass.sessions.length; // Or more complex logic

    await kClass.save();
    res.json({ message: 'Session deleted permanently', updatedClass: kClass });

  } catch (err) {
    console.error('Error permanently deleting session:', err);
    res.status(500).json({ message: 'Server error while deleting session' });
  }
});

// Get all sessions for a class
router.get('/:id/sessions', async (req, res) => {
  try {
    const kClass = await KindergartenClass.findById(req.params.id);
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    // Sort sessions by date
    const sortedSessions = [...kClass.sessions].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    res.json(sortedSessions);
  } catch (err) {
    console.error('Error getting class sessions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a custom session
router.post('/:id/sessions/custom', async (req, res) => {
  try {
    const { date, startTime, endTime, notes } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    
    if (!startTime) {
      return res.status(400).json({ message: 'Start time is required' });
    }
    
    if (!endTime) {
      return res.status(400).json({ message: 'End time is required' });
    }
    
    // Find the class
    const kClass = await KindergartenClass.findById(req.params.id);
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    // Create the new custom session
    const customSession = {
      date: new Date(date),
      startTime,
      endTime,
      status: 'Completed', // Automatically mark as completed
      notes: notes || `Custom session added on ${new Date().toLocaleDateString()}`,
      isCustom: true // Flag to identify custom sessions
    };
    
    // Add the custom session
    kClass.sessions.push(customSession);
    
    // Find and remove the last compensatory session (if any)
    const compensatorySessions = kClass.sessions
      .map((session, index) => ({ session, index }))
      .filter(item => item.session.isCompensatory)
      .sort((a, b) => new Date(b.session.date) - new Date(a.session.date)); // Sort by date descending
    
    if (compensatorySessions.length > 0) {
      // Remove the most recent compensatory session
      const lastCompensatoryIndex = compensatorySessions[0].index;
      kClass.sessions.splice(lastCompensatoryIndex, 1);
    }
    
    // Update session statistics
    await kClass.save();
    
    res.status(201).json(kClass);
  } catch (err) {
    console.error('Error adding custom session:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session statistics for a class
router.get('/:id/sessions/stats', async (req, res) => {
  try {
    const kClass = await KindergartenClass.findById(req.params.id);
    if (!kClass) {
      return res.status(404).json({ message: 'Kindergarten class not found' });
    }
    
    // Count sessions by status
    const scheduled = kClass.sessions.filter(s => s.status === 'Scheduled').length;
    const completed = kClass.completedSessions || 0;
    const canceled = kClass.canceledSessions || 0;
    const holidayBreak = kClass.holidayBreakSessions || 0;
    const compensatory = kClass.compensatorySessions || 0;
    
    // Calculate remaining time
    const today = new Date();
    const endDate = new Date(kClass.endDate);
    const remainingDays = endDate > today ? 
      Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : 0;
    const remainingWeeks = Math.ceil(remainingDays / 7);
    
    // Calculate progress
    const totalSessions = kClass.totalSessions;
    const progress = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;
    
    res.json({
      total: kClass.sessions.length,
      scheduled,
      completed,
      canceled,
      holidayBreak,
      compensatory,
      remainingDays,
      remainingWeeks,
      progress,
      isFinished: completed >= totalSessions || today > endDate
    });
  } catch (err) {
    console.error('Error getting session statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get statistics about kindergarten classes
router.get('/stats/overview', async (req, res) => {
  try {
    // Count classes by status
    const activeClassesCount = await KindergartenClass.countDocuments({ status: 'Active' });
    const inactiveClassesCount = await KindergartenClass.countDocuments({ status: 'Inactive' });
    
    // Count total students
    const classesPipeline = [
      {
        $group: {
          _id: null,
          totalStudents: { $sum: '$studentCount' },
          totalClasses: { $sum: 1 }
        }
      }
    ];
    
    const classesStats = await KindergartenClass.aggregate(classesPipeline);
    
    // Count total schools and regions
    const schoolsCount = await School.countDocuments();
    const schoolsPipeline = [
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          regionsCount: { $sum: 1 }
        }
      }
    ];
    
    const regionsStats = await School.aggregate(schoolsPipeline);
    
    res.json({
      classes: {
        total: classesStats.length > 0 ? classesStats[0].totalClasses : 0,
        active: activeClassesCount,
        inactive: inactiveClassesCount
      },
      students: {
        total: classesStats.length > 0 ? classesStats[0].totalStudents : 0
      },
      schools: {
        total: schoolsCount
      },
      regions: {
        total: regionsStats.length > 0 ? regionsStats[0].regionsCount : 0
      }
    });
  } catch (err) {
    console.error('Error getting statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 