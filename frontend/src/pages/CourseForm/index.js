/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { coursesAPI, teachersAPI, branchesAPI } from '../../api';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setError(t('course_management.form.schedule_required'));
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
        setError(t('course_management.form.validation_error'));
      }
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">{t('common.loading')}</Text>
      </Flex>
    );
  }

  return (
    <Container maxW="container.lg" py={6}>
      <Flex mb={6} justify="space-between" alignItems="center">
        <Heading size="lg">{isEditMode ? t('course_management.edit_course') : t('course_management.create_new_course')}</Heading>
        <Button 
          leftIcon={<FaArrowLeft />} 
          variant="outline" 
          onClick={() => navigate('/courses')}
        >
          {t('common.back')}
        </Button>
      </Flex>
      
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={bgColor}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        p={6}
        boxShadow="sm"
      >
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.name')}</FormLabel>
            <Input
              id="name"
              name="name"
              value={course.name}
              onChange={handleInputChange}
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.branch')}</FormLabel>
            <Select
              id="branch"
              name="branch"
              value={course.branch}
              onChange={handleInputChange}
            >
              <option value="">{t('common.selectOption')}</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>{branch.name}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.teacher')}</FormLabel>
            <Select
              id="teacher"
              name="teacher"
              value={course.teacher}
              onChange={handleInputChange}
            >
              <option value="">{t('common.selectOption')}</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>{t('course_management.form.previous_course')}</FormLabel>
            <Select
              id="previousCourse"
              name="previousCourse"
              value={course.previousCourse || ""}
              onChange={handleInputChange}
            >
              <option value="">{t('course_management.form.none')}</option>
              {previousCourses
                .filter(c => c._id !== courseId) // Don't show the current course as an option
                .map(course => (
                  <option key={course._id} value={course._id}>{course.name}</option>
                ))
              }
            </Select>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.start_date')}</FormLabel>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={course.startDate}
              onChange={handleInputChange}
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.end_date')}</FormLabel>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={course.endDate}
              onChange={handleInputChange}
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.total_sessions')}</FormLabel>
            <NumberInput
              id="totalSessions"
              min={1}
              value={course.totalSessions}
              onChange={(value) => handleNumberInputChange('totalSessions', value)}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('course_management.form.level')}</FormLabel>
            <Select
              id="level"
              name="level"
              value={course.level}
              onChange={handleInputChange}
            >
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {t(`course_management.level.${level.toLowerCase().replace(' ', '_')}`)}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>{t('course_management.form.max_students')}</FormLabel>
            <NumberInput
              id="maxStudents"
              min={1}
              value={course.maxStudents}
              onChange={(value) => handleNumberInputChange('maxStudents', value)}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          
          <FormControl>
            <FormLabel>{t('course_management.form.price')}</FormLabel>
            <NumberInput
              id="price"
              min={0}
              value={course.price}
              onChange={(value) => handleNumberInputChange('price', value)}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <FormControl>
              <FormLabel>{t('course_management.form.description')}</FormLabel>
              <Textarea
                id="description"
                name="description"
                value={course.description}
                onChange={handleInputChange}
                rows={3}
              />
            </FormControl>
          </GridItem>
          
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Flex justify="space-between" mb={4}>
              <FormLabel pt={2}>{t('course_management.form.weekly_schedule')}</FormLabel>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="blue"
                size="sm"
                onClick={handleAddSchedule}
              >
                {t('course_management.form.add_schedule')}
              </Button>
            </Flex>
            
            {schedule.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                {t('course_management.form.schedule_required')}
              </Text>
            ) : (
              schedule.map((item, index) => (
                <Flex key={index} gap={3} mb={3} align="center">
                  <FormControl flex="1">
                    <FormLabel fontSize="sm">{t('course_management.form.day')}</FormLabel>
                    <Select
                      value={item.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel fontSize="sm">{t('course_management.form.start_time')}</FormLabel>
                    <Input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel fontSize="sm">{t('course_management.form.end_time')}</FormLabel>
                    <Input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                    />
                  </FormControl>
                  
                  <IconButton
                    aria-label="Remove schedule"
                    icon={<FaTrash />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleRemoveSchedule(index)}
                    alignSelf="flex-end"
                    mb={1}
                  />
                </Flex>
              ))
            )}
          </GridItem>
        </Grid>
        
        <Flex justify="flex-end" mt={8}>
          <Button 
            variant="outline" 
            mr={3} 
            onClick={() => navigate('/courses')}
          >
            {t('course_management.form.cancel')}
          </Button>
          <Button 
            colorScheme="blue" 
            type="submit"
          >
            {t('course_management.form.save')}
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default CourseForm; 