import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { coursesAPI, studentsAPI, teachersAPI, branchesAPI } from '../../api';
import './CourseDetail.css';
import './SessionTableTracker.css';
import './EnrollmentStyles.css';
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
  useColorModeValue
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

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseData = await coursesAPI.getById(courseId);
        setCourse(courseData.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Fetch enrollments when the activeTab changes to 'enrollments'
  useEffect(() => {
    if (activeTab === 'enrollments' && courseId) {
      fetchEnrollmentData();
    }
  }, [activeTab, courseId]);

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

  const fetchEnrollmentData = async () => {
    try {
      setEnrollmentLoading(true);
      setEnrollmentError(null);
      
      console.log(`Fetching enrollments for course ${courseId}`);
      const response = await coursesAPI.getEnrollments(courseId);
      console.log('Enrollments data:', response.data);
      
      // Store all enrollments
      setAllEnrollments(response.data);
      
      // Only show Active enrollments in the table, filter out Withdrawn students
      const activeEnrollments = response.data.filter(enrollment => 
        enrollment.status === 'Active' || enrollment.status === 'Completed' || enrollment.status === 'Suspended'
      );
      
      setEnrollments(activeEnrollments);
      setEnrollmentLoading(false);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setEnrollmentError('Failed to load enrollment data. Please try again later.');
      setEnrollmentLoading(false);
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

  // Function to export sessions to Excel in a horizontal format
  const exportSessionsToExcel = () => {
    if (!course || !course.sessions || course.sessions.length === 0) return;
    
    // Group sessions by month
    const sessionsByMonth = {};
    const allDays = {};
    
    course.sessions.forEach(session => {
      const date = new Date(session.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      const monthKey = `${year}-${month+1}`;
      if (!sessionsByMonth[monthKey]) {
        sessionsByMonth[monthKey] = [];
      }
      
      // Track this day in this month
      if (!allDays[monthKey]) {
        allDays[monthKey] = {};
      }
      allDays[monthKey][day] = true;
      
      // Add session to the month
      sessionsByMonth[monthKey].push({
        day,
        status: session.status,
        date: session.date
      });
    });
    
    // Create worksheet data
    const wsData = [];
    
    // Add headers
    wsData.push(['Course: ' + (course.name || 'Unknown')]);
    wsData.push(['Teacher: ' + (course.teacher?.name || 'Unknown')]);
    wsData.push(['Branch: ' + (course.branch?.name || 'Unknown')]);
    wsData.push(['Start Date: ' + formatDate(course.startDate)]);
    wsData.push(['']);  // Empty row as separator
    
    // Process each month
    Object.keys(sessionsByMonth).sort().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(year, month-1, 1).toLocaleString('default', { month: 'long' });
      const monthRow = [`${monthName} ${year}`];
      
      // Get all days in this month
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Add day headers (1-31)
      for (let day = 1; day <= daysInMonth; day++) {
        monthRow.push(day);
      }
      wsData.push(monthRow);
      
      // Add sessions row (will contain 1 if session exists on that day)
      const sessionsRow = ['Sessions'];
      for (let day = 1; day <= daysInMonth; day++) {
        const hasSession = sessionsByMonth[monthKey].some(s => s.day === day);
        sessionsRow.push(hasSession ? 1 : '');
      }
      wsData.push(sessionsRow);
      
      // Add status row
      const statusRow = ['Status'];
      for (let day = 1; day <= daysInMonth; day++) {
        const session = sessionsByMonth[monthKey].find(s => s.day === day);
        statusRow.push(session ? session.status : '');
      }
      wsData.push(statusRow);
      
      // Add empty row as separator
      wsData.push(['']);
    });
    
    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sessions");
    
    // Auto-size columns
    const colWidths = wsData.reduce((widths, row) => {
      row.forEach((cell, i) => {
        const cellValue = cell?.toString() || '';
        widths[i] = Math.max(widths[i] || 0, cellValue.length);
      });
      return widths;
    }, {});
    
    ws['!cols'] = Object.keys(colWidths).map(i => ({ wch: colWidths[i] }));
    
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

  const exportEnrollmentsToExcel = () => {
    if (!enrollments || enrollments.length === 0) return;
    
    // Create worksheet
    const wb = XLSX.utils.book_new();
    
    // Add course info sheet
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
      ['', ''],
      ['Enrollment List', '']
    ];
    
    // Format data for Excel
    const data = enrollments.map((enrollment, index) => {
      return {
        '#': index + 1,
        'Student Name': enrollment.student.name,
        'Email': enrollment.student.email,
        'Phone': enrollment.student.phone || 'N/A',
        'Enrollment Date': formatDate(enrollment.enrollmentDate),
        'Status': enrollment.status,
        'Payment Status': enrollment.paymentStatus,
        'Amount Paid': enrollment.amountPaid,
        'Total Amount': enrollment.totalAmount,
        'Balance': enrollment.totalAmount - enrollment.amountPaid,
        'Notes': enrollment.notes || ''
      };
    });
    
    // Prepare main worksheet with enrollment data
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add header rows with course info
    XLSX.utils.sheet_add_aoa(ws, courseInfoData, { origin: 'A1' });
    
    // Adjust column width for the sheet
    const colWidths = courseInfoData.reduce((widths, row) => {
      row.forEach((cell, i) => {
        const cellValue = cell?.toString() || '';
        widths[i] = Math.max(widths[i] || 0, cellValue.length);
      });
      return widths;
    }, {});
    
    ws['!cols'] = Object.keys(colWidths).map(i => ({ wch: colWidths[i] }));
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
    
    // Generate filename
    const fileName = `${course.name.replace(/\s+/g, '_')}_Enrollments_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Export
    XLSX.writeFile(wb, fileName);
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
        <div className="no-data-message">
          <p>No sessions found for this course.</p>
        </div>
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
      <div>
        <div className="session-controls">
          <div className="control-group">
            <button 
              className={`toggle-button ${showTaughtSessions ? 'active' : ''}`}
              onClick={toggleTaughtSessions}
            >
              {showTaughtSessions ? 'Hide Taught & Canceled Sessions' : 'Show Taught & Canceled Sessions'}
            </button>
            
            {otherFutureSessions.length > 0 && (
              <button 
                className={`toggle-button ${showCollapsedFutureSessions ? 'active' : ''}`}
                onClick={toggleFutureSessions}
              >
                {showCollapsedFutureSessions ? 'Hide Future Sessions' : `Show ${otherFutureSessions.length} More Future Sessions`}
              </button>
            )}
            
            <button 
              className="export-button"
              onClick={exportSessionsToExcel}
            >
              Export to Excel
            </button>
          </div>
          
          {nearestFutureSessions.length > 0 && (
            <div className="nearest-sessions-label">
              Showing {nearestFutureSessions.length} nearest upcoming sessions
            </div>
          )}
        </div>
        
        <table className="session-table">
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
            {visibleSessions.map((session, index) => {
              const originalIndex = course.sessions.findIndex(s => 
                s._id === session._id
              );
              const isUpdateLoading = updatingSessionIndex === originalIndex;
              const isThisSessionFuture = isFutureSession(session.date);
              const isNearestFuture = nearestFutureSessions.some(s => s._id === session._id);
              
              // Find the original session number in the full course sessions array
              const sessionNumber = course.sessions.findIndex(s => s._id === session._id) + 1;
              
              return (
                <tr 
                  key={session._id || index}
                  className={`
                    ${session.status === 'Taught' ? 'taught-session' : ''}
                    ${session.status.startsWith('Absent') ? 'absent-session' : ''}
                    ${isThisSessionFuture ? 'future-session' : ''}
                    ${isNearestFuture ? 'nearest-future-session' : ''}
                  `}
                >
                  <td>{sessionNumber}</td>
                  <td>{formatDate(session.date)}</td>
                  <td>{getSessionDayAndTime(session.date)}</td>
                  <td>
                    <span className={`session-status ${getStatusClass(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="notes-cell">{session.notes || '-'}</td>
                  <td>
                    {isUpdateLoading ? (
                      <span className="loading-spinner-small"></span>
                    ) : (
                      <div className="session-actions">
                        {!isThisSessionFuture && session.status === 'Pending' && (
                          <div className="quick-update-buttons">
                            <button 
                              className="quick-update taught"
                              onClick={() => handleQuickStatusUpdate(originalIndex, 'Taught')}
                            >
                              Mark Taught
                            </button>
                            
                            <div className="absence-dropdown-container">
                              <button 
                                className="quick-update absent"
                                onClick={(e) => toggleAbsenceDropdown(originalIndex, e)}
                              >
                                Mark Absent
                              </button>
                              
                              {activeAbsenceDropdown === originalIndex && (
                                <div className="absence-dropdown">
                                  <button onClick={() => handleQuickStatusUpdate(originalIndex, 'Absent (Personal Reason)')}>
                                    Personal Reason
                                  </button>
                                  <button onClick={() => handleQuickStatusUpdate(originalIndex, 'Absent (Holiday)')}>
                                    Holiday
                                  </button>
                                  <button onClick={() => handleQuickStatusUpdate(originalIndex, 'Absent (Other Reason)')}>
                                    Other Reason
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <button 
                          className="edit-btn"
                          onClick={() => openUpdateModal(session, originalIndex)}
                          disabled={isThisSessionFuture}
                          title={isThisSessionFuture ? "Cannot update future sessions" : "Edit session"}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

  return (
    <Box maxW="container.xl" mx="auto" p={4}>
      <Flex justify="space-between" align="flex-start" mb={6} wrap="wrap">
        <Box mb={{ base: 4, md: 0 }}>
          <Heading as="h1" size="lg" mb={2}>{course.name}</Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Badge px={2} py={1} bg="purple.100" color="purple.700">
              {course.level}
            </Badge>
            <Badge px={2} py={1} bg="blue.100" color="blue.700">
              {course.branch?.name || 'Unknown Branch'}
            </Badge>
            <Badge 
              px={2} 
              py={1} 
              bg={getStatusColorScheme(course.status).bg} 
              color={getStatusColorScheme(course.status).color}
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
            <div className="enrollments-tab">
              <div className="enrollments-header">
                <div className="enrollments-filters">
                  <div className="filter-group">
                    <span className="info-label">Active Students:</span> {enrollments.length}
                    {withdrawnStudents.length > 0 && (
                      <button 
                        className="view-withdrawn-btn"
                          onClick={() => openWithdrawnModal()}
                      >
                        Show Withdrawn Students ({withdrawnStudents.length})
                      </button>
                    )}
                  </div>
                  
                  <div className="filter-group">
                    <span className="info-label status-filter">
                      Status: 
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter-select"
                      >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </span>
                    <span className="info-label status-filter">
                      Payment: 
                      <select 
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="status-filter-select"
                      >
                        <option value="">All</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="pending">Pending</option>
                      </select>
                    </span>
                  </div>
                </div>
                
                <div className="enrollments-controls">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button 
                    className="add-student-btn"
                    onClick={() => openEnrollModal()}
                  >
                    Add Student
                  </button>
                  <button 
                    className="import-students-btn"
                      onClick={() => openImportModal()}
                  >
                    Import Students
                  </button>
                  <button 
                    className="export-btn"
                    onClick={exportEnrollmentsToExcel}
                    disabled={enrollments.length === 0}
                  >
                    Export
                  </button>
                </div>
              </div>
              
              {enrollmentLoading && (
                <div className="loading-spinner">
                  <div>Loading enrollment data...</div>
                </div>
              )}
              
              {enrollmentError && (
                <div className="error-message">
                  <p>{enrollmentError}</p>
                  <button onClick={fetchEnrollmentData}>Try Again</button>
                </div>
              )}
              
              {!enrollmentLoading && !enrollmentError && (
                <>
                    {filteredEnrollments.length > 0 ? (
                    <div className="enrollments-table-container">
                      <table className="enrollments-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>ID</th>
                            <th>Enrollment Date</th>
                            <th>Status</th>
                            <th>Contact</th>
                            <th>Payment</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEnrollments.map((enrollment, index) => (
                            <tr key={enrollment._id}>
                              <td>{index + 1}</td>
                              <td>{enrollment.student.name}</td>
                              <td>{enrollment.student._id.substring(0, 8)}</td>
                              <td>{formatDate(enrollment.enrollmentDate)}</td>
                              <td>
                                <span className={`enrollment-status ${enrollment.status.toLowerCase()}`}>
                                  {enrollment.status}
                                </span>
                              </td>
                              <td>
                                {enrollment.student.email}<br />
                                {enrollment.student.phone && <span>{enrollment.student.phone}</span>}
                              </td>
                              <td>
                                <div className="payment-status">
                                  <span className={`payment-status-badge ${enrollment.paymentStatus.toLowerCase()}`}>
                                    {enrollment.paymentStatus}
                                  </span>
                                  <div className="payment-details">
                                    <span>Paid: ${enrollment.amountPaid}</span>
                                    <span>Total: ${enrollment.totalAmount}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="notes-cell">
                                {enrollment.notes ? 
                                  <div className="enrollment-notes" title={enrollment.notes}>
                                    {enrollment.notes.length > 50 ? 
                                      `${enrollment.notes.substring(0, 50)}...` : 
                                      enrollment.notes
                                    }
                                  </div> : 
                                  <span className="no-notes">No notes</span>
                                }
                              </td>
                              <td className="actions-cell">
                                <button 
                                  className="action-btn edit-btn"
                                  onClick={() => openEnrollModal(enrollment)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="action-btn remove-btn"
                                  onClick={() => handleRemoveEnrollment(enrollment._id, enrollment.student._id)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-data-message">
                      <p>No students enrolled in this course yet.</p>
                    </div>
                  )}
                </>
              )}
            </div>
            </TabPanel>
            <TabPanel p={4}>
            <div className="schedule-tab">
              <h2>Weekly Schedule</h2>
              {!course.weeklySchedule || course.weeklySchedule.length === 0 ? (
                <div className="no-data-message">
                  <p>No schedule defined for this course.</p>
                </div>
              ) : (
                <div className="schedule-list">
                  {course.weeklySchedule.map((schedule, index) => (
                    <div key={index} className="schedule-item">
                      <div className="schedule-day">{schedule.day}</div>
                      <div className="schedule-time">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default CourseDetail;