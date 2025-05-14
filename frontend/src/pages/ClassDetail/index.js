import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { kindergartenClassesAPI } from '../../api';
import './ClassDetail.css';
import { FaChevronDown, FaChevronRight, FaCalendarAlt, FaFileExcel, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Button, Badge, Table, Spinner, Card } from 'react-bootstrap';

const SessionStatusOptions = [
  { value: 'Scheduled', label: 'Scheduled', color: '#4a90e2' },
  { value: 'Completed', label: 'Completed', color: '#4caf50' },
  { value: 'Canceled', label: 'Canceled', color: '#e74c3c' },
  { value: 'Holiday Break', label: 'Holiday Break', color: '#9c27b0' },
  { value: 'Compensatory', label: 'Compensatory', color: '#ff9800' }
];

const ClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const sessionsRef = useRef(null);
  
  const [kClass, setKClass] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToUpdate, setSessionToUpdate] = useState(null);
  const [newSessionStatus, setNewSessionStatus] = useState('Completed');
  const [sessionNotes, setSessionNotes] = useState('');
  const [addCompensatory, setAddCompensatory] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [updatingSessionId, setUpdatingSessionId] = useState(null);
  const [customSessionModalOpen, setCustomSessionModalOpen] = useState(false);
  const [customSessionForm, setCustomSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchSessionsData = useCallback(async () => {
    try {
      const [sessionsResponse, statsResponse] = await Promise.all([
        kindergartenClassesAPI.getSessions(classId),
        kindergartenClassesAPI.getSessionStats(classId)
      ]);
      
      // Add explicit index to each session
      const sessionsList = sessionsResponse.data.map((session, idx) => ({
        ...session,
        index: idx
      }));
      
      setSessions(sessionsList);
      setSessionStats(statsResponse.data);
      
      // Get the current month key
      const currentMonth = getCurrentMonthKey();
      
      // Get all month keys from the sessions
      const monthKeys = [...new Set(sessionsList.map(session => {
        const date = new Date(session.date);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      }))];
      
      // Preserve expanded states while ensuring current month is expanded
      setExpandedMonths(prev => {
        const newExpandedState = { ...prev };
        
        // Make sure current month is always expanded
        if (monthKeys.includes(currentMonth)) {
          newExpandedState[currentMonth] = true;
        }
        
        // Add any new months that weren't in the previous state
        monthKeys.forEach(monthKey => {
          if (newExpandedState[monthKey] === undefined) {
            newExpandedState[monthKey] = monthKey === currentMonth;
          }
        });
        
        return newExpandedState;
      });
    } catch (err) {
      console.error('Error fetching sessions data:', err);
      setError('Failed to load sessions data. Please try again later.');
    }
  }, [classId]);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        // Fetch class details
        const classResponse = await kindergartenClassesAPI.getById(classId);
        setKClass(classResponse.data);
        
        // Always fetch sessions data
        await fetchSessionsData();
        
        setLoading(false);
        
        // Auto-scroll to sessions section after data is loaded
        setTimeout(() => {
          if (sessionsRef.current) {
            sessionsRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      } catch (err) {
        console.error('Error fetching class data:', err);
        setError('Failed to load class data. Please try again later.');
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId, fetchSessionsData]);
  
  const getCurrentMonthKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}`;
  };
  
  const toggleMonthExpansion = (monthKey) => {
    // If the month is the current month, don't allow collapsing
    if (monthKey === getCurrentMonthKey() && expandedMonths[monthKey]) {
      return; // Don't allow collapsing the current month
    }
    
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  const handleDeleteClass = async () => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await kindergartenClassesAPI.remove(classId);
        navigate('/kindergarten/classes');
      } catch (err) {
        console.error('Error deleting class:', err);
        setError('Failed to delete class. Please try again later.');
      }
    }
  };
  
  const handleSessionUpdate = (session, index) => {
    setSessionToUpdate({
      ...session,
      index
    });
    setNewSessionStatus(session.status);
    setSessionNotes(session.notes || '');
    setAddCompensatory(false);
    setSessionModalOpen(true);
  };
  
  const handleSessionStatusUpdate = async () => {
    if (!sessionToUpdate) return;
    
    try {
      setSessionActionLoading(true);
      
      await kindergartenClassesAPI.updateSession(classId, sessionToUpdate.index, {
        status: newSessionStatus,
        notes: sessionNotes,
        addCompensatory: addCompensatory && newSessionStatus === 'Canceled'
      });
      
      setSessionModalOpen(false);
      setSessionActionLoading(false);
      
      // Refresh data while preserving expanded state
      await fetchSessionsData();
      const classResponse = await kindergartenClassesAPI.getById(classId);
      setKClass(classResponse.data);
    } catch (err) {
      console.error('Error updating session:', err);
      setError('Failed to update session status. Please try again later.');
      setSessionActionLoading(false);
    }
  };
  
  const handleQuickStatusUpdate = async (sessionIndex, newStatus) => {
    if (updatingSessionId !== null) return; // Prevent multiple simultaneous updates
    
    setUpdatingSessionId(sessionIndex);
    
    try {
      const session = sessions[sessionIndex];
      
      // Check if session exists
      if (!session) {
        console.error(`No session found at index ${sessionIndex}`);
        toast.error('Session not found. Please refresh the page and try again.');
        setUpdatingSessionId(null);
        return;
      }
      
      // Set add compensatory flag if canceling a session
      const addCompensatory = newStatus === 'Canceled';
      
      // Add a note based on the status change
      let notes = session.notes || '';
      if (newStatus === 'Completed') {
        notes = notes ? `${notes}\nMarked as completed.` : 'Marked as completed.';
      } else if (newStatus === 'Canceled') {
        notes = notes ? `${notes}\nSession canceled.` : 'Session canceled.';
      } else if (newStatus === 'Holiday Break') {
        notes = notes ? `${notes}\nMarked as holiday break.` : 'Holiday break.';
      }
      
      const updateData = {
        status: newStatus,
        notes,
        addCompensatory
      };
      
      await kindergartenClassesAPI.updateSession(classId, sessionIndex, updateData);
      
      // Success message
      if (newStatus === 'Canceled' && addCompensatory) {
        toast.success('Session canceled and compensatory session added!');
      } else {
        toast.success(`Session marked as ${newStatus}!`);
      }
      
      // Refresh the sessions and class data
      fetchSessionsData();
      const classResponse = await kindergartenClassesAPI.getById(classId);
      setKClass(classResponse.data);
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    } finally {
      setUpdatingSessionId(null);
    }
  };
  
  const handleAdvancedUpdate = (session, index) => {
    handleSessionUpdate(session, index);
  };

  const handleCustomSessionFormChange = (e) => {
    const { name, value } = e.target;
    setCustomSessionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomSessionSubmit = async () => {
    try {
      // Basic validation
      if (!customSessionForm.date) {
        toast.error('Please select a date');
        return;
      }

      // Show loading state
      setSessionActionLoading(true);

      // Add the custom session
      const response = await kindergartenClassesAPI.addCustomSession(classId, customSessionForm);
      
      if (response.status === 201) {
        toast.success('Custom session added successfully');
        
        // Close the modal and reset form
        setCustomSessionModalOpen(false);
        setCustomSessionForm({
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        
        // Refresh session data while preserving expanded states
        await fetchSessionsData();
        const classResponse = await kindergartenClassesAPI.getById(classId);
        setKClass(classResponse.data);
      } else {
        toast.error('Failed to add custom session');
      }
    } catch (err) {
      console.error('Error adding custom session:', err);
      toast.error('Error adding custom session');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const exportSessionsToExcel = () => {
    if (!kClass || !sessions || sessions.length === 0) {
      toast.error('No session data available to export');
      return;
    }

    try {
      // Group sessions by month
      const sessionsByMonth = {};
      
      // Extract unique months from sessions
      sessions.forEach(session => {
        const date = new Date(session.date);
        const yearMonth = `${date.getFullYear()}-${date.getMonth()}`; // Key for grouping
        const month = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // Display value
        
        if (!sessionsByMonth[yearMonth]) {
          sessionsByMonth[yearMonth] = {
            displayName: month,
            year: date.getFullYear(),
            month: date.getMonth(),
            sessions: {}
          };
        }
        
        const day = date.getDate();
        sessionsByMonth[yearMonth].sessions[day] = {
          status: session.status,
          isCompleted: session.status === 'Completed'
        };
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const wsData = [];
      
      // Sort months chronologically
      const sortedMonthKeys = Object.keys(sessionsByMonth).sort();

      // Create column headers (days 1-31)
      const daysHeader = ['Month'];
      for (let day = 1; day <= 31; day++) {
        daysHeader.push(day);
      }
      wsData.push(daysHeader);
      
      // Add data for each month
      sortedMonthKeys.forEach(monthKey => {
        const monthData = sessionsByMonth[monthKey];
        const year = monthData.year;
        const month = monthData.month;
        
        // Get number of days in this month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Row for month name
        const monthRow = [monthData.displayName];
        
        // Add data for each day in this month
        for (let day = 1; day <= 31; day++) {
          if (day <= daysInMonth) {
            // This day exists in this month
            const sessionData = monthData.sessions[day];
            monthRow.push(sessionData && sessionData.isCompleted ? 1 : '');
          } else {
            // This day doesn't exist in this month (e.g., February 30)
            monthRow.push('');
          }
        }
        
        wsData.push(monthRow);
      });
      
      // Create worksheet from data
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidth = 5;
      ws['!cols'] = Array(32).fill({ wch: colWidth }); // 1 for month + 31 days
      ws['!cols'][0] = { wch: 20 }; // Month column wider
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
      
      // Create a filename
      const fileName = `${kClass.name} - Sessions.xlsx`;
      
      // Export the file
      XLSX.writeFile(wb, fileName);
      
      toast.success('Excel file exported successfully');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('Failed to export Excel file');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getDayName = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long'
    });
  };
  
  const getStatusColor = (status) => {
    const statusOption = SessionStatusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : '#999';
  };
  
  const getStatusLabel = (status) => {
    const statusOption = SessionStatusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Canceled': return 'danger';
      case 'Holiday Break': return 'warning';
      case 'Scheduled': return 'primary';
      default: return 'secondary';
    }
  };

  const renderSessionStatusButtons = (session, index) => {
    const isUpdating = updatingSessionId === index;
    
    // Define button styles based on status
    const getButtonStyle = (status, currentStatus) => {
      return {
        marginRight: '5px',
        opacity: currentStatus === status ? 1 : 0.7,
        fontWeight: currentStatus === status ? 'bold' : 'normal',
        cursor: isUpdating ? 'not-allowed' : 'pointer'
      };
    };
    
    return (
      <div className="status-buttons">
        <Button 
          size="sm" 
          variant={session.status === 'Completed' ? 'success' : 'outline-success'}
          style={getButtonStyle('Completed', session.status)}
          disabled={isUpdating}
          onClick={() => handleQuickStatusUpdate(index, 'Completed')}
        >
          {isUpdating && session.status !== 'Completed' ? <Spinner size="sm" /> : 'Complete'}
        </Button>
        
        <Button 
          size="sm" 
          variant={session.status === 'Canceled' ? 'danger' : 'outline-danger'}
          style={getButtonStyle('Canceled', session.status)}
          disabled={isUpdating}
          onClick={() => handleQuickStatusUpdate(index, 'Canceled')}
        >
          {isUpdating && session.status !== 'Canceled' ? <Spinner size="sm" /> : 'Cancel'}
        </Button>
        
        <Button 
          size="sm" 
          variant={session.status === 'Scheduled' ? 'primary' : 'outline-primary'}
          style={getButtonStyle('Scheduled', session.status)}
          disabled={isUpdating}
          onClick={() => handleQuickStatusUpdate(index, 'Scheduled')}
        >
          {isUpdating && session.status !== 'Scheduled' ? <Spinner size="sm" /> : 'Schedule'}
        </Button>
      </div>
    );
  };

  const renderSessions = (monthSessions, monthName) => {
    return (
      <Table striped bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {monthSessions.map((session, idx) => {
            const dateObj = new Date(session.date);
            const formattedDate = formatDate(dateObj);
            const isToday = isSameDay(dateObj, new Date());
            const isPast = dateObj < new Date();
            
            const statusVariant = getStatusVariant(session.status);
            const sessionKey = `${monthName}-${idx}`;
            
            return (
              <tr key={sessionKey} className={isToday ? 'today-session' : ''}>
                <td>{idx + 1}</td>
                <td className={isToday ? 'bg-info text-white' : ''}>{formattedDate}</td>
                <td>{session.startTime}</td>
                <td>{session.endTime}</td>
                <td>
                  <Badge bg={statusVariant}>
                    {session.status}
                  </Badge>
                </td>
                <td>{session.notes || '-'}</td>
                <td>
                  {renderSessionStatusButtons(session, session.index || idx)}
                  <Button 
                    size="sm" 
                    variant="info" 
                    className="ml-2"
                    onClick={() => openSessionEditModal(session.index || idx)}
                  >
                    <i className="fa fa-edit"></i>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const openSessionEditModal = (sessionIndex) => {
    const session = sessions[sessionIndex];
    if (!session) {
      console.error(`No session found at index ${sessionIndex}`);
      toast.error('Session not found. Please refresh the page and try again.');
      return;
    }
    handleAdvancedUpdate(session, sessionIndex);
  };

  const sessionsByMonth = useMemo(() => {
    if (!sessions.length) return {};

    const grouped = {};
    sessions.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          label: monthName,
          sessions: []
        };
      }
      grouped[monthKey].sessions.push(session);
    });

    // Sort months in descending order (most recent first)
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
    );
  }, [sessions]);

  if (loading) {
    return <div className="loading-spinner">Loading class details...</div>;
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

  if (!kClass) {
    return (
      <div className="error-message">
        <h2>Class Not Found</h2>
        <p>The requested class could not be found.</p>
        <Link to="/kindergarten/classes" className="back-link">Return to Classes</Link>
      </div>
    );
  }

  return (
    <div className="class-detail-container">
      <div className="class-detail-header">
        <h1>{kClass.name}</h1>
        <div className="action-buttons">
          <Link 
            to={`/kindergarten/classes/edit/${classId}`} 
            className="edit-btn"
          >
            Edit Class
          </Link>
          <button 
            onClick={handleDeleteClass} 
            className="delete-btn"
          >
            Delete Class
          </button>
        </div>
      </div>

      {/* Class Information Section */}
      <div className="class-info-section">
        <div className="section-header">
          <h2>Class Information</h2>
        </div>
        
        <div className="section-content">
          {/* Basic Information */}
          <div className="detail-card">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Class Name:</span>
                <span className="detail-value">{kClass.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">School:</span>
                <span className="detail-value">{kClass.school?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Teacher:</span>
                <span className="detail-value">
                  {kClass.teacher ? (
                    <span className="teacher-info">
                      {kClass.teacher.name}
                    </span>
                  ) : (
                    kClass.teacherName || 'N/A'
                  )}
                </span>
              </div>
              {kClass.teacher && kClass.teacher.email && (
                <div className="detail-item">
                  <span className="detail-label">Teacher Email:</span>
                  <span className="detail-value">
                    <a href={`mailto:${kClass.teacher.email}`}>{kClass.teacher.email}</a>
                  </span>
                </div>
              )}
              {kClass.teacher && kClass.teacher.phone && (
                <div className="detail-item">
                  <span className="detail-label">Teacher Phone:</span>
                  <span className="detail-value">{kClass.teacher.phone}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Age Group:</span>
                <span className="detail-value">{kClass.ageGroup}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Student Count:</span>
                <span className="detail-value">{kClass.studentCount}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`class-status status-${kClass.status?.toLowerCase()}`}>
                  {kClass.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{formatDate(kClass.startDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Sessions:</span>
                <span className="detail-value">{kClass.totalSessions}</span>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="detail-card">
            <h3>Weekly Schedule</h3>
            {kClass.weeklySchedule && kClass.weeklySchedule.length > 0 ? (
              <div className="schedule-list">
                {kClass.weeklySchedule.map((schedule, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-day">{schedule.day}</div>
                    <div className="schedule-time">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                No schedule has been set for this class.
              </div>
            )}
          </div>

          {/* Holidays & Breaks */}
          <div className="detail-card">
            <h3>Holidays & Breaks</h3>
            {kClass.holidays && kClass.holidays.length > 0 ? (
              <div className="holidays-list">
                {kClass.holidays.map((holiday, index) => (
                  <div key={index} className="holiday-item">
                    <div className="holiday-date">{formatDate(holiday.date)}</div>
                    <div className="holiday-name">{holiday.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                No holidays or breaks have been set for this class.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Tracking Section */}
      <div ref={sessionsRef} className="sessions-tracking-section">
        <div className="section-header">
          <h2>Sessions Tracking</h2>
        </div>
        
        <div className="section-content">
          {/* Session Statistics */}
          {sessionStats && (
            <div className="detail-card session-stats-card">
              <h3>Session Statistics</h3>
              <div className="session-stats">
                <div className="stat-item">
                  <div className="stat-label">Total Sessions</div>
                  <div className="stat-value">{sessionStats.total}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value stat-completed">{sessionStats.completed}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Scheduled</div>
                  <div className="stat-value stat-scheduled">{sessionStats.scheduled}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Canceled</div>
                  <div className="stat-value stat-canceled">{sessionStats.canceled}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Holiday Breaks</div>
                  <div className="stat-value stat-holiday">{sessionStats.holidayBreak}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Compensatory</div>
                  <div className="stat-value stat-compensatory">{sessionStats.compensatory}</div>
                </div>
              </div>
              
              <div className="session-progress">
                <div className="progress-info">
                  <div className="progress-label">Progress</div>
                  <div className="progress-value">{sessionStats.progress}%</div>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${sessionStats.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="session-remaining">
                <div className="remaining-info">
                  <div className="remaining-label">Remaining</div>
                  <div className="remaining-value">
                    {sessionStats.remainingWeeks} weeks ({sessionStats.remainingDays} days)
                  </div>
                </div>
                <div className="completion-status">
                  {sessionStats.isFinished ? (
                    <span className="status-completed">Class Complete</span>
                  ) : (
                    <span className="status-ongoing">In Progress</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Sessions List */}
          <div className="detail-card">
            <h3>Sessions</h3>
            <div className="sessions-header">
              <button
                className="add-custom-session-btn"
                onClick={() => setCustomSessionModalOpen(true)}
              >
                Add Custom Session
              </button>
              <button
                className="export-excel-btn"
                onClick={exportSessionsToExcel}
                title="Export sessions to Excel"
              >
                <FaFileExcel /> Export to Excel
              </button>
            </div>
            {Object.keys(sessionsByMonth).length > 0 ? (
              <div className="sessions-by-month">
                {Object.entries(sessionsByMonth).map(([monthKey, { label, sessions: monthSessions }]) => (
                  <Card className="month-card" key={monthKey}>
                    <Card.Header 
                      onClick={() => toggleMonthExpansion(monthKey)}
                      className={`month-header ${expandedMonths[monthKey] ? 'expanded' : 'collapsed'}`}
                    >
                      <div className="month-header-content">
                        <span className="month-toggle-icon">
                          {expandedMonths[monthKey] ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                        <span className="month-title">{label}</span>
                        <span className="session-count">{monthSessions.length} sessions</span>
                      </div>
                    </Card.Header>
                    
                    {expandedMonths[monthKey] && (
                      <Card.Body className="month-sessions">
                        <Table className="sessions-table" responsive>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Status</th>
                              <th>Notes</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthSessions.map((session) => (
                              <tr key={session.index} className={`session-row ${session.status.toLowerCase()}`}>
                                <td>{formatDate(session.date)}</td>
                                <td>
                                  {session.startTime} - {session.endTime}
                                </td>
                                <td>
                                  <Badge className="status-badge" bg={getStatusVariant(session.status)}>
                                    {getStatusLabel(session.status)}
                                  </Badge>
                                  {session.isCompensatory && 
                                    <span className="compensatory-badge">Compensatory</span>}
                                </td>
                                <td className="notes-cell">{session.notes || '-'}</td>
                                <td>
                                  <div className="action-buttons-group">
                                    {session.status !== 'Completed' && (
                                      <Button
                                        variant="outline-success"
                                        size="sm"
                                        className="action-button"
                                        onClick={() => {
                                          const validIndex = typeof session.index === 'number' ? session.index : monthSessions.indexOf(session);
                                          handleQuickStatusUpdate(validIndex, 'Completed');
                                        }}
                                        disabled={updatingSessionId === session.index}
                                      >
                                        <span className="button-content">
                                          {updatingSessionId === session.index ? <Spinner size="sm" /> : <FaCheck />}
                                          <span className="button-label">Complete</span>
                                        </span>
                                      </Button>
                                    )}
                                    
                                    {session.status !== 'Canceled' && (
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="action-button"
                                        onClick={() => {
                                          const validIndex = typeof session.index === 'number' ? session.index : monthSessions.indexOf(session);
                                          handleQuickStatusUpdate(validIndex, 'Canceled');
                                        }}
                                        disabled={updatingSessionId === session.index}
                                      >
                                        <span className="button-content">
                                          {updatingSessionId === session.index ? <Spinner size="sm" /> : <FaTimes />}
                                          <span className="button-label">Cancel</span>
                                        </span>
                                      </Button>
                                    )}
                                    
                                    {session.status !== 'Scheduled' && (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="action-button"
                                        onClick={() => {
                                          const validIndex = typeof session.index === 'number' ? session.index : monthSessions.indexOf(session);
                                          handleQuickStatusUpdate(validIndex, 'Scheduled');
                                        }}
                                        disabled={updatingSessionId === session.index}
                                      >
                                        <span className="button-content">
                                          {updatingSessionId === session.index ? <Spinner size="sm" /> : <FaCalendarAlt />}
                                          <span className="button-label">Schedule</span>
                                        </span>
                                      </Button>
                                    )}
                                    
                                    <Button
                                      variant="light"
                                      size="sm"
                                      className="edit-button"
                                      onClick={() => {
                                        const validIndex = typeof session.index === 'number' ? session.index : monthSessions.indexOf(session);
                                        openSessionEditModal(validIndex);
                                      }}
                                    >
                                      <FaEdit />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-sessions">No sessions found</div>
            )}
          </div>
        </div>
      </div>

      <div className="breadcrumb-navigation">
        <Link to="/kindergarten" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/kindergarten/classes" className="breadcrumb-link">Classes</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{kClass.name}</span>
      </div>
      
      {/* Session Update Modal */}
      {sessionModalOpen && sessionToUpdate && (
        <div className="session-modal-backdrop">
          <div className="session-modal">
            <div className="session-modal-header">
              <h3>Update Session Status</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setSessionModalOpen(false)}
                disabled={sessionActionLoading}
              >
                ×
              </button>
            </div>
            <div className="session-modal-body">
              <div className="session-date-info">
                <p><strong>Date:</strong> {formatDate(sessionToUpdate.date)} ({getDayName(sessionToUpdate.date)})</p>
                <p><strong>Current Status:</strong> {getStatusLabel(sessionToUpdate.status)}</p>
              </div>
              
              <div className="session-form">
                <div className="form-group">
                  <label htmlFor="session-status">New Status</label>
                  <select
                    id="session-status"
                    value={newSessionStatus}
                    onChange={(e) => setNewSessionStatus(e.target.value)}
                    disabled={sessionActionLoading}
                  >
                    {SessionStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="session-notes">Notes</label>
                  <textarea
                    id="session-notes"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Add notes about this session..."
                    disabled={sessionActionLoading}
                  />
                </div>
                
                {newSessionStatus === 'Canceled' && (
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="add-compensatory"
                      checked={addCompensatory}
                      onChange={(e) => setAddCompensatory(e.target.checked)}
                      disabled={sessionActionLoading}
                    />
                    <label htmlFor="add-compensatory">
                      Add compensatory session for this cancellation
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div className="session-modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setSessionModalOpen(false)}
                disabled={sessionActionLoading}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleSessionStatusUpdate}
                disabled={sessionActionLoading}
              >
                {sessionActionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Session Modal */}
      {customSessionModalOpen && (
        <div className="session-modal-backdrop">
          <div className="session-modal">
            <div className="session-modal-header">
              <h3>Add Custom Session</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setCustomSessionModalOpen(false)}
                disabled={sessionActionLoading}
              >
                ×
              </button>
            </div>
            <div className="session-modal-body">
              <div className="session-form">
                <div className="form-group">
                  <label htmlFor="custom-session-date">Date</label>
                  <input
                    type="date"
                    id="custom-session-date"
                    name="date"
                    value={customSessionForm.date}
                    onChange={handleCustomSessionFormChange}
                    disabled={sessionActionLoading}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="custom-session-notes">Notes (optional)</label>
                  <textarea
                    id="custom-session-notes"
                    name="notes"
                    value={customSessionForm.notes}
                    onChange={handleCustomSessionFormChange}
                    placeholder="Add notes about this custom session..."
                    disabled={sessionActionLoading}
                  />
                </div>
                
                <div className="custom-session-info">
                  <p>
                    <strong>Note:</strong> Custom sessions are automatically marked as "Completed". 
                    If a compensatory session exists, the most recent one will be removed to keep the total session count the same.
                  </p>
                </div>
              </div>
            </div>
            <div className="session-modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setCustomSessionModalOpen(false)}
                disabled={sessionActionLoading}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleCustomSessionSubmit}
                disabled={sessionActionLoading}
              >
                {sessionActionLoading ? 'Adding...' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetail; 