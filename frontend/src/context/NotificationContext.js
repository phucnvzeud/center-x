import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/notifications?page=${page}&limit=${limit}`);
      setNotifications(response.data.notifications);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/notifications/unread/count');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [fetchUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification._id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [fetchUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 