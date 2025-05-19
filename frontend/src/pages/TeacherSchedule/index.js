/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { teachersAPI, coursesAPI, kindergartenClassesAPI } from '../../api';
import './TeacherSchedule.css';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Badge,
  List,
  ListItem,
  Stack,
  HStack,
  VStack,
  Tag,
  TabList,
  TabPanels,
  Tab,
  Tabs,
  TabPanel,
  useColorModeValue
} from '@chakra-ui/react';

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
  const { t } = useTranslation();
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
            <div><strong>{t('teachers.schedule.school')}:</strong> {resource.school?.name || t('common.not_provided')}</div>
            <div><strong>{t('teachers.schedule.age_group')}:</strong> {resource.ageGroup || t('common.not_provided')}</div>
            <div><strong>{t('teachers.schedule.students')}:</strong> {resource.studentCount || 0}</div>
          </div>
        ) : (
          <div className="tooltip-details">
            <div><strong>{t('teachers.schedule.level')}:</strong> {resource.level || t('common.not_provided')}</div>
            <div><strong>{t('teachers.schedule.branch')}:</strong> {resource.branch?.name || t('common.not_provided')}</div>
            <div><strong>{t('teachers.schedule.students')}:</strong> {resource.totalStudent || 0}/{resource.maxStudents || t('common.not_provided')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const TeacherSchedule = () => {
  const { t } = useTranslation();
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [kindergartenClasses, setKindergartenClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const tooltipRef = useRef(null);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

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
        
        // Skip API calls if we're in the "new" teacher route
        if (teacherId === 'new' || !teacherId) {
          setError(t('teachers.cannot_view_schedule'));
          setLoading(false);
          return;
        }
        
        // Fetch teacher details
        const teacherResponse = await teachersAPI.getById(teacherId);
        
        // Check if valid response
        if (!teacherResponse.data || (typeof teacherResponse.data === 'object' && Object.keys(teacherResponse.data).length === 0)) {
          setError(t('teachers.teacher_not_found', { id: teacherId }));
          setLoading(false);
          return;
        }
        
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
        setError(t('teachers.schedule.error', {
          errorType: err.response?.status === 404 ? t('teachers.not_found') : t('common.try_again')
        }));
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacherData();
    }
  }, [teacherId, t]);

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
              title: `${course.name} (${course.level || t('common.not_provided')})`,
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
              title: `[${t('teachers.schedule.kindergarten')}] ${kClass.name} (${kClass.school?.name || t('common.not_provided')})`,
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
      timeOfDayLabel = t('teachers.schedule.morning');
    } else if (startHour >= 12 && startHour < 17) {
      timeOfDayLabel = t('teachers.schedule.afternoon');
    } else {
      timeOfDayLabel = t('teachers.schedule.evening');
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
    const duration = Math.round((event.end - event.start) / (1000 * 60)); // Duration in minutes
    
    // Style based on event type (kindergarten or course)
    const eventTypeStyle = event.type === 'kindergarten' 
      ? { borderLeft: '3px solid #805ad5' } 
      : { borderLeft: '3px solid #3182ce' };
    
    return (
      <div 
        className="event-wrapper"
        onClick={(e) => {
          e.stopPropagation();
          handleSelectEvent(event);
        }}
        style={eventTypeStyle}
      >
        <strong className="event-title">
          {event.type === 'kindergarten' && '🧒 '}
          {event.title}
        </strong>
        <p className="event-details">
          {startTime} - {endTime} • {duration}{t('teachers.schedule.minutes')}
          {event.type === 'kindergarten' ? 
            (event.resource.school ? ` • ${event.resource.school.name}` : '') :
            (event.resource.branch ? ` • ${event.resource.branch.name}` : '')
          }
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">{t('teachers.schedule.loading')}</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={6}>
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Heading size="lg" mb={4}>
        {teacher ? t('teachers.schedule.title_with_name', { name: teacher.name }) : t('teachers.schedule.title')}
      </Heading>
      
      {teacher && (
        <Box mb={6}>
          <HStack spacing={4} mb={4}>
            <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
              {teacher.specialization || t('teachers.no_specialization')}
            </Badge>
            {teacher.active !== undefined && (
              <Badge colorScheme={teacher.active ? "green" : "red"} fontSize="sm" px={2} py={1}>
                {teacher.active ? t('common.active') : t('common.inactive')}
              </Badge>
            )}
          </HStack>
          
          <Text color="gray.600" fontSize="sm">
            {t('teachers.email')}: {teacher.email || t('common.not_provided')} • {t('teachers.phone')}: {teacher.phone || t('common.not_provided')}
          </Text>
        </Box>
      )}
      
      <Tabs variant="enclosed" colorScheme="blue" size="md">
        <TabList>
          <Tab>{t('teachers.schedule.calendar')}</Tab>
          <Tab>{t('teachers.schedule.assignments')}</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel p={4}>
            <Box 
              className="calendar-container"
              bg={bgColor} 
              borderWidth="1px" 
              borderColor={borderColor} 
              borderRadius="md" 
              p={4} 
              shadow="sm"
            >
              <Flex justify="center" mb={4} wrap="wrap" gap={4}>
                <Tag size="md" colorScheme="green" borderRadius="full" variant="solid">
                  {t('teachers.schedule.morning_classes')}
                </Tag>
                <Tag size="md" colorScheme="orange" borderRadius="full" variant="solid">
                  {t('teachers.schedule.afternoon_classes')}
                </Tag>
                <Tag size="md" colorScheme="red" borderRadius="full" variant="solid">
                  {t('teachers.schedule.evening_classes')}
                </Tag>
                <Tag size="md" colorScheme="purple" borderRadius="full" variant="solid">
                  {t('teachers.schedule.kindergarten_classes')}
                </Tag>
              </Flex>
              
              <Box position="relative">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '700px' }}
                  views={['month', 'week', 'day']}
                  defaultView="week"
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  components={{
                    event: EventComponent
                  }}
                  messages={{
                    today: t('teachers.schedule.today'),
                    month: t('teachers.schedule.month'),
                    week: t('teachers.schedule.week'),
                    day: t('teachers.schedule.day'),
                    agenda: t('teachers.schedule.agenda'),
                    noEventsInRange: t('teachers.schedule.no_events')
                  }}
                />
                
                {selectedEvent && (
                  <div 
                    className="tooltip-container"
                    ref={tooltipRef}
                  >
                    <EventTooltip 
                      event={selectedEvent} 
                      onClose={() => setSelectedEvent(null)} 
                    />
                  </div>
                )}
              </Box>
            </Box>
          </TabPanel>
            
          <TabPanel p={4}>
            <VStack spacing={6} align="stretch">
              {courses.length > 0 && (
                <Box>
                  <Heading size="md" mb={4}>{t('courses.title')}</Heading>
                  <List spacing={3}>
                    {courses.map(course => (
                      <ListItem 
                        key={course._id} 
                        p={4} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor={borderColor}
                        bg={bgColor}
                      >
                        <Heading size="sm" mb={2}>{course.name}</Heading>
                        <Flex mb={2} wrap="wrap" gap={2}>
                          <Badge colorScheme="blue">{course.level || t('common.not_provided')}</Badge>
                          <Badge colorScheme="green">
                            {course.branch && course.branch.name ? course.branch.name : t('common.not_provided')}
                          </Badge>
                        </Flex>
                          {course.weeklySchedule && course.weeklySchedule.length > 0 ? (
                          <Box bg={cardBg} p={2} borderRadius="md" fontSize="sm">
                            <Text fontWeight="medium" mb={1}>{t('courses.schedule')}:</Text>
                            <List>
                              {course.weeklySchedule.map((schedule, idx) => (
                                <ListItem key={idx}>
                                  {t(`days.${schedule.day.toLowerCase()}`)}: {schedule.startTime} - {schedule.endTime}
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                          ) : (
                          <Text fontSize="sm" color="gray.500">{t('teachers.schedule.no_schedule')}</Text>
                          )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {kindergartenClasses.length > 0 && (
                <Box>
                  <Heading size="md" mb={4}>{t('teachers.kindergarten_classes')}</Heading>
                  <List spacing={3}>
                    {kindergartenClasses.map(kClass => (
                      <ListItem 
                        key={kClass._id} 
                        p={4} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor={borderColor}
                        bg={bgColor}
                      >
                        <Heading size="sm" mb={2}>{kClass.name}</Heading>
                        <Flex mb={2} wrap="wrap" gap={2}>
                          <Badge colorScheme="purple">
                            {kClass.school && kClass.school.name ? kClass.school.name : t('common.not_provided')}
                          </Badge>
                          <Badge colorScheme="teal">{kClass.ageGroup || t('common.not_provided')}</Badge>
                        </Flex>
                          {kClass.weeklySchedule && kClass.weeklySchedule.length > 0 ? (
                          <Box bg={cardBg} p={2} borderRadius="md" fontSize="sm">
                            <Text fontWeight="medium" mb={1}>{t('courses.schedule')}:</Text>
                            <List>
                              {kClass.weeklySchedule.map((schedule, idx) => (
                                <ListItem key={idx}>
                                  {t(`days.${schedule.day.toLowerCase()}`)}: {schedule.startTime} - {schedule.endTime}
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        ) : (
                          <Text fontSize="sm" color="gray.500">{t('teachers.schedule.no_schedule')}</Text>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {courses.length === 0 && kindergartenClasses.length === 0 && (
                <Alert status="info">
                  <AlertIcon />
                  {t('teachers.schedule.no_assignments')}
                </Alert>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default TeacherSchedule;