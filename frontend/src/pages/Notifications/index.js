import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { BsBell, BsCalendarX, BsCalendarCheck, BsPencil } from 'react-icons/bs';
import axios from 'axios';
import './Notifications.css';

const Notifications = () => {
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const perPage = 20;
  
  const navigate = useNavigate();

  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications(currentPage, perPage);
  }, [fetchNotifications, currentPage, perPage]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'read') return notifications.filter(n => n.read);
    return notifications;
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Info';
    }
  };

  const getEntityLabel = (entityType) => {
    switch(entityType) {
      case 'course': return 'Course';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'class': return 'Kindergarten Class';
      case 'school': return 'School';
      case 'region': return 'Region';
      case 'branch': return 'Branch';
      case 'session': return 'Session';
      default: return entityType;
    }
  };

  const getActionLabel = (action) => {
    switch(action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      case 'cancel': return 'Canceled';
      case 'ending_soon': return 'Ending Soon';
      default: return action;
    }
  };
  
  const getActionIcon = (action) => {
    switch(action) {
      case 'create': return <BsCalendarCheck size={14} />;
      case 'update': return <BsPencil size={14} />;
      case 'delete': 
      case 'cancel': return <BsCalendarX size={14} />;
      case 'ending_soon': 
      default: return <BsBell size={14} />;
    }
  };

  // Function to generate a test notification
  const createTestNotification = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    
    try {
      const response = await axios.post('/api/notifications/test');
      setTestResult(response.data);
      // Refresh notifications after creating test
      fetchNotifications(currentPage, perPage);
    } catch (error) {
      console.error('Error creating test notification:', error);
      setTestError(error.response?.data?.message || error.message || 'Failed to create test notification');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        
        <div className="notifications-actions">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => handleFilterChange('unread')}
            >
              Unread
            </button>
            <button 
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => handleFilterChange('read')}
            >
              Read
            </button>
          </div>
          
          <div className="notification-actions-right">
            {notifications.length > 0 && (
              <button 
                className="mark-all-btn" 
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
            
            <button 
              className="test-notification-btn"
              onClick={createTestNotification}
              disabled={testLoading}
            >
              {testLoading ? 'Creating...' : 'Create Test Notification'}
            </button>
          </div>
        </div>
      </div>
      
      {testResult && (
        <div className="test-result success">
          <p>Test notification created successfully! Check your notification list.</p>
        </div>
      )}
      
      {testError && (
        <div className="test-result error">
          <p>Error: {testError}</p>
        </div>
      )}
      
      <div className="notifications-list">
        {loading && <div className="notifications-loading">Loading notifications...</div>}
        
        {error && <div className="notifications-error">{error}</div>}
        
        {!loading && getFilteredNotifications().length === 0 && (
          <div className="notifications-empty">
            <p>No notifications found</p>
          </div>
        )}
        
        {getFilteredNotifications().map((notification) => (
          <div 
            key={notification._id}
            className={`notification-item ${!notification.read ? 'unread' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-badge" data-type={notification.type}>
              {getTypeLabel(notification.type)}
            </div>
            
            <div className="notification-content">
              <div className="notification-message">{notification.message}</div>
              <div className="notification-details">
                <span className="notification-entity">{getEntityLabel(notification.entityType)}</span>
                <span className={`notification-action action-${notification.action}`}>
                  {getActionIcon(notification.action)}
                  {getActionLabel(notification.action)}
                </span>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <div className="notification-actions">
              {!notification.read && (
                <button
                  className="notification-btn read-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification._id);
                  }}
                  title="Mark as read"
                >
                  Mark as read
                </button>
              )}
              <button
                className="notification-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
                title="Delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications; 