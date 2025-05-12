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
      
      switch (action) {
        case 'create':
          message = `New ${entityType} "${entityName}" was created`;
          type = 'success';
          break;
        case 'update':
          message = `${capitalizedEntity} "${entityName}" was updated`;
          type = 'info';
          break;
        case 'delete':
          message = `${capitalizedEntity} "${entityName}" was deleted`;
          type = 'warning';
          break;
        case 'cancel':
          if (entityType === 'session') {
            finalEntityType = parentEntityType || entityType;
            finalEntityId = parentEntityId || entityId;
            const parentInfo = parentEntityName ? ` (${parentEntityName})` : '';
            const dateInfo = date ? ` on ${date.toLocaleDateString()}` : '';
            message = `Session${dateInfo} has been canceled${parentInfo}`;
            type = 'warning';
          } else {
            message = `${capitalizedEntity} "${entityName}" was canceled`;
            type = 'warning';
          }
          break;
        case 'ending_soon':
          message = `${capitalizedEntity} "${entityName}" is ending soon`;
          type = 'info';
          if (date) {
            message = `${capitalizedEntity} "${entityName}" is ending on ${date.toLocaleDateString()}`;
          }
          break;
        default:
          message = `Action performed on ${entityType} "${entityName}"`;
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