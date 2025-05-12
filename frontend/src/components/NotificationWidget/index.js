import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { BsBell, BsCalendarX, BsCalendarCheck } from 'react-icons/bs';
import './NotificationWidget.css';

const NotificationWidget = () => {
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead,
    markAllAsRead
  } = useNotifications();
  
  const navigate = useNavigate();

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications(1, 5); // Show only 5 latest notifications
  }, [fetchNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (notification) => {
    switch (notification.action) {
      case 'create':
        return <BsCalendarCheck size={14} className="widget-icon widget-icon-create" />;
      case 'delete':
      case 'cancel':
        return <BsCalendarX size={14} className="widget-icon widget-icon-delete" />;
      default:
        return <BsBell size={14} className="widget-icon" />;
    }
  };

  return (
    <div className="notification-widget">
      <div className="widget-header">
        <h3>Recent Activity</h3>
        {notifications.length > 0 && (
          <button 
            className="mark-all-read-widget-btn" 
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="widget-content">
        {loading && <div className="widget-loading">Loading...</div>}
        
        {error && <div className="widget-error">{error}</div>}
        
        {!loading && notifications.length === 0 && (
          <div className="widget-empty">
            <p>No recent activity</p>
          </div>
        )}
        
        {notifications.map((notification) => (
          <div 
            key={notification._id}
            className={`widget-notification ${!notification.read ? 'unread' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="widget-notification-dot" data-type={notification.type}></div>
            <div className="widget-notification-content">
              <div className="widget-notification-header">
                {getNotificationIcon(notification)}
                <div className="widget-notification-time">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
              </div>
              <div className="widget-notification-message">
                {notification.message}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {notifications.length > 0 && (
        <div className="widget-footer">
          <button 
            className="view-all-btn" 
            onClick={() => navigate('/notifications')}
          >
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationWidget; 