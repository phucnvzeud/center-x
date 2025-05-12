import React, { useState } from 'react';
import { BsBellFill } from 'react-icons/bs';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationIcon.css';
import NotificationPanel from '../NotificationPanel';

const NotificationIcon = () => {
  const { unreadCount } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div className="notification-icon-container">
      <div className="notification-icon" onClick={togglePanel}>
        <BsBellFill size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      
      {showPanel && (
        <NotificationPanel onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
};

export default NotificationIcon; 