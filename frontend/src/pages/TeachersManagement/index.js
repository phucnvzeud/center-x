import React, { useState, useEffect } from 'react';
import { teachersAPI, coursesAPI } from '../../api';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Input,
  Select,
  Checkbox,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  CloseButton,
  Spinner,
  Stack,
  HStack,
  VStack,
  Divider,
  IconButton,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [teacherKindergartenClasses, setTeacherKindergartenClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Colors and styles
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeBorder = useColorModeValue('blue.500', 'blue.300');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    active: true
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers. Please try again.');
      setLoading(false);
    }
  };

  const fetchTeacherCourses = async (teacherId) => {
    try {
      setLoading(true);
      const response = await teachersAPI.getCourses(teacherId);
      setTeacherCourses(response.data);
      
      // Fetch kindergarten classes taught by this teacher
      const classesResponse = await teachersAPI.getKindergartenClasses(teacherId);
      setTeacherKindergartenClasses(classesResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
      setError('Failed to load teacher courses. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    await fetchTeacherCourses(teacher._id);
  };
  
  const handleViewSchedule = (teacherId) => {
    window.location.href = `/teachers/${teacherId}/schedule`;
  };

  const handleNewTeacher = () => {
    setSelectedTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      qualification: '',
      active: true
    });
    setIsFormVisible(true);
  };

  const handleEditTeacher = () => {
    setFormData({
      name: selectedTeacher.name,
      email: selectedTeacher.email,
      phone: selectedTeacher.phone || '',
      specialization: selectedTeacher.specialization || '',
      qualification: selectedTeacher.qualification || '',
      active: selectedTeacher.active
    });
    setIsFormVisible(true);
  };

  const handleDeleteTeacher = async () => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      await teachersAPI.remove(selectedTeacher._id);
      setSelectedTeacher(null);
      fetchTeachers();
      toast({
        title: "Teacher deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher. They may have courses assigned.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, active: e.target.checked });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (selectedTeacher) {
        // Update existing teacher
        await teachersAPI.update(selectedTeacher._id, formData);
        toast({
          title: "Teacher updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new teacher
        await teachersAPI.create(formData);
        toast({
          title: "Teacher created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      
      setIsFormVisible(false);
      fetchTeachers();
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError('Failed to save teacher. Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
  };

  if (loading && teachers.length === 0) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">Loading teachers...</Text>
      </Flex>
    );
  }

  const getStatusColorScheme = (status) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Upcoming': return 'orange';
      case 'Finished': return 'purple';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Teachers Management</Heading>
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="green" 
          onClick={handleNewTeacher}
        >
          Add New Teacher
        </Button>
      </Flex>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <Text flex="1">{error}</Text>
          <CloseButton onClick={() => setError(null)} />
        </Alert>
      )}

      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
        <Box>
          <Box 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor}
            borderRadius="md" 
            p={4} 
            mb={4}
          >
            <Heading size="md" mb={4}>Teachers</Heading>
            {teachers.length === 0 ? (
              <Text textAlign="center" py={4} color="gray.500" fontStyle="italic">No teachers found.</Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {teachers.map(teacher => (
                  <Box 
                    key={teacher._id} 
                    p={3}
                    borderWidth="1px"
                    borderColor={selectedTeacher && selectedTeacher._id === teacher._id ? activeBorder : borderColor}
                    borderLeftWidth={selectedTeacher && selectedTeacher._id === teacher._id ? "4px" : "1px"}
                    borderRadius="md"
                    bg={selectedTeacher && selectedTeacher._id === teacher._id ? activeBg : bgColor}
                    opacity={!teacher.active ? 0.7 : 1}
                    _hover={{ bg: hoverBg }}
                    cursor="pointer"
                    onClick={() => handleSelectTeacher(teacher)}
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">{teacher.name}</Text>
                        <Text fontSize="sm" color="gray.500">{teacher.email}</Text>
                      </Box>
                      {!teacher.active && (
                        <Badge colorScheme="red" variant="subtle">Inactive</Badge>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </Box>

        <Box>
          {!selectedTeacher && !isFormVisible ? (
            <Flex 
              direction="column" 
              justify="center" 
              align="center" 
              height="300px" 
              bg={bgColor} 
              borderWidth="1px" 
              borderColor={borderColor}
              borderRadius="md"
              p={6}
            >
              <Text color="gray.500" fontStyle="italic" mb={4}>Select a teacher from the list or add a new one.</Text>
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="blue" 
                variant="outline" 
                onClick={handleNewTeacher}
              >
                Add New Teacher
              </Button>
            </Flex>
          ) : isFormVisible ? (
            <Box 
              bg={bgColor} 
              borderWidth="1px" 
              borderColor={borderColor}
              borderRadius="md" 
              p={6}
            >
              <Heading size="md" mb={6}>{selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}</Heading>
              <Box as="form" onSubmit={handleSubmitForm}>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Specialization</FormLabel>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Qualification</FormLabel>
                    <Input
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <Checkbox
                      id="active"
                      name="active"
                      isChecked={formData.active}
                      onChange={handleCheckboxChange}
                      mt={8}
                    >
                      Active
                    </Checkbox>
                  </FormControl>
                </Grid>
                
                <Flex justify="flex-end" mt={6} gap={3}>
                  <Button
                    variant="outline"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                  >
                    {selectedTeacher ? 'Update Teacher' : 'Add Teacher'}
                  </Button>
                </Flex>
              </Box>
            </Box>
          ) : (
            <Box 
              bg={bgColor} 
              borderWidth="1px" 
              borderColor={borderColor}
              borderRadius="md" 
              p={6}
            >
              <Flex justify="space-between" align="flex-start" mb={6}>
                <VStack align="flex-start" spacing={1}>
                  <Heading size="md">{selectedTeacher.name}</Heading>
                  <Text color="gray.500">{selectedTeacher.email}</Text>
                </VStack>
                
                <HStack spacing={2}>
                  <IconButton
                    aria-label="View schedule"
                    icon={<FaCalendarAlt />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={() => handleViewSchedule(selectedTeacher._id)}
                  />
                  <IconButton
                    aria-label="Edit teacher"
                    icon={<FaEdit />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={handleEditTeacher}
                  />
                  <IconButton
                    aria-label="Delete teacher"
                    icon={<FaTrash />}
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDeleteTeacher}
                  />
                </HStack>
              </Flex>
              
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} mb={6}>
                {selectedTeacher.phone && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Phone</Text>
                    <Text>{selectedTeacher.phone}</Text>
                  </Box>
                )}
                
                {selectedTeacher.specialization && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Specialization</Text>
                    <Text>{selectedTeacher.specialization}</Text>
                  </Box>
                )}
                
                {selectedTeacher.qualification && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Qualification</Text>
                    <Text>{selectedTeacher.qualification}</Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color="gray.500">Status</Text>
                  <Badge colorScheme={selectedTeacher.active ? "green" : "red"}>
                    {selectedTeacher.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Box>
                
                {selectedTeacher.joiningDate && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Joined</Text>
                    <Text>{new Date(selectedTeacher.joiningDate).toLocaleDateString()}</Text>
                  </Box>
                )}
              </Grid>
              
              <Divider my={4} />
              
              <Box mb={6}>
                <Heading size="sm" mb={4}>Assigned Courses</Heading>
                {loading ? (
                  <Flex justify="center" py={4}>
                    <Spinner size="sm" mr={2} /> 
                    <Text>Loading courses...</Text>
                  </Flex>
                ) : teacherCourses.length === 0 ? (
                  <Text textAlign="center" py={4} color="gray.500" fontStyle="italic">
                    No courses assigned to this teacher.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Course Name</Th>
                          <Th>Level</Th>
                          <Th>Status</Th>
                          <Th>Branch</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {teacherCourses.map(course => (
                          <Tr key={course._id}>
                            <Td>
                              <ChakraLink as={Link} to={`/courses/${course._id}`} color="blue.500">
                                {course.name}
                              </ChakraLink>
                            </Td>
                            <Td>{course.level}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColorScheme(course.status)}>
                                {course.status}
                              </Badge>
                            </Td>
                            <Td>{course.branch?.name}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
              
              <Box>
                <Heading size="sm" mb={4}>Kindergarten Classes</Heading>
                {loading ? (
                  <Flex justify="center" py={4}>
                    <Spinner size="sm" mr={2} /> 
                    <Text>Loading kindergarten classes...</Text>
                  </Flex>
                ) : teacherKindergartenClasses.length === 0 ? (
                  <Text textAlign="center" py={4} color="gray.500" fontStyle="italic">
                    No kindergarten classes assigned to this teacher.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Class Name</Th>
                          <Th>School</Th>
                          <Th>Age Group</Th>
                          <Th>Status</Th>
                          <Th>Students</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {teacherKindergartenClasses.map(kClass => (
                          <Tr key={kClass._id}>
                            <Td>
                              <ChakraLink as={Link} to={`/kindergarten/classes/${kClass._id}`} color="blue.500">
                                {kClass.name}
                              </ChakraLink>
                            </Td>
                            <Td>{kClass.school?.name || 'N/A'}</Td>
                            <Td>{kClass.ageGroup}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColorScheme(kClass.status)}>
                                {kClass.status}
                              </Badge>
                            </Td>
                            <Td>{kClass.studentCount}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Grid>
    </Container>
  );
};

export default TeachersManagement;