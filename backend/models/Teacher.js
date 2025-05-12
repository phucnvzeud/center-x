const mongoose = require('mongoose');
const { queueNotification } = require('../utils/notificationQueue');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String
  }],
  active: {
    type: Boolean,
    default: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for kindergarten classes taught by this teacher
teacherSchema.virtual('kindergartenClasses', {
  ref: 'KindergartenClass',
  localField: '_id',
  foreignField: 'teacher'
});

// Virtual for courses taught by this teacher
teacherSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'teacher'
});

// Notification hooks
teacherSchema.post('save', async function(doc) {
  try {
    console.log('Teacher save hook triggered for:', doc.name);
    
    // Using wasNew which is set in the pre-save hook
    if (this._wasNew) {
      console.log('Queueing notification for NEW teacher:', doc.name);
      queueNotification('teacher', doc._id, 'create', doc.name);
    } else {
      console.log('Queueing notification for UPDATED teacher:', doc.name);
      queueNotification('teacher', doc._id, 'update', doc.name);
    }
  } catch (error) {
    console.error('Error queueing teacher notifications:', error);
  }
});

// Before saving, track if new
teacherSchema.pre('save', function() {
  // Store if this is a new document
  this._wasNew = this.isNew;
});

teacherSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    queueNotification('teacher', doc._id, 'update', doc.name);
  }
});

teacherSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    queueNotification('teacher', doc._id, 'delete', doc.name);
  }
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher; 