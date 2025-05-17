/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { coursesAPI, studentsAPI, teachersAPI, branchesAPI } from '../../api';
import SessionActions from '../../components/SessionActions';
import * as XLSX from 'xlsx';
import {
  Box,
  Heading,
  Text,
  Flex,
  Grid,
  Button,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Progress,
  HStack,
  VStack,
  Stack,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  SimpleGrid,
  UnorderedList,
  ListItem
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaFileExport, 
  FaCheck, 
  FaTimes, 
  FaCalendarAlt, 
  FaUserPlus, 
  FaFileImport, 
  FaEllipsisV, 
  FaSearch 
} from 'react-icons/fa';

const SESSION_STATUS_OPTIONS = [
  'Pending',
  'Taught',
  'Absent (Personal Reason)',
  'Absent (Holiday)',
  'Absent (Other Reason)'
];

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // Using index for Chakra UI Tabs
  
  // Session tracking state
  const [selectedSession, setSelectedSession] = useState(null);
  const [originalStatus, setOriginalStatus] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [showTaughtSessions, setShowTaughtSessions] = useState(false);
  const [updatingSessionIndex, setUpdatingSessionIndex] = useState(null);
  const [activeAbsenceDropdown, setActiveAbsenceDropdown] = useState(null);
  const [showCollapsedFutureSessions, setShowCollapsedFutureSessions] = useState(false);

  // Enrolled Students state
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [newEnrollmentData, setNewEnrollmentData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    totalAmount: 0,
    amountPaid: 0,
    notes: '',
    enrollmentDate: '',
    withdrawnDate: ''
  });
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEnrollment, setCurrentEnrollment] = useState(null);

  // All enrollments including withdrawn ones
  const [allEnrollments, setAllEnrollments] = useState([]);
  
  // Modal disclosures
  const { 
    isOpen: isSessionModalOpen, 
    onOpen: openSessionModal, 
    onClose: closeSessionModal 
  } = useDisclosure();
  const { 
    isOpen: isEnrollModalOpen, 
    onOpen: openEnrollModalDisclosure, 
    onClose: closeEnrollModalDisclosure 
  } = useDisclosure();
  const { 
    isOpen: isWithdrawnModalOpen, 
    onOpen: openWithdrawnModal, 
    onClose: closeWithdrawnModal 
  } = useDisclosure();
  const { 
    isOpen: isImportModalOpen, 
    onOpen: openImportModal, 
    onClose: closeImportModal 
  } = useDisclosure();

  // Add import related states, handlers and component
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Function to fetch course data
  const fetchCourseData = async (shouldRefreshEnrollments = false) => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseData = await coursesAPI.getById(courseId);
        setCourse(courseData.data);
      
      // Optionally refresh enrollment data as well
      if (shouldRefreshEnrollments) {
        // Small delay to ensure course data is properly saved on backend
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchEnrollmentData();
      }
        
        setLoading(false);
      return true;
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again later.');
        setLoading(false);
      return false;
      }
    };

  // Load course data on initial component mount
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Fetch enrollments when the activeTab changes to 'enrollments' or when course data is updated
  useEffect(() => {
    if ((activeTab === 1 || activeTab === 'enrollments') && courseId && course) {
      fetchEnrollmentData();
    }
  }, [activeTab, courseId, course?._id]);

  // Fetch students for enrollment form
  useEffect(() => {
    if (isEnrollModalOpen) {
      const fetchStudents = async () => {
        try {
          const response = await studentsAPI.getAll();
          setStudents(response.data);
        } catch (err) {
          console.error('Error fetching students:', err);
        }
      };
      fetchStudents();
    }
  }, [isEnrollModalOpen]);

  const fetchEnrollmentData = async (retryCount = 0) => {
    try {
      setEnrollmentLoading(true);
      setEnrollmentError(null);
      
      console.log(`Fetching enrollments for course ${courseId}`);
      const response = await coursesAPI.getEnrollments(courseId);
      console.log('Enrollments data:', response.data);
      
      // Store all enrollments
      setAllEnrollments(response.data);
      
      // Calculate payment progress based on all enrollments
      const paymentProgress = calculatePaymentProgress(response.data);
      
      // Only show Active enrollments in the table, filter out Withdrawn students
      const activeEnrollments = response.data.filter(enrollment => 
        enrollment.status === 'Active' || enrollment.status === 'Completed' || enrollment.status === 'Suspended'
      );
      
      console.log(`Found ${activeEnrollments.length} active enrollments out of ${response.data.length} total`);
      setEnrollments(activeEnrollments);
      setEnrollmentLoading(false);
      
      return true;
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      
      // Retry logic for network errors or timing issues
      if (retryCount < 3) {
        console.log(`Retry attempt ${retryCount + 1} for fetching enrollments...`);
        // Wait a bit longer between each retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchEnrollmentData(retryCount + 1);
      }
      
      setEnrollmentError('Failed to load enrollment data. Please try again later.');
      setEnrollmentLoading(false);
      return false;
    }
  };

  // Close absence dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeAbsenceDropdown !== null && !event.target.closest('.absence-dropdown-container')) {
        setActiveAbsenceDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeAbsenceDropdown]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    if (status.startsWith('Absent')) {
      if (status.includes('Personal')) return 'status-absent-personal';
      if (status.includes('Holiday')) return 'status-absent-holiday';
      return 'status-absent-other';
    }
    
    switch (status) {
      case 'Active': return 'status-active';
      case 'Upcoming': return 'status-upcoming';
      case 'Finished': return 'status-finished';
      case 'Cancelled': return 'status-cancelled';
      case 'Taught': return 'status-taught';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  };

  // Session tracking functions
  const getSessionDayAndTime = (date) => {
    if (!date || !course || !course.weeklySchedule) return '';
    
    const sessionDate = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sessionDate.getDay()];
    
    const scheduleForDay = course.weeklySchedule.find(s => s.day === dayOfWeek);
    if (!scheduleForDay) return dayOfWeek;
    
    return `${dayOfWeek}, ${scheduleForDay.startTime} - ${scheduleForDay.endTime}`;
  };

  const openUpdateModal = (session, index) => {
    // Prevent opening modal for future sessions
    if (isFutureSession(session.date)) {
      return;
    }
    
    setSelectedSession({ ...session, index });
    setOriginalStatus(session.status);
    openSessionModal();
  };

  const closeModal = () => {
    closeSessionModal();
    setSelectedSession(null);
    setOriginalStatus(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedSession({
      ...selectedSession,
      [name]: value
    });
  };

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      
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
      const response = await coursesAPI.updateSession(
        courseId,
        selectedSession.index,
        {
          status: selectedSession.status,
          notes: selectedSession.notes,
          addCompensatory: isChangingToAbsent
        }
      );
      
      console.log('Session update response:', response.data);
      
      // Refresh course data
      const courseData = await coursesAPI.getById(courseId);
      setCourse(courseData.data);
      
      closeModal();
      setUpdateLoading(false);
    } catch (err) {
      console.error('Error updating session:', err);
      setUpdateError('Failed to update session. Please try again.');
      setUpdateLoading(false);
    }
  };
  
  const isFutureSession = (dateString) => {
    const sessionDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate > today;
  };

  // Quick status update function
  const handleQuickStatusUpdate = async (sessionIndex, newStatus) => {
    try {
      // Prevent updating future sessions
      const session = course.sessions[sessionIndex];
      if (isFutureSession(session.date)) {
        return;
      }

      setUpdatingSessionIndex(sessionIndex);

      const originalStatus = session.status;
      const isChangingToAbsent = 
        originalStatus === 'Pending' && 
        newStatus.startsWith('Absent');

      // Update session status
      await coursesAPI.updateSession(
        courseId,
        sessionIndex,
        {
          status: newStatus,
          notes: session.notes || '',
          addCompensatory: isChangingToAbsent
        }
      );
      
      // Refresh course data
      const courseData = await coursesAPI.getById(courseId);
      setCourse(courseData.data);
    } catch (err) {
      console.error('Error updating session status:', err);
    } finally {
      setUpdatingSessionIndex(null);
    }
  };

  // Toggle show/hide taught sessions
  const toggleTaughtSessions = () => {
    setShowTaughtSessions(!showTaughtSessions);
  };

  const toggleFutureSessions = () => {
    setShowCollapsedFutureSessions(!showCollapsedFutureSessions);
  };

  // Toggle absence dropdown
  const toggleAbsenceDropdown = (index, event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    setActiveAbsenceDropdown(activeAbsenceDropdown === index ? null : index);
  };
  
  // Handle opening a modal with absence options when Mark Absent is clicked
  const openAbsenceMenu = (sessionIndex) => {
    // Using a modal dialog to select absence reason
    const absenceType = window.confirm(
      "Select absence reason:\n\n" +
      "- Click 'OK' for Personal Reason\n" +
      "- Click 'Cancel' to cancel"
    );
    
    if (absenceType) {
      handleQuickStatusUpdate(sessionIndex, 'Absent (Personal Reason)');
    } else {
      // Could show another dialog for more options in a real implementation
      // For now just do nothing when canceled
    }
  };

  // Filter sessions if taught are hidden
  const sessionsToDisplay = course?.sessions ? (
    showTaughtSessions 
      ? course.sessions 
      : course.sessions.filter(session => session.status !== 'Taught')
  ) : [];

  // Calculate actual end date including compensatory sessions
  const calculateActualEndDate = () => {
    if (!course || !course.sessions || course.sessions.length === 0) {
      return { formattedDate: 'N/A', daysLeft: 0 };
    }
    
    // Sort sessions by date to find the last one
    const sortedSessions = [...course.sessions].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    // Get the date of the last session (including compensatory)
    const lastSessionDate = new Date(sortedSessions[sortedSessions.length - 1].date);
    const formattedDate = formatDate(lastSessionDate);
    
    // Calculate days left
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const daysLeft = Math.ceil((lastSessionDate - today) / (1000 * 60 * 60 * 24));
    
    return { formattedDate, daysLeft };
  };

  // Function to export sessions to Excel in a better format
  const exportSessionsToExcel = () => {
    if (!course || !course.sessions || course.sessions.length === 0) return;
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Course Info Sheet
    const courseInfoData = [
      ['Course Information', ''],
      ['Course Name', course.name || 'N/A'],
      ['Branch', course.branch?.name || 'N/A'],
      ['Teacher', course.teacher?.name || 'N/A'],
      ['Level', course.level || 'N/A'],
      ['Start Date', formatDate(course.startDate)],
      ['End Date', calculateActualEndDate().formattedDate],
      ['Total Sessions', course.sessions.length],
      ['', '']
    ];
    
    const courseInfoWs = XLSX.utils.aoa_to_sheet(courseInfoData);
    XLSX.utils.book_append_sheet(wb, courseInfoWs, "Course Info");
    
    // Sessions Sheet
    const sessionHeaders = ['#', 'Date', 'Day & Time', 'Status', 'Notes'];
    const sessionData = course.sessions
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((session, index) => [
        index + 1,
        formatDate(session.date),
        getSessionDayAndTime(session.date),
        session.status,
        session.notes || ''
      ]);
    
    // Create sessions worksheet with headers
    const sessionsWs = XLSX.utils.aoa_to_sheet([sessionHeaders, ...sessionData]);
    
    // Auto-size columns for sessions worksheet
    const sessionWidths = [5, 15, 25, 20, 40]; // Define custom widths
    sessionsWs['!cols'] = sessionWidths.map(width => ({ wch: width }));
    
    XLSX.utils.book_append_sheet(wb, sessionsWs, "Sessions");
    
    // Monthly Sessions Overview Sheet (calendar format)
    // Group sessions by month
    const sessionsByMonth = {};
    
    course.sessions.forEach(session => {
      const date = new Date(session.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      const monthKey = `${year}-${month+1}`;
      if (!sessionsByMonth[monthKey]) {
        sessionsByMonth[monthKey] = [];
      }
      
      // Add session to the month
      sessionsByMonth[monthKey].push({
        day,
        status: session.status,
        date: session.date
      });
    });
    
    const calendarData = [];
    
    // Add header
    calendarData.push(['Calendar Overview - ' + course.name]);
    calendarData.push(['']);
    
    // Process each month
    Object.keys(sessionsByMonth).sort().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(year, month-1, 1).toLocaleString('default', { month: 'long' });
      const monthTitle = [`${monthName} ${year}`];
      calendarData.push(monthTitle);
      
      // Add day headers (1-31)
      const daysInMonth = new Date(year, month, 0).getDate();
      const dayRow = ['Days'];
      for (let day = 1; day <= daysInMonth; day++) {
        dayRow.push(day);
      }
      calendarData.push(dayRow);
      
      // Add session status row
      const sessionRow = ['Status'];
      for (let day = 1; day <= daysInMonth; day++) {
        const session = sessionsByMonth[monthKey].find(s => s.day === day);
        sessionRow.push(session ? session.status : '');
      }
      calendarData.push(sessionRow);
      
      // Add empty row as separator
      calendarData.push(['']);
    });
    
    const calendarWs = XLSX.utils.aoa_to_sheet(calendarData);
    
    // Auto-size columns for calendar
    const colWidths = calendarData.reduce((widths, row) => {
      row.forEach((cell, i) => {
        const cellValue = cell?.toString() || '';
        widths[i] = Math.max(widths[i] || 0, cellValue.length);
      });
      return widths;
    }, {});
    
    calendarWs['!cols'] = Object.keys(colWidths).map(i => ({ wch: colWidths[i] }));
    
    XLSX.utils.book_append_sheet(wb, calendarWs, "Calendar");
    
    // Generate filename
    const fileName = `${course.name.replace(/\s+/g, '_')}_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Export
    XLSX.writeFile(wb, fileName);
  };

  // Enrollment related functions
  const openEnrollModal = (enrollment = null) => {
    if (enrollment) {
      // Edit mode
      setIsEditMode(true);
      setCurrentEnrollment(enrollment);
      setSelectedStudent({
        _id: enrollment.student._id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        phone: enrollment.student.phone
      });
      setNewEnrollmentData({
        studentName: enrollment.student.name,
        studentEmail: enrollment.student.email,
        studentPhone: enrollment.student.phone || '',
        totalAmount: enrollment.totalAmount,
        amountPaid: enrollment.amountPaid,
        notes: enrollment.notes || '',
        enrollmentDate: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toISOString().split('T')[0] : '',
        withdrawnDate: enrollment.withdrawnDate ? new Date(enrollment.withdrawnDate).toISOString().split('T')[0] : ''
      });
    } else {
      // Add mode
      setIsEditMode(false);
      setCurrentEnrollment(null);
      setSelectedStudent(null);
      setNewEnrollmentData({
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        totalAmount: 0,
        amountPaid: 0,
        notes: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        withdrawnDate: ''
      });
    }
    openEnrollModalDisclosure();
  };

  const closeEnrollModal = () => {
    closeEnrollModalDisclosure();
    setSelectedStudent(null);
    setShowStudentDropdown(false);
  };

  const handleEnrollmentInputChange = (e) => {
    const { name, value } = e.target;
    setNewEnrollmentData({
      ...newEnrollmentData,
      [name]: value
    });

    // Show student dropdown when typing in student name
    if (name === 'studentName' && value.trim() !== '') {
      setShowStudentDropdown(true);
    } else if (name === 'studentName' && value.trim() === '') {
      setShowStudentDropdown(false);
      setSelectedStudent(null);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setNewEnrollmentData({
      ...newEnrollmentData,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone || ''
    });
    setShowStudentDropdown(false);
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(newEnrollmentData.studentName.toLowerCase())
  );

  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();
    
    try {
      setEnrollmentLoading(true);
      
      if (isEditMode && currentEnrollment) {
        // For withdrawn students being reactivated, set the status explicitly to "Active"
        const isReactivation = currentEnrollment.status === 'Withdrawn';
        
        // Update enrollment
        await studentsAPI.withdraw(currentEnrollment.student._id, {
          enrollmentId: currentEnrollment._id,
          newStatus: 'Active',
          notes: newEnrollmentData.notes,
          totalAmount: parseFloat(newEnrollmentData.totalAmount),
          amountPaid: parseFloat(newEnrollmentData.amountPaid),
          enrollmentDate: newEnrollmentData.enrollmentDate || undefined,
          withdrawnDate: newEnrollmentData.withdrawnDate || undefined
        });
        
        if (isReactivation) {
          console.log(`Reactivating previously withdrawn student: ${currentEnrollment.student.name}`);
        }
      } else {
        // New enrollment
        if (!selectedStudent) {
          // Create new student first
          const newStudent = await studentsAPI.create({
            name: newEnrollmentData.studentName,
            email: newEnrollmentData.studentEmail,
            phone: newEnrollmentData.studentPhone
          });
          
          // Then enroll
          const enrollmentData = {
            courseId,
            totalAmount: parseFloat(newEnrollmentData.totalAmount),
            amountPaid: parseFloat(newEnrollmentData.amountPaid),
            enrollmentDate: newEnrollmentData.enrollmentDate || undefined,
            notes: newEnrollmentData.notes || '' // Ensure notes are always included
          };
          
          console.log('Adding new student with enrollment data:', enrollmentData);
          await studentsAPI.enroll(newStudent.data._id, enrollmentData);
        } else {
          // Enroll existing student
          const enrollmentData = {
            courseId,
            totalAmount: parseFloat(newEnrollmentData.totalAmount),
            amountPaid: parseFloat(newEnrollmentData.amountPaid),
            enrollmentDate: newEnrollmentData.enrollmentDate || undefined,
            notes: newEnrollmentData.notes || '' // Ensure notes are always included
          };
          
          console.log('Enrolling existing student with data:', enrollmentData);
          await studentsAPI.enroll(selectedStudent._id, enrollmentData);
        }
      }
      
      // Refresh enrollment data
      await fetchEnrollmentData();
      
      // Refresh course data to update totalStudent
      const courseData = await coursesAPI.getById(courseId);
      setCourse(courseData.data);
      
      closeEnrollModal();
      setEnrollmentLoading(false);
    } catch (err) {
      console.error('Error processing enrollment:', err);
      setEnrollmentError('Failed to process enrollment. Please try again.');
      setEnrollmentLoading(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId, studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) {
      return;
    }
    
    try {
      setEnrollmentLoading(true);
      
      const response = await studentsAPI.withdraw(studentId, {
        enrollmentId,
        newStatus: 'Withdrawn'
      });
      
      console.log('Withdraw response:', response.data);
      
      // Refresh enrollment data - only show active enrollments
      await fetchEnrollmentData();
      
      // Refresh course data to update totalStudent
      const courseData = await coursesAPI.getById(courseId);
      setCourse(courseData.data);
      
      setEnrollmentLoading(false);
    } catch (err) {
      console.error('Error removing enrollment:', err);
      setEnrollmentError('Failed to remove enrollment. Please try again.');
      setEnrollmentLoading(false);
    }
  };

  // Export enrollments to Excel with better formatting
  const exportEnrollmentsToExcel = () => {
    if (!enrollments || enrollments.length === 0) return;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Course Info Sheet
    const courseInfoData = [
      ['Course Information', ''],
      ['Course Name', course.name || 'N/A'],
      ['Branch', course.branch?.name || 'N/A'],
      ['Teacher', course.teacher?.name || 'N/A'],
      ['Level', course.level || 'N/A'],
      ['Status', course.status || 'N/A'],
      ['Start Date', formatDate(course.startDate)],
      ['End Date', calculateActualEndDate().formattedDate],
      ['Total Students', enrollments.length],
      ['Total Payment Expected', `$${paymentProgress.total.toFixed(2)}`],
      ['Total Payment Received', `$${paymentProgress.paid.toFixed(2)}`],
      ['Payment Progress', `${paymentProgress.percent}%`],
      ['', '']
    ];
    
    const infoWs = XLSX.utils.aoa_to_sheet(courseInfoData);
    XLSX.utils.book_append_sheet(wb, infoWs, "Course Info");
    
    // Student Enrollment Sheet
    const headers = [
      '#',
      'Student Name',
      'Email',
      'Phone',
      'Enrollment Date',
      'Status',
      'Payment Status',
      'Amount Paid',
      'Total Amount',
      'Balance',
      'Notes'
    ];
    
    const studentData = enrollments.map((enrollment, index) => [
      index + 1,
      enrollment.student.name,
      enrollment.student.email || '',
      enrollment.student.phone || '',
      formatDate(enrollment.enrollmentDate),
      enrollment.status,
      enrollment.paymentStatus,
      enrollment.amountPaid,
      enrollment.totalAmount,
      enrollment.totalAmount - enrollment.amountPaid,
      enrollment.notes || ''
    ]);
    
    // Create enrollment data worksheet with headers
    const enrollmentsWs = XLSX.utils.aoa_to_sheet([headers, ...studentData]);
    
    // Set column widths
    const columnWidths = [
      { wch: 5 },  // #
      { wch: 25 }, // Student Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Enrollment Date
      { wch: 10 }, // Status
      { wch: 15 }, // Payment Status
      { wch: 10 }, // Amount Paid
      { wch: 10 }, // Total Amount
      { wch: 10 }, // Balance
      { wch: 40 }  // Notes
    ];
    
    enrollmentsWs['!cols'] = columnWidths;
    
    // Add enrollment sheet to workbook
    XLSX.utils.book_append_sheet(wb, enrollmentsWs, "Students");
    
    // Include Withdrawn Students Sheet if any exist
    if (withdrawnStudents.length > 0) {
      const withdrawnData = withdrawnStudents.map((enrollment, index) => [
        index + 1,
        enrollment.student.name,
        enrollment.student.email || '',
        enrollment.student.phone || '',
        formatDate(enrollment.enrollmentDate),
        formatDate(enrollment.withdrawnDate),
        enrollment.amountPaid,
        enrollment.totalAmount,
        enrollment.notes || ''
      ]);
      
      const withdrawnHeaders = [
        '#',
        'Student Name',
        'Email',
        'Phone',
        'Enrollment Date',
        'Withdrawn Date',
        'Amount Paid',
        'Total Amount',
        'Notes'
      ];
      
      const withdrawnWs = XLSX.utils.aoa_to_sheet([withdrawnHeaders, ...withdrawnData]);
      withdrawnWs['!cols'] = columnWidths.slice(0, withdrawnHeaders.length);
      
      XLSX.utils.book_append_sheet(wb, withdrawnWs, "Withdrawn Students");
    }

    // Generate filename
    const fileName = `${course.name.replace(/\s+/g, '_')}_Enrollments_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Export
    XLSX.writeFile(wb, fileName);
  };

  // Import functionality
  const handleFileImport = (e) => {
    setImportError(null);
    const file = e.target.files[0];
    if (!file) return;
    
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        
        if (jsonData.length === 0) {
          setImportError('No data found in the file');
          setImportPreview([]);
          return;
        }
        
        // Validate data structure
        const requiredFields = ['Name', 'Email'];
        const missingFields = requiredFields.filter(field => 
          !jsonData.some(row => row[field] !== undefined)
        );
        
        if (missingFields.length > 0) {
          setImportError(`Missing required fields: ${missingFields.join(', ')}`);
          setImportPreview([]);
          return;
        }
        
        // Preview first 5 records
        setImportPreview(jsonData.slice(0, 5));
      } catch (err) {
        console.error('Error processing import file:', err);
        setImportError('Failed to process the file. Please ensure it is a valid Excel or CSV file.');
        setImportPreview([]);
      }
    };
    
    reader.onerror = () => {
      setImportError('Error reading the file');
      setImportPreview([]);
    };
    
    reader.readAsBinaryString(file);
  };

  const handleImportSubmit = async () => {
    if (!importFile || importPreview.length === 0) return;
    
    try {
      setImportLoading(true);
      setImportError(null);
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
          
          // Process each student
          let successCount = 0;
          let errorCount = 0;
          let processedStudents = [];
          
          for (const row of jsonData) {
            try {
              if (!row.Name || !row.Email) {
                console.error('Missing required fields for student:', row);
                errorCount++;
                continue;
              }
              
              // Check if student already exists by email
              const existingStudents = await studentsAPI.getAll();
              let student = existingStudents.data.find(s => 
                s.email && s.email.toLowerCase() === row.Email.toLowerCase()
              );
              
              if (!student) {
                // Create new student
                console.log('Creating new student:', row.Name);
                const studentData = {
                  name: row.Name,
                  email: row.Email,
                  phone: row.Phone || '',
                  age: row.Age || null,
                  address: row.Address || '',
                  status: 'Active'
                };
                
                const newStudentResponse = await studentsAPI.create(studentData);
                student = newStudentResponse.data;
                console.log('Created new student:', student);
              }
              
              // Check if already enrolled
              const enrollmentCheck = await coursesAPI.getEnrollments(courseId);
              const alreadyEnrolled = enrollmentCheck.data.some(e => 
                e.student && e.student._id === student._id
              );
              
              if (!alreadyEnrolled) {
                // Prepare enrollment data
              const enrollmentData = {
                courseId,
                  totalAmount: typeof row.Amount === 'number' ? row.Amount : (course.price || 0),
                  amountPaid: typeof row.Paid === 'number' ? row.Paid : 0,
                  enrollmentDate: row.EnrollmentDate ? new Date(row.EnrollmentDate) : new Date(),
                  notes: row.Notes || '',
                  status: 'Active'
                };
                
                console.log(`Enrolling student ${student.name} in course ${courseId}:`, enrollmentData);
                
                // Enroll student
                const enrollResponse = await studentsAPI.enroll(student._id, enrollmentData);
              
                if (enrollResponse.status === 200 || enrollResponse.status === 201) {
                  console.log('Enrollment successful:', enrollResponse.data);
              successCount++;
                  processedStudents.push(student.name);
                } else {
                  console.error('Enrollment returned unexpected status:', enrollResponse.status);
              errorCount++;
                }
              } else {
                console.log(`Student ${student.name} already enrolled, skipping`);
              }
            } catch (err) {
              console.error('Error processing student import:', err);
              errorCount++;
            }
          }
          
          // Update UI state
          setImportLoading(false);
          
          // Close modal before any further operations
          closeImportModal();
          
          // Add a small delay to ensure backend processing is complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh enrollment data
          const enrollmentSuccess = await fetchEnrollmentData();
          
          // Refresh course data to update totalStudent count
          const courseData = await coursesAPI.getById(courseId);
          setCourse(courseData.data);
          
          // If importing was successful, switch to enrollments tab to show the imported students
          if (successCount > 0) {
            setActiveTab(1); // Enrollments tab
            
            // Show specific success message with student names for small imports
            const successMessage = processedStudents.length <= 5 
              ? `Successfully imported students: ${processedStudents.join(', ')}`
              : `Successfully imported ${successCount} students`;
            
            alert(successMessage + (errorCount > 0 ? ` (${errorCount} errors occurred)` : ''));
          } else if (errorCount > 0) {
            alert(`Import failed with ${errorCount} errors. Please check the console for details.`);
          } else {
            alert('No new students were imported. They may already be enrolled in this course.');
          }
          
          // Reset import state
          setImportFile(null);
          setImportPreview([]);
          
        } catch (err) {
          console.error('Error processing import file:', err);
          setImportError(`Failed to process the import: ${err.message || 'Unknown error'}`);
          setImportLoading(false);
        }
      };
      
      reader.onerror = () => {
        setImportError('Error reading the file');
        setImportLoading(false);
      };
      
      reader.readAsBinaryString(importFile);
    } catch (err) {
      console.error('Error in import process:', err);
      setImportError(`An error occurred during import: ${err.message || 'Unknown error'}`);
      setImportLoading(false);
    }
  };

  // Calculate payment progress for the course
  const calculatePaymentProgress = () => {
    if (!allEnrollments || allEnrollments.length === 0) {
      return { percent: 0, paid: 0, total: 0 };
    }
    
    const totalAmountSum = allEnrollments.reduce((sum, enrollment) => sum + (enrollment.totalAmount || 0), 0);
    const amountPaidSum = allEnrollments.reduce((sum, enrollment) => sum + (enrollment.amountPaid || 0), 0);
    
    const percent = totalAmountSum > 0 ? Math.round((amountPaidSum / totalAmountSum) * 100) : 0;
    
    return {
      percent,
      paid: amountPaidSum,
      total: totalAmountSum
    };
  };

  // Check if session is canceled (absent)
  const isCanceledSession = (status) => {
    return status.startsWith('Absent');
  };

  // Get the 4 nearest future sessions
  const getNearestFutureSessions = (sessions) => {
    if (!sessions || sessions.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureSessions = sessions
      .filter(session => new Date(session.date) > today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return futureSessions.slice(0, 4);
  };

  const renderSessionsContent = () => {
    if (!course || !course.sessions || course.sessions.length === 0) {
      return (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="md" textAlign="center">
          <Text color="gray.500">No sessions found for this course.</Text>
        </Box>
      );
    }

    // Current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all sessions
    const allSessions = [...course.sessions];
    
    // Sort sessions by date
    const sortedSessions = allSessions.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Separate sessions into categories
    const taughtSessions = sortedSessions.filter(session => 
      session.status === 'Taught'
    );
    
    const canceledSessions = sortedSessions.filter(session => 
      session.status.startsWith('Absent')
    );
    
    const untaughtPastSessions = sortedSessions.filter(session => 
      session.status === 'Pending' && new Date(session.date) <= today
    );
    
    const futureSessions = sortedSessions.filter(session => 
      session.status === 'Pending' && new Date(session.date) > today
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get the 4 nearest future sessions
    const nearestFutureSessions = futureSessions.slice(0, 4);
    const otherFutureSessions = futureSessions.slice(4);
    
    // Combine sessions in the desired order
    let visibleSessions = [...untaughtPastSessions, ...nearestFutureSessions];
    
    // Add taught sessions if toggle is on
    if (showTaughtSessions) {
      visibleSessions = [...visibleSessions, ...taughtSessions, ...canceledSessions];
    }
    
    // Add remaining future sessions if toggle is on
    if (showCollapsedFutureSessions) {
      visibleSessions = [...visibleSessions, ...otherFutureSessions];
    }
    
    // Sort by date
    visibleSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
          <HStack spacing={3} flexWrap="wrap">
            <Button 
              colorScheme={showTaughtSessions ? 'blue' : 'gray'}
              variant={showTaughtSessions ? 'solid' : 'outline'}
              size="sm"
              onClick={toggleTaughtSessions}
            >
              {showTaughtSessions ? 'Hide Taught & Canceled Sessions' : 'Show Taught & Canceled Sessions'}
            </Button>
            
            {otherFutureSessions.length > 0 && (
              <Button 
                colorScheme={showCollapsedFutureSessions ? 'blue' : 'gray'}
                variant={showCollapsedFutureSessions ? 'solid' : 'outline'}
                size="sm"
                onClick={toggleFutureSessions}
              >
                {showCollapsedFutureSessions ? 'Hide Future Sessions' : `Show ${otherFutureSessions.length} More Future Sessions`}
              </Button>
            )}
          </HStack>
            
          <Button 
            leftIcon={<FaFileExport />}
            colorScheme="green" 
            variant="outline"
            size="sm"
              onClick={exportSessionsToExcel}
            >
              Export to Excel
          </Button>
        </Flex>
          
          {nearestFutureSessions.length > 0 && (
          <Text fontSize="sm" color="gray.600" mb={3}>
              Showing {nearestFutureSessions.length} nearest upcoming sessions
          </Text>
          )}
        
        <Box overflowX="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md" mb={4}>
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th width="50px" textAlign="center">#</Th>
                <Th>Date</Th>
                <Th>Day & Time</Th>
                <Th>Status</Th>
                <Th>Notes</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
            {visibleSessions.map((session, index) => {
              const originalIndex = course.sessions.findIndex(s => 
                s._id === session._id
              );
              const isUpdateLoading = updatingSessionIndex === originalIndex;
              const isThisSessionFuture = isFutureSession(session.date);
              const isNearestFuture = nearestFutureSessions.some(s => s._id === session._id);
                const statusColors = getStatusColorScheme(session.status);
              
              // Find the original session number in the full course sessions array
              const sessionNumber = course.sessions.findIndex(s => s._id === session._id) + 1;
              
              return (
                  <Tr 
                  key={session._id || index}
                    bg={
                      session.status === 'Taught' ? 'green.50' :
                      session.status.startsWith('Absent') ? 'red.50' :
                      isThisSessionFuture ? 'blue.50' : undefined
                    }
                    _hover={{ bg: 'gray.50' }}
                    position="relative"
                >
                    {!isThisSessionFuture && (
                      <SessionActions
                        session={session}
                        onMarkCompleted={() => handleQuickStatusUpdate(originalIndex, 'Taught')}
                        onMarkCanceled={() => openAbsenceMenu(originalIndex)}
                        onAdvancedEdit={() => openUpdateModal(session, originalIndex)}
                        isLoading={isUpdateLoading}
                        completedLabel="Mark Taught"
                        canceledLabel="Mark Absent"
                      />
                    )}
                    <Td textAlign="center" fontWeight="medium">{sessionNumber}</Td>
                    <Td>{formatDate(session.date)}</Td>
                    <Td>{getSessionDayAndTime(session.date)}</Td>
                    <Td>
                      <Badge 
                        px={2} 
                        py={1} 
                        borderRadius="full"
                        bg={statusColors.bg}
                        color={statusColors.color}
                      >
                      {session.status}
                      </Badge>
                    </Td>
                    <Td maxW="200px" isTruncated fontSize="sm">{session.notes || '-'}</Td>
                    <Td>
                    {isUpdateLoading ? (
                        <Spinner size="sm" />
                    ) : (
                        <HStack spacing={2} visibility="hidden">
                          <IconButton icon={<FaCheck />} size="xs" aria-label="Placeholder" />
                          <IconButton icon={<FaTimes />} size="xs" aria-label="Placeholder" />
                          <IconButton icon={<FaEdit />} size="xs" aria-label="Placeholder" />
                        </HStack>
                    )}
                    </Td>
                  </Tr>
              );
            })}
            </Tbody>
          </Table>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={4} color="gray.500">Loading course data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md" maxW="container.md" mx="auto" my={8}>
        <Heading size="md" mb={2} color="red.600">Error</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box p={6} bg="blue.50" borderWidth="1px" borderColor="blue.200" borderRadius="md" maxW="container.md" mx="auto" my={8} textAlign="center">
        <Heading size="md" mb={3} color="blue.600">Course Not Found</Heading>
        <Text mb={4}>The requested course could not be found.</Text>
        <Button as={Link} to="/courses" colorScheme="blue">
          Back to Courses
        </Button>
      </Box>
    );
  }

  // Helper function to determine status color scheme
  const getStatusColorScheme = (status) => {
    if (status.startsWith('Absent')) {
      if (status.includes('Personal')) return { bg: 'orange.100', color: 'orange.700' };
      if (status.includes('Holiday')) return { bg: 'purple.100', color: 'purple.700' };
      return { bg: 'red.100', color: 'red.700' };
    }
    
    switch (status) {
      case 'Active': return { bg: 'green.100', color: 'green.700' };
      case 'Upcoming': return { bg: 'blue.100', color: 'blue.700' };
      case 'Finished': return { bg: 'gray.100', color: 'gray.700' };
      case 'Cancelled': return { bg: 'red.100', color: 'red.700' };
      case 'Taught': return { bg: 'green.100', color: 'green.700' };
      case 'Pending': return { bg: 'yellow.100', color: 'yellow.700' };
      default: return { bg: 'gray.100', color: 'gray.700' };
    }
  };

  // Compute the payment progress
  const paymentProgress = calculatePaymentProgress();
  
  // Compute actual end date info
  const actualEndDateInfo = calculateActualEndDate();

  // Filter enrollments based on search text and status filter
  const filteredEnrollments = enrollments.filter(enrollment => {
    // First apply status filter if set
    if (statusFilter && enrollment.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
  }
    
    // Apply payment status filter if set
    if (paymentStatusFilter && enrollment.paymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()) {
      return false;
    }
    
    // Then apply text search if there's a search term
    if (searchText) {
      return enrollment.student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (enrollment.student.email && enrollment.student.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (enrollment.student.phone && enrollment.student.phone.includes(searchText));
    }
    
    // If no filters, return true
    return true;
  });

  // Get withdrawn students from all enrollments
  const withdrawnStudents = allEnrollments.filter(enrollment => 
    enrollment.status === 'Withdrawn'
  );

  // Session update modal
  const sessionModal = selectedSession && (
    <Modal isOpen={isSessionModalOpen} onClose={closeModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Session Status</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmitSession}>
            <FormControl mb={4}>
              <FormLabel>Session Date</FormLabel>
              <Text>{formatDate(selectedSession.date)}</Text>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Status</FormLabel>
              <Select
                name="status"
                value={selectedSession.status}
                onChange={handleInputChange}
              >
                {SESSION_STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              {selectedSession.status.startsWith('Absent') && originalStatus === 'Pending' && (
                <Text fontSize="sm" color="blue.600" mt={2}>
                  A compensatory session will be added automatically.
                </Text>
              )}
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Notes</FormLabel>
              <Textarea
                name="notes"
                value={selectedSession.notes || ''}
                onChange={handleInputChange}
                placeholder="Add any notes about this session..."
                size="sm"
              />
            </FormControl>
            
            {updateError && (
              <Text color="red.500" mb={4}>{updateError}</Text>
            )}
            
            <ModalFooter px={0} pb={0}>
              <Button mr={3} onClick={closeModal} variant="ghost">
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                type="submit" 
                isLoading={updateLoading}
                loadingText="Updating"
              >
                Update
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  return (
    <Box maxW="container.xl" mx="auto" p={4}>
      <Flex justify="space-between" align="flex-start" mb={6} wrap="wrap">
        <Box mb={{ base: 4, md: 0 }}>
          <Heading as="h1" size="lg" mb={2}>{course.name}</Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Badge px={2} py={1} bg="purple.100" color="purple.700" borderRadius="full">
              {course.level}
            </Badge>
            <Badge px={2} py={1} bg="blue.100" color="blue.700" borderRadius="full">
              {course.branch?.name || 'Unknown Branch'}
            </Badge>
            <Badge 
              px={2} 
              py={1} 
              bg={getStatusColorScheme(course.status).bg} 
              color={getStatusColorScheme(course.status).color}
              borderRadius="full"
            >
              {course.status}
            </Badge>
            {course.previousCourse && (
              <Button 
                as={Link} 
                to={`/courses/${course.previousCourse._id}`} 
                size="xs" 
                leftIcon={<FaArrowLeft />} 
                variant="ghost" 
                colorScheme="blue"
              >
                Previous: {course.previousCourse.name}
              </Button>
            )}
          </HStack>
        </Box>
        <HStack spacing={3}>
          <Button 
            as={Link} 
            to="/courses" 
            leftIcon={<FaArrowLeft />} 
            size="sm" 
            colorScheme="gray" 
            variant="outline"
          >
            Back to Courses
          </Button>
          <Button 
            as={Link} 
            to={`/courses/edit/${course._id}`} 
            leftIcon={<FaEdit />} 
            size="sm" 
            colorScheme="blue"
          >
            Edit Course
          </Button>
          <Button 
            leftIcon={<FaFileExport />} 
            size="sm" 
            colorScheme="orange" 
            variant="outline"
            onClick={exportSessionsToExcel}
          >
            Export Sessions
          </Button>
        </HStack>
      </Flex>
      
      {sessionModal}

      <Grid 
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        gap={4}
        mb={6}
      >
        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Start Date</Text>
          <Text fontSize="lg" fontWeight="semibold">{formatDate(course.startDate)}</Text>
        </Box>
        
        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Original End Date</Text>
          <Text fontSize="lg" fontWeight="semibold">{formatDate(course.estimatedEndDate || course.endDate)}</Text>
        </Box>

        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Actual End Date</Text>
          <Text fontSize="lg" fontWeight="semibold">{actualEndDateInfo.formattedDate}</Text>
          {actualEndDateInfo.daysLeft > 0 && (
            <Text fontSize="sm" color="blue.500">
              {actualEndDateInfo.daysLeft} days left
            </Text>
            )}
          {actualEndDateInfo.daysLeft <= 0 && actualEndDateInfo.daysLeft > -7 && (
            <Text fontSize="sm" color="green.500">
              Completed {Math.abs(actualEndDateInfo.daysLeft)} days ago
            </Text>
            )}
        </Box>
        
        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Sessions</Text>
          <Text fontSize="lg" fontWeight="semibold">
            {course.sessions ? course.sessions.length : 0} total
            {course.sessions && course.sessions.length > course.totalSessions && (
              <Text as="span" fontSize="sm" ml={1} color="gray.500">
                (includes {course.sessions.length - course.totalSessions} compensatory)
              </Text>
            )}
          </Text>
        </Box>
        
        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Teacher</Text>
          <Text fontSize="lg" fontWeight="semibold">{course.teacher?.name || 'Not assigned'}</Text>
        </Box>
        
        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Progress</Text>
          <Box>
            <Progress 
              value={isNaN(course.progress) ? 0 : (course.progress || 0)} 
              size="sm" 
              colorScheme="blue" 
              borderRadius="md" 
              mb={1}
            />
            <Text fontSize="md" fontWeight="semibold">{isNaN(course.progress) ? 0 : (course.progress || 0)}%</Text>
          </Box>
        </Box>
        
        <Box 
          p={4} 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          shadow="sm"
          transition="transform 0.2s"
          _hover={{ transform: "translateY(-2px)", shadow: "md" }}
          gridColumn={{ lg: "span 2" }}
        >
          <Text fontSize="sm" color="gray.500" mb={1}>Payment Progress</Text>
          <Box>
            <Progress 
              value={paymentProgress.percent || 0} 
              size="sm" 
              colorScheme="green" 
              borderRadius="md" 
              mb={1}
            />
            <Flex justify="space-between">
              <Text fontSize="md" fontWeight="semibold">{paymentProgress.percent || 0}%</Text>
              <Text fontSize="sm" color="gray.600">
                ${(paymentProgress.paid || 0).toFixed(2)} / ${(paymentProgress.total || 0).toFixed(2)}
              </Text>
            </Flex>
          </Box>
        </Box>
      </Grid>

      <Box 
        bg={bgColor} 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="md" 
        shadow="sm" 
        overflow="hidden"
      >
        <Tabs onChange={(index) => setActiveTab(index)} colorScheme="brand">
          <TabList px={4}>
            <Tab>Sessions</Tab>
            <Tab>Enrolled Students</Tab>
            <Tab>Schedule</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={4}>
              {renderSessionsContent()}
            </TabPanel>
            <TabPanel p={4}>
              <Box>
                <Flex justify="space-between" align="flex-start" mb={6} flexWrap={{base: "wrap", md: "nowrap"}} gap={4}>
                  <VStack align="flex-start" spacing={4} flexGrow={1}>
                    <HStack spacing={4} flexWrap="wrap">
                      <HStack>
                        <Text fontWeight="medium">Active Students:</Text>
                        <Text>{enrollments.length}</Text>
                      </HStack>
                    {withdrawnStudents.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="gray"
                          onClick={() => openWithdrawnModal()}
                      >
                        Show Withdrawn Students ({withdrawnStudents.length})
                        </Button>
                    )}
                    </HStack>
                  
                    <HStack spacing={4} flexWrap="wrap">
                      <HStack>
                        <Text fontWeight="medium">Status:</Text>
                        <Select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                          size="sm"
                          width="auto"
                          minW="110px"
                      >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="suspended">Suspended</option>
                        </Select>
                      </HStack>
                      <HStack>
                        <Text fontWeight="medium">Payment:</Text>
                        <Select 
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                          size="sm"
                          width="auto"
                          minW="110px"
                      >
                        <option value="">All</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="pending">Pending</option>
                        </Select>
                      </HStack>
                    </HStack>
                  </VStack>
                
                  <HStack spacing={2} flexWrap="wrap">
                    <Input
                      placeholder="Search students..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      size="sm"
                      width={{base: "full", md: "auto"}}
                      minW="200px"
                    />
                    <Button 
                      leftIcon={<FaUserPlus />}
                      colorScheme="blue"
                      size="sm"
                    onClick={() => openEnrollModal()}
                  >
                    Add Student
                    </Button>
                    <Button 
                      leftIcon={<FaFileImport />}
                      colorScheme="blue"
                      size="sm"
                      variant="outline" 
                      onClick={() => openImportModal()}
                  >
                      Import
                    </Button>
                    <Button 
                      leftIcon={<FaFileExport />}
                      colorScheme="green"
                      size="sm"
                      variant="outline"
                    onClick={exportEnrollmentsToExcel}
                      isDisabled={enrollments.length === 0}
                  >
                    Export
                    </Button>
                  </HStack>
                </Flex>
              
              {enrollmentLoading && (
                  <Flex justify="center" align="center" p={8}>
                    <Spinner mr={3} color="blue.500" />
                    <Text>Loading enrollment data...</Text>
                  </Flex>
              )}
              
              {enrollmentError && (
                  <Box p={6} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md">
                    <Text color="red.600" mb={2}>{enrollmentError}</Text>
                    <Button colorScheme="red" size="sm" onClick={fetchEnrollmentData}>Try Again</Button>
                  </Box>
              )}
              
              {!enrollmentLoading && !enrollmentError && (
                <>
                    {filteredEnrollments.length > 0 ? (
                      <Box overflowX="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md">
                        <Table variant="simple" size="sm">
                          <Thead bg="gray.50">
                            <Tr>
                              <Th width="50px" textAlign="center">#</Th>
                              <Th>Student Name</Th>
                              <Th>ID</Th>
                              <Th>Enrollment Date</Th>
                              <Th>Status</Th>
                              <Th>Contact</Th>
                              <Th>Payment</Th>
                              <Th>Notes</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredEnrollments.map((enrollment, index) => {
                              const paymentStatusColors = 
                                enrollment.paymentStatus === 'Paid' ? { bg: 'green.100', color: 'green.700' } :
                                enrollment.paymentStatus === 'Partial' ? { bg: 'yellow.100', color: 'yellow.700' } :
                                { bg: 'red.100', color: 'red.700' };
                              
                              return (
                                <Tr key={enrollment._id} _hover={{ bg: 'gray.50' }}>
                                  <Td textAlign="center">{index + 1}</Td>
                                  <Td fontWeight="medium">{enrollment.student.name}</Td>
                                  <Td fontSize="sm" color="gray.600">{enrollment.student._id.substring(0, 8)}</Td>
                                  <Td>{formatDate(enrollment.enrollmentDate)}</Td>
                                  <Td>
                                    <Badge 
                                      px={2} 
                                      py={1} 
                                      colorScheme={
                                        enrollment.status === 'Active' ? 'green' :
                                        enrollment.status === 'Completed' ? 'blue' :
                                        enrollment.status === 'Suspended' ? 'orange' : 
                                        'gray'
                                      }
                                      borderRadius="full"
                                    >
                                  {enrollment.status}
                                    </Badge>
                                  </Td>
                                  <Td fontSize="sm">
                                    <VStack align="flex-start" spacing={0}>
                                      <Text>{enrollment.student.email}</Text>
                                      {enrollment.student.phone && <Text>{enrollment.student.phone}</Text>}
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <VStack align="flex-start" spacing={1}>
                                      <Badge 
                                        px={2} 
                                        py={1} 
                                        bg={paymentStatusColors.bg} 
                                        color={paymentStatusColors.color}
                                        borderRadius="full"
                                      >
                                    {enrollment.paymentStatus}
                                      </Badge>
                                      <Text fontSize="xs">Paid: ${enrollment.amountPaid}</Text>
                                      <Text fontSize="xs">Total: ${enrollment.totalAmount}</Text>
                                    </VStack>
                                  </Td>
                                  <Td maxW="200px" isTruncated>
                                {enrollment.notes ? 
                                      <Text 
                                        fontSize="sm" 
                                        bg="gray.50" 
                                        p={1} 
                                        borderRadius="md" 
                                        title={enrollment.notes}
                                      >
                                    {enrollment.notes.length > 50 ? 
                                      `${enrollment.notes.substring(0, 50)}...` : 
                                      enrollment.notes
                                    }
                                      </Text> : 
                                      <Text fontSize="xs" color="gray.500" fontStyle="italic">No notes</Text>
                                }
                                  </Td>
                                  <Td>
                                    <HStack spacing={1}>
                                      <IconButton
                                        icon={<FaEdit />}
                                        aria-label="Edit enrollment"
                                        size="sm"
                                        colorScheme="blue"
                                        variant="ghost"
                                  onClick={() => openEnrollModal(enrollment)}
                                      />
                                      <IconButton
                                        icon={<FaTimes />}
                                        aria-label="Remove student"
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                  onClick={() => handleRemoveEnrollment(enrollment._id, enrollment.student._id)}
                                      />
                                    </HStack>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </Box>
                  ) : (
                      <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="md" textAlign="center">
                        <Text color="gray.500">No students enrolled in this course yet.</Text>
                      </Box>
                  )}
                </>
              )}
              </Box>
            </TabPanel>
            <TabPanel p={4}>
              <Box>
                <Heading as="h3" size="md" mb={4}>Weekly Schedule</Heading>
              {!course.weeklySchedule || course.weeklySchedule.length === 0 ? (
                  <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="md" textAlign="center">
                    <Text color="gray.500">No schedule defined for this course.</Text>
                  </Box>
              ) : (
                  <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={4}>
                  {course.weeklySchedule.map((schedule, index) => (
                      <Box 
                        key={index} 
                        p={4} 
                        borderWidth="1px" 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        bg="white"
                        transition="transform 0.2s"
                        _hover={{ 
                          transform: "translateY(-2px)", 
                          shadow: "sm", 
                          borderColor: "blue.300" 
                        }}
                      >
                        <Text fontWeight="bold" color="blue.700">{schedule.day}</Text>
                        <Text>
                        {schedule.startTime} - {schedule.endTime}
                        </Text>
                      </Box>
                  ))}
                  </SimpleGrid>
          )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
            
      {/* Enrollment Modal */}
      <Modal isOpen={isEnrollModalOpen} onClose={closeEnrollModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditMode ? 'Edit Enrollment' : 'Add Student'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmitEnrollment}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Student Name</FormLabel>
                  <Box position="relative">
                    <Input
                    name="studentName"
                    value={newEnrollmentData.studentName}
                    onChange={handleEnrollmentInputChange}
                      placeholder="Enter student name"
                      autoComplete="off"
                    />
                    
                    {showStudentDropdown && filteredStudents.length > 0 && (
                      <Box
                        position="absolute"
                        top="100%"
                        left={0}
                        right={0}
                        zIndex={10}
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        shadow="md"
                        maxH="200px"
                        overflowY="auto"
                      >
                      {filteredStudents.map(student => (
                          <Box
                          key={student._id} 
                            p={2}
                            _hover={{ bg: 'gray.100' }}
                            cursor="pointer"
                          onClick={() => handleSelectStudent(student)}
                        >
                            <Text fontWeight="medium">{student.name}</Text>
                            <Text fontSize="sm" color="gray.600">{student.email}</Text>
                          </Box>
                      ))}
                      </Box>
                  )}
                  </Box>
                  {selectedStudent && (
                    <Text fontSize="sm" color="blue.500" mt={1}>
                      Using existing student record
                    </Text>
                  )}
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input 
                      name="studentEmail"
                      value={newEnrollmentData.studentEmail}
                      onChange={handleEnrollmentInputChange}
                    placeholder="Enter student email"
                    isReadOnly={selectedStudent !== null}
                    bg={selectedStudent ? "gray.50" : undefined}
                    />
                </FormControl>
                  
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input 
                      name="studentPhone"
                      value={newEnrollmentData.studentPhone}
                      onChange={handleEnrollmentInputChange}
                    placeholder="Enter student phone"
                    isReadOnly={selectedStudent !== null}
                    bg={selectedStudent ? "gray.50" : undefined}
                />
                </FormControl>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl>
                    <FormLabel>Total Amount</FormLabel>
                    <Input 
                  name="totalAmount"
                      value={newEnrollmentData.totalAmount}
                      onChange={handleEnrollmentInputChange}
                  type="number"
                      placeholder="0"
                  min="0"
                  step="0.01"
                />
                  </FormControl>
              
                  <FormControl>
                    <FormLabel>Amount Paid</FormLabel>
                    <Input 
                  name="amountPaid"
                      value={newEnrollmentData.amountPaid}
                      onChange={handleEnrollmentInputChange}
                  type="number"
                      placeholder="0"
                  min="0"
                  step="0.01"
                    />
                  </FormControl>
                </Grid>
                
                <FormControl>
                  <FormLabel>Enrollment Date</FormLabel>
                  <Input 
                    name="enrollmentDate"
                    value={newEnrollmentData.enrollmentDate}
                  onChange={handleEnrollmentInputChange}
                    type="date"
                  />
                </FormControl>
                
                {isEditMode && (
                  <FormControl>
                    <FormLabel>Withdrawn Date (leave empty if active)</FormLabel>
                    <Input 
                      name="withdrawnDate"
                      value={newEnrollmentData.withdrawnDate}
                      onChange={handleEnrollmentInputChange}
                      type="date"
                />
                  </FormControl>
                )}
                
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                  name="notes"
                  value={newEnrollmentData.notes}
                  onChange={handleEnrollmentInputChange}
                    placeholder="Add any notes about this enrollment..."
                    size="sm"
                    rows={3}
                  />
                </FormControl>
              </Stack>
              
              {enrollmentError && (
                <Box mt={4} p={3} bg="red.50" color="red.600" borderRadius="md">
                  <Text>{enrollmentError}</Text>
                </Box>
              )}
            </form>
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={closeEnrollModal} mr={3} variant="outline">
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmitEnrollment}
              isLoading={enrollmentLoading}
            >
              {isEditMode ? 'Update' : 'Enroll'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={closeImportModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Students</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box mb={4} p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="medium" mb={2}>Instructions:</Text>
              <Text fontSize="sm">
                Upload an Excel file (.xlsx) or CSV file with the following columns:
              </Text>
              <UnorderedList fontSize="sm" mt={2}>
                <ListItem><b>Name</b> - Required</ListItem>
                <ListItem><b>Email</b> - Required</ListItem>
                <ListItem><b>Phone</b> - Optional</ListItem>
                <ListItem><b>Amount</b> - Optional (Total Fee)</ListItem>
                <ListItem><b>Paid</b> - Optional (Amount Paid)</ListItem>
                <ListItem><b>EnrollmentDate</b> - Optional (mm/dd/yyyy)</ListItem>
                <ListItem><b>Notes</b> - Optional</ListItem>
              </UnorderedList>
            </Box>
            
            <FormControl mb={4}>
              <FormLabel htmlFor="importFile">Upload File</FormLabel>
              <Input
                  type="file"
                id="importFile"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileImport}
                />
            </FormControl>
              
              {importError && (
              <Box mb={4} p={3} bg="red.50" color="red.600" borderRadius="md">
                <Text fontSize="sm">{importError}</Text>
              </Box>
              )}
              
              {importPreview.length > 0 && (
              <Box mb={4} border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
                <Box bg="gray.50" p={2} borderBottomWidth="1px">
                  <Text fontWeight="medium" fontSize="sm">Data Preview</Text>
                </Box>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        {Object.keys(importPreview[0]).map(header => (
                          <Th key={header}>{header}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {importPreview.map((row, index) => (
                        <Tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <Td key={i}>{value}</Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
              )}
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={closeImportModal} mr={3} variant="outline">
                  Cancel
            </Button>
            <Button 
              colorScheme="blue" 
                  onClick={handleImportSubmit} 
              isLoading={importLoading}
              isDisabled={importPreview.length === 0}
            >
              Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Withdrawn Students Modal */}
      <Modal isOpen={isWithdrawnModalOpen} onClose={closeWithdrawnModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Withdrawn Students</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {withdrawnStudents.length > 0 ? (
              <Box overflowX="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md">
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th width="50px" textAlign="center">#</Th>
                      <Th>Student Name</Th>
                      <Th>Withdrawn Date</Th>
                      <Th>Contact</Th>
                      <Th>Payment</Th>
                      <Th>Notes</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {withdrawnStudents.map((enrollment, index) => (
                      <Tr key={enrollment._id} _hover={{ bg: 'gray.50' }}>
                        <Td textAlign="center">{index + 1}</Td>
                        <Td fontWeight="medium">{enrollment.student.name}</Td>
                        <Td>{formatDate(enrollment.withdrawnDate)}</Td>
                        <Td fontSize="sm">
                          <VStack align="flex-start" spacing={0}>
                            <Text>{enrollment.student.email}</Text>
                            {enrollment.student.phone && <Text>{enrollment.student.phone}</Text>}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <Text fontSize="xs">Paid: ${enrollment.amountPaid}</Text>
                            <Text fontSize="xs">Total: ${enrollment.totalAmount}</Text>
                          </VStack>
                        </Td>
                        <Td maxW="200px" isTruncated>
                          {enrollment.notes ? 
                            <Text 
                              fontSize="sm" 
                              bg="gray.50" 
                              p={1} 
                              borderRadius="md" 
                              title={enrollment.notes}
                            >
                              {enrollment.notes.length > 50 ? 
                                `${enrollment.notes.substring(0, 50)}...` : 
                                enrollment.notes
                              }
                            </Text> : 
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">No notes</Text>
                          }
                        </Td>
                        <Td>
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={() => openEnrollModal(enrollment)}
                          >
                            Reactivate
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="md" textAlign="center">
                <Text color="gray.500">No withdrawn students for this course.</Text>
              </Box>
      )}
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={closeWithdrawnModal} colorScheme="blue">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CourseDetail;