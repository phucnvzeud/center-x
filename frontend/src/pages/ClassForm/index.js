import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { kindergartenClassesAPI, schoolsAPI, teachersAPI } from '../../api';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FaArrowLeft, FaChevronRight, FaPlus, FaTrash } from 'react-icons/fa';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const AGE_GROUPS = [
  '2-3 years', '3-4 years', '4-5 years', '5-6 years'
];

const ClassForm = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!classId;

  // Check if a default school was passed through location state
  const defaultSchoolId = location.state?.schoolId || '';

  const [kClass, setKClass] = useState({
    name: '',
    school: defaultSchoolId,
    teacher: '',
    teacherName: '',
    studentCount: 0,
    ageGroup: AGE_GROUPS[0],
    status: 'Active',
    startDate: '',
    totalSessions: 10,
    weeklySchedule: [],
    holidays: []
  });

  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Default time slots for new schedules
  const defaultStartTime = '09:00';
  const defaultEndTime = '10:30';

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const scheduleBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all schools and teachers for the dropdowns
        const [schoolsResponse, teachersResponse] = await Promise.all([
          schoolsAPI.getAll(),
          teachersAPI.getAll()
        ]);
        
        setSchools(schoolsResponse.data);
        setTeachers(teachersResponse.data);
        
        // If in edit mode, fetch the class details
        if (isEditMode) {
          const classResponse = await kindergartenClassesAPI.getById(classId);
          const classData = classResponse.data;
          
          // Ensure school is properly set to the ID value
          if (classData.school && typeof classData.school === 'object') {
            classData.school = classData.school._id;
          }
          
          // Ensure teacher is properly set to the ID value
          if (classData.teacher && typeof classData.teacher === 'object') {
            classData.teacher = classData.teacher._id;
          }
          
          // Format dates for input fields
          if (classData.startDate) {
            classData.startDate = new Date(classData.startDate).toISOString().split('T')[0];
          }
          
          // If there's no weekly schedule, initialize an empty array
          if (!classData.weeklySchedule || !Array.isArray(classData.weeklySchedule)) {
            classData.weeklySchedule = [];
          }
          
          // If there's no holidays array, initialize it
          if (!classData.holidays || !Array.isArray(classData.holidays)) {
            classData.holidays = [];
          }
          
          setKClass(classData);
        } else {
          // Set default startDate to current date if creating a new class
          const today = new Date();
          const formattedDate = today.toISOString().split('T')[0];
          setKClass(prev => ({
            ...prev,
            startDate: formattedDate
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'studentCount' || name === 'totalSessions') {
      // Ensure these fields are numeric
      setKClass(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else if (name === 'teacher') {
      // When teacher selection changes, also update teacherName for compatibility
      const selectedTeacher = teachers.find(t => t._id === value);
      setKClass(prev => ({ 
        ...prev, 
        teacher: value,
        teacherName: selectedTeacher ? selectedTeacher.name : ''
      }));
    } else {
      setKClass(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberInputChange = (name, value) => {
    setKClass(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleAddSchedule = () => {
    setKClass(prev => ({
      ...prev,
      weeklySchedule: [
        ...prev.weeklySchedule,
        {
          day: DAYS_OF_WEEK[0],
          startTime: defaultStartTime,
          endTime: defaultEndTime
        }
      ]
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...kClass.weeklySchedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setKClass(prev => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedule = [...kClass.weeklySchedule];
    updatedSchedule.splice(index, 1);
    setKClass(prev => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleAddHoliday = () => {
    // Set default holiday date to current date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setKClass(prev => ({
      ...prev,
      holidays: [
        ...prev.holidays,
        {
          date: formattedDate,
          name: 'Holiday'
        }
      ]
    }));
  };

  const handleHolidayChange = (index, field, value) => {
    const updatedHolidays = [...kClass.holidays];
    updatedHolidays[index] = { ...updatedHolidays[index], [field]: value };
    setKClass(prev => ({ ...prev, holidays: updatedHolidays }));
  };

  const handleRemoveHoliday = (index) => {
    const updatedHolidays = [...kClass.holidays];
    updatedHolidays.splice(index, 1);
    setKClass(prev => ({ ...prev, holidays: updatedHolidays }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!kClass.name.trim()) {
      setError('Class name is required.');
      return;
    }
    
    if (!kClass.school) {
      setError('Please select a school.');
      return;
    }
    
    if (!kClass.teacher) {
      setError('Please select a teacher.');
      return;
    }
    
    if (!kClass.startDate) {
      setError('Start date is required.');
      return;
    }
    
    if (kClass.weeklySchedule.length === 0) {
      setError('At least one weekly schedule item is required.');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await kindergartenClassesAPI.update(classId, kClass);
      } else {
        await kindergartenClassesAPI.create(kClass);
      }
      
      // If we came from a specific school, go back to that school's classes page
      if (defaultSchoolId) {
        navigate(`/kindergarten/schools/${defaultSchoolId}/classes`);
      } else {
        // Otherwise, go to the general classes list
        navigate('/kindergarten/classes');
      }
    } catch (err) {
      console.error('Error saving class:', err);
      setError('Failed to save class. Please check all fields and try again.');
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">Loading class data...</Text>
      </Flex>
    );
  }

  return (
    <Container maxW="container.lg" py={6}>
      <Flex mb={6} justify="space-between" alignItems="center">
        <Heading size="lg">{isEditMode ? 'Edit Class' : 'Create New Class'}</Heading>
        <Button 
          as={Link} 
          to={defaultSchoolId ? `/kindergarten/schools/${defaultSchoolId}/classes` : '/kindergarten/classes'} 
          leftIcon={<FaArrowLeft />} 
          size="sm" 
          colorScheme="gray" 
          variant="outline"
        >
          Back to Classes
        </Button>
      </Flex>
      
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <Box 
        as="form" 
        onSubmit={handleSubmit} 
        bg={bgColor} 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="md" 
        p={6} 
        shadow="sm"
      >
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="md" mb={4}>Basic Information</Heading>
            <Divider mb={4} />
            
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Class Name</FormLabel>
                  <Input
                    id="name"
                    name="name"
                    value={kClass.name}
                    onChange={handleInputChange}
                    isDisabled={formSubmitting}
                  />
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Age Group</FormLabel>
                  <Select
                    id="ageGroup"
                    name="ageGroup"
                    value={kClass.ageGroup}
                    onChange={handleInputChange}
                    isDisabled={formSubmitting}
                  >
                    {AGE_GROUPS.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>School</FormLabel>
                  <Select
                    id="school"
                    name="school"
                    value={kClass.school}
                    onChange={handleInputChange}
                    isDisabled={formSubmitting || defaultSchoolId}
                  >
                    <option value="">Select a school</option>
                    {schools.map(school => (
                      <option key={school._id} value={school._id}>{school.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Teacher</FormLabel>
                  <Select
                    id="teacher"
                    name="teacher"
                    value={kClass.teacher}
                    onChange={handleInputChange}
                    isDisabled={formSubmitting}
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Student Count</FormLabel>
                  <NumberInput
                    min={0}
                    value={kClass.studentCount}
                    onChange={(valueString) => handleNumberInputChange('studentCount', valueString)}
                    isDisabled={formSubmitting}
                  >
                    <NumberInputField
                      id="studentCount"
                      name="studentCount"
                    />
                  </NumberInput>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    id="status"
                    name="status"
                    value={kClass.status}
                    onChange={handleInputChange}
                    isDisabled={formSubmitting}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>
          </Box>
          
          <Box>
            <Heading size="md" mb={4}>Schedule Information</Heading>
            <Divider mb={4} />
            
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={6}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={kClass.startDate}
                    onChange={handleInputChange}
                    isDisabled={formSubmitting}
                  />
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Total Sessions</FormLabel>
                  <NumberInput
                    min={1}
                    value={kClass.totalSessions}
                    onChange={(valueString) => handleNumberInputChange('totalSessions', valueString)}
                    isDisabled={formSubmitting}
                  >
                    <NumberInputField
                      id="totalSessions"
                      name="totalSessions"
                    />
                  </NumberInput>
                </FormControl>
              </GridItem>
            </Grid>
            
            <FormControl mb={6}>
              <FormLabel>Weekly Schedule</FormLabel>
              <VStack spacing={3} align="stretch">
                {kClass.weeklySchedule.map((schedule, index) => (
                  <Flex 
                    key={index} 
                    p={3} 
                    bg={scheduleBg} 
                    borderRadius="md" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    align="center"
                    justify="space-between"
                  >
                    <Select
                      value={schedule.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      width="auto"
                      mr={4}
                      isDisabled={formSubmitting}
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </Select>
                    
                    <HStack spacing={2} flex="1">
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        width="auto"
                        isDisabled={formSubmitting}
                      />
                      <Text>to</Text>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        width="auto"
                        isDisabled={formSubmitting}
                      />
                    </HStack>
                    
                    <IconButton
                      aria-label="Remove schedule"
                      icon={<FaTrash />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSchedule(index)}
                      ml={2}
                      isDisabled={formSubmitting}
                    />
                  </Flex>
                ))}
                
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSchedule}
                  alignSelf="flex-start"
                  mt={2}
                  isDisabled={formSubmitting}
                >
                  Add Schedule
                </Button>
              </VStack>
            </FormControl>
            
            <FormControl>
              <FormLabel>Holidays (Optional)</FormLabel>
              <VStack spacing={3} align="stretch">
                {kClass.holidays.map((holiday, index) => (
                  <Flex 
                    key={index} 
                    p={3} 
                    bg={scheduleBg} 
                    borderRadius="md" 
                    borderWidth="1px" 
                    borderColor={borderColor}
                    align="center"
                    justify="space-between"
                  >
                    <Input
                      type="date"
                      value={holiday.date}
                      onChange={(e) => handleHolidayChange(index, 'date', e.target.value)}
                      width="auto"
                      mr={4}
                      isDisabled={formSubmitting}
                    />
                    
                    <Input
                      value={holiday.name}
                      onChange={(e) => handleHolidayChange(index, 'name', e.target.value)}
                      placeholder="Holiday name"
                      flex="1"
                      isDisabled={formSubmitting}
                    />
                    
                    <IconButton
                      aria-label="Remove holiday"
                      icon={<FaTrash />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHoliday(index)}
                      ml={2}
                      isDisabled={formSubmitting}
                    />
                  </Flex>
                ))}
                
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHoliday}
                  alignSelf="flex-start"
                  mt={2}
                  isDisabled={formSubmitting}
                >
                  Add Holiday
                </Button>
              </VStack>
            </FormControl>
          </Box>
          
          <Flex justify="flex-end" gap={3} mt={4}>
            <Button 
              as={Link}
              to={defaultSchoolId ? `/kindergarten/schools/${defaultSchoolId}/classes` : '/kindergarten/classes'} 
              variant="outline" 
              isDisabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue"
              isLoading={formSubmitting}
              loadingText="Saving"
            >
              {isEditMode ? 'Update Class' : 'Create Class'}
            </Button>
          </Flex>
        </VStack>
      </Box>
      
      <Breadcrumb 
        separator={<FaChevronRight color="gray.500" />} 
        mt={6}
        fontSize="sm"
        color="gray.500"
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/kindergarten">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/kindergarten/classes">Classes</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text fontWeight="medium">{isEditMode ? 'Edit Class' : 'New Class'}</Text>
        </BreadcrumbItem>
      </Breadcrumb>
    </Container>
  );
};

export default ClassForm; 