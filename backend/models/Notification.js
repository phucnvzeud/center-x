const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  entityType: {
    type: String,
    required: true,
    enum: ['course', 'teacher', 'student', 'class', 'school', 'region', 'branch', 'session', 'system', 'test']
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    // Allow string IDs for test notifications
    get: v => v.toString ? v.toString() : v,
    set: v => {
      if (v && typeof v === 'string' && v.startsWith('test_')) {
        return v; // Keep test IDs as strings
      }
      return v; // Let MongoDB handle normal ObjectIds
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'cancel', 'ending_soon', 'test'],
    required: true
  },
  link: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add index for fast querying of unread notifications
notificationSchema.index({ read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 