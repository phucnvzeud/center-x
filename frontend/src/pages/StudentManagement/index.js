/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentsAPI, coursesAPI } from '../../api';
import './StudentManagement.css';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Button,
  Divider,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  useColorModeValue,
  Select,
  FormControl,
  FormLabel,
  Textarea
} from '@chakra-ui/react';
import { 
  FaUser, 
  FaSearch, 
  FaEllipsisV, 
  FaTrash, 
  FaEdit, 
  FaGraduationCap, 
  FaArrowRight, 
  FaTimes, 
  FaBook,
  FaFilter,
  FaExchangeAlt
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const StudentManagement = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedCourses, setDisplayedCourses] = useState([]);
  const [expandedCourses, setExpandedCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sourceCourseId, setSourceCourseId] = useState(null);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferPaid, setTransferPaid] = useState(0);
  const [transferReason, setTransferReason] = useState('');
  const [isTransferProcessing, setIsTransferProcessing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isTransferModalOpen, onOpen: onTransferModalOpen, onClose: onTransferModalClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Fetch courses and students data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch courses and students in parallel
        const [coursesResponse, studentsResponse] = await Promise.all([
          coursesAPI.getAll(),
          studentsAPI.getAll()
        ]);
        
        const coursesData = coursesResponse.data;
        const studentsData = studentsResponse.data;
        
        console.log('Fetched students:', studentsData);
        setStudents(studentsData);
        
        // Process courses data
        const coursesWithStudents = await processCoursesWithEnrollments(coursesData);
        
        // Sort courses by name
        coursesWithStudents.sort((a, b) => a.name.localeCompare(b.name));
        
        setCourses(coursesWithStudents);
        setDisplayedCourses(coursesWithStudents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Process courses to include student enrollment data
  const processCoursesWithEnrollments = async (coursesData) => {
    const coursesWithEnrollments = [];
    
    for (const course of coursesData) {
      try {
        // Fetch enrollments for each course
        const enrollmentsResponse = await coursesAPI.getEnrollments(course._id);
        const enrollments = enrollmentsResponse.data;
        
        // Only include active enrollments
        const activeEnrollments = enrollments.filter(
          enrollment => enrollment.status === 'Active' || enrollment.status === 'Completed' || enrollment.status === 'Suspended'
        );
        
        // Add students array to course
        coursesWithEnrollments.push({
          ...course,
          students: activeEnrollments.map(enrollment => enrollment.student)
        });
      } catch (err) {
        console.error(`Error fetching enrollments for course ${course._id}:`, err);
        // Add course without enrollments
        coursesWithEnrollments.push({
          ...course,
          students: []
        });
      }
    }
    
    return coursesWithEnrollments;
  };
  
  // Filter courses and students based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayedCourses(courses);
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    const filtered = courses.map(course => {
      // Filter students in each course
      const matchingStudents = (course.students || []).filter(
        student => 
          student.name?.toLowerCase().includes(lowerCaseSearch) ||
          student.email?.toLowerCase().includes(lowerCaseSearch) ||
          student.phone?.includes(searchTerm)
      );
      
      // Return course with only matching students
      return {
        ...course,
        students: matchingStudents,
        isMatch: course.name.toLowerCase().includes(lowerCaseSearch) || matchingStudents.length > 0
      };
    }).filter(course => course.isMatch);
    
    setDisplayedCourses(filtered);
    
    // Auto-expand courses that have matching students
    const coursesToExpand = filtered
      .filter(course => 
        (course.students.length > 0 && !course.name.toLowerCase().includes(lowerCaseSearch)) || 
        searchTerm.length >= 3
      )
      .map(course => course._id);
    
    setExpandedCourses(prev => [...new Set([...prev, ...coursesToExpand])]);
  }, [searchTerm, courses]);
  
  // Handle expanding/collapsing courses
  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId) 
        : [...prev, courseId]
    );
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setExpandedCourses([]);
  };
  
  // Handle student transfer
  const openTransferModal = async (studentId, courseId) => {
    const course = courses.find(c => c._id === courseId);
    const student = course?.students.find(s => s._id === studentId);
    
    if (student && course) {
      setSelectedStudent(student);
      setSourceCourseId(courseId);
      setTargetCourseId('');
      setTransferReason('');
      
      // Get enrollment details to initialize payment information
      try {
        const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
        const enrollment = enrollmentsResponse.data.find(e => e.course && e.course._id === courseId);
        
        if (enrollment) {
          // Ensure these are proper numbers
          const totalAmountValue = typeof enrollment.totalAmount === 'number' ? enrollment.totalAmount : 0;
          const amountPaidValue = typeof enrollment.amountPaid === 'number' ? enrollment.amountPaid : 0;
          
          console.log('Initializing transfer with enrollment data:', {
            totalAmount: totalAmountValue,
            amountPaid: amountPaidValue
          });
          
          setTransferAmount(totalAmountValue);
          setTransferPaid(amountPaidValue);
        } else {
          console.log('No enrollment found for this student in this course, setting default values');
          setTransferAmount(0);
          setTransferPaid(0);
        }
      } catch (err) {
        console.error('Error fetching enrollment details:', err);
        setTransferAmount(0);
        setTransferPaid(0);
      }
      
      onTransferModalOpen();
    } else {
      toast({
        title: 'Error',
        description: 'Could not find student or course information.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleTransferSubmit = async () => {
    if (!selectedStudent || !sourceCourseId || !targetCourseId) {
      toast({
        title: 'Error',
        description: 'Please select a target course.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsTransferProcessing(true);
    
    try {
      // First get the enrollment ID from the student's enrollments
      const enrollmentsResponse = await studentsAPI.getEnrollments(selectedStudent._id);
      const enrollment = enrollmentsResponse.data.find(e => e.course && e.course._id === sourceCourseId);
      
      if (!enrollment) {
        toast({
          title: 'Error',
          description: 'Could not find enrollment record for this student and course.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsTransferProcessing(false);
        return;
      }
      
      let withdrawalSuccessful = false;
      
      try {
        // Step 1: First withdraw the student from the source course
        const withdrawResponse = await studentsAPI.withdraw(selectedStudent._id, { 
          enrollmentId: enrollment._id,
          newStatus: 'Withdrawn'
        });
        withdrawalSuccessful = true;
        
        // Step 2: Then try to enroll student in target course
        try {
          // Ensure values are numeric and valid
          const totalAmountValue = Number(transferAmount) || 0;
          const amountPaidValue = Number(transferPaid) || 0;
          
          // Validate the required values
          if (!targetCourseId) {
            throw new Error('Target course is required');
          }
          
          if (isNaN(totalAmountValue) || totalAmountValue < 0) {
            throw new Error('Total amount must be a valid number');
          }
          
          // First, check if student already has an enrollment in the target course
          const allEnrollments = await studentsAPI.getEnrollments(selectedStudent._id);
          const existingTargetEnrollment = allEnrollments.data.find(
            e => e.course && e.course._id === targetCourseId
          );
          
          if (existingTargetEnrollment) {
            console.log('Found existing enrollment in target course:', existingTargetEnrollment);
            
            // Get the source course name safely
            const sourceCourse = enrollment.course ? enrollment.course.name || 'previous course' : 'previous course';
            
            // If there's an existing enrollment, update it instead of creating a new one
            await studentsAPI.withdraw(selectedStudent._id, {
              enrollmentId: existingTargetEnrollment._id,
              newStatus: 'Active',
              totalAmount: totalAmountValue,
              amountPaid: amountPaidValue,
              notes: transferReason
                ? `Reactivated enrollment. Transferred from ${sourceCourse}. Reason: ${transferReason}`
                : `Reactivated enrollment. Transferred from ${sourceCourse} on ${new Date().toLocaleDateString()}`
            });
            
            console.log('Successfully reactivated existing enrollment');
          } else {
            // No existing enrollment, create a new one
            console.log('Creating new enrollment in target course');
            
            // Get the source course name safely
            const sourceCourse = enrollment.course ? enrollment.course.name || 'previous course' : 'previous course';
            
            // Log what we're about to send
            console.log('Enrolling student with data:', {
              studentId: selectedStudent._id,
              courseId: targetCourseId,
              totalAmount: totalAmountValue,
              amountPaid: amountPaidValue
            });
            
            await studentsAPI.enroll(selectedStudent._id, { 
              courseId: targetCourseId,
              totalAmount: totalAmountValue,
              amountPaid: amountPaidValue,
              enrollmentDate: new Date(),
              notes: transferReason 
                ? `Transferred from ${sourceCourse}. Reason: ${transferReason}` 
                : `Transferred from ${sourceCourse} on ${new Date().toLocaleDateString()}`
            });
          }
          
          // Show success message
          toast({
            title: 'Success',
            description: `Transferred ${selectedStudent.name} to new course.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Optimized approach: Only refresh the affected courses instead of all data
          const [sourceCourseResponse, targetCourseResponse] = await Promise.all([
            coursesAPI.getById(sourceCourseId),
            coursesAPI.getById(targetCourseId)
          ]);
          
          // Process the two updated courses
          const updatedSourceCourse = {
            ...sourceCourseResponse.data,
            students: [] // Will be populated below
          };
          
          const updatedTargetCourse = {
            ...targetCourseResponse.data,
            students: [] // Will be populated below
          };
          
          // Get enrollments for the updated courses
          const [sourceEnrollments, targetEnrollments] = await Promise.all([
            coursesAPI.getEnrollments(sourceCourseId),
            coursesAPI.getEnrollments(targetCourseId)
          ]);
          
          // Update the source course with active enrollments
          updatedSourceCourse.students = sourceEnrollments.data
            .filter(e => e.status === 'Active' || e.status === 'Completed' || e.status === 'Suspended')
            .map(e => e.student);
          
          // Update the target course with active enrollments
          updatedTargetCourse.students = targetEnrollments.data
            .filter(e => e.status === 'Active' || e.status === 'Completed' || e.status === 'Suspended')
            .map(e => e.student);
          
          // Update only the affected courses in the state
          setCourses(prevCourses => 
            prevCourses.map(course => {
              if (course._id === sourceCourseId) return updatedSourceCourse;
              if (course._id === targetCourseId) return updatedTargetCourse;
              return course;
            })
          );
          
          // Update displayed courses
          setDisplayedCourses(prevCourses => 
            prevCourses.map(course => {
              if (course._id === sourceCourseId) return updatedSourceCourse;
              if (course._id === targetCourseId) return updatedTargetCourse;
              return course;
            })
          );
          
          // Close modal
          onTransferModalClose();
        } catch (enrollError) {
          // If enrollment fails but withdrawal succeeded, try to reactivate the student in original course
          if (withdrawalSuccessful) {
            try {
              // Attempt to revert the withdrawal by reactivating the student
              await studentsAPI.withdraw(selectedStudent._id, { 
                enrollmentId: enrollment._id,
                newStatus: 'Active',
                notes: `${enrollment.notes || ''} Auto-reactivated after failed transfer attempt`
              });
              
              toast({
                title: 'Warning',
                description: `Enrollment in new course failed. Student was reactivated in the original course.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
            } catch (revertError) {
              // Critical failure - withdrawal succeeded but both enrollment and reactivation failed
              console.error('Critical error: Could not revert withdrawal after enrollment failed', revertError);
              toast({
                title: 'Critical Error',
                description: `Student was withdrawn but could not be enrolled or reactivated. Please check student status manually.`,
                status: 'error',
                duration: 8000,
                isClosable: true,
              });
            }
          }
          throw enrollError; // Re-throw to be caught by outer catch
        }
      } catch (err) {
        console.error('Error transferring student:', err);
        toast({
          title: 'Error',
          description: 'Failed to transfer student. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error preparing transfer:', err);
      toast({
        title: 'Error',
        description: 'Failed to prepare student transfer. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTransferProcessing(false);
    }
  };
  
  // Handle student withdrawal from a course
  const handleWithdrawStudent = async (studentId, courseId) => {
    if (window.confirm('Are you sure you want to withdraw this student from the course?')) {
      try {
        // First get the enrollment ID from the student's enrollments
        const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
        const enrollment = enrollmentsResponse.data.find(e => e.course._id === courseId);
        
        if (!enrollment) {
          toast({
            title: 'Error',
            description: 'Could not find enrollment record for this student and course.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        
        // Now withdraw with the correct enrollmentId parameter
        await studentsAPI.withdraw(studentId, { 
          enrollmentId: enrollment._id,
          newStatus: 'Withdrawn' 
        });
        
        // Show success message
        toast({
          title: 'Success',
          description: 'Student withdrawn from course.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh both students and courses data
        const [coursesResponse, studentsResponse] = await Promise.all([
          coursesAPI.getAll(),
          studentsAPI.getAll()
        ]);
        
        const coursesData = coursesResponse.data;
        const studentsData = studentsResponse.data;
        
        setStudents(studentsData);
        
        // Process updated courses with enrollment information
        const coursesWithStudents = await processCoursesWithEnrollments(coursesData);
        coursesWithStudents.sort((a, b) => a.name.localeCompare(b.name));
        
        setCourses(coursesWithStudents);
        setDisplayedCourses(coursesWithStudents);
      } catch (err) {
        console.error('Error withdrawing student:', err);
        toast({
          title: 'Error',
          description: 'Failed to withdraw student. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" thickness="4px" color="purple.500" />
        <Text ml={4} fontSize="xl">{t('common.loading_students')}</Text>
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" variant="solid">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  return (
    <Box p={5}>
      <Flex mb={6} justify="space-between" align="center">
        <Heading size="lg">{t('students.management')}</Heading>
        <Button 
          colorScheme="purple" 
          leftIcon={<FaUser />}
          onClick={() => navigate('/students/new')}
        >
          {t('students.add')}
        </Button>
      </Flex>
      
      {/* Search and Filter Bar */}
      <Flex mb={6} direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} gap={4}>
        <InputGroup size="md" maxW={{ md: '400px' }}>
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder={t('students.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="md"
          />
          {searchTerm && (
            <InputRightElement>
              <IconButton
                icon={<FaTimes />}
                size="sm"
                variant="ghost"
                aria-label="Clear search"
                onClick={handleClearSearch}
              />
            </InputRightElement>
          )}
        </InputGroup>
        
        <HStack spacing={4} ml="auto">
          <Text fontSize="sm" color="gray.600">
            {displayedCourses.reduce((count, course) => count + (course.students?.length || 0), 0)} {t('students.students_in_courses')} {displayedCourses.length} {t('courses.name').toLowerCase()}
          </Text>
        </HStack>
      </Flex>
      
      {/* Courses Accordion with Students */}
      {displayedCourses.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <Accordion allowMultiple defaultIndex={[]}>
            {displayedCourses.map((course) => (
              <AccordionItem 
                key={course._id} 
                border="1px" 
                borderColor={borderColor} 
                borderRadius="md" 
                mb={4}
                bg={bgColor}
                isExpanded={expandedCourses.includes(course._id)}
              >
                <h2>
                  <AccordionButton 
                    py={4}
                    onClick={() => toggleCourseExpansion(course._id)}
                    _hover={{ bg: 'gray.50' }}
                    className="accordion-button-hover"
                  >
                    <Box flex="1" textAlign="left">
                      <Flex align="center" className="course-header">
                        <Box 
                          color="purple.500" 
                          bg="purple.50" 
                          p={2} 
                          borderRadius="md" 
                          mr={3}
                          className="course-icon"
                        >
                          <FaBook />
                        </Box>
                        <Box>
                          <Text fontWeight="bold">{course.name}</Text>
                          <HStack spacing={3} mt={1}>
                            <Badge colorScheme={getCourseStatusColor(course.status)}>
                              {course.status}
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              {course.students.length} {t('courses.students')}
                            </Text>
                            {course.teacher && (
                              <Text fontSize="sm" color="gray.600">
                                {t('courses.teacher')}: {course.teacher.name}
                              </Text>
                            )}
                          </HStack>
                        </Box>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  {course.students.length > 0 ? (
                    <Box overflowX="auto" className="student-table-container">
                      <Table variant="simple" size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th width="40px">#</Th>
                            <Th>{t('students.student')}</Th>
                            <Th>{t('students.contact')}</Th>
                            <Th>{t('students.enrollment_date')}</Th>
                            <Th>{t('common.status')}</Th>
                            <Th width="80px" className="actions-column">{t('common.actions')}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {course.students.map((student, index) => (
                            <Tr key={student._id || index} className="student-row">
                              <Td>{index + 1}</Td>
                              <Td>
                                <Flex align="center" className="avatar-container">
                                  <Avatar 
                                    size="sm" 
                                    name={student.name} 
                                    src={student.avatar} 
                                    bg="purple.500" 
                                    color="white" 
                                    mr={2} 
                                  />
                                  <Box>
                                    <Text 
                                      fontWeight="medium" 
                                      color="blue.500" 
                                      cursor="pointer"
                                      onClick={() => navigate(`/students/${student._id}`)}
                                    >
                                      {student.name}
                                    </Text>
                                    {student.age && (
                                      <Text fontSize="xs" color="gray.500">
                                        Age: {student.age}
                                      </Text>
                                    )}
                                  </Box>
                                </Flex>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  {student.email && (
                                    <Text fontSize="sm">{student.email}</Text>
                                  )}
                                  {student.phone && (
                                    <Text fontSize="sm" color="gray.600">
                                      {student.phone}
                                    </Text>
                                  )}
                                </VStack>
                              </Td>
                              <Td>
                                {student.enrollmentDate ? 
                                  new Date(student.enrollmentDate).toLocaleDateString() : 
                                  'N/A'
                                }
                              </Td>
                              <Td>
                                <Badge colorScheme={student.status === 'Active' ? 'green' : 'gray'}>
                                  {student.status || 'Active'}
                                </Badge>
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    aria-label="Options"
                                    icon={<FaEllipsisV />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                                                      <MenuList fontSize="sm">                                      <MenuItem                                         icon={<FaEdit />}                                         onClick={() => navigate(`/students/${student._id}/edit`)}                                      >                                        {t('students.edit')}                                      </MenuItem>                                      <MenuItem                                         icon={<FaExchangeAlt />}                                         onClick={() => openTransferModal(student._id, course._id)}                                      >                                        {t('students.transfer_to_another')}                                      </MenuItem>
                                    <MenuItem icon={<FaTrash />} color="red.500" onClick={() => handleWithdrawStudent(student._id, course._id)}>
                                      {t('students.withdraw_from_course')}
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Box p={4} textAlign="center">
                      <Text color="gray.500">{t('students.no_students_enrolled')}</Text>
                      <Button 
                        mt={2} 
                        size="sm" 
                        colorScheme="purple" 
                        variant="outline"
                        leftIcon={<FaUser />}
                        onClick={() => navigate(`/courses/${course._id}`)}
                      >
                        {t('students.add_students')}
                      </Button>
                    </Box>
                  )}
                  
                  <Flex justify="flex-end" mt={4}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      colorScheme="purple"
                      leftIcon={<FaArrowRight />}
                      as={Link}
                      to={`/courses/${course._id}`}
                    >
                      {t('students.go_to_course')}
                    </Button>
                  </Flex>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </VStack>
      ) : (
        <Box p={8} textAlign="center" borderWidth="1px" borderRadius="lg">
          <Text mb={4} fontSize="lg">
            {searchTerm ? t('students.no_match') : t('students.no_courses_found')}
          </Text>
          {searchTerm && (
            <Button variant="outline" onClick={handleClearSearch}>
              {t('students.clear_search')}
            </Button>
          )}
        </Box>
      )}
      
      {/* Transfer Student Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={onTransferModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('students.transfer_student')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedStudent && (
              <>
                <Text mb={4}>
                  {t('students.transfer')} <b>{selectedStudent.name}</b> {t('students.transfer_to')}:
                </Text>
                
                <Box mb={4}>
                  <Text fontWeight="medium" mb={2}>{t('students.select_target_course')}:</Text>
                  <Select 
                    placeholder={t('students.select_course')} 
                    value={targetCourseId} 
                    onChange={(e) => setTargetCourseId(e.target.value)}
                  >
                    {courses
                      .filter(course => 
                        course._id !== sourceCourseId && 
                        course.status !== 'Completed' && 
                        course.status !== 'Cancelled' &&
                        course.totalStudent < (course.maxCapacity || 30) // Only show courses with available capacity
                      )
                      .map(course => (
                        <option key={course._id} value={course._id}>
                          {course.name} ({course.status}) - {course.students?.length || 0} {t('courses.students')}
                        </option>
                      ))
                    }
                  </Select>
                </Box>
                
                <Box mb={4}>
                  <Text fontWeight="medium" mb={2}>{t('students.payment_information')}:</Text>
                  <Flex gap={3}>
                    <FormControl mb={2}>
                      <FormLabel fontSize="sm">{t('students.total_amount')}</FormLabel>
                      <Input 
                        type="number" 
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('students.amount_paid')}</FormLabel>
                      <Input 
                        type="number" 
                        value={transferPaid}
                        onChange={(e) => setTransferPaid(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </Flex>
                </Box>
                
                <Box mb={4}>
                  <Text fontWeight="medium" mb={2}>{t('students.reason_for_transfer')}:</Text>
                  <Textarea
                    placeholder={t('students.enter_reason')}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                  />
                </Box>
                
                <Flex justify="flex-end" mt={6} gap={3}>
                  <Button variant="outline" onClick={onTransferModalClose} isDisabled={isTransferProcessing}>{t('common.cancel')}</Button>
                  <Button 
                    colorScheme="blue" 
                    isDisabled={!targetCourseId || isTransferProcessing}
                    isLoading={isTransferProcessing}
                    onClick={handleTransferSubmit}
                  >
                    {t('students.transfer')}
                  </Button>
                </Flex>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Helper functions
const getCourseStatusColor = (status) => {
  switch (status) {
    case 'Active': return 'green';
    case 'Upcoming': return 'blue';
    case 'Completed': return 'purple';
    case 'Cancelled': return 'red';
    default: return 'gray';
  }
};

export default StudentManagement; 