/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input, 
  Button, 
  VStack, 
  HStack, 
  Textarea, 
  Select, 
  Flex, 
  Spinner, 
  Alert, 
  AlertIcon, 
  Divider, 
  Text, 
  FormHelperText,
  useToast
} from '@chakra-ui/react';
import { FaArrowLeft, FaSave, FaTrash } from 'react-icons/fa';
import { studentsAPI, coursesAPI } from '../../api';

const StudentForm = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [isEdit, setIsEdit] = useState(!!studentId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  
  const [student, setStudent] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    languageLevel: 'Beginner',
    active: true,
    notes: ''
  });
  
  // Fetch student data if in edit mode
  useEffect(() => {
    if (isEdit) {
      const fetchStudentData = async () => {
        try {
          setLoading(true);
          const response = await studentsAPI.getById(studentId);
          setStudent({
            ...response.data,
            dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : ''
          });
          
          // Fetch student enrollments
          const enrollmentsResponse = await studentsAPI.getEnrollments(studentId);
          setEnrollments(enrollmentsResponse.data);
          
          setLoading(false);
        } catch (err) {
          console.error('Error fetching student data:', err);
          setError('Failed to load student data. Please try again.');
          setLoading(false);
        }
      };
      
      fetchStudentData();
    }
    
    // Fetch all courses for reference
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        setCourses(response.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    
    fetchCourses();
  }, [isEdit, studentId]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStudent({
      ...student,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      let response;
      if (isEdit) {
        response = await studentsAPI.update(studentId, student);
        toast({
          title: 'Student updated',
          description: 'Student information has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        response = await studentsAPI.create(student);
        toast({
          title: 'Student created',
          description: 'New student has been successfully added.',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      
      setSaving(false);
      navigate(`/students/${response.data._id}`);
    } catch (err) {
      console.error('Error saving student:', err);
      setError(err.response?.data?.message || 'Failed to save student. Please try again.');
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this student? This will remove them from all courses.')) {
      return;
    }
    
    try {
      setSaving(true);
      await studentsAPI.remove(studentId);
      
      toast({
        title: 'Student deleted',
        description: 'Student has been permanently removed.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      navigate('/students');
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student. Please try again.');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" thickness="4px" color="purple.500" />
        <Text ml={4} fontSize="xl">Loading student data...</Text>
      </Flex>
    );
  }
  
  return (
    <Box p={5} maxW="1000px" mx="auto">
      <Flex mb={6} align="center">
        <Button
          leftIcon={<FaArrowLeft />}
          variant="ghost"
          onClick={() => navigate(-1)}
          mr={4}
        >
          Back
        </Button>
        <Heading size="lg">{isEdit ? 'Edit Student' : 'Add New Student'}</Heading>
      </Flex>
      
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          boxShadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          mb={6}
        >
          <Heading size="md" mb={4}>Basic Information</Heading>
          
          <VStack spacing={4} align="start">
            <FormControl id="name" isRequired>
              <FormLabel>Student Name</FormLabel>
              <Input 
                name="name"
                value={student.name} 
                onChange={handleInputChange}
                placeholder="Enter student's full name"
              />
            </FormControl>
            
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input 
                name="email"
                type="email"
                value={student.email} 
                onChange={handleInputChange}
                placeholder="Email address"
              />
            </FormControl>
            
            <FormControl id="phone">
              <FormLabel>Phone</FormLabel>
              <Input 
                name="phone"
                value={student.phone || ''} 
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </FormControl>
            
            <HStack w="100%" spacing={4}>
              <FormControl id="dateOfBirth">
                <FormLabel>Date of Birth</FormLabel>
                <Input 
                  name="dateOfBirth"
                  type="date"
                  value={student.dateOfBirth || ''} 
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="languageLevel">
                <FormLabel>Language Level</FormLabel>
                <Select 
                  name="languageLevel"
                  value={student.languageLevel} 
                  onChange={handleInputChange}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Elementary">Elementary</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Upper Intermediate">Upper Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Proficient">Proficient</option>
                </Select>
              </FormControl>
            </HStack>
            
            <FormControl id="address">
              <FormLabel>Address</FormLabel>
              <Textarea 
                name="address"
                value={student.address || ''} 
                onChange={handleInputChange}
                placeholder="Full address"
                rows={3}
              />
            </FormControl>
            
            <FormControl id="notes">
              <FormLabel>Notes</FormLabel>
              <Textarea 
                name="notes"
                value={student.notes || ''} 
                onChange={handleInputChange}
                placeholder="Any additional information about the student"
                rows={4}
              />
            </FormControl>
          </VStack>
        </Box>
        
        {isEdit && enrollments.length > 0 && (
          <Box 
            bg="white" 
            p={6} 
            borderRadius="md" 
            boxShadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
            mb={6}
          >
            <Heading size="md" mb={4}>Course Enrollments</Heading>
            <VStack spacing={3} align="stretch">
              {enrollments.map(enrollment => {
                const course = courses.find(c => c._id === enrollment.course?._id) || enrollment.course;
                return (
                  <Box 
                    key={enrollment._id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md"
                    borderColor="gray.200"
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="bold">{course?.name || 'Unknown Course'}</Text>
                        <Text fontSize="sm" color="gray.600">
                          Status: {enrollment.status}
                          {enrollment.enrollmentDate && ` • Enrolled: ${new Date(enrollment.enrollmentDate).toLocaleDateString()}`}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Payment: {enrollment.paymentStatus} 
                          ({enrollment.amountPaid ? `$${enrollment.amountPaid}` : '$0'} of {enrollment.totalAmount ? `$${enrollment.totalAmount}` : '$0'})
                        </Text>
                      </Box>
                      <Link to={`/courses/${course?._id}`}>
                        <Button size="sm" colorScheme="blue" variant="outline">
                          View Course
                        </Button>
                      </Link>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        )}
        
        <Flex justify="space-between" mt={6}>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          
          <HStack>
            {isEdit && (
              <Button
                leftIcon={<FaTrash />}
                colorScheme="red"
                variant="outline"
                onClick={handleDelete}
                isLoading={saving}
              >
                Delete
              </Button>
            )}
            
            <Button
              leftIcon={<FaSave />}
              colorScheme="blue"
              type="submit"
              isLoading={saving}
            >
              {isEdit ? 'Update Student' : 'Create Student'}
            </Button>
          </HStack>
        </Flex>
      </form>
    </Box>
  );
};

export default StudentForm; 