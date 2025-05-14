import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { coursesAPI, studentsAPI, teachersAPI, branchesAPI } from '../../api';
import './CourseDetail.css';
import './SessionTableTracker.css';
import './EnrollmentStyles.css';
import * as XLSX from 'xlsx';

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
  const [activeTab, setActiveTab] = useState('sessions');
  
  // Session tracking state
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
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
  // Modal for viewing withdrawn students
  const [isWithdrawnModalOpen, setIsWithdrawnModalOpen] = useState(false);

  // Add import related states, handlers and component
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);

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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
    setIsEnrollModalOpen(true);
  };

  const closeEnrollModal = () => {
    setIsEnrollModalOpen(false);
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

  // Add import related functions
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportFile(file);
    
    // Read the excel file for preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Validate at least one row with data
        if (jsonData.length < 2) {
          setImportError('Excel file has no data rows or is incorrectly formatted');
          return;
        }
        
        // Get headers (first row)
        const headers = jsonData[0];
        
        // Check for required columns (name)
        if (!headers.some(header => header.toLowerCase() === 'name')) {
          setImportError('Excel file must contain a "Name" column');
          return;
        }
        
        // Create preview data (up to 5 rows)
        const previewData = jsonData.slice(1, 6).map(row => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
          });
          return rowData;
        });
        
        setImportPreview(previewData);
        setImportError(null);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setImportError('Failed to parse Excel file. Please ensure it is a valid Excel file.');
        setImportPreview([]);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    
    try {
      setImportLoading(true);
      setImportError(null);
      
      // Read all data from the file
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setImportError('No data found in Excel file');
            setImportLoading(false);
            return;
          }
          
          console.log(`Processing ${jsonData.length} students for import`);
          
          // Process each student
          const results = [];
          let successCount = 0;
          let errorCount = 0;
          
          for (const studentData of jsonData) {
            try {
              // Check for required name field
              if (!studentData.Name && !studentData.name) {
                results.push({ name: 'Unknown', status: 'error', message: 'Name is required' });
                errorCount++;
                continue;
              }
              
              // Prepare student data (normalize field names)
              const name = studentData.Name || studentData.name;
              const email = studentData.Email || studentData.email || '';
              const phone = studentData.Phone || studentData.phone || '';
              const totalAmount = parseFloat(studentData.Fee || studentData.fee || studentData.Amount || studentData.amount || 0);
              const amountPaid = parseFloat(studentData.Paid || studentData.paid || 0);
              const notes = studentData.Notes || studentData.notes || '';
              const enrollmentDate = studentData.EnrollmentDate || studentData.enrollmentDate || '';
              
              // Create or find student
              const studentResponse = await studentsAPI.create({
                name,
                email,
                phone
              });
              
              const studentId = studentResponse.data._id;
              
              // Enroll student in this course
              const enrollmentData = {
                courseId,
                totalAmount,
                amountPaid,
                enrollmentDate: enrollmentDate || undefined
              };
              
              // Add notes explicitly to ensure it's captured
              if (notes) {
                enrollmentData.notes = notes;
              } else {
                enrollmentData.notes = `Imported via Excel on ${new Date().toLocaleString()}`;
              }
              
              console.log('Sending enrollment data with notes:', enrollmentData);
              await studentsAPI.enroll(studentId, enrollmentData);
              
              // Add to results
              results.push({ name, status: 'success' });
              successCount++;
            } catch (error) {
              // Handle individual student error
              const name = studentData.Name || studentData.name || 'Unknown';
              const errorMessage = error.response?.data?.message || 'Failed to import';
              
              results.push({ name, status: 'error', message: errorMessage });
              errorCount++;
              
              console.error(`Error importing student ${name}:`, error);
            }
          }
          
          // Refresh data after all imports
          await fetchEnrollmentData();
          
          // Refresh course data to update totalStudent
          const courseData = await coursesAPI.getById(courseId);
          setCourse(courseData.data);
          
          // Show results
          if (errorCount === 0) {
            alert(`Successfully imported all ${successCount} students!`);
          } else {
            alert(`Imported ${successCount} students with ${errorCount} errors. See console for details.`);
            console.table(results);
          }
          
          // Close modal and reset state
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportPreview([]);
          setImportLoading(false);
        } catch (err) {
          console.error('Error processing Excel file:', err);
          setImportError('Failed to process Excel file');
          setImportLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(importFile);
    } catch (err) {
      console.error('Error importing students:', err);
      setImportError('Failed to import students');
      setImportLoading(false);
    }
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
      <div className="loading-spinner">
        <div>Loading course data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="not-found-message">
        <h2>Course Not Found</h2>
        <p>The requested course could not be found.</p>
        <Link to="/courses" className="back-link">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
      <div className="course-detail-header">
        <div>
          <h1>{course.name}</h1>
          <div className="course-metadata">
            <span className="course-level">{course.level}</span>
            <span className="course-branch">{course.branch?.name || 'Unknown Branch'}</span>
            <span className={`course-status ${getStatusClass(course.status)}`}>
              {course.status}
            </span>
            {course.previousCourse && (
              <Link 
                to={`/courses/${course.previousCourse._id}`} 
                className="previous-course-link"
              >
                ← Previous: {course.previousCourse.name}
              </Link>
            )}
          </div>
        </div>
        <div className="course-actions">
          <Link to="/courses" className="view-sessions-btn">
            Back to Courses
          </Link>
          <Link to={`/courses/edit/${course._id}`} className="edit-course-btn">
            Edit Course
          </Link>
          <button 
            className="export-btn" 
            onClick={exportSessionsToExcel}
          >
            Export Sessions to Excel
          </button>
        </div>
      </div>

      <div className="course-info-grid">
        <div className="info-card">
          <div className="info-label">Start Date</div>
          <div className="info-value">{formatDate(course.startDate)}</div>
        </div>
        
        <div className="info-card">
          <div className="info-label">Original End Date</div>
          <div className="info-value">{formatDate(course.estimatedEndDate || course.endDate)}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Actual End Date</div>
          <div className="info-value">
            {calculateActualEndDate().formattedDate}
            {calculateActualEndDate().daysLeft > 0 && (
              <div className="days-left">
                {calculateActualEndDate().daysLeft} days left
              </div>
            )}
            {calculateActualEndDate().daysLeft <= 0 && calculateActualEndDate().daysLeft > -7 && (
              <div className="days-left completed">
                Completed {Math.abs(calculateActualEndDate().daysLeft)} days ago
              </div>
            )}
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-label">Sessions</div>
          <div className="info-value">
            {course.sessions ? course.sessions.length : 0} total
            {course.sessions && course.sessions.length > course.totalSessions && (
              <span className="compensatory-count"> 
                (includes {course.sessions.length - course.totalSessions} compensatory)
              </span>
            )}
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-label">Teacher</div>
          <div className="info-value">{course.teacher?.name || 'Not assigned'}</div>
        </div>
        
        <div className="info-card">
          <div className="info-label">Progress</div>
          <div className="info-value progress-container">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${isNaN(course.progress) ? 0 : (course.progress || 0)}%` }}
              ></div>
            </div>
            <span className="progress-text">{isNaN(course.progress) ? 0 : (course.progress || 0)}%</span>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-label">Payment Progress</div>
          <div className="info-value progress-container">
            {(() => {
              const payment = calculatePaymentProgress();
              return (
                <>
                  <div className="progress-bar payment-progress-bar">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${payment.percent || 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {payment.percent || 0}% 
                    <span className="payment-details">
                      ${(payment.paid || 0).toFixed(2)} / ${(payment.total || 0).toFixed(2)}
                    </span>
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="course-detail-content">
        <div className="tabs-container">
          <div 
            className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </div>
          <div 
            className={`tab ${activeTab === 'enrollments' ? 'active' : ''}`}
            onClick={() => setActiveTab('enrollments')}
          >
            Enrolled Students
          </div>
          <div 
            className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'sessions' && (
            renderSessionsContent()
          )}
          
          {activeTab === 'enrollments' && (
            <div className="enrollments-tab">
              <div className="enrollments-header">
                <div className="enrollments-filters">
                  <div className="filter-group">
                    <span className="info-label">Active Students:</span> {enrollments.length}
                    {withdrawnStudents.length > 0 && (
                      <button 
                        className="view-withdrawn-btn"
                        onClick={() => setIsWithdrawnModalOpen(true)}
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
                    onClick={() => setIsImportModalOpen(true)}
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
                  {enrollments.length > 0 ? (
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
          )}
          
          {activeTab === 'schedule' && (
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
          )}
        </div>
      </div>
      
      {/* Session Update Modal */}
      {isModalOpen && selectedSession && (
        <div className="session-modal-backdrop">
          <div className="session-modal">
            <div className="session-modal-header">
              <h3>Update Session Status</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            {updateError && (
              <div className="error-message">{updateError}</div>
            )}
            
            <form onSubmit={handleSubmitSession}>
              <div className="form-group">
                <label>Date:</label>
                <span>{formatDate(selectedSession.date)} ({getSessionDayAndTime(selectedSession.date).split(',')[0]})</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={selectedSession.status}
                  onChange={handleInputChange}
                  disabled={updateLoading || isFutureSession(selectedSession.date)}
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
                  disabled={updateLoading}
                ></textarea>
              </div>
              
              {originalStatus === 'Pending' && selectedSession.status.startsWith('Absent') && (
                <div className="info-box">
                  <p>
                    When marking a session as absent, a compensatory session will 
                    automatically be added to the end of the course.
                  </p>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={closeModal} disabled={updateLoading}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={updateLoading || isFutureSession(selectedSession.date)}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Student Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="enrollment-modal-backdrop">
          <div className="enrollment-modal">
            <div className="enrollment-modal-header">
              <h3>{isEditMode ? 'Update Enrollment' : 'Add Student to Course'}</h3>
              <button className="close-btn" onClick={closeEnrollModal}>×</button>
            </div>
            
            {enrollmentError && (
              <div className="error-message">{enrollmentError}</div>
            )}
            
            <form onSubmit={handleSubmitEnrollment}>
              <div className="form-group">
                <label htmlFor="studentName">Student Name:</label>
                <div className="student-select-container">
                  <input
                    id="studentName"
                    name="studentName"
                    type="text"
                    value={newEnrollmentData.studentName}
                    onChange={handleEnrollmentInputChange}
                    disabled={enrollmentLoading || isEditMode}
                    required
                  />
                  {showStudentDropdown && filteredStudents.length > 0 && !isEditMode && (
                    <div className="student-dropdown">
                      {filteredStudents.map(student => (
                        <div 
                          key={student._id} 
                          className="student-dropdown-item"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {!selectedStudent && !isEditMode && (
                <>
                  <div className="form-group">
                    <label htmlFor="studentEmail">Email:</label>
                    <input
                      id="studentEmail"
                      name="studentEmail"
                      type="email"
                      value={newEnrollmentData.studentEmail}
                      onChange={handleEnrollmentInputChange}
                      disabled={enrollmentLoading}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="studentPhone">Phone (optional):</label>
                    <input
                      id="studentPhone"
                      name="studentPhone"
                      type="tel"
                      value={newEnrollmentData.studentPhone}
                      onChange={handleEnrollmentInputChange}
                      disabled={enrollmentLoading}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label htmlFor="enrollmentDate">Enrollment Date:</label>
                <input
                  id="enrollmentDate"
                  name="enrollmentDate"
                  type="date"
                  value={newEnrollmentData.enrollmentDate}
                  onChange={handleEnrollmentInputChange}
                  disabled={enrollmentLoading}
                />
              </div>
              
              {isEditMode && currentEnrollment && currentEnrollment.status === 'Withdrawn' && (
                <div className="form-group">
                  <label htmlFor="withdrawnDate">Withdrawn Date:</label>
                  <input
                    id="withdrawnDate"
                    name="withdrawnDate"
                    type="date"
                    value={newEnrollmentData.withdrawnDate}
                    onChange={handleEnrollmentInputChange}
                    disabled={enrollmentLoading}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="totalAmount">Total Amount ($):</label>
                <input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newEnrollmentData.totalAmount}
                  onChange={handleEnrollmentInputChange}
                  disabled={enrollmentLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amountPaid">Amount Paid ($):</label>
                <input
                  id="amountPaid"
                  name="amountPaid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newEnrollmentData.amountPaid}
                  onChange={handleEnrollmentInputChange}
                  disabled={enrollmentLoading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newEnrollmentData.notes}
                  onChange={handleEnrollmentInputChange}
                  disabled={enrollmentLoading}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={closeEnrollModal} disabled={enrollmentLoading}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={enrollmentLoading}
                >
                  {enrollmentLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Withdrawn Students Modal */}
      {isWithdrawnModalOpen && (
        <div className="withdrawn-modal-backdrop">
          <div className="withdrawn-modal">
            <div className="withdrawn-modal-header">
              <h3>Withdrawn Students</h3>
              <button className="close-btn" onClick={() => setIsWithdrawnModalOpen(false)}>×</button>
            </div>
            <div className="withdrawn-modal-body">
              {withdrawnStudents.length === 0 ? (
                <div className="no-data-message">
                  <p>No withdrawn students for this course.</p>
                </div>
              ) : (
                <>
                  <div className="withdrawn-info">
                    Showing {withdrawnStudents.length} withdrawn students. These students are not counted in the course's total student count.
                  </div>
                  <div className="withdrawals-table-container">
                    <table className="enrollments-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Enrollment Date</th>
                          <th>Withdrawn Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawnStudents.map((enrollment, index) => (
                          <tr key={enrollment._id}>
                            <td>{index + 1}</td>
                            <td>{enrollment.student.name}</td>
                            <td>{formatDate(enrollment.enrollmentDate)}</td>
                            <td>{formatDate(enrollment.updatedAt)}</td>
                            <td className="actions-cell">
                              <button 
                                className="action-btn edit-btn"
                                onClick={() => {
                                  setIsWithdrawnModalOpen(false);
                                  setTimeout(() => openEnrollModal(enrollment), 100);
                                }}
                              >
                                Reactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="import-modal-backdrop">
          <div className="import-modal">
            <div className="import-modal-header">
              <h3>Import Students from Excel</h3>
              <button className="close-btn" onClick={() => setIsImportModalOpen(false)}>×</button>
            </div>
            <div className="import-modal-body">
              <div className="import-instructions">
                <p>Upload an Excel file with student information to enroll them in this course.</p>
                <p>The file must contain the following columns:</p>
                <ul>
                  <li><strong>Name</strong> (required) - Student's full name</li>
                  <li><strong>Email</strong> (optional) - Student's email address</li>
                  <li><strong>Phone</strong> (optional) - Student's phone number</li>
                  <li><strong>Fee</strong> or <strong>Amount</strong> (optional) - Total course fee</li>
                  <li><strong>Paid</strong> (optional) - Amount already paid</li>
                  <li><strong>Notes</strong> (optional) - Any notes about the student</li>
                  <li><strong>EnrollmentDate</strong> (optional) - Date of enrollment (YYYY-MM-DD format)</li>
                </ul>
              </div>
              
              <div className="file-upload-container">
                <input
                  type="file"
                  id="import-file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="import-file" className="file-input-label">
                  {importFile ? importFile.name : 'Choose Excel File'}
                </label>
              </div>
              
              {importError && (
                <div className="import-error">
                  {importError}
                </div>
              )}
              
              {importPreview.length > 0 && (
                <div className="import-preview">
                  <h4>Preview (first {importPreview.length} rows):</h4>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {Object.keys(importPreview[0]).map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="import-actions">
                <button 
                  type="button" 
                  onClick={() => setIsImportModalOpen(false)} 
                  disabled={importLoading}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleImportSubmit} 
                  disabled={importLoading || !importFile || importError}
                  className="import-btn"
                >
                  {importLoading ? 'Importing...' : 'Import Students'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;