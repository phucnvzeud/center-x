/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  HStack,
  VStack,
  Badge,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
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
  Select,
  Textarea
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaEllipsisV, 
  FaUserPlus, 
  FaExchangeAlt, 
  FaTrash, 
  FaGraduationCap,
  FaCalendarAlt,
  FaMoneyBillWave
} from 'react-icons/fa';
import { studentsAPI, coursesAPI } from '../../api';

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Form data for enrollment
  const [enrollmentData, setEnrollmentData] = useState({
    courseId: '',
    totalAmount: 0,
    amountPaid: 0,
    enrollmentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  // Modal controls
  const { 
    isOpen: isEnrollModalOpen, 
    onOpen: openEnrollModal, 
    onClose: closeEnrollModal 
  } = useDisclosure();
  
  const { 
    isOpen: isPaymentModalOpen, 
    onOpen: openPaymentModal, 
    onClose: closePaymentModal 
  } = useDisclosure();
  
  // Fetch student and enrollment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student details
        const studentResponse = await studentsAPI.getById(studentId);
        setStudent(studentResponse.data);
        
        // Fetch student enrollments
        const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
        setEnrollments(enrollmentsResponse.data);
        
        // Fetch all courses
        const coursesResponse = await coursesAPI.getAll();
        setCourses(coursesResponse.data);
        
        // Determine available courses for enrollment (exclude already enrolled active courses)
        const enrolledCourseIds = enrollmentsResponse.data
          .filter(e => e.status !== 'Withdrawn')
          .map(e => e.course._id);
        
        const availableCourses = coursesResponse.data.filter(
          course => !enrolledCourseIds.includes(course._id) &&
                   course.status !== 'Completed' &&
                   course.status !== 'Cancelled'
        );
        
        setAvailableCourses(availableCourses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student information. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);
  
  const openEnrollmentModal = () => {
    if (availableCourses.length === 0) {
      toast({
        title: 'No courses available',
        description: 'There are no available courses for enrollment.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setEnrollmentData({
      courseId: availableCourses[0]?._id || '',
      totalAmount: availableCourses[0]?.price || 0,
      amountPaid: 0,
      enrollmentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    
    openEnrollModal();
  };
  
  const openUpdatePaymentModal = (enrollment) => {
    setSelectedEnrollment(enrollment);
    
    setEnrollmentData({
      ...enrollmentData,
      totalAmount: enrollment.totalAmount || 0,
      amountPaid: enrollment.amountPaid || 0,
      notes: enrollment.notes || ''
    });
    
    openPaymentModal();
  };
  
  const handleEnrollmentInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'courseId') {
      // Update totalAmount to match selected course price
      const selectedCourse = courses.find(c => c._id === value);
      setEnrollmentData({
        ...enrollmentData,
        courseId: value,
        totalAmount: selectedCourse?.price || 0
      });
    } else {
      setEnrollmentData({
        ...enrollmentData,
        [name]: value
      });
    }
  };
  
  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Enroll student in course
      await studentsAPI.enroll(studentId, enrollmentData);
      
      toast({
        title: 'Enrollment successful',
        description: 'Student has been enrolled in the course.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Refresh enrollments
      const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
      setEnrollments(enrollmentsResponse.data);
      
      // Update available courses
      const enrolledCourseIds = enrollmentsResponse.data
        .filter(e => e.status !== 'Withdrawn')
        .map(e => e.course._id);
      
      setAvailableCourses(courses.filter(
        course => !enrolledCourseIds.includes(course._id) &&
                 course.status !== 'Completed' &&
                 course.status !== 'Cancelled'
      ));
      
      closeEnrollModal();
      setLoading(false);
    } catch (err) {
      console.error('Error enrolling student:', err);
      toast({
        title: 'Enrollment failed',
        description: err.response?.data?.message || 'Failed to enroll student. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Update enrollment payment information
      await studentsAPI.withdraw(studentId, {
        enrollmentId: selectedEnrollment._id,
        newStatus: selectedEnrollment.status, // Keep the same status
        totalAmount: parseFloat(enrollmentData.totalAmount),
        amountPaid: parseFloat(enrollmentData.amountPaid),
        notes: enrollmentData.notes
      });
      
      toast({
        title: 'Payment updated',
        description: 'Payment information has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Refresh enrollments
      const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
      setEnrollments(enrollmentsResponse.data);
      
      closePaymentModal();
      setLoading(false);
    } catch (err) {
      console.error('Error updating payment:', err);
      toast({
        title: 'Payment update failed',
        description: 'Failed to update payment information. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const handleWithdrawFromCourse = async (enrollment) => {
    if (!window.confirm(`Are you sure you want to withdraw ${student.name} from this course?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Withdraw student from course
      await studentsAPI.withdraw(studentId, {
        enrollmentId: enrollment._id,
        newStatus: 'Withdrawn'
      });
      
      toast({
        title: 'Student withdrawn',
        description: 'Student has been withdrawn from the course.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Refresh enrollments
      const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
      setEnrollments(enrollmentsResponse.data);
      
      // Update available courses
      const enrolledCourseIds = enrollmentsResponse.data
        .filter(e => e.status !== 'Withdrawn')
        .map(e => e.course._id);
      
      setAvailableCourses(courses.filter(
        course => !enrolledCourseIds.includes(course._id) &&
                 course.status !== 'Completed' &&
                 course.status !== 'Cancelled'
      ));
      
      setLoading(false);
    } catch (err) {
      console.error('Error withdrawing student:', err);
      toast({
        title: 'Withdrawal failed',
        description: 'Failed to withdraw student from course. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Partial': return 'yellow';
      case 'Pending': return 'orange';
      default: return 'gray';
    }
  };
  
  const getEnrollmentStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Completed': return 'blue';
      case 'Withdrawn': return 'red';
      case 'Suspended': return 'orange';
      default: return 'gray';
    }
  };
  
  if (loading && !student) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" thickness="4px" color="purple.500" />
        <Text ml={4} fontSize="xl">Loading student data...</Text>
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
      <Flex mb={6} align="center">
        <Button
          leftIcon={<FaArrowLeft />}
          variant="ghost"
          onClick={() => navigate('/students')}
          mr={4}
        >
          Back to Students
        </Button>
        <Heading size="lg">{student?.name}</Heading>
        <Button
          leftIcon={<FaEdit />}
          colorScheme="blue"
          variant="outline"
          ml="auto"
          onClick={() => navigate(`/students/${studentId}/edit`)}
        >
          Edit
        </Button>
      </Flex>
      
      <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
        {/* Student Information */}
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm"
          flex="1"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4}>Student Information</Heading>
          
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between">
              <Text fontWeight="bold">Name:</Text>
              <Text>{student?.name}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Email:</Text>
              <Text>{student?.email}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Phone:</Text>
              <Text>{student?.phone || 'Not provided'}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Date of Birth:</Text>
              <Text>{student?.dateOfBirth ? formatDate(student.dateOfBirth) : 'Not provided'}</Text>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Language Level:</Text>
              <Badge colorScheme="purple">{student?.languageLevel || 'Beginner'}</Badge>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Status:</Text>
              <Badge colorScheme={student?.active ? 'green' : 'red'}>
                {student?.active ? 'Active' : 'Inactive'}
              </Badge>
            </Flex>
            
            <Flex justify="space-between">
              <Text fontWeight="bold">Enrolled Since:</Text>
              <Text>{student?.enrollmentDate ? formatDate(student.enrollmentDate) : 'N/A'}</Text>
            </Flex>
            
            {student?.address && (
              <>
                <Text fontWeight="bold">Address:</Text>
                <Text>{student.address}</Text>
              </>
            )}
            
            {student?.notes && (
              <>
                <Text fontWeight="bold">Notes:</Text>
                <Text>{student.notes}</Text>
              </>
            )}
          </VStack>
        </Box>
        
        {/* Enrollments */}
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm"
          flex="2"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Course Enrollments</Heading>
            <Button
              leftIcon={<FaUserPlus />}
              colorScheme="purple"
              size="sm"
              onClick={openEnrollmentModal}
            >
              Enroll in Course
            </Button>
          </Flex>
          
          {enrollments.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Course</Th>
                    <Th>Enrollment Date</Th>
                    <Th>Status</Th>
                    <Th>Payment</Th>
                    <Th width="50px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {enrollments.map(enrollment => (
                    <Tr key={enrollment._id}>
                      <Td>
                        <Link to={`/courses/${enrollment.course?._id}`}>
                          <Text color="blue.500" fontWeight="medium">
                            {enrollment.course?.name || 'Unknown Course'}
                          </Text>
                        </Link>
                      </Td>
                      <Td>{formatDate(enrollment.enrollmentDate)}</Td>
                      <Td>
                        <Badge colorScheme={getEnrollmentStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex align="center">
                          <Badge colorScheme={getPaymentStatusColor(enrollment.paymentStatus)} mr={2}>
                            {enrollment.paymentStatus}
                          </Badge>
                          <Text fontSize="sm" whiteSpace="nowrap">
                            ${enrollment.amountPaid || 0} of ${enrollment.totalAmount || 0}
                          </Text>
                        </Flex>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem 
                              icon={<FaMoneyBillWave />}
                              onClick={() => openUpdatePaymentModal(enrollment)}
                            >
                              Update Payment
                            </MenuItem>
                            <MenuItem 
                              icon={<FaCalendarAlt />}
                              as={Link}
                              to={`/courses/${enrollment.course?._id}`}
                            >
                              View Course
                            </MenuItem>
                            {enrollment.status !== 'Withdrawn' && (
                              <MenuItem 
                                icon={<FaTrash />}
                                color="red.500"
                                onClick={() => handleWithdrawFromCourse(enrollment)}
                              >
                                Withdraw
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Flex 
              direction="column" 
              align="center" 
              justify="center" 
              p={10} 
              borderWidth="1px" 
              borderRadius="md" 
              borderStyle="dashed"
            >
              <Box color="purple.500" mb={3} fontSize="3xl">
                <FaGraduationCap />
              </Box>
              <Text mb={5}>
                This student is not enrolled in any courses yet.
              </Text>
              <Button
                leftIcon={<FaUserPlus />}
                colorScheme="purple"
                onClick={openEnrollmentModal}
              >
                Enroll in Course
              </Button>
            </Flex>
          )}
        </Box>
      </Flex>
      
      {/* Enroll in Course Modal */}
      <Modal isOpen={isEnrollModalOpen} onClose={closeEnrollModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enroll in Course</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmitEnrollment}>
            <ModalBody pb={6}>
              <FormControl isRequired>
                <FormLabel>Select Course</FormLabel>
                <Select
                  name="courseId"
                  value={enrollmentData.courseId}
                  onChange={handleEnrollmentInputChange}
                >
                  {availableCourses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.status})
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <HStack mt={4} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Total Amount</FormLabel>
                  <Input
                    name="totalAmount"
                    type="number"
                    value={enrollmentData.totalAmount}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Amount Paid</FormLabel>
                  <Input
                    name="amountPaid"
                    type="number"
                    value={enrollmentData.amountPaid}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
              </HStack>
              
              <FormControl mt={4}>
                <FormLabel>Enrollment Date</FormLabel>
                <Input
                  name="enrollmentDate"
                  type="date"
                  value={enrollmentData.enrollmentDate}
                  onChange={handleEnrollmentInputChange}
                />
              </FormControl>
              
              <FormControl mt={4}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  name="notes"
                  value={enrollmentData.notes}
                  onChange={handleEnrollmentInputChange}
                  placeholder="Any notes about this enrollment"
                />
              </FormControl>
            </ModalBody>
            
            <ModalFooter>
              <Button onClick={closeEnrollModal} mr={3}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={loading}>
                Enroll
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      
      {/* Update Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Payment</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleUpdatePayment}>
            <ModalBody pb={6}>
              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Total Amount</FormLabel>
                  <Input
                    name="totalAmount"
                    type="number"
                    value={enrollmentData.totalAmount}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Amount Paid</FormLabel>
                  <Input
                    name="amountPaid"
                    type="number"
                    value={enrollmentData.amountPaid}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
              </HStack>
              
              <FormControl mt={4}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  name="notes"
                  value={enrollmentData.notes}
                  onChange={handleEnrollmentInputChange}
                  placeholder="Any notes about payment"
                />
              </FormControl>
            </ModalBody>
            
            <ModalFooter>
              <Button onClick={closePaymentModal} mr={3}>Cancel</Button>
              <Button colorScheme="blue" type="submit" isLoading={loading}>
                Update
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StudentDetail; 