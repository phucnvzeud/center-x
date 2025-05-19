/* eslint-disable no-unused-vars */
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
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TeachersManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      <Flex p={8} justify="center" align="center">
        <Spinner size="md" mr={3} />
        <Text ml={4} fontSize="lg" color="gray.600">{t('common.loading_teachers')}</Text>
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
      <Box p={5}>
        <Flex mb={6} justify="space-between" align="center">
          <Heading size="lg">{t('teachers.management')}</Heading>
          <Button 
            colorScheme="blue" 
            leftIcon={<FaPlus />}
            onClick={handleNewTeacher}
          >
            {t('teachers.add')}
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
              <Heading size="md" mb={4}>{t('teachers.teachers')}</Heading>
              {teachers.length === 0 ? (
                <Text textAlign="center" py={4} color="gray.500" fontStyle="italic">{t('teachers.no_teachers_found')}</Text>
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
                          <Badge colorScheme="red" variant="subtle">{t('common.inactive')}</Badge>
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
                bg={bgColor} 
                justify="center" 
                align="center" 
                direction="column" 
                py={10}
                borderWidth="1px" 
                borderColor={borderColor}
                borderRadius="md"
                p={6}
              >
                <Text color="gray.500" fontStyle="italic" mb={4}>{t('teachers.select_teacher')}</Text>
                <Button 
                  leftIcon={<FaPlus />} 
                  colorScheme="blue" 
                  variant="outline" 
                  onClick={handleNewTeacher}
                >
                  {t('teachers.add_new')}
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
                <Heading size="md" mb={6}>{selectedTeacher ? t('teachers.edit') : t('teachers.add')}</Heading>
                <Box as="form" onSubmit={handleSubmitForm}>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                    <FormControl isRequired>
                      <FormLabel>{t('common.name')}</FormLabel>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>{t('common.email')}</FormLabel>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>{t('common.phone')}</FormLabel>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>{t('teachers.specialization')}</FormLabel>
                      <Input
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>{t('teachers.qualification')}</FormLabel>
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
                        {t('common.active')}
                      </Checkbox>
                    </FormControl>
                  </Grid>
                  
                  <Flex justify="flex-end" mt={6} gap={3}>
                    <Button
                      variant="outline"
                      onClick={handleCancelForm}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      isLoading={loading}
                    >
                      {selectedTeacher ? t('teachers.update') : t('teachers.add')}
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
                      aria-label={t('teachers.view_schedule')}
                      icon={<FaCalendarAlt />}
                      colorScheme="purple"
                      variant="outline"
                      onClick={() => handleViewSchedule(selectedTeacher._id)}
                    />
                    <IconButton
                      aria-label={t('teachers.edit')}
                      icon={<FaEdit />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={handleEditTeacher}
                    />
                    <IconButton
                      aria-label={t('teachers.delete_teacher')}
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
                      <Text fontWeight="medium" fontSize="sm" color="gray.500">{t('common.phone')}</Text>
                      <Text>{selectedTeacher.phone}</Text>
                    </Box>
                  )}
                  
                  {selectedTeacher.specialization && (
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.500">{t('teachers.specialization')}</Text>
                      <Text>{selectedTeacher.specialization}</Text>
                    </Box>
                  )}
                  
                  {selectedTeacher.qualification && (
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.500">{t('teachers.qualification')}</Text>
                      <Text>{selectedTeacher.qualification}</Text>
                    </Box>
                  )}
                  
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">{t('teachers.status')}</Text>
                    <Badge colorScheme={selectedTeacher.active ? "green" : "red"}>
                      {selectedTeacher.active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </Box>
                  
                  {selectedTeacher.joiningDate && (
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.500">{t('teachers.joined')}</Text>
                      <Text>{new Date(selectedTeacher.joiningDate).toLocaleDateString()}</Text>
                    </Box>
                  )}
                </Grid>
                
                <Divider my={4} />
                
                <Box mb={6}>
                  <Heading size="sm" mb={4}>{t('teachers.assigned_courses')}</Heading>
                  {loading ? (
                    <Flex justify="center" py={4}>
                      <Spinner size="sm" mr={2} />
                      <Text>{t('common.loading_courses')}</Text>
                    </Flex>
                  ) : teacherCourses.length === 0 ? (
                    <Text textAlign="center" py={4} color="gray.500" fontStyle="italic">{t('teachers.no_courses')}</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>{t('teachers.course_name')}</Th>
                            <Th>{t('teachers.level')}</Th>
                            <Th>{t('common.status')}</Th>
                            <Th>{t('teachers.branch')}</Th>
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
                      <Text>{t('common.loading_classes')}</Text>
                    </Flex>
                  ) : teacherKindergartenClasses.length === 0 ? (
                    <Text textAlign="center" py={4} color="gray.500" fontStyle="italic">{t('teachers.no_classes')}</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>{t('teachers.class_name')}</Th>
                            <Th>{t('teachers.school')}</Th>
                            <Th>{t('teachers.age_group')}</Th>
                            <Th>{t('common.status')}</Th>
                            <Th>{t('teachers.student_count')}</Th>
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
      </Box>
    </Container>
  );
};

export default TeachersManagement;