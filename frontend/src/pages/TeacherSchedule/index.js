import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { teachersAPI, coursesAPI, kindergartenClassesAPI } from '../../api';
import './TeacherSchedule.css';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Use startOfWeek with Monday (1) as start
  getDay,
  locales,
});

// Custom tooltip component for event details
const EventTooltip = ({ event, onClose }) => {
  if (!event) return null;
  
  const isKindergarten = event.type === 'kindergarten';
  const resource = event.resource || {};
  
  // Format dates for display
  const formatDateTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="event-tooltip">
      <div className={`tooltip-header ${isKindergarten ? 'kindergarten' : 'course'}`}>
        <h4>{event.title}</h4>
        <button onClick={onClose} className="close-tooltip">&times;</button>
      </div>
      <div className="tooltip-content">
        <div className="tooltip-schedule">
          <strong>{formatDate(event.start)}</strong>
          <div>{formatDateTime(event.start)} - {formatDateTime(event.end)}</div>
        </div>
        
        {isKindergarten ? (
          <div className="tooltip-details">
            <div><strong>School:</strong> {resource.school?.name || 'N/A'}</div>
            <div><strong>Age Group:</strong> {resource.ageGroup || 'N/A'}</div>
            <div><strong>Students:</strong> {resource.studentCount || 0}</div>
          </div>
        ) : (
          <div className="tooltip-details">
            <div><strong>Level:</strong> {resource.level || 'N/A'}</div>
            <div><strong>Branch:</strong> {resource.branch?.name || 'N/A'}</div>
            <div><strong>Students:</strong> {resource.totalStudent || 0}/{resource.maxStudents || 'N/A'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const TeacherSchedule = () => {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [kindergartenClasses, setKindergartenClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const tooltipRef = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setSelectedEvent(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        // Fetch teacher details
        const teacherResponse = await teachersAPI.getById(teacherId);
        setTeacher(teacherResponse.data);
        
        // Fetch all courses
        const coursesResponse = await coursesAPI.getAll();
        
        // Filter courses assigned to this teacher
        const teacherCourses = coursesResponse.data.filter(
          course => course.teacher && (course.teacher._id === teacherId || course.teacher === teacherId)
        );
        
        setCourses(teacherCourses);
        
        // Fetch kindergarten classes for this teacher
        // Using direct API endpoint for kindergarten classes assigned to the teacher
        const kgClassesResponse = await kindergartenClassesAPI.getAll({ teacher: teacherId });
        const teacherKgClasses = kgClassesResponse.data;
        console.log('Fetched kindergarten classes:', teacherKgClasses);
        setKindergartenClasses(teacherKgClasses);
        
        // Generate calendar events from courses and kindergarten classes
        generateCalendarEvents(teacherCourses, teacherKgClasses);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teacher schedule data:', err);
        setError('Failed to load schedule. Please try again later.');
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacherData();
    }
  }, [teacherId]);

  const generateCalendarEvents = (teacherCourses, teacherKindergartenClasses) => {
    const calendarEvents = [];
    // Track unique events to prevent duplicates
    const eventKeys = new Set();
    
    // Current date for reference
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    
    // Day mapping
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    
    console.log('Current day is:', currentDay, '(', 
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay], 
                ')');
    
    // Process each course
    teacherCourses.forEach(course => {
      if (course.weeklySchedule && course.weeklySchedule.length > 0) {
        // Calculate end date or default to 20 weeks from current date
        let endDate;
        const DEFAULT_WEEKS = 20;
        
        if (course.estimatedEndDate) {
          // If course has an estimated end date, use it
          endDate = new Date(course.estimatedEndDate);
        } else if (course.startDate) {
          // If there's a start date but no end date, add 20 weeks to start date
          endDate = new Date(course.startDate);
          endDate.setDate(endDate.getDate() + (DEFAULT_WEEKS * 7));
        } else {
          // No dates available, use 20 weeks from current date
          endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() + (DEFAULT_WEEKS * 7));
        }
        
        // Calculate total weeks to display from current date to end date
        const timeDiff = endDate.getTime() - currentDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const weeksToDisplay = Math.ceil(daysDiff / 7);
        
        course.weeklySchedule.forEach(schedule => {
          // Get the day number (0-6) for this schedule
          const scheduleDay = dayMap[schedule.day];
          
          for (let week = 0; week < weeksToDisplay; week++) {
            // Calculate how many days to add/subtract to get to this day from current day
            let daysToAdd = scheduleDay - currentDay + (week * 7);
            
            // If we're in the first week and the day has already passed, move to next week
            if (week === 0 && daysToAdd < 0) daysToAdd += 7;
            
            // Create a new date for this scheduled day
            const eventDate = new Date(currentDate);
            eventDate.setDate(currentDate.getDate() + daysToAdd);
            
            // Skip if the date is beyond the end date
            if (eventDate > endDate) continue;
            
            // Parse the start and end times
            const startParts = schedule.startTime.split(':');
            const endParts = schedule.endTime.split(':');
            
            const startHour = parseInt(startParts[0], 10);
            const startMinute = parseInt(startParts[1], 10);
            const endHour = parseInt(endParts[0], 10);
            const endMinute = parseInt(endParts[1], 10);
            
            // Create the event start and end datetimes
            const startDateTime = new Date(eventDate);
            startDateTime.setHours(startHour, startMinute, 0);
            
            const endDateTime = new Date(eventDate);
            endDateTime.setHours(endHour, endMinute, 0);
            
            // Create unique key for this event to prevent duplicates
            const eventKey = `${course._id}-${schedule.day}-${schedule.startTime}-${eventDate.toDateString()}`;
            if (eventKeys.has(eventKey)) continue;
            eventKeys.add(eventKey);
            
            // Create the event
            calendarEvents.push({
              title: `${course.name} (${course.level || 'N/A'})`,
              start: startDateTime,
              end: endDateTime,
              courseId: course._id,
              resource: course,
              type: 'course'
            });
          }
        });
      }
    });
    
    // Process each kindergarten class
    console.log('Processing kindergarten classes for calendar:', teacherKindergartenClasses);
    teacherKindergartenClasses.forEach(kClass => {
      console.log('Processing class:', kClass.name, 'Weekly schedule:', kClass.weeklySchedule);
      
      // Check if the class has a valid weekly schedule
      if (!kClass.weeklySchedule || !Array.isArray(kClass.weeklySchedule) || kClass.weeklySchedule.length === 0) {
        console.warn(`Skipping class ${kClass.name} due to missing or invalid weekly schedule`);
        return; // Skip this class
      }
      
      // Calculate end date based on class end date or default to 20 weeks
      let endDate;
      const DEFAULT_WEEKS = 20;
      
      // IMPORTANT: Always show events for active classes, regardless of end date
      // If end date is in the past, we'll still show future events for the next few weeks
      if (kClass.endDate) {
        const classEndDate = new Date(kClass.endDate);
        // Only use the class end date if it's in the future
        if (classEndDate > currentDate) {
          endDate = classEndDate;
          console.log(`Using class end date: ${endDate.toDateString()}`);
        } else {
          // If end date is in the past, show events for the next few weeks anyway
          endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() + (DEFAULT_WEEKS * 7));
          console.log(`Class end date ${classEndDate.toDateString()} is in the past, using default future date: ${endDate.toDateString()}`);
        }
      } else if (kClass.startDate) {
        endDate = new Date(kClass.startDate);
        endDate.setDate(endDate.getDate() + (DEFAULT_WEEKS * 7));
        console.log(`No end date, using start date + ${DEFAULT_WEEKS} weeks: ${endDate.toDateString()}`);
      } else {
        endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + (DEFAULT_WEEKS * 7));
        console.log(`No start or end date, using current date + ${DEFAULT_WEEKS} weeks: ${endDate.toDateString()}`);
      }
      
      // Use shorter time span for testing - show events for next 4 weeks only
      const weeksToDisplay = 4;
      
      // For each schedule entry in the kindergarten class
      kClass.weeklySchedule.forEach(schedule => {
        // Validate schedule has required fields
        if (!schedule.day || !schedule.startTime || !schedule.endTime) {
          console.warn(`Skipping invalid schedule entry for ${kClass.name}:`, schedule);
          return; // Skip this schedule entry
        }
        
        // Get the day number for this schedule
        const scheduleDay = dayMap[schedule.day];
        if (scheduleDay === undefined) {
          console.warn(`Unknown day value in schedule: ${schedule.day}`);
          return; // Skip if day is not recognized
        }
        
        console.log(`Creating events for ${kClass.name} on ${schedule.day} (day ${scheduleDay}) at ${schedule.startTime}-${schedule.endTime}`);
        
        // For each week, create an event
        for (let week = 0; week < weeksToDisplay; week++) {
          // Calculate days to add
          let daysToAdd = scheduleDay - currentDay + (week * 7);
          if (week === 0 && daysToAdd < 0) daysToAdd += 7;
          
          // Create date for this schedule
          const eventDate = new Date(currentDate);
          eventDate.setDate(currentDate.getDate() + daysToAdd);
          
          console.log(`Week ${week}: ${kClass.name} - ${schedule.day} - adding ${daysToAdd} days to current date, resulting in ${eventDate.toDateString()}`);
          
          // We'll skip the end date check for now since we've already adjusted the end date logic above
          // This ensures events will always be displayed
          
          try {
            // Parse times
            const startParts = schedule.startTime.split(':');
            const endParts = schedule.endTime.split(':');
            
            if (startParts.length < 2 || endParts.length < 2) {
              console.warn(`Invalid time format in schedule: ${schedule.startTime} - ${schedule.endTime}`);
              continue; // Skip if time format is invalid
            }
            
            const startHour = parseInt(startParts[0], 10);
            const startMinute = parseInt(startParts[1], 10);
            const endHour = parseInt(endParts[0], 10);
            const endMinute = parseInt(endParts[1], 10);
            
            if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
              console.warn(`Invalid time values in schedule: ${schedule.startTime} - ${schedule.endTime}`);
              continue; // Skip if time values are not numbers
            }
            
            // Create event dates
            const startDateTime = new Date(eventDate);
            startDateTime.setHours(startHour, startMinute, 0);
            
            const endDateTime = new Date(eventDate);
            endDateTime.setHours(endHour, endMinute, 0);
            
            // Create unique key for this event to prevent duplicates
            const eventKey = `kg-${kClass._id}-${schedule.day}-${schedule.startTime}-${eventDate.toDateString()}`;
            if (eventKeys.has(eventKey)) {
              console.log(`Skipping duplicate event with key: ${eventKey}`);
              continue;
            }
            eventKeys.add(eventKey);
            
            // Create the event with different styling for kindergarten classes
            const newEvent = {
              title: `[KG] ${kClass.name} (${kClass.school?.name || 'N/A'})`,
              start: startDateTime,
              end: endDateTime,
              classId: kClass._id,
              resource: kClass,
              type: 'kindergarten'
            };
            
            console.log('Created kindergarten event:', newEvent);
            calendarEvents.push(newEvent);
          } catch (err) {
            console.error(`Error creating event for class ${kClass.name}:`, err);
          }
        }
      });
    });
    
    console.log('Final calendar events:', calendarEvents);
    console.log('Kindergarten events:', calendarEvents.filter(event => event.type === 'kindergarten').length);
    console.log('Course events:', calendarEvents.filter(event => event.type === 'course').length);
    setEvents(calendarEvents);
  };

  const eventStyleGetter = (event) => {
    // Determine the time of day
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    
    let timeOfDay = '';
    if (startHour >= 6 && startHour < 12) {
      timeOfDay = 'morning';
    } else if (startHour >= 12 && startHour < 17) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }
    
    // Add event type class (kindergarten or course)
    const eventType = event.type || 'course';
    
    // Check if event is in a hidden time slot
    const isInHiddenSlot = 
      (startHour === 6) || // 6 AM to 7 AM is hidden
      ((startHour === 11 && startMinute >= 30) || (startHour === 12 && startMinute < 30)); // 11:30 AM to 12:30 PM is hidden
    
    let className = `${timeOfDay}-event ${eventType}-event`;
    if (isInHiddenSlot) {
      className += ' hidden-slot-event';
    }
    
    return {
      className: className,
      style: {
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const EventComponent = ({ event }) => {
    // Determine the time of day
    const startHour = event.start.getHours();
    let timeOfDayLabel = '';
    
    if (startHour >= 6 && startHour < 12) {
      timeOfDayLabel = 'Morning';
    } else if (startHour >= 12 && startHour < 17) {
      timeOfDayLabel = 'Afternoon';
    } else {
      timeOfDayLabel = 'Evening';
    }
    
    // Format event time for compact display
    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    };
    
    const startTime = formatTime(event.start);
    const endTime = formatTime(event.end);
    
    return (
      <div 
        className="event-wrapper"
        onClick={(e) => {
          e.stopPropagation();
          handleSelectEvent(event);
        }}
      >
        <strong className="event-title">{event.title}</strong>
        <p className="event-details">
          {startTime} - {endTime} • {timeOfDayLabel}
          {event.resource.branch && event.resource.branch.name ? 
            ` • ${event.resource.branch.name}` : ''}
        </p>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-spinner">Loading schedule...</div>;
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
    <div className="teacher-schedule-container">
      <h1>{teacher ? `${teacher.name}'s Schedule` : 'Teacher Schedule'}</h1>
      
      {courses.length === 0 && kindergartenClasses.length === 0 ? (
        <div className="no-data-message">
          <p>No courses or kindergarten classes assigned to this teacher yet.</p>
        </div>
      ) : (
        <div className="schedule-content">
          <div className="assignments-panel">
            <h2>Assigned Teaching</h2>
            
            {/* Tabs for switching between courses and kindergarten classes */}
            <div className="assignment-tabs">
              <button 
                className={`tab-button ${courses.length > 0 ? 'active' : 'disabled'}`}
                onClick={() => document.getElementById('courses-section').scrollIntoView({ behavior: 'smooth' })}
                disabled={courses.length === 0}
              >
                Courses ({courses.length})
              </button>
              <button 
                className={`tab-button ${kindergartenClasses.length > 0 ? 'active' : 'disabled'}`}
                onClick={() => document.getElementById('kindergarten-section').scrollIntoView({ behavior: 'smooth' })}
                disabled={kindergartenClasses.length === 0}
              >
                KG Classes ({kindergartenClasses.length})
              </button>
            </div>
            
            <div className="assignments-list">
              {courses.length > 0 && (
                <div id="courses-section" className="assignment-section">
                  <h3>Courses</h3>
                  <ul className="compact-list">
                    {courses.map(course => (
                      <li key={course._id} className="assignment-item">
                        <div className="assignment-name">{course.name}</div>
                        <div className="assignment-details">
                          <span>Level: {course.level || 'N/A'}</span>
                          <span>Branch: {course.branch && course.branch.name ? course.branch.name : 'N/A'}</span>
                        </div>
                        <div className="assignment-schedule">
                          {course.weeklySchedule && course.weeklySchedule.length > 0 ? (
                            <ul className="schedule-times compact">
                              {course.weeklySchedule.map((schedule, idx) => (
                                <li key={idx}>
                                  {schedule.day}: {schedule.startTime} - {schedule.endTime}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No schedule defined</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {kindergartenClasses.length > 0 && (
                <div id="kindergarten-section" className="assignment-section">
                  <h3>Kindergarten Classes</h3>
                  <ul className="compact-list">
                    {kindergartenClasses.map(kClass => (
                      <li key={kClass._id} className="assignment-item">
                        <div className="assignment-name">{kClass.name}</div>
                        <div className="assignment-details">
                          <span>School: {kClass.school && kClass.school.name ? kClass.school.name : 'N/A'}</span>
                          <span>Age Group: {kClass.ageGroup || 'N/A'}</span>
                        </div>
                        <div className="assignment-schedule">
                          {kClass.weeklySchedule && kClass.weeklySchedule.length > 0 ? (
                            <ul className="schedule-times compact">
                              {kClass.weeklySchedule.map((schedule, idx) => (
                                <li key={idx}>
                                  {schedule.day}: {schedule.startTime} - {schedule.endTime}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No schedule defined</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="calendar-container">
            <div className="time-legend">
              <div className="legend-item">
                <span className="legend-color legend-morning"></span>
                <span>Morning Courses (6:00 - 11:59)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-afternoon"></span>
                <span>Afternoon Courses (12:00 - 16:59)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-evening"></span>
                <span>Evening Courses (17:00 - 22:00)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color legend-kindergarten"></span>
                <span>Kindergarten Classes</span>
              </div>
            </div>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              views={['week', 'day']}
              defaultView={'week'}
              min={new Date(0, 0, 0, 7, 0, 0)} // Start display at 7:00 AM instead of 6:00 AM
              max={new Date(0, 0, 0, 22, 0, 0)} // End display at 10:00 PM
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
                timeSlotWrapper: (props) => {
                  const hour = props.value.getHours();
                  const minutes = props.value.getMinutes();
                  
                  // Check if this is a time slot we want to hide
                  // For 11:30 AM to 12:30 PM time range
                  if ((hour === 11 && minutes >= 30) || (hour === 12 && minutes < 30)) {
                    return (
                      <div
                        className="hidden-time-slot"
                        {...props}
                      />
                    );
                  }
                  
                  return <div {...props} />;
                }
              }}
              step={15} // 15-minute intervals for better precision
              timeslots={2} // 2 slots per step gives 7.5-minute visual precision
              onNavigate={(date) => console.log('Calendar navigated to:', date)}
              onSelectEvent={handleSelectEvent}
              selectable
            />
            
            {selectedEvent && (
              <div className="tooltip-container" ref={tooltipRef}>
                <EventTooltip 
                  event={selectedEvent} 
                  onClose={() => setSelectedEvent(null)} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;