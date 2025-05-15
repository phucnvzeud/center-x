import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { coursesAPI, branchesAPI, teachersAPI } from '../../api';
import { 
  Box, 
  Heading, 
  Text, 
  SimpleGrid, 
  Flex, 
  Input, 
  Select, 
  Button, 
  Badge, 
  IconButton, 
  Stack, 
  Spinner, 
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaEye, FaUserGraduate } from 'react-icons/fa';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  
  // Reference data
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchCourses();
    fetchReferenceData();
  }, []);
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, statusFilter, levelFilter, branchFilter, teacherFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data);
      setFilteredCourses(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchReferenceData = async () => {
    try {
      // Fetch branches
      const branchesResponse = await branchesAPI.getAll();
      setBranches(branchesResponse.data);
      
      // Fetch teachers
      const teachersResponse = await teachersAPI.getAll();
      setTeachers(teachersResponse.data);
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  };
  
  const applyFilters = () => {
    let result = [...courses];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(course => 
        course.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(course => course.status === statusFilter);
    }
    
    // Apply level filter
    if (levelFilter) {
      result = result.filter(course => course.level === levelFilter);
    }
    
    // Apply branch filter
    if (branchFilter) {
      result = result.filter(course => course.branch?._id === branchFilter);
    }
    
    // Apply teacher filter
    if (teacherFilter) {
      result = result.filter(course => course.teacher?._id === teacherFilter);
    }
    
    setFilteredCourses(result);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: 'green.100', color: 'green.700' };
      case 'Upcoming': return { bg: 'blue.100', color: 'blue.700' };
      case 'Finished': return { bg: 'gray.100', color: 'gray.700' };
      case 'Cancelled': return { bg: 'red.100', color: 'red.700' };
      default: return { bg: 'gray.100', color: 'gray.700' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await coursesAPI.remove(courseId);
        // Refresh the course list
        fetchCourses();
      } catch (err) {
        console.error('Error deleting course:', err);
        setError('Failed to delete course. Please try again later.');
      }
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLevelFilter('');
    setBranchFilter('');
    setTeacherFilter('');
  };
  
  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  // Handle click on course card to navigate to course details
  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading courses...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">Error</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">Courses</Heading>
        <HStack spacing={2}>
          <Button 
            leftIcon={<FaFilter />}
            size="sm"
            onClick={toggleFilters}
            colorScheme="gray"
            variant="outline"
          >
            {isFiltersVisible ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            as={Link} 
            to="/courses/new" 
            leftIcon={<FaPlus />} 
            colorScheme="brand"
            size="sm"
          >
            New Course
          </Button>
        </HStack>
      </Flex>
      
      {isFiltersVisible && (
        <Box bg={bgColor} p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor={borderColor}>
          <Stack spacing={4} direction={{ base: 'column', md: 'row' }}>
            <Box flex="1">
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftElement={<FaSearch color="gray.300" />}
              />
            </Box>
            
            <Box>
              <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="All Statuses"
              >
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Finished">Finished</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </Box>
            
            <Box>
              <Select 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
                placeholder="All Levels"
              >
                <option value="Beginner">Beginner</option>
                <option value="Elementary">Elementary</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Upper Intermediate">Upper Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Proficient">Proficient</option>
              </Select>
            </Box>
            
            <Box>
              <Select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                placeholder="All Branches"
              >
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.name}</option>
                ))}
              </Select>
            </Box>
            
            <Box>
              <Select 
                value={teacherFilter} 
                onChange={(e) => setTeacherFilter(e.target.value)}
                placeholder="All Teachers"
              >
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </Select>
            </Box>
            
            <Button onClick={clearFilters} variant="outline" size="md">
              Clear
            </Button>
          </Stack>
        </Box>
      )}
      
      {filteredCourses.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500">No courses found. Adjust your filters or add a new course to get started.</Text>
        </Box>
          ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredCourses.map(course => {
            const statusColorScheme = getStatusColor(course.status);
            
            return (
              <Box 
              key={course._id} 
                bg={bgColor}
                borderWidth="1px" 
                borderColor={borderColor}
                borderRadius="md"
                p={4}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => handleCourseClick(course._id)}
                _hover={{ shadow: "md", borderColor: "brand.200", transform: "translateY(-2px)" }}
              >
                <Box mb={4}>
                  <Heading size="sm" mb={1}>{course.name}</Heading>
                  <Badge px={2} py={1} mb={2} bg={statusColorScheme.bg} color={statusColorScheme.color}>
                  {course.status}
                  </Badge>
                  
                  {course.level && (
                    <Badge ml={course.status ? 2 : 0} px={2} py={1} bg="purple.100" color="purple.700">
                      {course.level}
                    </Badge>
                  )}
                </Box>
                
                <Stack spacing={2} mb={4} fontSize="sm">
                  {course.teacher && (
                    <Flex align="center">
                      <Text fontWeight="medium" width="80px">Teacher:</Text>
                      <Text>{course.teacher.name}</Text>
                    </Flex>
                  )}
                  
                  {course.branch && (
                    <Flex align="center">
                      <Text fontWeight="medium" width="80px">Branch:</Text>
                      <Text>{course.branch.name}</Text>
                    </Flex>
                  )}
                  
                  <Flex align="center">
                    <Text fontWeight="medium" width="80px">Start:</Text>
                    <Text>{formatDate(course.startDate)}</Text>
                  </Flex>
                
                  <Flex align="center">
                    <Text fontWeight="medium" width="80px">End:</Text>
                    <Text>{formatDate(course.endDate)}</Text>
                  </Flex>
                </Stack>
                
                <Flex justify="flex-end" mt={4} gap={2}>
                  <IconButton
                    icon={<FaEye />}
                    aria-label="View course details"
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course._id}`);
                    }}
                  />
                  <IconButton
                    icon={<FaEdit />}
                    aria-label="Edit course"
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/edit/${course._id}`);
                    }}
                  />
                  <IconButton
                    icon={<FaCalendarAlt />}
                    aria-label="Course sessions"
                    size="sm"
                    variant="ghost"
                    colorScheme="green"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course._id}/sessions`);
                    }}
                  />
                  <IconButton
                    icon={<FaUserGraduate />}
                    aria-label="Students"
                    size="sm"
                    variant="ghost"
                    colorScheme="brand"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course._id}?tab=enrollments`);
                    }}
                  />
                  <IconButton
                    icon={<FaTrash />}
                    aria-label="Delete course"
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => handleDeleteCourse(course._id, e)}
                  />
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Courses; 