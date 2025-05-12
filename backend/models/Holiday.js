const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
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

// Pre-save hook to ensure endDate is at least equal to startDate
HolidaySchema.pre('save', function(next) {
  if (this.startDate > this.endDate) {
    this.endDate = this.startDate;
  }
  next();
});

// Method to check if a date falls within this holiday period
HolidaySchema.methods.containsDate = function(date) {
  const checkDate = new Date(date);
  // Reset hours to compare dates only
  checkDate.setHours(0, 0, 0, 0);
  
  const startDateCopy = new Date(this.startDate);
  startDateCopy.setHours(0, 0, 0, 0);
  
  const endDateCopy = new Date(this.endDate);
  endDateCopy.setHours(0, 0, 0, 0);
  
  return checkDate >= startDateCopy && checkDate <= endDateCopy;
};

// Static method to check if a date falls within any holiday
HolidaySchema.statics.isHoliday = async function(date) {
  const checkDate = new Date(date);
  // Reset hours to compare dates only
  checkDate.setHours(0, 0, 0, 0);
  
  const holidays = await this.find({
    $and: [
      { startDate: { $lte: checkDate } },
      { endDate: { $gte: checkDate } }
    ]
  });
  
  return holidays.length > 0 ? holidays[0] : null;
};

module.exports = mongoose.model('Holiday', HolidaySchema); 