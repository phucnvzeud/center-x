/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { coursesAPI, branchesAPI, teachersAPI } from '../../api';
import { useTranslation } from 'react-i18next';
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
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaEye, FaUserGraduate, FaClock } from 'react-icons/fa';
import i18n from '../../i18n';

const Courses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [levelFilter, setLevelFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [showFinished, setShowFinished] = useState(false);
  
  // Reference data
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const footerBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchCourses();
    fetchReferenceData();
  }, [showFinished]); // Re-fetch when showFinished changes
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, statusFilter, levelFilter, branchFilter, teacherFilter, showFinished]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      
      // For active courses, fetch sessions data
      const coursesData = response.data;
      const activeCourses = coursesData.filter(course => course.status === 'Active');
      
      // Create an array of promises for fetching sessions for active courses
      const sessionPromises = activeCourses.map(course => 
        coursesAPI.getSessions(course._id)
          .then(sessionsResponse => ({
            courseId: course._id,
            sessions: sessionsResponse.data
          }))
          .catch(err => {
            console.error(`Error fetching sessions for course ${course._id}:`, err);
            return { courseId: course._id, sessions: [] };
          })
      );
      
      // Wait for all session requests to complete
      const sessionResults = await Promise.all(sessionPromises);
      
      // Create a map of course ID to sessions
      const sessionsMap = {};
      sessionResults.forEach(result => {
        sessionsMap[result.courseId] = result.sessions;
      });
      
      // Add remaining sessions to each course
      const coursesWithRemainingSessions = coursesData.map(course => {
        let remainingSessions = 0;
        
        if (course.status === 'Active') {
          const sessions = sessionsMap[course._id] || [];
          remainingSessions = sessions.filter(session => 
            !session.status || 
            (session.status !== 'Taught' && 
             session.status !== 'Canceled' && 
             !session.status.startsWith('Absent'))
          ).length;
        }
        
        return {
          ...course,
          remainingSessions: remainingSessions
        };
      });
      
      // Sort courses by remaining sessions (fewest first)
      coursesWithRemainingSessions.sort((a, b) => {
        // Active courses first
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        
        // For active courses, sort by remaining sessions
        if (a.status === 'Active' && b.status === 'Active') {
          return a.remainingSessions - b.remainingSessions;
        }
        
        // Default sorting
        return 0;
      });
      
      setCourses(coursesWithRemainingSessions);
      
      // Apply initial filtering based on showFinished state
      let initialFiltered = coursesWithRemainingSessions;
      if (!showFinished && statusFilter === 'Active') {
        initialFiltered = coursesWithRemainingSessions.filter(course => course.status === 'Active');
      }
      
      setFilteredCourses(initialFiltered);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(t('course_management.load_error'));
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
    } else if (!showFinished) {
      // If no status filter is set but showFinished is false, exclude Finished courses
      result = result.filter(course => course.status !== 'Finished');
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
    
    // Sort by remaining sessions (courses with the fewest remaining sessions first)
    result.sort((a, b) => {
      // Active courses first
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (a.status !== 'Active' && b.status === 'Active') return 1;
      
      // For active courses, sort by remaining sessions
      if (a.status === 'Active' && b.status === 'Active') {
        return a.remainingSessions - b.remainingSessions;
      }
      
      // Default sorting
      return 0;
    });
    
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
    if (!dateString) return t('common.not_provided');
    // Use the current language for date formatting
    const currentLanguage = i18n.language || 'en';
    const languageMap = {
      'en': 'en-US',
      'vi': 'vi-VN'
    };
    const locale = languageMap[currentLanguage] || 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (window.confirm(t('course_management.delete_confirmation'))) {
      try {
        await coursesAPI.remove(courseId);
        // Refresh the course list
        fetchCourses();
      } catch (err) {
        console.error('Error deleting course:', err);
        setError(t('course_management.delete_error'));
      }
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('Active');
    setLevelFilter('');
    setBranchFilter('');
    setTeacherFilter('');
    setShowFinished(false);
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
        <Text mt={2} color="gray.500">{t('course_management.loading')}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">{t('common.error')}</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => window.location.reload()}>
          {t('common.reset')}
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">{t('course_management.courses')}</Heading>
        <HStack spacing={2}>
          <Button 
            size="sm"
            variant={showFinished ? "solid" : "outline"} 
            colorScheme={showFinished ? "blue" : "gray"}
            onClick={() => {
              // When toggling, reset any explicit status filter if it was set to Finished
              if (statusFilter === 'Finished') {
                setStatusFilter('Active');
              }
              setShowFinished(!showFinished);
            }}
          >
            {showFinished ? t('course_management.filter.show_active') : t('course_management.filter.show_finished')}
          </Button>
          <Button 
            leftIcon={<FaFilter />}
            size="sm"
            onClick={toggleFilters}
            colorScheme="gray"
            variant="outline"
          >
            {isFiltersVisible ? t('course_management.filter.hide_filters') : t('course_management.filter.show_filters')}
          </Button>
          <Button 
            as={Link} 
            to="/courses/new" 
            leftIcon={<FaPlus />} 
            colorScheme="brand"
            size="sm"
          >
            {t('course_management.new_course')}
          </Button>
        </HStack>
      </Flex>
      
      {isFiltersVisible && (
        <Box bg={bgColor} p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor={borderColor}>
          <Stack spacing={4} direction={{ base: 'column', md: 'row' }}>
            <Box flex="1">
              <Input
                placeholder={t('course_management.filter.search_by_name')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftElement={<FaSearch color="gray.300" />}
              />
            </Box>
            
            <Box>
              <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder={t('course_management.filter.all_statuses')}
              >
                <option value="Active">{t('course_management.status.active')}</option>
                <option value="Upcoming">{t('course_management.status.upcoming')}</option>
                <option value="Finished">{t('course_management.status.finished')}</option>
                <option value="Cancelled">{t('course_management.status.cancelled')}</option>
              </Select>
            </Box>
            
            <Box>
              <Select 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
                placeholder={t('course_management.filter.all_levels')}
              >
                <option value="Beginner">{t('course_management.level.beginner')}</option>
                <option value="Elementary">{t('course_management.level.elementary')}</option>
                <option value="Intermediate">{t('course_management.level.intermediate')}</option>
                <option value="Upper Intermediate">{t('course_management.level.upper_intermediate')}</option>
                <option value="Advanced">{t('course_management.level.advanced')}</option>
                <option value="Proficient">{t('course_management.level.proficient')}</option>
              </Select>
            </Box>
            
            <Box>
              <Select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                placeholder={t('course_management.filter.all_branches')}
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
                placeholder={t('course_management.filter.all_teachers')}
              >
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </Select>
            </Box>
            
            <Button onClick={clearFilters} variant="outline" size="md">
              {t('course_management.filter.clear')}
            </Button>
          </Stack>
        </Box>
      )}
      
      {filteredCourses.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500">{t('course_management.no_courses')}</Text>
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
                borderRadius="lg"
                overflow="hidden"
                boxShadow="base"
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => handleCourseClick(course._id)}
                _hover={{ shadow: "md", borderColor: "brand.300", transform: "translateY(-2px)" }}
                display="flex"
                flexDirection="column"
                maxW="350px"
              >
                <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Heading size="md" mb={2} noOfLines={1}>{course.name}</Heading>
                  <Flex gap={2} flexWrap="wrap">
                    <Badge px={2} py={1} bg={statusColorScheme.bg} color={statusColorScheme.color} borderRadius="full">
                      {t(`course_management.status.${course.status.toLowerCase()}`)}
                    </Badge>
                    
                    {course.level && (
                      <Badge px={2} py={1} bg="purple.100" color="purple.700" borderRadius="full">
                        {t(`course_management.level.${course.level.toLowerCase().replace(/\s+/g, '_')}`)}
                      </Badge>
                    )}
                    
                    {course.status === 'Active' && (
                      <Badge px={2} py={1} bg="orange.100" color="orange.700" borderRadius="full" display="flex" alignItems="center">
                        <Box as={FaClock} mr={1} size="12px" />
                        {course.remainingSessions} {t('course_management.course_info.sessions_left')}
                      </Badge>
                    )}
                  </Flex>
                </Box>
                
                <Box p={4} flex="1">
                  <Stack spacing={3} mb={3} fontSize="sm">
                    {course.teacher && (
                      <Flex align="center">
                        <Text fontWeight="medium" width="80px">{t('course_management.course_info.teacher')}:</Text>
                        <Text noOfLines={1}>{course.teacher.name}</Text>
                      </Flex>
                    )}
                    
                    {course.branch && (
                      <Flex align="center">
                        <Text fontWeight="medium" width="80px">{t('course_management.course_info.branch')}:</Text>
                        <Text noOfLines={1}>{course.branch.name}</Text>
                      </Flex>
                    )}
                    
                    <Flex align="center">
                      <Text fontWeight="medium" width="80px">{t('course_management.course_info.start')}:</Text>
                      <Text>{formatDate(course.startDate)}</Text>
                    </Flex>
                
                    <Flex align="center">
                      <Text fontWeight="medium" width="80px">{t('course_management.course_info.end')}:</Text>
                      <Text>{formatDate(course.endDate)}</Text>
                    </Flex>
                  </Stack>
                </Box>
                
                <Box p={3} bg={footerBgColor} borderTopWidth="1px" borderColor={borderColor}>
                  <Flex justify="flex-end" gap={1}>
                    <IconButton
                      icon={<FaEye />}
                      aria-label={t('course_management.actions.view_course')}
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
                      aria-label={t('course_management.actions.edit_course')}
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
                      aria-label={t('course_management.actions.course_sessions')}
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
                      aria-label={t('course_management.actions.students')}
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
                      aria-label={t('course_management.actions.delete_course')}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => handleDeleteCourse(course._id, e)}
                    />
                  </Flex>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Courses; 