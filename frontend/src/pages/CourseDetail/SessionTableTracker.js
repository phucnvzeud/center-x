import React, { useState } from 'react';
import { format } from 'date-fns';
import coursesAPI from '../../api/courses';
import './SessionTableTracker.css';

const SESSION_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'taught', label: 'Taught' },
  { value: 'absent-personal', label: 'Absent (Personal)' },
  { value: 'absent-holiday', label: 'Absent (Holiday)' },
  { value: 'absent-other', label: 'Absent (Other)' },
];

const SessionTableTracker = ({ course, setCourse }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
  });

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  };

  const formatDayTime = (session) => {
    const dayName = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${session.startTime} - ${session.endTime}`;
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  const isFutureSession = (date) => {
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sessionDate > today;
  };

  // Modal handlers
  const openUpdateModal = (session) => {
    setSelectedSession(session);
    setFormData({
      status: session.status,
      notes: session.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSession(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await coursesAPI.updateSession(
        course._id,
        selectedSession._id,
        formData.status,
        formData.notes
      );

      const updatedCourse = response.data;
      setCourse(updatedCourse);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  // If no sessions, display a message
  if (!course?.sessions || course.sessions.length === 0) {
    return (
      <div className="sessions-table-view">
        <div className="sessions-header">
          <h3>Sessions</h3>
        </div>
        <p>No sessions available for this course.</p>
      </div>
    );
  }

  return (
    <div className="sessions-table-view">
      <div className="sessions-header">
        <div className="sessions-info">
          <span>Total Sessions:<span className="info-label">{course.sessions.length}</span></span>
          {course.compensatorySessions > 0 && (
            <span>Compensatory Sessions:<span className="info-label">{course.compensatorySessions}</span></span>
          )}
        </div>
        
        <div className="status-legend">
          {SESSION_STATUS_OPTIONS.map(option => (
            <div className="legend-item" key={option.value}>
              <span className={`status-dot ${getStatusClass(option.value)}`}></span>
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sessions-table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day & Time</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {course.sessions.map(session => (
              <tr 
                key={session._id} 
                className={session.isCompensatory ? 'compensatory-session' : ''}
              >
                <td>{formatDate(session.date)}</td>
                <td>{formatDayTime(session)}</td>
                <td>
                  <span className={`session-status ${getStatusClass(session.status)}`}>
                    {SESSION_STATUS_OPTIONS.find(opt => opt.value === session.status)?.label || session.status}
                  </span>
                </td>
                <td className="notes-cell">
                  {session.notes ? (
                    <div className="session-notes" title={session.notes}>
                      {session.notes}
                    </div>
                  ) : (
                    <span className="no-notes">No notes</span>
                  )}
                </td>
                <td>
                  <button 
                    className="action-btn update-btn"
                    onClick={() => openUpdateModal(session)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Session Modal */}
      {modalOpen && selectedSession && (
        <div className="session-modal-backdrop">
          <div className="session-modal">
            <div className="session-modal-header">
              <h3>Update Session - {formatDate(selectedSession.date)}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="status">Session Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={loading || isFutureSession(selectedSession.date)}
                >
                  {SESSION_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isFutureSession(selectedSession.date) && (
                  <div className="help-text">
                    Future sessions cannot be marked as taught or absent.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add notes about this session"
                  disabled={loading}
                />
              </div>

              {formData.status.startsWith('absent-') && (
                <div className="info-box">
                  <p>
                    When marking a session as absent, a compensatory session will be automatically added.
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} disabled={loading}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={loading || isFutureSession(selectedSession.date)}
                >
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

export default SessionTableTracker; 