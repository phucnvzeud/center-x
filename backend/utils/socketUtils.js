/**
 * Socket.io utility functions for notifications
 */

/**
 * Emit a notification update event to all connected clients
 * @param {Object} io - Socket.io instance
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToAll = (io, event, data) => {
  if (!io) {
    console.warn('Socket.io instance not available for emitToAll');
    return;
  }
  io.emit(event, data);
};

/**
 * Emit a notification update event to a specific user
 * @param {Object} io - Socket.io instance
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToUser = (io, userId, event, data) => {
  if (!io || !userId) {
    console.warn('Socket.io instance or userId not available for emitToUser');
    return;
  }
  io.to(`user-${userId}`).emit(event, data);
};

/**
 * Emit notification created event
 * @param {Object} io - Socket.io instance
 * @param {Object} notification - The newly created notification
 */
const notificationCreated = (io, notification) => {
  emitToAll(io, 'notification:created', notification);
};

/**
 * Emit notification count updated event
 * @param {Object} io - Socket.io instance
 * @param {Number} count - The current unread count
 */
const unreadCountUpdated = (io, count) => {
  emitToAll(io, 'notification:unread_count', { count });
};

module.exports = {
  emitToAll,
  emitToUser,
  notificationCreated,
  unreadCountUpdated
}; 