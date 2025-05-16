import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { coursesAPI, teachersAPI, branchesAPI } from '../../api';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Grid,
  GridItem,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
  HStack,
  IconButton,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftAddon,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const LEVEL_OPTIONS = [
  'Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Proficient'
];

const CourseForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!courseId;

  const [course, setCourse] = useState({
    name: '',
    branch: '',
    teacher: '',
    previousCourse: '',
    startDate: '',
    endDate: '',
    totalSessions: 0,
    weeklySchedule: [],
    description: '',
    level: 'Beginner',
    maxStudents: 15,
    price: 0
  });

  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [previousCourses, setPreviousCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch teachers
        const teachersRes = await teachersAPI.getAll();
        setTeachers(teachersRes.data);
        
        // Fetch branches
        const branchesRes = await branchesAPI.getAll();
        setBranches(branchesRes.data);
        
        // Fetch previous courses for selection
        const coursesRes = await coursesAPI.getAll();
        setPreviousCourses(coursesRes.data);
        
        // If editing an existing course, fetch its details
        if (isEditMode) {
          const courseRes = await coursesAPI.getById(courseId);
          const courseData = courseRes.data;
          
          // Format dates for input fields
          if (courseData.startDate) {
            courseData.startDate = new Date(courseData.startDate).toISOString().split('T')[0];
          }
          if (courseData.endDate) {
            courseData.endDate = new Date(courseData.endDate).toISOString().split('T')[0];
          }
          
          // Ensure references are properly set
          if (courseData.teacher && typeof courseData.teacher === 'object') {
            courseData.teacher = courseData.teacher._id;
          }
          
          if (courseData.branch && typeof courseData.branch === 'object') {
            courseData.branch = courseData.branch._id;
          }
          
          if (courseData.previousCourse && typeof courseData.previousCourse === 'object') {
            courseData.previousCourse = courseData.previousCourse._id;
          }
          
          // Remove totalStudent from course data as we'll derive it from maxStudents
          delete courseData.totalStudent;
          
          setCourse(courseData);
          
          // Initialize schedule from weeklySchedule
          if (courseData.weeklySchedule && courseData.weeklySchedule.length > 0) {
            // Make a deep copy of the weeklySchedule to avoid reference issues
            const scheduleData = courseData.weeklySchedule.map(item => ({
              day: item.day,
              startTime: item.startTime,
              endTime: item.endTime
            }));
            
            setSchedule(scheduleData);
          } else {
            // Add default schedule item if none exists
            setSchedule([{ day: 'Monday', startTime: '09:00', endTime: '11:00' }]);
          }
        } else {
          // For new courses, set default start date to today
          const today = new Date().toISOString().split('T')[0];
          setCourse(prev => ({ ...prev, startDate: today }));
          
          // Add a default schedule item for new courses
          setSchedule([{ day: 'Monday', startTime: '09:00', endTime: '11:00' }]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
  };

  const handleNumberInputChange = (name, value) => {
    setCourse({ ...course, [name]: value });
  };

  const handleAddSchedule = () => {
    setSchedule([...schedule, { day: 'Monday', startTime: '09:00', endTime: '11:00' }]);
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setSchedule(updatedSchedule);
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedule = [...schedule];
    updatedSchedule.splice(index, 1);
    setSchedule(updatedSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Add validation for required fields
      if (schedule.length === 0) {
        setError('Please add at least one weekly schedule item.');
        return;
      }
      
      // Set totalStudent to match maxStudents
      const totalStudent = parseInt(course.maxStudents) || 0;
      
      // Prepare data for submission
      const courseData = {
        ...course,
        weeklySchedule: schedule, // Ensure schedule is correctly passed
        totalStudent, // Ensure totalStudent is correctly set
        maxStudents: parseInt(course.maxStudents) || 15 // Ensure maxStudents is a number
      };
      
      // Handle previousCourse - must be null (not empty string) when not selected
      if (courseData.previousCourse === "") {
        courseData.previousCourse = null;
      }
      
      let savedCourse;
      
      if (isEditMode) {
        // Ensure weeklySchedule is properly formatted for update
        const formattedSchedule = courseData.weeklySchedule.map(item => ({
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime
        }));
        
        courseData.weeklySchedule = formattedSchedule;
        
        // Send the update request
        savedCourse = await coursesAPI.update(courseId, courseData);
      } else {
        savedCourse = await coursesAPI.create(courseData);
      }
      
      navigate('/courses');
    } catch (err) {
      console.error('Error saving course:', err);
      if (err.response) {
        setError(`Failed to save course: ${err.response.data.message || 'Unknown error'}`);
      } else {
        setError('Failed to save course. Please check all fields and try again.');
      }
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">Loading...</Text>
      </Flex>
    );
  }

  return (
    <Container maxW="container.lg" py={6}>
      <Flex mb={6} justify="space-between" alignItems="center">
        <Heading size="lg">{isEditMode ? 'Edit Course' : 'Create New Course'}</Heading>
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
                  <FormLabel>Course Name</FormLabel>
                  <Input
                    id="name"
                    name="name"
                    value={course.name}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Level</FormLabel>
                  <Select
                    id="level"
                    name="level"
                    value={course.level}
                    onChange={handleInputChange}
                  >
                    {LEVEL_OPTIONS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    id="branch"
                    name="branch"
                    value={course.branch}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a branch</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
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
                    value={course.teacher}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormControl>
                  <FormLabel>Previous Course (Optional)</FormLabel>
                  <Select
                    id="previousCourse"
                    name="previousCourse"
                    value={course.previousCourse || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">None</option>
                    {previousCourses.map(prevCourse => (
                      <option key={prevCourse._id} value={prevCourse._id}>
                        {prevCourse.name} ({prevCourse.level})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    id="description"
                    name="description"
                    value={course.description}
                    onChange={handleInputChange}
                    rows="3"
                    resize="vertical"
                  />
                </FormControl>
              </GridItem>
            </Grid>
          </Box>
          
          <Box>
            <Heading size="md" mb={4}>Schedule & Duration</Heading>
            <Divider mb={4} />
            
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} mb={6}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={course.startDate}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={course.endDate || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Total Sessions</FormLabel>
                  <NumberInput min={1} value={course.totalSessions}>
                    <NumberInputField
                      id="totalSessions"
                      name="totalSessions"
                      onChange={handleInputChange}
                    />
                  </NumberInput>
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Maximum Students</FormLabel>
                  <NumberInput min={1} value={course.maxStudents}>
                    <NumberInputField
                      id="maxStudents"
                      name="maxStudents"
                      onChange={handleInputChange}
                    />
                  </NumberInput>
                </FormControl>
              </GridItem>
            </Grid>
            
            <FormControl mb={4}>
              <FormLabel>Weekly Schedule</FormLabel>
              <VStack spacing={3} align="stretch">
                {schedule.map((item, index) => (
                  <Flex 
                    key={index} 
                    p={3} 
                    bg="gray.50" 
                    borderRadius="md" 
                    borderWidth="1px" 
                    borderColor="gray.200"
                    align="center"
                    justify="space-between"
                  >
                    <Select
                      value={item.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      width="auto"
                      mr={4}
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </Select>
                    
                    <HStack spacing={2} flex="1">
                      <Input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        width="auto"
                      />
                      <Text>to</Text>
                      <Input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        width="auto"
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
                >
                  Add Schedule
                </Button>
              </VStack>
            </FormControl>
          </Box>
          
          <Box>
            <Heading size="md" mb={4}>Pricing</Heading>
            <Divider mb={4} />
            
            <FormControl isRequired mb={6}>
              <FormLabel>Course Price</FormLabel>
              <InputGroup>
                <InputLeftAddon children="$" />
                <NumberInput 
                  min={0} 
                  precision={2} 
                  value={course.price}
                  onChange={(valueString) => handleNumberInputChange('price', parseFloat(valueString))}
                  width="full"
                >
                  <NumberInputField
                    id="price"
                    name="price"
                    borderLeftRadius={0}
                  />
                </NumberInput>
              </InputGroup>
            </FormControl>
          </Box>
          
          <Flex justify="flex-end" gap={3} mt={4}>
            <Button 
              variant="outline" 
              onClick={() => navigate('/courses')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue"
            >
              {isEditMode ? 'Update Course' : 'Create Course'}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Container>
  );
};

export default CourseForm; 