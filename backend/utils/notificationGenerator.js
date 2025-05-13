const { Notification } = require('../models');

/**
 * Check if the notification system is working correctly
 * @returns {Promise<Object>} Status object with diagnostic information
 */
const checkNotificationSystem = async () => {
  try {
    // Try to count notifications to check database access
    const count = await Notification.countDocuments();
    
    // Generate a test notification
    const testId = 'test_' + Date.now();
    const testNotification = new Notification({
      message: 'Notification system check ' + new Date().toLocaleTimeString(),
      type: 'info',
      entityType: 'system',
      entityId: testId,
      action: 'test',
      link: '/'
    });
    
    // Save the test notification
    await testNotification.save();
    
    // Verify it was saved correctly
    const savedNotification = await Notification.findOne({ entityId: testId });
    
    return {
      status: 'ok',
      existingCount: count,
      testCreated: !!savedNotification,
      testId: testId,
      testNotificationId: savedNotification ? savedNotification._id : null
    };
  } catch (error) {
    console.error('Notification system check failed:', error);
    return {
      status: 'error',
      error: error.message,
      stack: error.stack
    };
  }
};

/**
 * Generate notification based on database changes or events
 * @param {String} entityType - Type of entity (course, teacher, student, class, session)
 * @param {ObjectId} entityId - MongoDB ID of the entity
 * @param {String} action - Action performed (create, update, delete, cancel, ending_soon)
 * @param {String} entityName - Name of the entity (optional)
 * @param {Object} options - Additional options (optional)
 * @param {String} options.customMessage - Custom message
 * @param {String} options.parentEntityType - Parent entity type (e.g. 'course' for a session)
 * @param {ObjectId} options.parentEntityId - Parent entity ID
 * @param {String} options.parentEntityName - Parent entity name
 * @param {Date} options.date - Relevant date (e.g. for ending_soon notifications)
 */
const generateNotification = async (entityType, entityId, action, entityName = '', options = {}) => {
  try {
    // Create message based on action and entity
    let message;
    let type = 'info';
    let link = null;
    let finalEntityType = entityType;
    let finalEntityId = entityId;

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

    // Create notification
    const notification = new Notification({
      message,
      type,
      entityType: finalEntityType,
      entityId: finalEntityId,
      action,
      link
    });

    // Save notification
    await notification.save();
    
    // Log successful notification creation for debugging
    console.log(`Notification created: ${action} ${entityType} "${entityName}" - ID: ${notification._id}`);
    
    return notification;
  } catch (error) {
    console.error('Error generating notification:', error);
    return null;
  }
};

module.exports = {
  generateNotification,
  checkNotificationSystem
}; 