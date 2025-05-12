const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { queueNotification, checkQueueSystem } = require('../utils/notificationQueue');

// Get all notifications (with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const { read, limit = 20, page = 1, entityType } = req.query;
    
    // Build query filters
    const filter = {};
    if (read !== undefined) filter.read = read === 'true';
    if (entityType) filter.entityType = entityType;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Notification.countDocuments(filter);
    
    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread notifications count
router.get('/unread/count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { read: false },
      { read: true }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint to generate a notification
router.post('/test', async (req, res) => {
  try {
    const testId = new mongoose.Types.ObjectId();
    
    // Queue a test notification
    queueNotification(
      'course', 
      testId, 
      'create',
      'Test Notification Course',
      {
        customMessage: 'This is a test notification created at ' + new Date().toLocaleTimeString()
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Test notification queued successfully',
      notification: {
        entityId: testId,
        message: 'This is a test notification created at ' + new Date().toLocaleTimeString()
      }
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Error creating test notification', error: error.message });
  }
});

// Diagnostic endpoint to check notification system status
router.get('/system-check', async (req, res) => {
  try {
    // Run the diagnostic check
    const status = await checkQueueSystem();
    
    res.json(status);
  } catch (error) {
    console.error('Error running notification system check:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error checking notification system',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 