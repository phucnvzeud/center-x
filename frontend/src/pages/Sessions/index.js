import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Sessions.css';

const Sessions = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);

  useEffect(() => {
    const fetchCourseAndSessions = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await axios.get(`/api/courses/${courseId}`);
        setCourse(courseResponse.data);
        
        // Sessions are embedded in the course document
        setSessions(courseResponse.data.sessions || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourseAndSessions();
  }, [courseId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Taught': return 'status-taught';
      case 'Pending': return 'status-pending';
      case 'Absent (Personal Reason)': return 'status-absent';
      case 'Absent (Holiday)': return 'status-holiday';
      case 'Absent (Other Reason)': return 'status-other-absence';
      default: return '';
    }
  };

  const getSessionDayAndTime = (date) => {
    if (!date || !course || !course.weeklySchedule) return '';
    
    const sessionDate = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sessionDate.getDay()];
    
    const scheduleForDay = course.weeklySchedule.find(s => s.day === dayOfWeek);
    if (!scheduleForDay) return dayOfWeek;
    
    return `${dayOfWeek}, ${formatTime(scheduleForDay.startTime)} - ${formatTime(scheduleForDay.endTime)}`;
  };

  const openUpdateModal = (session, index) => {
    setSelectedSession({ ...session, index });
    setOriginalStatus(session.status);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
    setOriginalStatus(null);
  };

  const handleStatusChange = async (e) => {
    setSelectedSession({
      ...selectedSession,
      status: e.target.value
    });
  };

  const handleNotesChange = (e) => {
    setSelectedSession({
      ...selectedSession,
      notes: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if we need to add a compensatory session
      const isChangingToAbsent = 
        originalStatus === 'Pending' && 
        selectedSession.status.startsWith('Absent');
      
      console.log('Status change detected:', {
        originalStatus,
        newStatus: selectedSession.status,
        shouldAddCompensatory: isChangingToAbsent
      });
      
      // Update session status with compensatory flag if needed
      const response = await axios.put(
        `/api/courses/${courseId}/sessions/${selectedSession.index}`,
        {
          status: selectedSession.status,
          notes: selectedSession.notes,
          addCompensatory: isChangingToAbsent
        }
      );
      
      console.log('Session update response:', response.data);
      
      // Check if a compensatory session was added
      if (response.data.compensatorySessionAdded) {
        // If we got direct sessions data from the response, use it
        if (response.data.sessions) {
          setSessions(response.data.sessions);
          console.log(`Updated sessions directly from response. Total: ${response.data.sessions.length}`);
        } else {
          // Otherwise, fetch the latest course data
          const courseResponse = await axios.get(`/api/courses/${courseId}`);
          setCourse(courseResponse.data);
          
          // Make sure we get ALL sessions, including compensatory ones
          if (courseResponse.data.sessions) {
            const updatedSessions = courseResponse.data.sessions;
            setSessions(updatedSessions);
            console.log(`Fetched updated sessions: Total=${updatedSessions.length}, Regular=${courseResponse.data.totalSessions}, Compensatory=${updatedSessions.length - courseResponse.data.totalSessions}`);
          }
        }
      } else {
        // No compensatory session was added, just update the current session
        const updatedSessions = [...sessions];
        updatedSessions[selectedSession.index] = {
          ...updatedSessions[selectedSession.index],
          status: selectedSession.status,
          notes: selectedSession.notes
        };
        setSessions(updatedSessions);
        
        // Also update the course data
        const courseResponse = await axios.get(`/api/courses/${courseId}`);
        setCourse(courseResponse.data);
      }
      
      closeModal();
    } catch (err) {
      console.error('Error updating session:', err);
      setError('Failed to update session. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading sessions...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <div className="sessions-header">
        <div className="sessions-header-info">
          <h1>Sessions</h1>
          <h2>{course?.name}</h2>
          <p>
            <span className="info-label">Branch:</span> {course?.branch?.name || 'N/A'} | 
            <span className="info-label">Teacher:</span> {course?.teacher?.name || 'N/A'} | 
            <span className="info-label">Total Sessions:</span> {course?.totalSessions || 0} | 
            <span className="info-label">All Sessions (including compensatory):</span> {sessions.length}
          </p>
          {sessions.length !== (course?.sessions?.length || 0) && (
            <div className="warning">
              <p>Warning: Not all sessions are displayed. Total sessions: {course?.sessions?.length}, Displayed: {sessions.length}</p>
            </div>
          )}
        </div>
        <button className="back-btn" onClick={() => navigate(`/courses/${courseId}`)}>
          Back to Course
        </button>
      </div>
      
      {sessions.length === 0 ? (
        <div className="no-data-message">
          <p>No sessions found for this course.</p>
        </div>
      ) : (
        <div className="sessions-list">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Day & Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {course?.sessions?.map((session, index) => (
                <tr key={index} className={index >= course.totalSessions ? 'compensatory-session' : ''}>
                  <td>{index + 1}</td>
                  <td>{formatDate(session.date)}</td>
                  <td>{getSessionDayAndTime(session.date)}</td>
                  <td>
                    <span className={`session-status ${getStatusClass(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="notes-cell">
                    {session.notes ? (
                      <div className="session-notes">{session.notes}</div>
                    ) : (
                      <span className="no-notes">No notes</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn update-btn"
                      onClick={() => openUpdateModal(session, index)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {isModalOpen && selectedSession && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Update Session Status</h2>
            <h3>Session {selectedSession.index + 1} - {formatDate(selectedSession.date)}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={selectedSession.status}
                  onChange={handleStatusChange}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Taught">Taught</option>
                  <option value="Absent (Personal Reason)">Absent (Personal Reason)</option>
                  <option value="Absent (Holiday)">Absent (Holiday)</option>
                  <option value="Absent (Other Reason)">Absent (Other Reason)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={selectedSession.notes || ''}
                  onChange={handleNotesChange}
                  rows="3"
                ></textarea>
              </div>
              
              {originalStatus === 'Pending' && selectedSession.status.startsWith('Absent') && (
                <div className="compensatory-info">
                  <i className="info-icon">ℹ️</i> 
                  <p>
                    A compensatory session will be automatically added to the end of the course 
                    when changing from Pending to Absent.
                  </p>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions; 