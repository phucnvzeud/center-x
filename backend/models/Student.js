const mongoose = require('mongoose');
const { queueNotification } = require('../utils/notificationQueue');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
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
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  languageLevel: {
    type: String,
    enum: ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Proficient'],
    default: 'Beginner'
  },
  active: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for courses enrolled
studentSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student'
});

// Notification hooks
studentSchema.post('save', async function(doc) {
  try {
    console.log('Student save hook triggered for:', doc.name);
    
    // Using wasNew which is set in the pre-save hook
    if (this._wasNew) {
      console.log('Queueing notification for NEW student:', doc.name);
      queueNotification('student', doc._id, 'create', doc.name);
    } else {
      console.log('Queueing notification for UPDATED student:', doc.name);
      queueNotification('student', doc._id, 'update', doc.name);
    }
  } catch (error) {
    console.error('Error queueing student notifications:', error);
  }
});

// Before saving, track if new
studentSchema.pre('save', function() {
  // Store if this is a new document
  this._wasNew = this.isNew;
});

studentSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    queueNotification('student', doc._id, 'update', doc.name);
  }
});

studentSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    queueNotification('student', doc._id, 'delete', doc.name);
  }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 