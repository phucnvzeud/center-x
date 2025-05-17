import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { kindergartenClassesAPI } from '../../api';
import { clearCache, generateCacheKey } from '../../api/cache';
import SessionActions from '../../components/SessionActions';
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
  FaRegClock,
  FaArrowLeft,
  FaTrash
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
  useColorModeValue,
  Link
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
    startTime: '09:00', // Default start time
    endTime: '10:00',   // Default end time
    notes: ''
  });
  const [deleteSessionModalOpen, setDeleteSessionModalOpen] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState(null);

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.300');
  const primaryGradient = useColorModeValue('linear(to-r, blue.500, purple.500)', 'linear(to-r, blue.300, purple.300)');

  const backButtonHoverBg = useColorModeValue('gray.100', 'gray.700');
  const listItemBg = useColorModeValue('gray.50', 'gray.800');
  const scheduleDayBg = useColorModeValue('blue.100', 'blue.700');
  const scheduleDayColor = useColorModeValue('blue.700', 'blue.100');
  const holidayDateBg = useColorModeValue('orange.100', 'orange.700');
  const holidayDateColor = useColorModeValue('orange.700', 'orange.100');

  // New color values for sessions list to fix hook errors
  const monthHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const monthHeaderHoverBg = useColorModeValue('gray.100', 'gray.600');
  const chevronIconColor = useColorModeValue('gray.500', 'gray.300');
  const tableHeadBg = useColorModeValue('gray.50', 'gray.700');
  const todaySessionTrBg = useColorModeValue('blue.50', 'blue.900');
  const noSessionsBoxBg = useColorModeValue('gray.50', 'gray.700');
  const progressTextColor = useColorModeValue('blue.600', 'blue.300');

  const checkAndUpdateClassStatus = useCallback(async (currentClassData, currentStatsData) => {
    if (!currentClassData || !currentStatsData || 
        typeof currentClassData.totalSessions !== 'number' || 
        typeof currentStatsData.completed !== 'number' ||
        !currentClassData.status // Ensure status field exists
    ) {
      // console.warn('checkAndUpdateClassStatus: Essential data missing for status check.');
      return; // Silently return if data isn't ready
    }

    const { totalSessions, status: currentStatus } = currentClassData;
    const { completed } = currentStatsData;
    let newStatus = currentStatus;

    if (totalSessions > 0) {
      const progress = (completed / totalSessions) * 100;
      if (progress >= 100) {
        if (currentStatus !== 'Finished') {
          newStatus = 'Finished';
        }
      } else { // Progress < 100
        if (currentStatus === 'Finished') {
          newStatus = 'Active'; // Revert to Active if it was Finished
        }
      }
    } else { // totalSessions <= 0
      if (currentStatus === 'Finished') {
        newStatus = 'Active'; // A class with no sessions cannot be 'Finished'
      }
    }

    if (newStatus !== currentStatus) {
      try {
        toast.loading(`Updating class status to ${newStatus}...`, { id: 'class-status-toast' });
        const updatedClassFromAPI = await kindergartenClassesAPI.update(classId, { status: newStatus });
        setKClass(updatedClassFromAPI.data); 
        toast.success(`Class status automatically updated to ${newStatus}.`, { id: 'class-status-toast' });
      } catch (err) {
        console.error('Error auto-updating class status:', err);
        toast.error(`Failed to auto-update class status to ${newStatus}. Please ensure 'Finished' is a valid status.`, { id: 'class-status-toast' });
      }
    }
  }, [classId, setKClass]); // kindergartenClassesAPI.update is stable, toast is stable

  const fetchSessionsData = useCallback(async () => {
    try {
      const [sessionsResponse, statsResponse] = await Promise.all([
        kindergartenClassesAPI.getSessions(classId),
        kindergartenClassesAPI.getSessionStats(classId)
      ]);
      
      // Log the raw stats response to check its structure and values
      console.log('Raw session stats from API:', statsResponse.data);

      const sessionsList = sessionsResponse.data.map((session, idx) => ({
        ...session,
        index: idx
      }));
      
      setSessions(sessionsList);
      setSessionStats(statsResponse.data);
      
      const currentMonth = getCurrentMonthKey();
      const monthKeys = [...new Set(sessionsList.map(session => {
        const date = new Date(session.date);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      }))];
      
      setExpandedMonths(prev => {
        const newExpandedState = { ...prev };
        if (monthKeys.includes(currentMonth)) {
          newExpandedState[currentMonth] = true;
        }
      monthKeys.forEach(monthKey => {
          if (newExpandedState[monthKey] === undefined) {
            newExpandedState[monthKey] = monthKey === currentMonth;
          }
      });
        return newExpandedState;
      });
    } catch (err) {
      console.error('Error fetching sessions data:', err);
      toast.error('Failed to load sessions data.');
      setError('Failed to load sessions data. Please try again later.');
    }
  }, [classId]);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        const classResponse = await kindergartenClassesAPI.getById(classId);
        setKClass(classResponse.data);
          await fetchSessionsData();
        setLoading(false);
        setTimeout(() => {
          if (sessionsRef.current) {
            sessionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
          }
        }, 100); // Keep a small delay to ensure DOM is ready after expandedMonths update
      } catch (err) {
        console.error('Error fetching class data:', err);
        toast.error('Failed to load class details.');
        setError('Failed to load class data. Please try again later.');
        setLoading(false);
      }
    };
    fetchClassData();
  }, [classId, fetchSessionsData]); // Keep fetchSessionsData if it's stable or memoized

  // Effect to automatically update class status based on progress
  useEffect(() => {
    if (kClass && sessionStats && !loading) {
      // Ensure we don't run this if kClass or sessionStats are null (e.g. during initial load error)
      checkAndUpdateClassStatus(kClass, sessionStats);
    }
  }, [kClass, sessionStats, loading, checkAndUpdateClassStatus]);
  
  const getCurrentMonthKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}`;
  };
  
  const toggleMonthExpansion = (monthKey) => {
    if (monthKey === getCurrentMonthKey() && expandedMonths[monthKey]) {
      return; 
    }
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const handleDeleteClass = async () => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await kindergartenClassesAPI.remove(classId);
        toast.success('Class deleted successfully.');
        navigate('/kindergarten/classes');
      } catch (err) {
        console.error('Error deleting class:', err);
        toast.error('Failed to delete class.');
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
      if (newStatus === 'Holiday Break') {
        notes = notes ? `${notes}\nMarked as holiday break.` : 'Holiday break.';
      }
      
      const updateData = {
        status: newStatus,
        notes: notes,
        addCompensatory
      };
      
      await kindergartenClassesAPI.updateSession(classId, sessionIndex, updateData);

      // Clear relevant caches
      const sessionsCacheKey = generateCacheKey('kindergartenClassesAPI.getSessions', [classId]);
      const sessionStatsCacheKey = generateCacheKey('kindergartenClassesAPI.getSessionStats', [classId]);
      const classByIdCacheKey = generateCacheKey('kindergartenClassesAPI.getById', [classId]);
      
      clearCache([sessionsCacheKey, sessionStatsCacheKey, classByIdCacheKey]);
      // console.log('Cleared caches for:', sessionsCacheKey, sessionStatsCacheKey, classByIdCacheKey); // For debugging
      
      // Optimistically update the local sessions state for immediate UI feedback
      setSessions(prevSessions => 
        prevSessions.map((s, idx) => 
          idx === sessionIndex 
            ? { ...s, status: newStatus, notes: updateData.notes } // Use notes from updateData
            : s
        )
      );
      
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

  const handleConfirmDeleteSession = async () => {
    if (sessionToDeleteId === null) return;

    setSessionActionLoading(true);
    try {
      // Assuming kindergartenClassesAPI.deleteSession(classId, sessionIndex) exists
      await kindergartenClassesAPI.deleteSession(classId, sessionToDeleteId);
      toast.success('Session deleted permanently.');
      
      setDeleteSessionModalOpen(false);
      setSessionToDeleteId(null);

      // Refresh data
      await fetchSessionsData();
      const classResponse = await kindergartenClassesAPI.getById(classId);
      setKClass(classResponse.data); // Also refresh class-level data like totalSessions if it might change

    } catch (err) {
      console.error('Error deleting session permanently:', err);
      toast.error(err.response?.data?.message || 'Failed to delete session. Please ensure this action is supported.');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleCustomSessionSubmit = async () => {
    try {
      // Validation
      if (!customSessionForm.date) {
        toast.error('Please select a date');
        return;
      }
      
      if (!customSessionForm.startTime) {
        toast.error('Please select a start time');
        return;
      }
      
      if (!customSessionForm.endTime) {
        toast.error('Please select an end time');
        return;
      }

      // Show loading state
      setSessionActionLoading(true);
      
      // Clone the form data and ensure date is in proper format
      const formData = {
        ...customSessionForm,
        date: new Date(customSessionForm.date).toISOString()
      };

      console.log('Submitting custom session data:', formData);

      // Add the custom session
      const response = await kindergartenClassesAPI.addCustomSession(classId, formData);
      
      if (response.status === 201) {
        toast.success('Custom session added successfully');
        
        // Close the modal and reset form
        setCustomSessionModalOpen(false);
        setCustomSessionForm({
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
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
      // More detailed error logging for debugging
      if (err.response) {
        console.error('Error response:', {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        });
      }
      const errorMessage = err.response?.data?.message || 'Failed to add custom session';
      toast.error(errorMessage);
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
            <th>Day & Time</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {monthSessions.map((session, idx) => {
            const dateObj = new Date(session.date);
            const formattedDate = formatDate(dateObj);
            const dayName = getDayName(dateObj);
            const isToday = isSameDay(dateObj, new Date());
            const isPast = dateObj < new Date();
            
            const statusVariant = getStatusVariant(session.status);
            const sessionKey = `${monthName}-${idx}`;
            
            return (
              <tr key={sessionKey} className={isToday ? 'today-session' : ''}>
                <td>{idx + 1}</td>
                <td className={isToday ? 'bg-info text-white' : ''}>{formattedDate}</td>
                <td>
                  <VStack spacing={0} align="flex-start">
                    <Text fontWeight="medium">{dayName}</Text>
                    <Text fontSize="sm" color={subtleTextColor}>
                      {session.startTime || formatTime(session.date)} {session.endTime ? `- ${session.endTime}` : ''}
                    </Text>
                  </VStack>
                </td>
                <td>
                  <Badge bg={statusVariant}>
                    {session.status}
                  </Badge>
                </td>
                <Td 
                  maxWidth="250px" 
                  whiteSpace="normal" 
                  wordBreak="break-word"
                  fontSize="sm"
                >
                  {session.notes || '-'}
                </Td>
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

    // Sort months in chronological order
    return Object.fromEntries(
      Object.entries(grouped).sort(([keyA], [keyB]) => {
        // Parse the month keys (YYYY-MM format)
        const [yearA, monthA] = keyA.split('-').map(num => parseInt(num, 10));
        const [yearB, monthB] = keyB.split('-').map(num => parseInt(num, 10));
        
        // Compare years first
        if (yearA !== yearB) {
          return yearA - yearB;
        }
        
        // If same year, compare months
        return monthA - monthB;
      })
    );
  }, [sessions]);

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="80vh" bg={bgColor}>
        <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
        <Text mt={4} fontSize="lg" color={textColor}>Loading class details...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" centerContent py={10} bg={bgColor} minH="80vh">
        <Box p={8} bg={cardBgColor} boxShadow="xl" borderRadius="lg" textAlign="center">
          <Heading as="h2" size="lg" color="red.500" mb={4}>Error Occurred</Heading>
          <Text fontSize="md" color={textColor} mb={6}>{error}</Text>
          <Button colorScheme="blue" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!kClass) {
    return (
      <Container maxW="container.md" centerContent py={10} bg={bgColor} minH="80vh">
        <Box p={8} bg={cardBgColor} boxShadow="xl" borderRadius="lg" textAlign="center">
          <Heading as="h2" size="lg" color="orange.500" mb={4}>Class Not Found</Heading>
          <Text fontSize="md" color={textColor} mb={6}>The requested class could not be found.</Text>
          <Button as={RouterLink} to="/kindergarten/classes" colorScheme="blue">
            Return to Classes List
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
      <Container maxW="container.xl">
        {/* Breadcrumbs and Back Button */}
        <Flex justify="space-between" align="center" mb={4}>
          <Breadcrumb spacing="8px" separator={<FaChevronRight color="gray.500" />} fontSize="sm">
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/kindergarten" color={subtleTextColor} _hover={{ color: 'blue.500' }}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/kindergarten/classes" color={subtleTextColor} _hover={{ color: 'blue.500' }}>Classes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <Text color={headingColor} fontWeight="medium">{kClass.name}</Text>
            </BreadcrumbItem>
          </Breadcrumb>
          <Button 
            leftIcon={<FaArrowLeft />} 
            onClick={() => navigate(-1)} 
            variant="outline"
            size="sm"
            borderColor={borderColor}
            color={textColor}
            _hover={{ bg: backButtonHoverBg }}
          >
            Back
          </Button>
        </Flex>

        {/* Header Section */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'flex-start', md: 'center' }}
          mb={6}
          p={6}
          bg={cardBgColor}
          borderRadius="lg"
          boxShadow="md"
        >
          <Box mb={{ base: 4, md: 0 }}>
            <Heading 
              as="h1" 
              size="xl" 
              bgGradient={primaryGradient}
              bgClip="text"
              fontWeight="extrabold"
            >
              {kClass.name}
            </Heading>
            <Text fontSize="lg" color={subtleTextColor} mt={1}>
              <Icon as={FaSchool} mr={2} verticalAlign="middle" />
              {kClass.school?.name || 'No School Assigned'}
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              as={RouterLink}
              to={`/kindergarten/classes/edit/${classId}`} 
              leftIcon={<FaEdit />}
              colorScheme="yellow"
              variant="solid"
              size="md"
            >
              Edit Class
            </Button>
            <Button
              leftIcon={<FaTimes />}
              colorScheme="red"
              variant="outline"
              size="md"
              onClick={handleDeleteClass} 
            >
              Delete Class
            </Button>
          </HStack>
        </Flex>

        {/* Class Information Section */}
        <Box 
          bg={cardBgColor}
          p={{ base: 4, md: 6 }}
          borderRadius="lg"
          boxShadow="md"
          mb={8} 
        >
          <Flex align="center" mb={6}>
             <Icon as={FaGraduationCap} fontSize="2xl" color="blue.500" mr={3} />
            <Heading size="lg" color={headingColor} fontWeight="semibold">
                Class Information
            </Heading>
                  </Flex>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 5, md: 8 }}>
            {/* Left Column: Basic Information */}
            <VStack align="stretch" spacing={2}>
              <InfoItem label="Class Name" value={kClass.name} />
              <InfoItem label="School" value={kClass.school?.name || 'N/A'} />
              <InfoItem label="Teacher" value={kClass.teacher ? kClass.teacher.name : (kClass.teacherName || 'N/A')} />
              {kClass.teacher?.email && (
                <InfoItem 
                  label="Teacher Email" 
                  value={kClass.teacher.email} 
                  isLink={`mailto:${kClass.teacher.email}`}
                />
                )}
              {kClass.teacher?.phone && <InfoItem label="Teacher Phone" value={kClass.teacher.phone} />}
              <InfoItem label="Age Group" value={kClass.ageGroup} />
              <InfoItem label="Student Count" value={String(kClass.studentCount || 0)} />
              <InfoItem label="Status">
                <Badge colorScheme={kClass.status === 'Active' ? 'green' : 'orange'} px={3} py={1} borderRadius="md">
                    {kClass.status}
                    </Badge>
              </InfoItem>
              <InfoItem label="Start Date" value={formatDate(kClass.startDate)} />
              <InfoItem label="Total Sessions" value={String(kClass.totalSessions || 0)} />
                </VStack>

            {/* Right Column: Weekly Schedule & Holidays */}
            <VStack align="stretch" spacing={6}>
              <Box>
                <Heading as="h4" size="md" mb={3} color={headingColor} borderBottomWidth="1px" borderColor={borderColor} pb={2}>
                  Weekly Schedule
                </Heading>
              {kClass.weeklySchedule && kClass.weeklySchedule.length > 0 ? (
                  <VStack align="stretch" spacing={3}>
                  {kClass.weeklySchedule.map((schedule, index) => (
                      <Flex 
                        key={index} 
                        p={3} 
                        bg={listItemBg}
                        borderRadius="md" 
                        align="center"
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{ borderColor: 'blue.300', boxShadow: 'sm' }}
                      >
                        <Box 
                          bg={scheduleDayBg}
                          color={scheduleDayColor}
                          borderRadius="md" 
                          px={3} 
                          py={1}
                          fontWeight="medium"
                          mr={4}
                          minW="100px"
                          textAlign="center"
                        >
                          {schedule.day}
                        </Box>
                        <Flex align="center" color={textColor}>
                          <Icon as={FaClock} color={subtleTextColor} mr={2} />
                          <Text>{schedule.startTime} - {schedule.endTime}</Text>
                        </Flex>
                      </Flex>
                    ))}
                  </VStack>
                ) : (
                  <Text color={subtleTextColor} p={3} bg={listItemBg} borderRadius="md" textAlign="center">
                  No schedule has been set for this class.
                    </Text>
              )}
              </Box>

              <Box>
                <Heading as="h4" size="md" mb={3} color={headingColor} borderBottomWidth="1px" borderColor={borderColor} pb={2}>
                  Holidays & Breaks
                </Heading>
              {kClass.holidays && kClass.holidays.length > 0 ? (
                  <VStack align="stretch" spacing={3}>
                  {kClass.holidays.map((holiday, index) => (
                      <Flex 
                        key={index} 
                        p={3} 
                        bg={listItemBg}
                        borderRadius="md" 
                        align="center"
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{ borderColor: 'orange.300', boxShadow: 'sm' }}
                      >
                        <Box 
                          bg={holidayDateBg}
                          color={holidayDateColor}
                          borderRadius="md" 
                          px={3} 
                          py={1}
                          fontWeight="medium"
                          mr={4}
                          minW="110px"
                          textAlign="center"
                        >
                          {formatDate(holiday.date)}
                        </Box>
                        <Text color={textColor}>{holiday.name}</Text>
                      </Flex>
                    ))}
                  </VStack>
                ) : (
                  <Text color={subtleTextColor} p={3} bg={listItemBg} borderRadius="md" textAlign="center">
                  No holidays or breaks have been set for this class.
                    </Text>
                )}
              </Box>
            </VStack>
            </SimpleGrid>
        </Box>

        {/* Sessions Tracking Section */}
        <Box 
          ref={sessionsRef} 
          mb={8} 
          id="sessions-tracking"
          bg={cardBgColor}
          p={{ base: 4, md: 6 }}
                  borderRadius="lg"
          boxShadow="md"
        >
          <Flex justify="space-between" align="center" mb={6}>
                  <Flex align="center">
              <Icon as={FaCalendarAlt} fontSize="2xl" color="blue.500" mr={3} />
              <Heading size="lg" color={headingColor} fontWeight="semibold">
                    Sessions
                </Heading>
            </Flex>
            <HStack spacing={3}>
                  <Button
                    leftIcon={<FaCalendarPlus />}
                colorScheme="green"
                    onClick={() => setCustomSessionModalOpen(true)}
                size="sm"
                  >
                    Add Custom Session
                  </Button>
                  <Button
                    leftIcon={<FaFileExcel />}
                colorScheme="teal"
                    onClick={exportSessionsToExcel}
                size="sm"
                  >
                    Export to Excel
                  </Button>
                </HStack>
              </Flex>

          {/* Session Stats */}
          {sessionStats && kClass && (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4} mb={6}>
              <StatCard 
                label="Total Sessions" 
                value={kClass.totalSessions ?? 0} 
                icon={FaCalendarAlt}
                color="blue"
              />
              <StatCard 
                label="Completed" 
                value={sessionStats.completed ?? 0} 
                icon={FaCalendarCheck}
                color="green"
              />
              <StatCard 
                label="Remaining" 
                value={Math.max(0, (kClass.totalSessions ?? 0) - (sessionStats.completed ?? 0))} 
                icon={FaRegCalendarAlt}
                color="purple"
              />
              <StatCard 
                label="Canceled" 
                value={sessionStats.canceled ?? 0} 
                icon={FaCalendarTimes}
                color="red"
              />
            </SimpleGrid>
          )}

          {/* Progress Bar for Session Completion */}
          {sessionStats && kClass && 
            typeof kClass.totalSessions === 'number' &&
            typeof sessionStats.completed === 'number' &&
          (() => {
            const effectiveTotal = kClass.totalSessions; // Use kClass.totalSessions
            const calculatedProgress = effectiveTotal > 0 ? (sessionStats.completed / effectiveTotal) * 100 : 0;
            const displayProgress = Math.min(100, Math.max(0, calculatedProgress)); // Ensure progress is between 0 and 100
            const roundedProgress = parseFloat(displayProgress.toFixed(1));

            return (
              <Box mt={6} mb={6}> 
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" color={textColor}>Class Progress</Text>
                  <Text fontSize="sm" fontWeight="bold" color={progressTextColor}>
                    {roundedProgress}%
                  </Text>
                </Flex>
                <Progress 
                  value={roundedProgress} 
                  size="sm" 
                  colorScheme="blue" 
                  borderRadius="md" 
                  hasStripe 
                  isAnimated
                />
            </Box>
            );
          })()}

          {/* Sessions List */}
          {sessions.length > 0 ? (
            <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden">
              {Object.entries(sessionsByMonth).map(([monthKey, monthData]) => (
                <Box key={monthKey}>
                      <Flex
                        p={4}
                    bg={monthHeaderBg}
                    borderBottomWidth={expandedMonths[monthKey] ? "1px" : "0"}
                    borderColor={borderColor}
                        cursor="pointer"
                    onClick={() => toggleMonthExpansion(monthKey)}
                    _hover={{ bg: monthHeaderHoverBg }}
                    align="center"
                    justify="space-between"
                      >
                        <Flex align="center">
                          <Icon 
                            as={expandedMonths[monthKey] ? FaChevronDown : FaChevronRight} 
                            mr={2} 
                        color={chevronIconColor}
                            boxSize="12px"
                          />
                      <Text fontWeight="semibold" color={headingColor} mb="0">
                        {monthData.label}
                          </Text>
                      <HStack spacing={2} ml={2} align="center">
                        <Badge 
                          colorScheme="blue" 
                          borderRadius="full"
                          px={2}
                          py={1}
                          fontSize="xs"
                          display="flex"
                          alignItems="center"
                        >
                          {monthData.sessions.length} total
                        </Badge>
                        {monthData.sessions.filter(session => session.status === 'Scheduled').length > 0 && (
                          <Badge 
                            colorScheme="red" 
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            px={2}
                            py={1}
                            fontSize="xs"
                            opacity="0.85"
                          >
                            <Box as={FaRegCalendarAlt} mr={1} boxSize="10px" />
                            {monthData.sessions.filter(session => session.status === 'Scheduled').length} scheduled
                          </Badge>
                        )}
                      </HStack>
                    </Flex>
                      </Flex>
                      
                      {expandedMonths[monthKey] && (
                    <Box p={4}>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead bg={tableHeadBg}>
                              <Tr>
                              <Th width="5%">#</Th>
                              <Th width="15%">Date</Th>
                              <Th width="15%">Day & Time</Th>
                              <Th width="15%">Status</Th>
                              <Th width="25%">Notes</Th>
                              <Th width="25%">Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                            {monthData.sessions.map((session, idx) => {
                              const dateObj = new Date(session.date);
                              const formattedDate = formatDate(dateObj);
                              const dayName = getDayName(dateObj);
                              const isToday = isSameDay(dateObj, new Date());
                              const isPast = dateObj < new Date();
                              const statusOption = SessionStatusOptions.find(opt => opt.value === session.status) || {};
                                
                                return (
                                  <Tr 
                                  key={`${monthKey}-${idx}`}
                                  bg={isToday ? todaySessionTrBg : undefined}
                                  position="relative"
                                  >
                                    <SessionActions
                                      session={session}
                                      onMarkCompleted={() => handleQuickStatusUpdate(session.index, 'Completed')}
                                      onMarkCanceled={() => handleQuickStatusUpdate(session.index, 'Canceled')}
                                      onAdvancedEdit={() => handleAdvancedUpdate(session, session.index)}
                                      onDelete={() => {
                                        setSessionToDeleteId(session.index);
                                        setDeleteSessionModalOpen(true);
                                      }}
                                      isLoading={updatingSessionId !== null}
                                      completedLabel="Mark Completed"
                                      canceledLabel="Mark Canceled"
                                      showDelete={true}
                                    />
                                  <Td>{idx + 1}</Td>
                                  <Td fontWeight={isToday ? "bold" : "normal"}>
                                    {formattedDate}
                                    </Td>
                                    <Td>
                                    <VStack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">{dayName}</Text>
                                      <Text fontSize="sm" color={subtleTextColor}>
                                        {session.startTime || formatTime(session.date)} {session.endTime ? `- ${session.endTime}` : ''}
                                      </Text>
                                    </VStack>
                                    </Td>
                                    <Td>
                                    <Badge 
                                      colorScheme={statusOption.colorScheme || 'gray'} 
                                      fontSize="xs"
                                      px={2}
                                      py={1}
                                      borderRadius="full"
                                    >
                                      {session.status}
                                    </Badge>
                                    </Td>
                                  <Td 
                                    maxWidth="250px" 
                                    whiteSpace="normal" 
                                    wordBreak="break-word"
                                    fontSize="sm"
                                  >
                                    {session.notes || '-'}
                                    </Td>
                                    <Td>
                                      <HStack spacing={2} visibility="hidden">
                                        <IconButton icon={<FaCheck />} size="xs" aria-label="Placeholder" />
                                        <IconButton icon={<FaTimes />} size="xs" aria-label="Placeholder" />
                                        <IconButton icon={<FaEdit />} size="xs" aria-label="Placeholder" />
                                        <IconButton icon={<FaTrash />} size="xs" aria-label="Placeholder" />
                                      </HStack>
                                    </Td>
                                  </Tr>
                                );
                              })}
                            </Tbody>
                          </Table>
                      </TableContainer>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
            <Box 
              p={8} 
              textAlign="center" 
              borderWidth="1px" 
              borderRadius="lg" 
              borderColor={borderColor}
              bg={noSessionsBoxBg}
            >
              <Icon as={FaRegCalendarAlt} boxSize={10} color="gray.400" mb={4} />
              <Heading size="md" mb={2} color={subtleTextColor}>No Sessions Available</Heading>
              <Text color={subtleTextColor}>
                There are no scheduled sessions for this class yet.
              </Text>
              <Button 
                mt={4} 
                colorScheme="blue" 
                leftIcon={<FaCalendarPlus />}
                onClick={() => setCustomSessionModalOpen(true)}
              >
                Add Custom Session
              </Button>
                </Box>
              )}
        </Box>

        {/* Session Status Update Modal */}
        <Modal isOpen={sessionModalOpen} onClose={() => setSessionModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Update Session Status</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            {sessionToUpdate && (
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Date</FormLabel>
                    <Input value={formatDate(sessionToUpdate.date)} isReadOnly />
                  </FormControl>
                
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                  <Select
                    value={newSessionStatus}
                    onChange={(e) => setNewSessionStatus(e.target.value)}
                  >
                    {SessionStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={4}
                  />
                </FormControl>
                
                {newSessionStatus === 'Canceled' && (
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="add-compensatory" mb="0">
                        Add compensatory session
                      </FormLabel>
                      <Switch 
                      id="add-compensatory"
                      isChecked={addCompensatory}
                        onChange={() => setAddCompensatory(!addCompensatory)}
                      />
                  </FormControl>
                )}
                </VStack>
            )}
          </ModalBody>
          <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setSessionModalOpen(false)}>
                Cancel
            </Button>
            <Button
                colorScheme="blue" 
                onClick={handleSessionStatusUpdate}
              isLoading={sessionActionLoading}
            >
                Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Custom Session Modal */}
        <Modal isOpen={customSessionModalOpen} onClose={() => setCustomSessionModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Custom Session</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    name="date"
                    value={customSessionForm.date}
                    onChange={handleCustomSessionFormChange}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Start Time</FormLabel>
                    <Input
                      type="time"
                      name="startTime"
                      value={customSessionForm.startTime}
                      onChange={handleCustomSessionFormChange}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>End Time</FormLabel>
                    <Input
                      type="time"
                      name="endTime"
                      value={customSessionForm.endTime}
                      onChange={handleCustomSessionFormChange}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    name="notes"
                    value={customSessionForm.notes}
                    onChange={handleCustomSessionFormChange}
                    placeholder="Reason for adding this custom session"
                    rows={4}
                  />
                </FormControl>
              </VStack>
          </ModalBody>
          <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setCustomSessionModalOpen(false)}>
                Cancel
            </Button>
            <Button
                colorScheme="blue"
                onClick={handleCustomSessionSubmit}
              isLoading={sessionActionLoading}
            >
              Add Session
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

        {/* Delete Session Confirmation Modal */}
        <Modal isOpen={deleteSessionModalOpen} onClose={() => setDeleteSessionModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Permanent Deletion</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Are you sure you want to permanently delete this session?</Text>
              <Text fontWeight="bold" color="red.500">This action cannot be undone and will not create a compensatory session.</Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteSessionModalOpen(false)} isDisabled={sessionActionLoading}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleConfirmDeleteSession}
                isLoading={sessionActionLoading}
                leftIcon={<FaTrash />}
              >
                Delete Permanently
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      </Container>
    </Box>
  );
};

// StatCard component for displaying session statistics
const StatCard = ({ label, value, icon, color = 'blue' }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const statBorderColor = useColorModeValue(`${color}.100`, `${color}.800`);
  const iconBg = useColorModeValue(`${color}.100`, `${color}.800`);
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);
  const statLabelColor = useColorModeValue('gray.600', 'gray.400');
  const statValueColor = useColorModeValue(`${color}.600`, `${color}.300`);
  
  return (
    <Box 
      p={3}
      bg={cardBg} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={statBorderColor}
      overflow="hidden"
      boxShadow="sm"
      transition="all 0.3s"
      _hover={{ 
        boxShadow: 'md',
        transform: 'translateY(-2px)'
      }}
    >
      <Flex alignItems="center" mb={1}>
        <Box
          mr={2}
          p={1.5}
          borderRadius="full"
          bg={iconBg}
          color={iconColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize={4} />
        </Box>
        <Text fontWeight="normal" fontSize="xs" color={statLabelColor}>{label}</Text>
      </Flex>
      <Text fontSize="xl" fontWeight="bold" color={statValueColor}>
        {value}
      </Text>
    </Box>
  );
};

// Helper component for Info Items to reduce repetition
const InfoItem = ({ label, value, children, isLink = null }) => {
  const itemTextColor = useColorModeValue('gray.700', 'gray.200');
  const itemLabelColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between">
      <Text fontWeight="medium" color={itemLabelColor} minW={{ sm: '140px' }} mb={{ base: 1, sm: 0 }}>{label}:</Text>
      {children ? (
        <Box flex={1} textAlign={{ sm: 'left' }}>{children}</Box>
      ) : isLink ? (
        <Link href={isLink} color="blue.500" _hover={{ textDecoration: 'underline' }} isExternal={isLink.startsWith('mailto:')} flex={1} textAlign={{ sm: 'left' }}>
          {value}
        </Link>
      ) : (
        <Text color={itemTextColor} flex={1} textAlign={{ sm: 'left' }}>{value}</Text>
      )}
    </Flex>
  );
};

export default ClassDetail; 