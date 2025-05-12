import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { BsCheck2All, BsTrash, BsCheckAll, BsBell, BsCalendarX, BsCalendarCheck } from 'react-icons/bs';
import './NotificationPanel.css';

const NotificationPanel = ({ onClose }) => {
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Handle click outside the panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle notification click to navigate to the relevant page
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'success': return 'notification-success';
      case 'warning': return 'notification-warning';
      case 'error': return 'notification-error';
      default: return 'notification-info';
    }
  };

  const getNotificationIcon = (notification) => {
    switch (notification.action) {
      case 'create':
        return <BsCalendarCheck size={16} className="notification-icon-create" />;
      case 'delete':
        return <BsCalendarX size={16} className="notification-icon-delete" />;
      case 'cancel':
        return <BsCalendarX size={16} className="notification-icon-cancel" />;
      case 'ending_soon':
        return <BsBell size={16} className="notification-icon-ending-soon" />;
      default:
        return <BsBell size={16} />;
    }
  };

  return (
    <div className="notification-panel" ref={panelRef}>
      <div className="notification-panel-header">
        <h3>Notifications</h3>
        <button 
          className="mark-all-read-btn" 
          onClick={markAllAsRead}
          title="Mark all as read"
        >
          <BsCheckAll size={18} />
          <span>Mark all read</span>
        </button>
      </div>
      
      <div className="notification-panel-content">
        {loading && <div className="notification-loading">Loading...</div>}
        
        {error && <div className="notification-error-message">{error}</div>}
        
        {!loading && notifications.length === 0 && (
          <div className="no-notifications">
            <p>No notifications yet</p>
          </div>
        )}
        
        {notifications.map((notification) => (
          <div 
            key={notification._id}
            className={`notification-item ${!notification.read ? 'unread' : ''} ${getNotificationTypeClass(notification.type)}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-icon-wrapper">
              {getNotificationIcon(notification)}
            </div>
            <div className="notification-content">
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </div>
            </div>
            <div className="notification-actions">
              {!notification.read && (
                <button 
                  className="notification-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification._id);
                  }}
                  title="Mark as read"
                >
                  <BsCheck2All size={16} />
                </button>
              )}
              <button 
                className="notification-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
                title="Delete"
              >
                <BsTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel; 