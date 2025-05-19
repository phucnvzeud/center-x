/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { kindergartenClassesAPI, schoolsAPI, regionsAPI, teachersAPI } from '../../api';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Grid,
  SimpleGrid,
  HStack,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  Spinner,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorModeValue,
  useBreakpointValue,
  GridItem,
  Icon
} from '@chakra-ui/react';
import { FaSearch, FaPlus, FaFilter, FaEllipsisV, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaChalkboardTeacher, FaSchool, FaUserGraduate } from 'react-icons/fa';

const ClassList = ({ limit, compact = false }) => {
  const { t } = useTranslation();
  const { schoolId } = useParams();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState(schoolId || '');
  const [showFinished, setShowFinished] = useState(false);
  
  // Data for filters
  const [teachers, setTeachers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [isFiltersVisible, setIsFiltersVisible] = useState(!compact);
  
  // Determine if we're viewing classes for a specific school
  const isSchoolSpecific = !!schoolId;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoadingFilters(true);
        
        // Load teachers, regions, and schools in parallel
        const [teachersRes, regionsRes, schoolsRes] = await Promise.all([
          teachersAPI.getAll(),
          regionsAPI.getAll(),
          schoolsAPI.getAll()
        ]);
        
        setTeachers(teachersRes.data);
        setRegions(regionsRes.data);
        setSchools(schoolsRes.data);
        setLoadingFilters(false);
      } catch (err) {
        console.error('Error loading filter data:', err);
        setLoadingFilters(false);
      }
    };
    
    loadFilterData();
  }, []);

  // Load classes based on filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If showFinished is false and no status filter is explicitly set, default to Active
        const effectiveStatusFilter = (!showFinished && !statusFilter) ? 'Active' : statusFilter;
        
        // If a school ID is provided in the URL, it takes precedence
        if (isSchoolSpecific) {
          const [schoolResponse, classesResponse] = await Promise.all([
            schoolsAPI.getById(schoolId),
            schoolsAPI.getClasses(schoolId, effectiveStatusFilter)
          ]);
          
          setSchool(schoolResponse.data);
          setClasses(classesResponse.data);
        } else {
          // Build filters for API request
          const filters = {};
          
          if (effectiveStatusFilter) filters.status = effectiveStatusFilter;
          if (teacherFilter) filters.teacher = teacherFilter;
          if (schoolFilter) filters.school = schoolFilter;
          // Region filter needs to be handled by filtering the results client-side
          
          const classesResponse = await kindergartenClassesAPI.getAll(filters);
          let filteredClasses = classesResponse.data;
          
          // Filter by region if needed
          if (regionFilter && schools.length > 0) {
            // Get schools in the selected region
            const schoolsInRegion = schools
              .filter(school => school.region === regionFilter || 
                               (school.region && school.region._id === regionFilter))
              .map(school => school._id);
              
            // Filter classes by these schools
            filteredClasses = filteredClasses.filter(cls => 
              cls.school && schoolsInRegion.includes(cls.school._id));
          }
          
          setClasses(filteredClasses);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching classes data:', err);
        setError(t('kindergarten.class_list.error'));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [schoolId, isSchoolSpecific, statusFilter, teacherFilter, regionFilter, schoolFilter, schools, showFinished, t]);

  const handleDeleteClass = async (classId) => {
    if (window.confirm(t('kindergarten.class_list.delete_confirm'))) {
      try {
        await kindergartenClassesAPI.remove(classId);
        
        // Refresh the classes list with current filters
        setClasses(classes.filter(c => c._id !== classId));
      } catch (err) {
        console.error('Error deleting class:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError(t('kindergarten.class_list.error'));
        }
      }
    }
  };

  // Handle reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTeacherFilter('');
    setRegionFilter('');
    setShowFinished(false);
    if (!isSchoolSpecific) {
      setSchoolFilter('');
    }
  };

  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(kClass => 
    kClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // Check teacher name from either teacher object or teacherName field
    (kClass.teacher && kClass.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (kClass.teacherName && kClass.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Apply limit if specified
  const displayedClasses = limit ? filteredClasses.slice(0, limit) : filteredClasses;

  // Helper function to get teacher name
  const getTeacherName = (kClass) => {
    if (kClass.teacher && kClass.teacher.name) {
      return kClass.teacher.name;
    }
    return kClass.teacherName || t('kindergarten.class_list.teacher');
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: 'green.100', color: 'green.700' };
      case 'Planning': return { bg: 'blue.100', color: 'blue.700' };
      case 'Completed': return { bg: 'gray.100', color: 'gray.700' };
      case 'Cancelled': return { bg: 'red.100', color: 'red.700' };
      default: return { bg: 'gray.100', color: 'gray.700' };
    }
  };

  // Handle click on class item to navigate to class details
  const handleClassClick = (classId) => {
    navigate(`/kindergarten/classes/${classId}`);
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">{t('kindergarten.class_list.loading')}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">{t('common.error')}</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => window.location.reload()}>
          {t('kindergarten.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {!compact && (
        <Breadcrumb mb={4} fontSize="sm" color="gray.500">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/kindergarten">{t('kindergarten.dashboard')}</BreadcrumbLink>
          </BreadcrumbItem>
          {isSchoolSpecific && school ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/kindergarten/schools">{t('kindergarten.schools')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>{school.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>{t('kindergarten.classes')}</BreadcrumbLink>
            </BreadcrumbItem>
          )}
        </Breadcrumb>
      )}
      
      {!compact && (
        <Flex 
          justify="space-between" 
          align="center" 
          mb={4} 
          flexDir={{ base: 'column', md: 'row' }}
          gap={{ base: 2, md: 0 }}
        >
          <Heading fontSize="xl" fontWeight="semibold">
            {isSchoolSpecific && school 
              ? `${school.name} ${t('kindergarten.classes')}` 
              : t('kindergarten.class_list.title')}
          </Heading>
          
          <HStack spacing={2}>
            <Button 
              as={Link} 
              to={isSchoolSpecific 
                ? `/kindergarten/schools/${schoolId}/classes/new` 
                : '/kindergarten/classes/new'
              } 
              leftIcon={<FaPlus />} 
              colorScheme="brand"
              size="sm"
        >
              {t('kindergarten.new_class')}
            </Button>
          </HStack>
        </Flex>
      )}
      
      <Box 
        mb={4} 
        bg={bgColor} 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="md" 
        p={4}
      >
        <Grid templateColumns="repeat(12, 1fr)" gap={4}>
          <GridItem colSpan={{ base: 12, md: isFiltersVisible ? 9 : 12 }}>
            <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                type="text" 
                placeholder={t('kindergarten.class_list.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
              </InputGroup>
          </GridItem>
          
          {!compact && (
            <GridItem colSpan={{ base: 12, md: 3 }} display={{ base: 'block', md: isFiltersVisible ? 'block' : 'none' }}>
              <Flex justify="space-between" align="center">
                <Button 
                  leftIcon={<FaFilter />} 
                  size="md" 
                  colorScheme="gray" 
                  variant="outline"
                  onClick={toggleFilters}
                  width={{ base: '100%', md: 'auto' }}
                >
                  {isFiltersVisible ? t('kindergarten.class_list.toggle_filters') : t('kindergarten.class_list.toggle_filters')}
                </Button>
                
                {isFiltersVisible && (
                  <Button 
                    size="md" 
                    variant="link" 
                    colorScheme="blue" 
                    onClick={resetFilters}
                    display={{ base: 'none', md: 'block' }}
                  >
                    {t('kindergarten.class_list.reset_filters')}
                  </Button>
                )}
              </Flex>
            </GridItem>
          )}
        </Grid>
        
        {isFiltersVisible && !compact && (
          <>
            <Grid 
              templateColumns="repeat(12, 1fr)" 
              gap={4} 
              mt={4}
            >
              <GridItem colSpan={{ base: 12, sm: 6, md: 3 }}>
              <Select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder={t('kindergarten.class_list.status_filter')}
                  size="md"
                >
                  <option value="">{t('kindergarten.class_list.all')}</option>
                  <option value="Active">{t('kindergarten.class_list.active')}</option>
                  <option value="Planning">{t('kindergarten.class_list.planning')}</option>
                  <option value="Completed">{t('kindergarten.class_list.completed')}</option>
                  <option value="Cancelled">{t('kindergarten.class_list.cancelled')}</option>
              </Select>
              </GridItem>
        
              <GridItem colSpan={{ base: 12, sm: 6, md: 3 }}>
              <Select 
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
                  placeholder={t('kindergarten.class_list.teacher_filter')}
                  size="md"
                isDisabled={loadingFilters}
            >
                  <option value="">{t('kindergarten.class_list.all_teachers')}</option>
              {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
              ))}
              </Select>
              </GridItem>
          
            {!isSchoolSpecific && (
              <>
                  <GridItem colSpan={{ base: 12, sm: 6, md: 3 }}>
                  <Select 
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
                      placeholder={t('kindergarten.class_list.region_filter')}
                      size="md"
                    isDisabled={loadingFilters}
            >
                      <option value="">{t('kindergarten.class_list.all_regions')}</option>
              {regions.map(region => (
                      <option key={region._id} value={region._id}>
                        {region.name}
                      </option>
              ))}
                  </Select>
                  </GridItem>
          
                  <GridItem colSpan={{ base: 12, sm: 6, md: 3 }}>
                  <Select 
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
                      placeholder={t('kindergarten.class_list.school_filter')}
                      size="md"
                    isDisabled={loadingFilters}
            >
                      <option value="">{t('kindergarten.class_list.all_schools')}</option>
                    {schools.map(school => (
                      <option key={school._id} value={school._id}>
                        {school.name}
                      </option>
                    ))}
                  </Select>
                  </GridItem>
              </>
            )}
          </Grid>
          
            <Flex mt={3} justify="space-between" align="center">
              <Button 
                size="sm" 
                colorScheme={showFinished ? "blue" : "gray"} 
                variant={showFinished ? "solid" : "outline"}
                onClick={() => setShowFinished(!showFinished)}
              >
                {t('kindergarten.class_list.show_finished')}
              </Button>
              
            <Button 
                size="sm" 
              variant="outline" 
                colorScheme="blue" 
            onClick={resetFilters}
                display={{ base: 'block', md: 'none' }}
          >
                {t('kindergarten.class_list.reset_filters')}
            </Button>
          </Flex>
          </>
        )}
        </Box>
      
      {/* Display classes */}
      {displayedClasses.length === 0 ? (
        <Box p={6} borderWidth="1px" borderColor="gray.200" borderRadius="md" textAlign="center">
          <Text color="gray.500">{t('kindergarten.class_list.no_classes')}</Text>
          {!compact && (
            <Button 
              as={Link} 
              to={isSchoolSpecific 
                ? `/kindergarten/schools/${schoolId}/classes/new` 
                : '/kindergarten/classes/new'
              } 
              mt={4} 
              leftIcon={<FaPlus />} 
              colorScheme="brand"
              size="sm"
            >
              {t('kindergarten.new_class')}
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {displayedClasses.map(kClass => (
              <Box 
                  key={kClass._id} 
                borderWidth="1px" 
              borderColor="gray.200"
                borderRadius="md"
              overflow="hidden"
              bg={bgColor}
              transition="transform 0.2s, box-shadow 0.2s"
              _hover={{ 
                transform: "translateY(-2px)", 
                shadow: "md", 
                borderColor: "brand.300",
                cursor: "pointer"
              }}
                onClick={() => handleClassClick(kClass._id)}
            >
              <Box p={4}>
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <Heading as="h3" size="sm" noOfLines={2} mb={1} flex="1">
                    {kClass.name}
                  </Heading>
                  <Badge 
                    ml={2} 
                    px={2} 
                    py={1} 
                    borderRadius="full" 
                    bg={getStatusColor(kClass.status).bg}
                    color={getStatusColor(kClass.status).color}
                  >
                      {kClass.status}
                    </Badge>
                </Flex>
                
                <VStack align="flex-start" spacing={1} mt={3}>
                  <Flex align="center" w="100%">
                    <Icon as={FaChalkboardTeacher} color="blue.500" mr={2} />
                    <Text fontSize="sm" isTruncated>
                      {getTeacherName(kClass)}
                    </Text>
                  </Flex>
                  
                  {kClass.school && (
                    <Flex align="center" w="100%">
                      <Icon as={FaSchool} color="green.500" mr={2} />
                      <Text fontSize="sm" isTruncated>
                        {kClass.school.name}
                      </Text>
                    </Flex>
                  )}
                  
                  {kClass.studentCount !== undefined && (
                    <Flex align="center" w="100%">
                      <Icon as={FaUserGraduate} color="purple.500" mr={2} />
                      <Text fontSize="sm">
                        {kClass.studentCount} {t('kindergarten.students')}
                      </Text>
                    </Flex>
                  )}
                </VStack>
                  </Box>
              
              {!compact && (
                <Flex 
                  bg="gray.50" 
                  p={2} 
                  borderTopWidth="1px" 
                  borderColor="gray.200"
                  justify="space-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HStack spacing={1}>
                    <IconButton
                      icon={<FaEye />}
                      aria-label={t('kindergarten.class_list.view_class')}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/kindergarten/classes/${kClass._id}`);
                      }}
                    />
                    <IconButton
                      icon={<FaEdit />}
                      aria-label={t('kindergarten.class_list.edit_class')}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/kindergarten/classes/edit/${kClass._id}`);
                      }}
                    />
                    <IconButton
                      icon={<FaTrash />}
                      aria-label={t('kindergarten.class_list.delete_class')}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(kClass._id);
                      }}
                    />
                  </HStack>
                  
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FaEllipsisV />}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <MenuList fontSize="sm" onClick={(e) => e.stopPropagation()}>
                      <MenuItem 
                        icon={<FaEye />}
                        onClick={() => navigate(`/kindergarten/classes/${kClass._id}`)}
                      >
                        {t('kindergarten.class_list.view_class')}
                      </MenuItem>
                      <MenuItem 
                        icon={<FaEdit />}
                        onClick={() => navigate(`/kindergarten/classes/edit/${kClass._id}`)}
                      >
                        {t('kindergarten.class_list.edit_class')}
                      </MenuItem>
                      <MenuItem 
                        icon={<FaTrash />} 
                        onClick={() => handleDeleteClass(kClass._id)}
                        color="red.500"
                      >
                        {t('kindergarten.class_list.delete_class')}
                      </MenuItem>
                    </MenuList>
                  </Menu>
                    </Flex>
                  )}
              </Box>
          ))}
        </SimpleGrid>
        )}
    </Box>
  );
};

export default ClassList; 