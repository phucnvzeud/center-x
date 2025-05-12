const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Import notification queue instead of generator
const { queueNotification } = require('../utils/notificationQueue');

const sessionSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Taught', 'Absent (Personal Reason)', 'Absent (Holiday)', 'Absent (Other Reason)'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const scheduleSchema = new Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, { _id: false });

const courseSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher is required']
  },
  previousCourse: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  weeklySchedule: [scheduleSchema],
  totalSessions: {
    type: Number,
    required: [true, 'Total number of sessions is required'],
    min: 1
  },
  sessions: [sessionSchema],
  description: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Proficient'],
    required: true
  },
  maxStudents: {
    type: Number,
    default: 15
  },
  totalStudent: {
    type: Number,
    default: 0,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Upcoming', 'Finished', 'Cancelled'],
    default: 'Upcoming'
  },
  price: {
    type: Number,
    required: true
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Ensure totalStudent is always returned, defaulting to 0 if not set
      ret.totalStudent = ret.totalStudent !== undefined ? ret.totalStudent : 0;
      return ret;
    },
    virtuals: true
  },
  toObject: { virtuals: true }
});

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function() {
  return this.enrollments ? this.enrollments.length : 0;
});

// Virtual for progress (percentage of completed sessions)
courseSchema.virtual('progress').get(function() {
  if (!this.sessions || this.sessions.length === 0) return 0;
  
  const completedSessions = this.sessions.filter(session => 
    session.status === 'Taught'
  ).length;
  
  return Math.round((completedSessions / this.totalSessions) * 100);
});

// Virtual for estimated end date
courseSchema.virtual('estimatedEndDate').get(function() {
  if (!this.sessions || this.sessions.length === 0) return this.endDate;
  
  const pendingSessions = this.sessions.filter(session => 
    session.status === 'Pending'
  );
  
  if (pendingSessions.length === 0) return this.sessions[this.sessions.length - 1].date;
  
  // Sort pending sessions by date and return the last one
  const sortedPendingSessions = [...pendingSessions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  return sortedPendingSessions[0].date;
});

// Virtual for enrollments
courseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course'
});

// Method to sync totalStudent with enrollment count
courseSchema.methods.syncTotalStudentCount = function() {
  this.totalStudent = this.enrollmentCount || 0;
  return this.totalStudent;
};

// Methods

// Generate sessions based on weekly schedule and duration
courseSchema.methods.generateSessions = function() {
  this.sessions = [];
  const startDate = new Date(this.startDate);
  let sessionsGenerated = 0;
  let currentDate = new Date(startDate);
  
  // Map day strings to JavaScript day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  // Get array of day numbers from weekly schedule
  const scheduleDays = this.weeklySchedule.map(schedule => dayMap[schedule.day]);
  
  // Generate sessions until we reach the required number
  while (sessionsGenerated < this.totalSessions) {
    const currentDayOfWeek = currentDate.getDay();
    
    // Check if current day is in schedule
    if (scheduleDays.includes(currentDayOfWeek)) {
      this.sessions.push({
        date: new Date(currentDate),
        status: 'Pending',
        notes: ''
      });
      sessionsGenerated++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // If endDate is not set, set it to the last session date
  if (!this.endDate && this.sessions.length > 0) {
    this.endDate = new Date(this.sessions[this.sessions.length - 1].date);
  }
  
  return this.sessions;
};

// Update course status based on session progress
courseSchema.methods.updateStatus = function() {
  if (!this.sessions || this.sessions.length === 0) {
    this.status = 'Upcoming';
    return;
  }
  
  const now = new Date();
  const startDate = new Date(this.startDate);
  const hasStarted = startDate <= now;
  
  const completedSessions = this.sessions.filter(session => 
    session.status === 'Taught'
  ).length;
  
  const pendingSessions = this.sessions.filter(session => 
    session.status === 'Pending'
  ).length;
  
  if (completedSessions === this.totalSessions || pendingSessions === 0) {
    this.status = 'Finished';
  } else if (hasStarted) {
    this.status = 'Active';
  } else {
    this.status = 'Upcoming';
  }
  
  return this.status;
};

// Add compensatory session when a session is marked as absent
courseSchema.methods.addCompensatorySession = function(absentSessionIndex) {
  if (!this.sessions || !this.sessions[absentSessionIndex]) {
    return null;
  }
  
  // Get the last session date
  const lastSessionDate = this.sessions[this.sessions.length - 1].date;
  const lastSessionDay = new Date(lastSessionDate).getDay();
  
  // Find the next occurrence of a day in the schedule after the last session
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  const scheduleDays = this.weeklySchedule.map(schedule => dayMap[schedule.day]);
  let daysToAdd = 1;
  
  // Find how many days to add to get to the next scheduled day
  while (!scheduleDays.includes((lastSessionDay + daysToAdd) % 7)) {
    daysToAdd++;
  }
  
  // Create new date by adding days to the last session date
  const newSessionDate = new Date(lastSessionDate);
  newSessionDate.setDate(newSessionDate.getDate() + daysToAdd);
  
  // Add new compensatory session
  const newSession = {
    date: newSessionDate,
    status: 'Pending',
    notes: 'Compensatory session for missed class'
  };
  
  this.sessions.push(newSession);
  
  // Update end date if needed
  if (this.endDate && newSessionDate > this.endDate) {
    this.endDate = newSessionDate;
  }
  
  return newSession;
};

// Pre-save middleware
courseSchema.pre('save', function(next) {
  // Generate sessions if they don't exist and we have all required info
  if ((!this.sessions || this.sessions.length === 0) && 
      this.startDate && 
      this.totalSessions && 
      this.weeklySchedule && 
      this.weeklySchedule.length > 0) {
    this.generateSessions();
  }
  
  // Update course status
  this.updateStatus();
  
  // Ensure totalStudent is set
  if (this.totalStudent === undefined || this.totalStudent === null) {
    this.totalStudent = 0;
  }
  
  next();
});

// Function to ensure all existing courses have totalStudent field
async function ensureTotalStudentField() {
  // Wait for schema to be fully registered
  setTimeout(async () => {
    try {
      // Update any course documents that don't have totalStudent
      const updateResult = await mongoose.model('Course').updateMany(
        { totalStudent: { $exists: false } },
        { $set: { totalStudent: 0 } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} courses with missing totalStudent field`);
    } catch (error) {
      console.error('Error ensuring totalStudent field:', error);
    }
  }, 1000);
}

// Run the function to ensure all courses have totalStudent
ensureTotalStudentField();

// Middleware hooks for notifications
courseSchema.post('save', async function(doc) {
  try {
    console.log('Course save hook triggered for:', doc.name);
    
    // More reliable way to check if this is a new document
    // Using wasNew which is set in the pre-save hook
    if (this._wasNew) {
      console.log('Queueing notification for NEW course:', doc.name);
      queueNotification('course', doc._id, 'create', doc.name);
    } else {
      // Check for session status changes
      if (this.modifiedPaths && this.modifiedPaths().includes('sessions')) {
        // Find sessions that changed status to 'Absent'
        const originalSessions = this._originalSessions || [];
        const newSessions = doc.sessions || [];
        
        for (let i = 0; i < newSessions.length; i++) {
          const newSession = newSessions[i];
          const originalSession = originalSessions[i];
          
          // If session status changed to any type of absence
          if (originalSession && 
              originalSession.status === 'Pending' && 
              newSession.status.includes('Absent')) {
            
            queueNotification('session', newSession._id, 'cancel', '', {
              parentEntityType: 'course',
              parentEntityId: doc._id,
              parentEntityName: doc.name,
              date: new Date(newSession.date)
            });
          }
        }
      }
      
      console.log('Queueing notification for UPDATED course:', doc.name);
      queueNotification('course', doc._id, 'update', doc.name);
    }
  } catch (error) {
    console.error('Error queueing course notifications:', error);
  }
});

// Before saving, store the original sessions for comparison and track if new
courseSchema.pre('save', function() {
  // Store if this is a new document
  this._wasNew = this.isNew;
  
  if (this.isModified('sessions')) {
    this._originalSessions = this.isNew ? [] : [...(this.sessions || [])];
  }
});

courseSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    queueNotification('course', doc._id, 'update', doc.name);
  }
});

courseSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    queueNotification('course', doc._id, 'delete', doc.name);
  }
});

// Function to check for courses ending soon
async function checkCoursesEndingSoon() {
  try {
    const currentDate = new Date();
    const oneWeekLater = new Date(currentDate);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    // Find courses ending in the next week that haven't been notified yet
    const endingSoonCourses = await mongoose.model('Course').find({
      endDate: { 
        $gte: currentDate,
        $lte: oneWeekLater
      },
      status: { $in: ['Active', 'Upcoming'] }
    });
    
    // Import Notification model directly
    const Notification = require('../models/Notification');
    
    for (const course of endingSoonCourses) {
      // Check when the last "ending_soon" notification was sent for this course
      const existingNotification = await Notification.findOne({
        entityType: 'course',
        entityId: course._id,
        action: 'ending_soon',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Within last week
      });
      
      // If no notification was sent in the last week, send one
      if (!existingNotification) {
        queueNotification('course', course._id, 'ending_soon', course.name, {
          date: course.endDate
        });
      }
    }
  } catch (error) {
    console.error('Error checking courses ending soon:', error);
  }
}

// Schedule the check to run once a day
setInterval(checkCoursesEndingSoon, 24 * 60 * 60 * 1000);
// Also run it once when the server starts
setTimeout(checkCoursesEndingSoon, 10000);

module.exports = mongoose.model('Course', courseSchema); 