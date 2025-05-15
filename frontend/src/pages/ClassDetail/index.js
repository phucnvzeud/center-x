import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { kindergartenClassesAPI } from '../../api';
import './ClassDetail.css';
import { 
  FaChevronDown, 
  FaChevronRight, 
  FaCalendarAlt, 
  FaFileExcel, 
  FaCheck, 
  FaTimes, 
  FaEdit,
  FaGraduationCap,
  FaSchool,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaUsers,
  FaRegCalendarAlt,
  FaListAlt,
  FaHourglass,
  FaCalendarCheck,
  FaCalendarTimes,
  FaCalendarPlus,
  FaRegClock
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Badge,
  Spinner,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  HStack,
  Stack,
  Grid,
  GridItem,
  Divider,
  Progress,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Container,
  SimpleGrid,
  Checkbox,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  Image,
} from '@chakra-ui/react';

const SessionStatusOptions = [
  { value: 'Scheduled', label: 'Scheduled', color: 'blue.500', colorScheme: 'blue' },
  { value: 'Completed', label: 'Completed', color: 'green.500', colorScheme: 'green' },
  { value: 'Canceled', label: 'Canceled', color: 'red.500', colorScheme: 'red' },
  { value: 'Holiday Break', label: 'Holiday Break', color: 'purple.500', colorScheme: 'purple' },
  { value: 'Compensatory', label: 'Compensatory', color: 'orange.500', colorScheme: 'orange' }
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
    return (
      <Flex direction="column" align="center" justify="center" h="100vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="primary.500"
          size="xl"
          data-aos="fade-up"
        />
        <Text mt={4} fontSize="lg" color="gray.600" data-aos="fade-up" data-aos-delay="200">
          Loading class details...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" centerContent py={10}>
        <Box 
          p={8} 
          bg="white" 
          boxShadow="xl" 
          borderRadius="xl" 
          textAlign="center"
          data-aos="fade-up"
        >
          <Heading as="h2" size="lg" color="red.500" mb={4}>Error</Heading>
          <Text fontSize="md" mb={6}>{error}</Text>
          <Button colorScheme="blue" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!kClass) {
    return (
      <Container maxW="container.md" centerContent py={10}>
        <Box 
          p={8} 
          bg="white" 
          boxShadow="xl" 
          borderRadius="xl" 
          textAlign="center"
          data-aos="fade-up"
        >
          <Heading as="h2" size="lg" color="orange.500" mb={4}>Class Not Found</Heading>
          <Text fontSize="md" mb={6}>The requested class could not be found.</Text>
          <Button 
            as={Link} 
            to="/kindergarten/classes" 
            variant="primary"
          >
            Return to Classes
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box 
      className="bg-gradient-animated"
      minH="100vh" 
      py={8} 
      px={{ base: 4, md: 8 }}
    >
      <Container maxW="container.xl">
        {/* Header Section */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'flex-start', md: 'center' }}
          mb={8}
          data-aos="fade-up"
        >
          <Box mb={{ base: 4, md: 0 }}>
            <Heading 
              as="h1" 
              size="xl" 
              className="text-gradient-primary"
              fontWeight="bold"
              letterSpacing="tight"
            >
              {kClass.name}
            </Heading>
            <Text fontSize="lg" color="white" mt={1}>
              {kClass.school?.name || 'No School Assigned'}
            </Text>
          </Box>
          <HStack spacing={4}>
            <Button
              as={Link}
              to={`/kindergarten/classes/edit/${classId}`} 
              leftIcon={<FaEdit />}
              variant="glass"
              size="md"
              data-aos="fade-left"
              data-aos-delay="100"
            >
              Edit Class
            </Button>
            <Button
              leftIcon={<FaTimes />}
              colorScheme="red"
              variant="outline"
              size="md"
              onClick={handleDeleteClass} 
              data-aos="fade-left"
              data-aos-delay="200"
            >
              Delete Class
            </Button>
          </HStack>
        </Flex>

        {/* Class Information Section */}
        <Box 
          className="glass-card"
          mb={8} 
          overflow="hidden"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <Box bg="rgba(41, 121, 255, 0.8)" py={4} px={6}>
            <Heading size="md" color="white">
              <Flex align="center">
                <Icon as={FaGraduationCap} mr={2} />
                Class Information
              </Flex>
            </Heading>
          </Box>
          <Box p={8}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {/* Basic Information */}
              <Box>
                <Heading as="h3" size="md" mb={4} color="gray.700">
                  Basic Information
                </Heading>
                <VStack align="stretch" spacing={3}>
                  <Flex>
                    <Text fontWeight="bold" width="140px">Class Name:</Text>
                    <Text>{kClass.name}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="bold" width="140px">School:</Text>
                    <Text>{kClass.school?.name || 'N/A'}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="bold" width="140px">Teacher:</Text>
                    <Text>
                      {kClass.teacher ? kClass.teacher.name : (kClass.teacherName || 'N/A')}
                    </Text>
                  </Flex>
                {kClass.teacher && kClass.teacher.email && (
                    <Flex>
                      <Text fontWeight="bold" width="140px">Teacher Email:</Text>
                      <Text>
                        <Link href={`mailto:${kClass.teacher.email}`} color="blue.500">
                          {kClass.teacher.email}
                        </Link>
                      </Text>
                    </Flex>
                )}
                {kClass.teacher && kClass.teacher.phone && (
                    <Flex>
                      <Text fontWeight="bold" width="140px">Teacher Phone:</Text>
                      <Text>{kClass.teacher.phone}</Text>
                    </Flex>
                  )}
                  <Flex>
                    <Text fontWeight="bold" width="140px">Age Group:</Text>
                    <Text>{kClass.ageGroup}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="bold" width="140px">Student Count:</Text>
                    <Text>{kClass.studentCount}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="bold" width="140px">Status:</Text>
                    <Badge colorScheme={kClass.status === 'Active' ? 'green' : 'orange'} px={2} py={1}>
                    {kClass.status}
                    </Badge>
                  </Flex>
                  <Flex>
                    <Text fontWeight="bold" width="140px">Start Date:</Text>
                    <Text>{formatDate(kClass.startDate)}</Text>
                  </Flex>
                  <Flex>
                    <Text fontWeight="bold" width="140px">Total Sessions:</Text>
                    <Text>{kClass.totalSessions}</Text>
                  </Flex>
                </VStack>
              </Box>

              {/* Weekly Schedule & Holidays */}
              <Box>
                <Heading as="h3" size="md" mb={4} color="gray.700">
                  Weekly Schedule
                </Heading>
              {kClass.weeklySchedule && kClass.weeklySchedule.length > 0 ? (
                  <VStack align="stretch" spacing={2} mb={6}>
                  {kClass.weeklySchedule.map((schedule, index) => (
                      <Flex 
                        key={index} 
                        p={2} 
                        bg="gray.50" 
                        borderRadius="md" 
                        align="center"
                        _hover={{ bg: 'gray.100' }}
                      >
                        <Box 
                          bg="primary.100" 
                          color="primary.700" 
                          borderRadius="full" 
                          px={3} 
                          py={1}
                          fontWeight="bold"
                          mr={3}
                          minW="100px"
                          textAlign="center"
                        >
                          {schedule.day}
                        </Box>
                        <Flex align="center">
                          <Icon as={FaClock} color="gray.500" mr={2} />
                          <Text>{schedule.startTime} - {schedule.endTime}</Text>
                        </Flex>
                      </Flex>
                    ))}
                  </VStack>
                ) : (
                  <Box p={4} bg="gray.50" borderRadius="md" mb={6}>
                    <Text color="gray.500" textAlign="center">
                  No schedule has been set for this class.
                    </Text>
                  </Box>
              )}

                <Heading as="h3" size="md" mb={4} color="gray.700">
                  Holidays & Breaks
                </Heading>
              {kClass.holidays && kClass.holidays.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                  {kClass.holidays.map((holiday, index) => (
                      <Flex 
                        key={index} 
                        p={2} 
                        bg="gray.50" 
                        borderRadius="md" 
                        align="center"
                        _hover={{ bg: 'gray.100' }}
                      >
                        <Box 
                          bg="red.100" 
                          color="red.700" 
                          borderRadius="full" 
                          px={3} 
                          py={1}
                          fontWeight="medium"
                          mr={3}
                          minW="110px"
                          textAlign="center"
                        >
                          {formatDate(holiday.date)}
                        </Box>
                        <Text>{holiday.name}</Text>
                      </Flex>
                    ))}
                  </VStack>
                ) : (
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text color="gray.500" textAlign="center">
                  No holidays or breaks have been set for this class.
                    </Text>
                  </Box>
                )}
              </Box>
            </SimpleGrid>
          </Box>
        </Box>

        {/* Sessions Tracking Section */}
        <Box ref={sessionsRef} mb={8} data-aos="fade-up" data-aos-delay="150">
          <Flex 
            align="center" 
            mb={4}
            className="glass-card"
            color="white"
            p={3}
            borderRadius="lg"
          >
            <Icon as={FaListAlt} mr={2} boxSize={5} />
            <Heading as="h2" size="lg">Sessions Tracking</Heading>
          </Flex>
          
          {/* Session Statistics */}
            {sessionStats && (
            <Box 
              className="glass-card"
              mb={6}
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <Box bg="rgba(255, 255, 255, 0.2)" py={4} px={6}>
                <Heading size="md" color="white">
                  <Flex align="center">
                    <Icon as={FaHourglass} mr={2} />
                    Session Statistics
                  </Flex>
                </Heading>
              </Box>
              <Box p={6}>
                <SimpleGrid columns={{ base: 2, md: 6 }} spacing={6} mb={6}>
                  <Stat
                    className="glass-card hover-float"
                    p={4}
                    textAlign="center"
                    data-aos="zoom-in"
                    data-aos-delay="100"
                  >
                    <StatLabel color="white">Total Sessions</StatLabel>
                    <StatNumber fontSize="2xl" color="white">{sessionStats.total}</StatNumber>
                  </Stat>
                  <Stat
                    className="glass-card hover-float"
                    p={4}
                    textAlign="center"
                    data-aos="zoom-in"
                    data-aos-delay="150"
                  >
                    <StatLabel color="white">Completed</StatLabel>
                    <StatNumber fontSize="2xl" color="white">{sessionStats.completed}</StatNumber>
                  </Stat>
                  <Stat
                    className="glass-card hover-float"
                    p={4}
                    textAlign="center"
                    data-aos="zoom-in"
                    data-aos-delay="200"
                  >
                    <StatLabel color="white">Scheduled</StatLabel>
                    <StatNumber fontSize="2xl" color="white">{sessionStats.scheduled}</StatNumber>
                  </Stat>
                  <Stat
                    className="glass-card hover-float"
                    p={4}
                    textAlign="center"
                    data-aos="zoom-in"
                    data-aos-delay="250"
                  >
                    <StatLabel color="white">Canceled</StatLabel>
                    <StatNumber fontSize="2xl" color="white">{sessionStats.canceled}</StatNumber>
                  </Stat>
                  <Stat
                    className="glass-card hover-float"
                    p={4}
                    textAlign="center"
                    data-aos="zoom-in"
                    data-aos-delay="300"
                  >
                    <StatLabel color="white">Holiday Breaks</StatLabel>
                    <StatNumber fontSize="2xl" color="white">{sessionStats.holidayBreak}</StatNumber>
                  </Stat>
                  <Stat
                    className="glass-card hover-float"
                    p={4}
                    textAlign="center"
                    data-aos="zoom-in"
                    data-aos-delay="350"
                  >
                    <StatLabel color="white">Compensatory</StatLabel>
                    <StatNumber fontSize="2xl" color="white">{sessionStats.compensatory}</StatNumber>
                  </Stat>
                </SimpleGrid>
                
                <Box 
                  className="glass-card"
                  p={4} 
                  mb={4}
                  data-aos="fade-up"
                  data-aos-delay="400"
                >
                  <Flex justify="space-between" mb={2}>
                    <Text fontWeight="semibold" color="white">Progress</Text>
                    <Text fontWeight="bold" color="white">{sessionStats.progress}%</Text>
                  </Flex>
                  <Progress 
                    value={sessionStats.progress} 
                    size="lg" 
                    colorScheme="green" 
                    borderRadius="md"
                    hasStripe
                    isAnimated
                  />
                </Box>
                
                <Flex 
                  direction={{ base: 'column', md: 'row' }}
                  bg="gray.50" 
                  p={4} 
                  borderRadius="lg"
                  justify="space-between"
                  align="center"
                  data-aos="fade-up"
                  data-aos-delay="450"
                >
                  <HStack spacing={4}>
                    <Icon as={FaRegClock} color="gray.500" boxSize={5} />
                    <Box>
                      <Text fontWeight="medium" color="gray.600">Remaining</Text>
                      <Text fontWeight="bold" color="gray.700">
                      {sessionStats.remainingWeeks} weeks ({sessionStats.remainingDays} days)
                      </Text>
                    </Box>
                  </HStack>
                  <Badge 
                    px={4} 
                    py={2} 
                    borderRadius="full" 
                    colorScheme={sessionStats.isFinished ? "green" : "blue"}
                    fontSize="md"
                    mt={{ base: 3, md: 0 }}
                  >
                    {sessionStats.isFinished ? "Class Complete" : "In Progress"}
                  </Badge>
                </Flex>
              </Box>
            </Box>
          )}
          
          {/* Sessions List */}
          <Box 
            className="glass-card"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <Box bg="rgba(255, 255, 255, 0.2)" py={4} px={6}>
              <Flex justify="space-between" align="center">
                <Heading size="md" color="white">
                  <Flex align="center">
                    <Icon as={FaCalendarAlt} mr={2} />
                    Sessions
                  </Flex>
                </Heading>
                <HStack>
                  <Button
                    leftIcon={<FaCalendarPlus />}
                    variant="glass"
                    size="sm"
                    onClick={() => setCustomSessionModalOpen(true)}
                    data-aos="fade-left"
                    data-aos-delay="350"
                    className="btn-pulse"
                  >
                    Add Custom Session
                  </Button>
                  <Button
                    leftIcon={<FaFileExcel />}
                    colorScheme="green"
                    variant="outline"
                    size="sm"
                    onClick={exportSessionsToExcel}
                    data-aos="fade-left"
                    data-aos-delay="400"
                  >
                    Export to Excel
                  </Button>
                </HStack>
              </Flex>
            </Box>
            <Box p={0}>
              {Object.keys(sessionsByMonth).length > 0 ? (
                <Box>
                  {Object.entries(sessionsByMonth).map(([monthKey, { label, sessions: monthSessions }]) => (
                    <Box 
                      key={monthKey} 
                      mb={4}
                      data-aos="fade-up"
                      data-aos-delay="200"
                    >
                      <Flex
                        p={4}
                        bg={expandedMonths[monthKey] ? 'primary.50' : 'gray.50'}
                        borderBottomWidth={expandedMonths[monthKey] ? '0' : '1px'}
                        borderColor="gray.200"
                        justify="space-between"
                        align="center"
                        onClick={() => toggleMonthExpansion(monthKey)}
                        cursor="pointer"
                        transition="all 0.3s"
                        _hover={{ bg: expandedMonths[monthKey] ? 'primary.100' : 'gray.100' }}
                      >
                        <Flex align="center">
                          <Icon 
                            as={expandedMonths[monthKey] ? FaChevronDown : FaChevronRight} 
                            mr={2} 
                            color={expandedMonths[monthKey] ? 'primary.500' : 'gray.500'} 
                          />
                          <Text fontWeight="semibold" color={expandedMonths[monthKey] ? 'primary.700' : 'gray.700'}>
                            {label}
                          </Text>
                        </Flex>
                        <Badge colorScheme="primary" variant="subtle">
                          {monthSessions.length} sessions
                        </Badge>
                      </Flex>
                      
                      {expandedMonths[monthKey] && (
                        <Box 
                          overflowX="auto"
                          data-aos="fade-down"
                          data-aos-delay="50"
                        >
                          <Table variant="simple" size="md">
                            <Thead>
                              <Tr>
                                <Th>Date</Th>
                                <Th>Time</Th>
                                <Th>Status</Th>
                                <Th>Notes</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {monthSessions.map((session) => {
                                const sessionDate = new Date(session.date);
                                const isToday = isSameDay(sessionDate, new Date());
                                const statusOption = SessionStatusOptions.find(o => o.value === session.status);
                                
                                return (
                                  <Tr 
                                    key={session.index} 
                                    bg={isToday ? 'blue.50' : 'transparent'}
                                    _hover={{ bg: isToday ? 'blue.100' : 'gray.50' }}
                                  >
                                    <Td fontWeight={isToday ? 'bold' : 'normal'}>
                                      {formatDate(session.date)}
                                    </Td>
                                    <Td>
                                    {session.startTime} - {session.endTime}
                                    </Td>
                                    <Td>
                                      <HStack>
                                        <Badge colorScheme={statusOption?.colorScheme || 'gray'}>
                                      {getStatusLabel(session.status)}
                                    </Badge>
                                        {session.isCompensatory && (
                                          <Badge colorScheme="orange" variant="outline" fontSize="xs">
                                            Compensatory
                                          </Badge>
                                        )}
                                      </HStack>
                                    </Td>
                                    <Td maxW="300px" isTruncated>
                                      <Tooltip label={session.notes || 'No notes'} placement="top" hasArrow>
                                        <Text>{session.notes || '-'}</Text>
                                      </Tooltip>
                                    </Td>
                                    <Td>
                                      <HStack spacing={2}>
                                      {session.status !== 'Completed' && (
                                          <Tooltip label="Mark as Completed" hasArrow>
                                            <IconButton
                                              icon={updatingSessionId === session.index ? <Spinner size="sm" /> : <FaCheck />}
                                              colorScheme="green"
                                              variant="ghost"
                                          size="sm"
                                              onClick={() => {
                                                const validIndex = typeof session.index === 'number' 
                                                  ? session.index 
                                                  : monthSessions.indexOf(session);
                                                handleQuickStatusUpdate(validIndex, 'Completed');
                                              }}
                                              isDisabled={updatingSessionId === session.index}
                                              aria-label="Mark as completed"
                                            />
                                          </Tooltip>
                                      )}
                                      
                                      {session.status !== 'Canceled' && (
                                          <Tooltip label="Mark as Canceled" hasArrow>
                                            <IconButton
                                              icon={updatingSessionId === session.index ? <Spinner size="sm" /> : <FaTimes />}
                                              colorScheme="red"
                                              variant="ghost"
                                          size="sm"
                                              onClick={() => {
                                                const validIndex = typeof session.index === 'number' 
                                                  ? session.index 
                                                  : monthSessions.indexOf(session);
                                                handleQuickStatusUpdate(validIndex, 'Canceled');
                                              }}
                                              isDisabled={updatingSessionId === session.index}
                                              aria-label="Mark as canceled"
                                            />
                                          </Tooltip>
                                      )}
                                      
                                      {session.status !== 'Scheduled' && (
                                          <Tooltip label="Mark as Scheduled" hasArrow>
                                            <IconButton
                                              icon={updatingSessionId === session.index ? <Spinner size="sm" /> : <FaCalendarAlt />}
                                              colorScheme="blue"
                                              variant="ghost"
                                          size="sm"
                                              onClick={() => {
                                                const validIndex = typeof session.index === 'number' 
                                                  ? session.index 
                                                  : monthSessions.indexOf(session);
                                                handleQuickStatusUpdate(validIndex, 'Scheduled');
                                              }}
                                              isDisabled={updatingSessionId === session.index}
                                              aria-label="Mark as scheduled"
                                            />
                                          </Tooltip>
                                        )}
                                        
                                        <Tooltip label="Edit Session" hasArrow>
                                          <IconButton
                                            icon={<FaEdit />}
                                            colorScheme="gray"
                                            variant="ghost"
                                        size="sm"
                                            onClick={() => {
                                              const validIndex = typeof session.index === 'number' 
                                                ? session.index 
                                                : monthSessions.indexOf(session);
                                              openSessionEditModal(validIndex);
                                            }}
                                            aria-label="Edit session"
                                          />
                                        </Tooltip>
                                      </HStack>
                                    </Td>
                                  </Tr>
                                );
                              })}
                            </Tbody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box p={8} textAlign="center">
                  <Text color="gray.500">No sessions found</Text>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Breadcrumb 
          separator="/" 
          fontSize="sm" 
          color="gray.500"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/kindergarten">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/kindergarten/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text>{kClass.name}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
      </Container>
      
      {/* Session Update Modal */}
      <Modal 
        isOpen={sessionModalOpen && sessionToUpdate} 
        onClose={() => setSessionModalOpen(false)}
        size="md"
      >
        <ModalOverlay backdropFilter="blur(12px)" />
        <ModalContent className="glass-card">
          <ModalHeader bg="brand.500" color="white" borderTopRadius="xl">
            Update Session Status
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={4}>
            {sessionToUpdate && (
              <>
                <Box mb={4} p={3} bg="gray.50" borderRadius="md">
                  <Text><strong>Date:</strong> {formatDate(sessionToUpdate.date)} ({getDayName(sessionToUpdate.date)})</Text>
                  <Text mt={2}><strong>Current Status:</strong> {getStatusLabel(sessionToUpdate.status)}</Text>
                </Box>
                
                <FormControl mb={4}>
                  <FormLabel htmlFor="session-status">New Status</FormLabel>
                  <Select
                    id="session-status"
                    value={newSessionStatus}
                    onChange={(e) => setNewSessionStatus(e.target.value)}
                    isDisabled={sessionActionLoading}
                  >
                    {SessionStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl mb={4}>
                  <FormLabel htmlFor="session-notes">Notes</FormLabel>
                  <Textarea
                    id="session-notes"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Add notes about this session..."
                    isDisabled={sessionActionLoading}
                    rows={4}
                  />
                </FormControl>
                
                {newSessionStatus === 'Canceled' && (
                  <FormControl mb={4}>
                    <Checkbox
                      id="add-compensatory"
                      isChecked={addCompensatory}
                      onChange={(e) => setAddCompensatory(e.target.checked)}
                      isDisabled={sessionActionLoading}
                      colorScheme="green"
                    >
                      Add compensatory session for this cancellation
                    </Checkbox>
                  </FormControl>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="outline" 
              mr={3} 
                onClick={() => setSessionModalOpen(false)}
              isDisabled={sessionActionLoading}
              >
                Cancel
            </Button>
            <Button
              colorScheme="brand"
                onClick={handleSessionStatusUpdate}
              isLoading={sessionActionLoading}
              loadingText="Saving..."
              className="btn-pulse"
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Custom Session Modal */}
      <Modal 
        isOpen={customSessionModalOpen} 
        onClose={() => setCustomSessionModalOpen(false)}
        size="md"
      >
        <ModalOverlay backdropFilter="blur(12px)" />
        <ModalContent className="glass-card">
          <ModalHeader bg="brand.500" color="white" borderTopRadius="xl">
            Add Custom Session
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={4}>
            <FormControl mb={4} isRequired>
              <FormLabel htmlFor="custom-session-date">Date</FormLabel>
              <Input
                    type="date"
                    id="custom-session-date"
                    name="date"
                    value={customSessionForm.date}
                    onChange={handleCustomSessionFormChange}
                isDisabled={sessionActionLoading}
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel htmlFor="custom-session-notes">Notes (optional)</FormLabel>
              <Textarea
                    id="custom-session-notes"
                    name="notes"
                    value={customSessionForm.notes}
                    onChange={handleCustomSessionFormChange}
                    placeholder="Add notes about this custom session..."
                isDisabled={sessionActionLoading}
                rows={4}
                  />
            </FormControl>
                
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" color="blue.700">
                    <strong>Note:</strong> Custom sessions are automatically marked as "Completed". 
                    If a compensatory session exists, the most recent one will be removed to keep the total session count the same.
              </Text>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="outline" 
              mr={3} 
                onClick={() => setCustomSessionModalOpen(false)}
              isDisabled={sessionActionLoading}
              >
                Cancel
            </Button>
            <Button
              colorScheme="brand"
                onClick={handleCustomSessionSubmit}
              isLoading={sessionActionLoading}
              loadingText="Adding..."
              className="btn-pulse"
            >
              Add Session
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ClassDetail; 