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
import { useTranslation } from 'react-i18next';

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  
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
        title: t('students.enrollment_saved'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reload enrollments and close modal
      const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
      setEnrollments(enrollmentsResponse.data);
      
      closeEnrollModal();
      setLoading(false);
    } catch (err) {
      console.error('Error enrolling student:', err);
      toast({
        title: t('common.error'),
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedEnrollment) return;
    
    try {
      setLoading(true);
      
      // Update enrollment payment details
      await studentsAPI.updateEnrollment(
        studentId, 
        selectedEnrollment._id, 
        {
        totalAmount: parseFloat(enrollmentData.totalAmount),
        amountPaid: parseFloat(enrollmentData.amountPaid),
        notes: enrollmentData.notes
        }
      );
      
      toast({
        title: t('students.payment_updated'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reload enrollments and close modal
      const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
      setEnrollments(enrollmentsResponse.data);
      
      closePaymentModal();
      setLoading(false);
    } catch (err) {
      console.error('Error updating payment:', err);
      toast({
        title: t('common.error'),
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const handleWithdrawFromCourse = async (enrollment) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    
    try {
      setLoading(true);
      
      // Withdraw student from course
      await studentsAPI.withdrawFromCourse(studentId, enrollment._id);
      
      toast({
        title: t('students.student_withdrawn'),
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
    if (!dateString) return t('common.not_provided');
    return new Date(dateString).toLocaleDateString();
  };
  
  const getPaymentStatusColor = (enrollment) => {
    const { totalAmount, amountPaid } = enrollment;
    
    // Calculate payment status
    let status, colorScheme;
    
    if (!totalAmount || totalAmount === 0) {
      status = t('course_management.course_detail.no_payment');
      colorScheme = 'gray';
    } else if (amountPaid >= totalAmount) {
      status = t('course_management.course_detail.full_payment');
      colorScheme = 'green';
    } else if (amountPaid > 0) {
      status = t('course_management.course_detail.partial_payment');
      colorScheme = 'yellow';
    } else {
      status = t('course_management.course_detail.no_payment');
      colorScheme = 'red';
    }
    
    return (
      <Badge colorScheme={colorScheme}>
        {status}
      </Badge>
    );
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
        <Text ml={4} fontSize="xl">{t('students.loading')}</Text>
      </Flex>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" variant="solid">
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }
  
  return (
    <Box maxW="1200px" mx="auto" mb={8}>
      <Flex mb={6} align="center">
        <Button
          leftIcon={<FaArrowLeft />}
          variant="ghost"
          onClick={() => navigate('/students')}
        >
          {t('common.back')}
        </Button>
        <Heading size="lg">{student?.name}</Heading>
        <Button
          leftIcon={<FaEdit />}
          colorScheme="blue"
          variant="outline"
          ml="auto"
          onClick={() => navigate(`/students/edit/${studentId}`)}
        >
          {t('students.edit')}
        </Button>
      </Flex>
      
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm"
        mb={6}
        >
        <Heading size="md" mb={4}>{t('students.student_information')}</Heading>
          
          <VStack spacing={3} align="stretch">
          <Flex>
            <Text fontWeight="bold">{t('students.name')}:</Text>
            <Text ml={2}>{student?.name}</Text>
            </Flex>
            
          <Flex>
            <Text fontWeight="bold">{t('students.email')}:</Text>
            <Text ml={2}>{student?.email || t('common.not_provided')}</Text>
            </Flex>
            
          <Flex>
            <Text fontWeight="bold">{t('students.phone')}:</Text>
            <Text ml={2}>{student?.phone || t('common.not_provided')}</Text>
            </Flex>
            
          <Flex>
            <Text fontWeight="bold">{t('students.dob')}:</Text>
            <Text ml={2}>{student?.dateOfBirth ? formatDate(student.dateOfBirth) : t('common.not_provided')}</Text>
            </Flex>
            
          <Flex align="center">
            <Text fontWeight="bold">{t('students.language_level')}:</Text>
            <Badge colorScheme="purple" ml={2}>{student?.languageLevel || t('students.beginner')}</Badge>
            </Flex>
            
          <Flex align="center">
            <Text fontWeight="bold">{t('students.status')}:</Text>
            <Badge colorScheme={student?.status === 'Active' ? 'green' : 'gray'} ml={2}>{student?.status}</Badge>
            </Flex>
            
          <Flex>
            <Text fontWeight="bold">{t('students.enrolled_since')}:</Text>
            <Text ml={2}>{student?.createdAt ? formatDate(student.createdAt) : t('common.not_provided')}</Text>
            </Flex>
            
          <Flex>
            <Text fontWeight="bold">{t('students.address')}:</Text>
            <Text ml={2}>{student?.address || t('common.not_provided')}</Text>
          </Flex>
          
          <Flex>
            <Text fontWeight="bold">{t('students.notes')}:</Text>
            <Text ml={2}>{student?.notes || t('common.not_provided')}</Text>
          </Flex>
          </VStack>
        </Box>
        
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm"
        >
          <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">{t('students.course_enrollments')}</Heading>
            <Button
              leftIcon={<FaUserPlus />}
              colorScheme="purple"
              size="sm"
              onClick={openEnrollmentModal}
            >
            {t('students.add_enrollment')}
            </Button>
          </Flex>
          
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                <Th>{t('students.course')}</Th>
                <Th>{t('students.start_date')}</Th>
                <Th>{t('students.payment_status')}</Th>
                <Th>{t('students.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {enrollments.map(enrollment => (
                    <Tr key={enrollment._id}>
                      <Td>
                          <Text color="blue.500" fontWeight="medium">
                      <Link to={`/courses/${enrollment.course._id}`}>
                        {enrollment.course.name}
                      </Link>
                          </Text>
                      </Td>
                      <Td>
                        <Flex align="center">
                      <Box as={FaCalendarAlt} color="gray.500" mr={2} />
                          <Text fontSize="sm" whiteSpace="nowrap">
                        {formatDate(enrollment.enrollmentDate)}
                          </Text>
                        </Flex>
                      </Td>
                  <Td>{getPaymentStatusColor(enrollment)}</Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                        <MenuItem icon={<FaMoneyBillWave />} onClick={() => openUpdatePaymentModal(enrollment)}>
                          {t('students.update_payment')}
                            </MenuItem>
                        <MenuItem icon={<FaTrash />} onClick={() => handleWithdrawFromCourse(enrollment)}>
                          {t('students.withdraw')}
                              </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
        
        {enrollments.length === 0 && (
          <Box
            mt={4}
            p={8}
            textAlign="center"
              direction="column" 
              align="center" 
              justify="center" 
            borderWidth={1}
              borderRadius="md" 
              borderStyle="dashed"
            >
            <Text mb={4}>{t('students.no_enrollments')}</Text>
              <Button
                leftIcon={<FaUserPlus />}
                colorScheme="purple"
                onClick={openEnrollmentModal}
              >
              {t('students.enroll_in_course')}
              </Button>
          </Box>
          )}
        </Box>
      
      {/* Enrollment Modal */}
      <Modal isOpen={isEnrollModalOpen} onClose={closeEnrollModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('students.enroll_student')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
          <form onSubmit={handleSubmitEnrollment}>
              <VStack spacing={4}>
              <FormControl isRequired>
                  <FormLabel>{t('students.course')}</FormLabel>
                <Select
                  name="courseId"
                  value={enrollmentData.courseId}
                  onChange={handleEnrollmentInputChange}
                >
                  {availableCourses.map(course => (
                      <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </Select>
              </FormControl>
              
                <FormControl isRequired>
                  <FormLabel>{t('students.total_amount')}</FormLabel>
                  <Input
                    name="totalAmount"
                    type="number"
                    value={enrollmentData.totalAmount}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('students.amount_paid')}</FormLabel>
                  <Input
                    name="amountPaid"
                    type="number"
                    value={enrollmentData.amountPaid}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
              
                <FormControl isRequired>
                  <FormLabel>{t('students.enrollment_date')}</FormLabel>
                <Input
                  name="enrollmentDate"
                  type="date"
                  value={enrollmentData.enrollmentDate}
                  onChange={handleEnrollmentInputChange}
                />
              </FormControl>
              
                <FormControl>
                  <FormLabel>{t('students.notes')}</FormLabel>
                <Textarea
                  name="notes"
                  value={enrollmentData.notes}
                  onChange={handleEnrollmentInputChange}
                    placeholder={t('students.enrollment_notes')}
                />
              </FormControl>
            
              <Button colorScheme="blue" type="submit" isLoading={loading}>
                  {t('students.save')}
              </Button>
              </VStack>
          </form>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Payment Update Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('students.update_payment')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
          <form onSubmit={handleUpdatePayment}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('students.total_amount')}</FormLabel>
                  <Input
                    name="totalAmount"
                    type="number"
                    value={enrollmentData.totalAmount}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('students.amount_paid')}</FormLabel>
                  <Input
                    name="amountPaid"
                    type="number"
                    value={enrollmentData.amountPaid}
                    onChange={handleEnrollmentInputChange}
                  />
                </FormControl>
              
                <FormControl>
                  <FormLabel>{t('students.notes')}</FormLabel>
                <Textarea
                  name="notes"
                  value={enrollmentData.notes}
                  onChange={handleEnrollmentInputChange}
                    placeholder={t('students.payment_notes')}
                />
              </FormControl>
            
              <Button colorScheme="blue" type="submit" isLoading={loading}>
                  {t('students.save')}
              </Button>
              </VStack>
          </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StudentDetail; 