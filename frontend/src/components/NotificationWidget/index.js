import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { BsBell, BsCalendarX, BsCalendarCheck } from 'react-icons/bs';
import { useAppTranslation, translateNotificationMessage, useI18nUtils } from '../../utils/i18nHelper';
import './NotificationWidget.css';

const NotificationWidget = ({ limit = 5 }) => {
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead,
    markAllAsRead
  } = useNotifications();
  
  const navigate = useNavigate();
  const { t } = useAppTranslation();
  const { formatDistanceToNowLocalized } = useI18nUtils();

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications(1, limit); // Use the limit prop
  }, [fetchNotifications, limit]);

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
        <h3>{t('dashboard.recent_activity')}</h3>
        {notifications.length > 0 && (
          <button 
            className="mark-all-read-widget-btn" 
            onClick={markAllAsRead}
          >
            {t('dashboard.mark_all_as_read')}
          </button>
        )}
      </div>
      
      <div className="widget-content">
        {loading && <div className="widget-loading">{t('notifications.loading')}</div>}
        
        {error && <div className="widget-error">{error}</div>}
        
        {!loading && notifications.length === 0 && (
          <div className="widget-empty">
            <p>{t('notifications.no_notifications')}</p>
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
                  {formatDistanceToNowLocalized(new Date(notification.createdAt))}
                </div>
              </div>
              <div className="widget-notification-message">
                {translateNotificationMessage(notification.message, notification, t)}
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
            {t('notifications.title')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationWidget; 