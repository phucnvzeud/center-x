import React, { useState } from 'react';
import { coursesAPI } from '../../api';
import './SessionTracker.css';

const SESSION_STATUS_OPTIONS = [
  'Pending',
  'Taught',
  'Absent (Personal Reason)',
  'Absent (Holiday)',
  'Absent (Other Reason)'
];

const SessionTracker = ({ course, onSessionsUpdated }) => {
  const [sessions, setSessions] = useState(course.sessions || []);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getDayName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const openSessionModal = (session, index) => {
    setSelectedSession({ ...session, index });
    setIsModalOpen(true);
  };

  const closeSessionModal = () => {
    setSelectedSession(null);
    setIsModalOpen(false);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Taught': return 'status-taught';
      case 'Absent (Personal Reason)': return 'status-absent-personal';
      case 'Absent (Holiday)': return 'status-absent-holiday';
      case 'Absent (Other Reason)': return 'status-absent-other';
      default: return 'status-pending';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedSession({ ...selectedSession, [name]: value });
  };

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const { index, ...sessionData } = selectedSession;
      
      // Check if this is changing from pending to absent
      const needsCompensatory = 
        sessions[index].status === 'Pending' && 
        sessionData.status.startsWith('Absent');
      
      // Update session at the backend
      const response = await coursesAPI.updateSession(
        course._id, 
        index, 
        { 
          ...sessionData,
          addCompensatory: needsCompensatory 
        }
      );
      
      // Update sessions in the local state
      const updatedSessions = [...sessions];
      updatedSessions[index] = sessionData;
      
      // If a compensatory session was added, add it to the local state
      if (response.data.compensatorySession) {
        updatedSessions.push(response.data.compensatorySession);
      }
      
      setSessions(updatedSessions);
      
      // Notify parent component
      if (onSessionsUpdated) {
        onSessionsUpdated(updatedSessions);
      }
      
      closeSessionModal();
      setLoading(false);
    } catch (err) {
      console.error('Error updating session:', err);
      setError('Failed to update session. Please try again.');
      setLoading(false);
    }
  };

  const isFutureSession = (dateString) => {
    const sessionDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate > today;
  };

  return (
    <div className="session-tracker">
      <div className="session-header">
        <h2>Session Tracking</h2>
        <div className="session-legend">
          <div className="legend-item">
            <span className="status-dot status-taught"></span>
            <span>Taught</span>
          </div>
          <div className="legend-item">
            <span className="status-dot status-pending"></span>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <span className="status-dot status-absent-personal"></span>
            <span>Personal</span>
          </div>
          <div className="legend-item">
            <span className="status-dot status-absent-holiday"></span>
            <span>Holiday</span>
          </div>
          <div className="legend-item">
            <span className="status-dot status-absent-other"></span>
            <span>Other</span>
          </div>
        </div>
      </div>
      
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="no-sessions-message">No sessions scheduled yet.</div>
        ) : (
          sessions.map((session, index) => (
            <div 
              key={index} 
              className={`session-item ${getStatusClass(session.status)}`}
              onClick={() => openSessionModal(session, index)}
            >
              <div className="session-date">
                <span className="date">{formatDate(session.date)}</span>
                <span className="day">{getDayName(session.date)}</span>
              </div>
              <div className="session-status">
                <span className={`status-badge ${getStatusClass(session.status)}`}>
                  {session.status}
                </span>
              </div>
              {session.notes && (
                <div className="session-notes">
                  <span className="notes-label">Notes:</span>
                  <span className="notes-text">{session.notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {isModalOpen && selectedSession && (
        <div className="session-modal-backdrop">
          <div className="session-modal">
            <div className="session-modal-header">
              <h3>Update Session Status</h3>
              <button className="close-btn" onClick={closeSessionModal}>×</button>
            </div>
            
            {error && (
              <div className="error-message">{error}</div>
            )}
            
            <form onSubmit={handleSubmitSession}>
              <div className="form-group">
                <label>Date:</label>
                <span>{formatDate(selectedSession.date)} ({getDayName(selectedSession.date)})</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={selectedSession.status}
                  onChange={handleInputChange}
                  disabled={loading || isFutureSession(selectedSession.date)}
                >
                  {SESSION_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {isFutureSession(selectedSession.date) && (
                  <div className="help-text">
                    Future sessions cannot be marked as taught or absent.
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={selectedSession.notes || ''}
                  onChange={handleInputChange}
                  rows="3"
                  disabled={loading}
                ></textarea>
              </div>
              
              {selectedSession.status.startsWith('Absent') && (
                <div className="info-box">
                  <p>
                    When marking a session as absent, a compensatory session will 
                    automatically be added to the end of the course.
                  </p>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={closeSessionModal} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading || isFutureSession(selectedSession.date)}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionTracker; 