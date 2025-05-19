import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // Connect to WebSocket server
  useEffect(() => {
    // Create socket connection
    const SOCKET_URL = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:5000';
      
    socketRef.current = io(SOCKET_URL);
    
    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Connected to notification server');
      setConnected(true);
      
      // Initial data fetch after connection
      fetchNotifications();
      fetchUnreadCount();
      
      // Join user-specific room (placeholder - replace with actual user ID)
      // socketRef.current.emit('join', currentUser.id);
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from notification server');
      setConnected(false);
    });
    
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to notification server');
    });
    
    // Listen for notification events
    socketRef.current.on('notification:created', (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      fetchUnreadCount(); // Update badge count
    });
    
    socketRef.current.on('notification:unread_count', (data) => {
      console.log('Unread count updated:', data);
      setUnreadCount(data.count);
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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
      
      // Server will emit WebSocket event to update count
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Server will emit WebSocket event to update count
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
      // Server will emit WebSocket event to update count
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        connected,
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