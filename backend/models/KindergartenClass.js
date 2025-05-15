const mongoose = require('mongoose');
const { queueNotification } = require('../utils/notificationQueue');

const SessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Canceled', 'Holiday Break', 'Compensatory'],
    default: 'Scheduled'
  },
  notes: String,
  originalSessionDate: {
    type: Date,
    default: null
  },
  isCompensatory: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  }
});

const WeeklyScheduleSchema = new mongoose.Schema({
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
});

const KindergartenClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  teacherName: {
    type: String,
    trim: true
  },
  studentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  ageGroup: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Finished'],
    default: 'Active'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 1
  },
  weeklySchedule: [WeeklyScheduleSchema],
  sessions: [SessionSchema],
  holidays: [{
    date: Date,
    name: String
  }],
  completedSessions: {
    type: Number,
    default: 0
  },
  canceledSessions: {
    type: Number,
    default: 0
  },
  holidayBreakSessions: {
    type: Number,
    default: 0
  },
  compensatorySessions: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate end date based on start date, total sessions, and weekly schedule
KindergartenClassSchema.pre('save', function(next) {
  if (this.startDate && this.totalSessions && this.weeklySchedule && this.weeklySchedule.length > 0) {
    // First, generate all session dates
    const sessions = [];
    const holidays = this.holidays ? this.holidays.map(h => new Date(h.date).toDateString()) : [];
    
    // Map days of week to numbers
    const dayMap = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
      'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };
    
    const scheduleDays = this.weeklySchedule.map(schedule => dayMap[schedule.day]);
    let currentDate = new Date(this.startDate);
    let sessionCount = 0;
    
    // Keep track of the latest session date to set as end date
    let latestSessionDate = new Date(this.startDate);
    
    // Generate sessions until we reach the total
    while (sessionCount < this.totalSessions) {
      // Check if the current day is in our schedule
      if (scheduleDays.includes(currentDate.getDay())) {
        // Check if it's not a holiday
        if (!holidays.includes(currentDate.toDateString())) {
          // Create a new session
          const sessionDate = new Date(currentDate);
          
          // Only add new sessions if they don't already exist
          if (!this.sessions.some(s => new Date(s.date).toDateString() === sessionDate.toDateString())) {
            sessions.push({
              date: sessionDate,
              status: 'Scheduled'
            });
          }
          
          latestSessionDate = new Date(currentDate);
          sessionCount++;
        }
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Only add new sessions if they don't already exist
    const existingDates = this.sessions.map(s => new Date(s.date).toDateString());
    const newSessions = sessions.filter(s => !existingDates.includes(new Date(s.date).toDateString()));
    
    this.sessions = [...this.sessions, ...newSessions];
    this.endDate = latestSessionDate;
  }
  
  // Update session statistics
  let completed = 0;
  let canceled = 0;
  let holidayBreak = 0;
  let compensatory = 0;
  
  this.sessions.forEach(session => {
    if (session.status === 'Completed') completed++;
    else if (session.status === 'Canceled') canceled++;
    else if (session.status === 'Holiday Break') holidayBreak++;
    else if (session.status === 'Compensatory' || session.isCompensatory) compensatory++;
  });
  
  this.completedSessions = completed;
  this.canceledSessions = canceled;
  this.holidayBreakSessions = holidayBreak;
  this.compensatorySessions = compensatory;
  
  next();
});

// Method to add a compensatory session for a canceled one
KindergartenClassSchema.methods.addCompensatorySession = async function(canceledSessionIndex) {
  const canceledSession = this.sessions[canceledSessionIndex];
  if (!canceledSession) return false;
  
  // Get the day of week for the canceled session
  const canceledDate = new Date(canceledSession.date);
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][canceledDate.getDay()];
  
  // Find the matching schedule for this day
  const daySchedule = this.weeklySchedule.find(s => 
    s.day === dayOfWeek
  );
  
  if (!daySchedule) return false;
  
  // Find the latest session date
  let latestDate = new Date(0);
  this.sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (sessionDate > latestDate) {
      latestDate = sessionDate;
    }
  });
  
  // Create a new date one week after the last session
  const newSessionDate = new Date(latestDate);
  newSessionDate.setDate(newSessionDate.getDate() + 7);
  
  // Add the compensatory session
  this.sessions.push({
    date: newSessionDate,
    status: 'Compensatory',
    notes: `Compensatory session for canceled class on ${canceledDate.toLocaleDateString()}`,
    originalSessionDate: canceledSession.date,
    isCompensatory: true
  });
  
  // Update the endDate if needed
  if (newSessionDate > this.endDate) {
    this.endDate = newSessionDate;
  }
  
  await this.save();
  return true;
};

// Method to mark sessions as holiday breaks
KindergartenClassSchema.methods.checkHolidays = async function(holidays) {
  let updated = false;
  
  // Check each session against the holidays
  for (let i = 0; i < this.sessions.length; i++) {
    const session = this.sessions[i];
    const sessionDate = new Date(session.date);
    
    // Skip sessions that are already completed or canceled
    if (session.status === 'Completed' || session.status === 'Canceled') continue;
    
    // Check if this session falls on a holiday
    for (const holiday of holidays) {
      if (holiday.containsDate(sessionDate)) {
        // Mark as holiday break if not already
        if (session.status !== 'Holiday Break') {
          this.sessions[i].status = 'Holiday Break';
          this.sessions[i].notes = `Holiday: ${holiday.name}`;
          updated = true;
          break;
        }
      }
    }
  }
  
  if (updated) {
    await this.save();
  }
  
  return updated;
};

// Virtual for remaining sessions
KindergartenClassSchema.virtual('remainingSessions').get(function() {
  const completed = this.completedSessions || 0;
  const scheduled = this.sessions.filter(s => s.status === 'Scheduled').length;
  return scheduled;
});

// Virtual for remaining weeks
KindergartenClassSchema.virtual('remainingWeeks').get(function() {
  if (!this.endDate) return 0;
  
  const today = new Date();
  const endDate = new Date(this.endDate);
  
  // If class is already finished
  if (today > endDate) return 0;
  
  // Calculate weeks difference
  const diffTime = Math.abs(endDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
});

// Virtual for progress percentage
KindergartenClassSchema.virtual('progressPercentage').get(function() {
  const completed = this.completedSessions || 0;
  const total = this.totalSessions || 0;
  
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
});

// Notification hooks
KindergartenClassSchema.post('save', async function(doc) {
  try {
    console.log('Class save hook triggered for:', doc.name);
    
    // Using wasNew which is set in the pre-save hook
    if (this._wasNew) {
      console.log('Queueing notification for NEW class:', doc.name);
      queueNotification('class', doc._id, 'create', doc.name);
    } else {
      // Check for session status changes
      if (this.modifiedPaths && this.modifiedPaths().includes('sessions')) {
        // Find sessions that changed status to 'Canceled'
        const originalSessions = this._originalSessions || [];
        const newSessions = doc.sessions || [];
        
        for (let i = 0; i < newSessions.length; i++) {
          const newSession = newSessions[i];
          const originalSession = originalSessions[i];
          
          // If session status changed to Canceled
          if (originalSession && 
              originalSession.status === 'Scheduled' && 
              newSession.status === 'Canceled') {
            
            queueNotification('session', newSession._id, 'cancel', '', {
              parentEntityType: 'class',
              parentEntityId: doc._id,
              parentEntityName: doc.name,
              date: new Date(newSession.date)
            });
          }
        }
      }
      
      console.log('Queueing notification for UPDATED class:', doc.name);
      queueNotification('class', doc._id, 'update', doc.name);
    }
  } catch (error) {
    console.error('Error queueing class notifications:', error);
  }
});

// Before saving, store the original sessions for comparison and track if new
KindergartenClassSchema.pre('save', function() {
  // Store if this is a new document
  this._wasNew = this.isNew;
  
  if (this.isModified('sessions')) {
    this._originalSessions = this.isNew ? [] : [...(this.sessions || [])];
  }
});

KindergartenClassSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    queueNotification('class', doc._id, 'update', doc.name);
  }
});

KindergartenClassSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    queueNotification('class', doc._id, 'delete', doc.name);
  }
});

// Function to check for classes ending soon
async function checkClassesEndingSoon() {
  try {
    const currentDate = new Date();
    const oneWeekLater = new Date(currentDate);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    // Find classes ending in the next week that haven't been notified yet
    const endingSoonClasses = await mongoose.model('KindergartenClass').find({
      endDate: { 
        $gte: currentDate,
        $lte: oneWeekLater
      },
      status: 'Active'
    });
    
    // Import Notification model directly
    const Notification = require('../models/Notification');
    
    for (const kclass of endingSoonClasses) {
      // Check when the last "ending_soon" notification was sent for this class
      const existingNotification = await Notification.findOne({
        entityType: 'class',
        entityId: kclass._id,
        action: 'ending_soon',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Within last week
      });
      
      // If no notification was sent in the last week, send one
      if (!existingNotification) {
        queueNotification('class', kclass._id, 'ending_soon', kclass.name, {
          date: kclass.endDate
        });
      }
    }
  } catch (error) {
    console.error('Error checking classes ending soon:', error);
  }
}

// Schedule the check to run once a day
setInterval(checkClassesEndingSoon, 24 * 60 * 60 * 1000);
// Also run it once when the server starts
setTimeout(checkClassesEndingSoon, 15000);

module.exports = mongoose.model('KindergartenClass', KindergartenClassSchema); 