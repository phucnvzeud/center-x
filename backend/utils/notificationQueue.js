const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const socketUtils = require('./socketUtils');

// In-memory queue for storing pending notifications
let notificationQueue = [];
let isProcessing = false;
let retryDelay = 2000; // 2 seconds between retries
let maxRetries = 3;
let app = null;

// Set the Express app instance
function setApp(expressApp) {
  app = expressApp;
}

// Initialize queue
function initQueue() {
  console.log('Initializing notification queue system');
  
  // Process queue periodically
  setInterval(processQueue, 1000);
  
  // Log queue stats periodically
  setInterval(() => {
    console.log(`Notification queue stats: ${notificationQueue.length} items pending`);
  }, 300000); // Log every 5 minutes
  
  return true;
}

// Add notification to queue
function queueNotification(entityType, entityId, action, entityName, options = {}) {
  const notificationData = {
    entityType,
    entityId,
    action,
    entityName,
    options,
    retries: 0,
    addedAt: new Date()
  };
  
  notificationQueue.push(notificationData);
  console.log(`Queued ${action} notification for ${entityType} "${entityName}" (Queue size: ${notificationQueue.length})`);
  
  return notificationData;
}

// Process notifications from queue
async function processQueue() {
  // Exit if already processing or queue is empty
  if (isProcessing || notificationQueue.length === 0) return;
  
  isProcessing = true;
  
  try {
    // Get the next notification
    const notificationData = notificationQueue[0];
    
    // Try to create the notification
    try {
      const result = await createNotification(
        notificationData.entityType,
        notificationData.entityId,
        notificationData.action,
        notificationData.entityName,
        notificationData.options
      );
      
      if (result) {
        // Success - remove from queue
        notificationQueue.shift();
        console.log(`Successfully processed notification (Queue size: ${notificationQueue.length})`);
        
        // Emit WebSocket event if we have access to the io instance
        if (app) {
          const io = app.get('io');
          if (io) {
            // Emit notification created event
            socketUtils.notificationCreated(io, result);
            
            // Get and emit updated unread count
            const unreadCount = await Notification.countDocuments({ read: false });
            socketUtils.unreadCountUpdated(io, unreadCount);
          }
        }
      } else {
        // Failed but no error thrown - retry later
        handleRetry(notificationData);
      }
    } catch (error) {
      console.error('Error processing notification:', error);
      handleRetry(notificationData);
    }
  } finally {
    isProcessing = false;
  }
}

// Handle retries for failed notifications
function handleRetry(notificationData) {
  notificationData.retries++;
  
  if (notificationData.retries > maxRetries) {
    // Too many retries - log error and remove from queue
    console.error(`Failed to process notification after ${maxRetries} retries, dropping:`, notificationData);
    notificationQueue.shift();
  } else {
    // Move to end of queue for retry
    notificationQueue.shift();
    
    // Add delay based on retry count
    setTimeout(() => {
      notificationQueue.push(notificationData);
    }, retryDelay * notificationData.retries);
    
    console.log(`Scheduled retry ${notificationData.retries} for notification`);
  }
}

// Core function to create a notification
async function createNotification(entityType, entityId, action, entityName = '', options = {}) {
  try {
    // Create message based on action and entity
    let message;
    let type = 'info';
    let link = null;
    let finalEntityType = entityType;
    let finalEntityId = entityId;

    // Handle entityId conversion to ObjectId for non-test IDs
    if (finalEntityId && typeof finalEntityId === 'string' && !finalEntityId.startsWith('test_')) {
      try {
        finalEntityId = new mongoose.Types.ObjectId(finalEntityId);
      } catch (error) {
        console.warn(`Failed to convert entityId to ObjectId: ${finalEntityId}`, error);
        // Keep original ID if conversion fails
      }
    }

    // Extract options
    const { customMessage, parentEntityType, parentEntityId, parentEntityName, date } = options;

    // Create appropriate message based on action and entity type
    if (customMessage) {
      message = customMessage;
    } else {
      const capitalizedEntity = entityType.charAt(0).toUpperCase() + entityType.slice(1);
      const currentDate = new Date();
      const timeString = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      switch (action) {
        case 'create':
          message = `Great news! A new ${entityType} named "${entityName}" has just been added to the system at ${timeString}`;
          type = 'success';
          break;
        case 'update':
          message = `We've just updated the ${entityType} "${entityName}" with the latest information. Check it out!`;
          type = 'info';
          break;
        case 'delete':
          message = `The ${entityType} "${entityName}" has been removed from the system. If this was a mistake, please contact support.`;
          type = 'warning';
          break;
        case 'cancel':
          if (entityType === 'session') {
            finalEntityType = parentEntityType || entityType;
            finalEntityId = parentEntityId || entityId;
            const parentInfo = parentEntityName ? ` for ${parentEntityName}` : '';
            const dateInfo = date ? ` scheduled for ${date.toLocaleDateString()}` : '';
            message = `Heads up! The session${dateInfo}${parentInfo} has been canceled. Please check your schedule.`;
            type = 'warning';
          } else {
            message = `Important: The ${entityType} "${entityName}" has been canceled. Please review any related plans.`;
            type = 'warning';
          }
          break;
        case 'ending_soon':
          if (date) {
            const daysUntil = Math.ceil((date - currentDate) / (1000 * 60 * 60 * 24));
            const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
            message = `Reminder: The ${entityType} "${entityName}" is ending ${dayText} on ${date.toLocaleDateString()}. Don't forget to prepare!`;
          } else {
            message = `Just a friendly reminder that the ${entityType} "${entityName}" is ending soon. Make sure you're prepared!`;
          }
          type = 'info';
          break;
        default:
          message = `There's been an update to the ${entityType} "${entityName}". Take a moment to review the changes.`;
      }
    }

    // Generate appropriate link
    switch (finalEntityType) {
      case 'course':
        link = `/courses/${finalEntityId}`;
        break;
      case 'teacher':
        link = `/teachers/${finalEntityId}/schedule`;
        break;
      case 'student':
        link = `/students/${finalEntityId}`;
        break;
      case 'class':
        link = `/kindergarten/classes/${finalEntityId}`;
        break;
      case 'school':
        link = `/kindergarten/schools/${finalEntityId}/classes`;
        break;
      case 'region':
        link = `/kindergarten/regions/${finalEntityId}/schools`;
        break;
      case 'branch':
        link = `/branches`;
        break;
      case 'session':
        if (parentEntityType === 'course') {
          link = `/courses/${parentEntityId}/sessions`;
        } else if (parentEntityType === 'class') {
          link = `/kindergarten/classes/${parentEntityId}`;
        }
        break;
      default:
        link = `/`;
    }

    // Create notification document
    const notificationData = {
      message,
      type,
      entityType: finalEntityType,
      entityId: finalEntityId,
      action,
      link
    };

    // Use the model to create a new notification
    const notification = await Notification.create(notificationData);
    
    // Log successful notification creation
    console.log(`Notification created: ${action} ${entityType} "${entityName}" - ID: ${notification._id}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// System health check
async function checkQueueSystem() {
  try {
    // Generate a test notification through the queue
    const testId = 'test_' + Date.now();
    
    // Queue a test notification
    queueNotification('system', testId, 'test', 'System Test', {
      customMessage: 'Queue system test at ' + new Date().toLocaleTimeString()
    });
    
    // Wait for queue processing (3 seconds should be enough)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if notification was created
    const notification = await Notification.findOne({ 
      entityType: 'system',
      entityId: testId
    });
    
    return {
      status: notification ? 'ok' : 'error',
      queueSize: notificationQueue.length,
      notificationCreated: !!notification,
      isProcessing,
      maxRetries
    };
  } catch (error) {
    console.error('Queue system check failed:', error);
    return {
      status: 'error',
      error: error.message,
      queueSize: notificationQueue.length,
      isProcessing
    };
  }
}

// Initialize the queue when this module is imported
initQueue();

module.exports = {
  queueNotification,
  checkQueueSystem,
  setApp
}; 