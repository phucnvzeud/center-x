const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Withdrawn', 'Suspended'],
    default: 'Active'
  },
  attendance: [{
    sessionDate: Date,
    present: Boolean,
    notes: String
  }],
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate attendance percentage
enrollmentSchema.virtual('attendancePercentage').get(function() {
  if (!this.attendance || this.attendance.length === 0) return 0;
  
  const presentSessions = this.attendance.filter(record => record.present).length;
  return Math.round((presentSessions / this.attendance.length) * 100);
});

// Calculate remaining balance
enrollmentSchema.virtual('remainingBalance').get(function() {
  return this.totalAmount - this.amountPaid;
});

// Method to update attendance
enrollmentSchema.methods.updateAttendance = function(sessionDate, present, notes = '') {
  const sessionDateObj = new Date(sessionDate);
  
  // Check if attendance record for this date already exists
  const existingIndex = this.attendance.findIndex(record => 
    new Date(record.sessionDate).toDateString() === sessionDateObj.toDateString()
  );
  
  if (existingIndex >= 0) {
    // Update existing record
    this.attendance[existingIndex].present = present;
    if (notes) this.attendance[existingIndex].notes = notes;
  } else {
    // Add new record
    this.attendance.push({
      sessionDate: sessionDateObj,
      present,
      notes
    });
  }
  
  return this.attendance;
};

// Ensure course enrollment is unique per student
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment; 