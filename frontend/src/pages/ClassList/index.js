import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { kindergartenClassesAPI, schoolsAPI, regionsAPI, teachersAPI } from '../../api';
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
  GridItem
} from '@chakra-ui/react';
import { FaSearch, FaPlus, FaFilter, FaEllipsisV, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaChalkboardTeacher, FaSchool } from 'react-icons/fa';

const ClassList = ({ limit, compact = false }) => {
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
        setError('Failed to load classes data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [schoolId, isSchoolSpecific, statusFilter, teacherFilter, regionFilter, schoolFilter, schools, showFinished]);

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await kindergartenClassesAPI.remove(classId);
        
        // Refresh the classes list with current filters
        setClasses(classes.filter(c => c._id !== classId));
      } catch (err) {
        console.error('Error deleting class:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to delete class. Please try again later.');
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
    return kClass.teacherName || 'Not assigned';
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
        <Text mt={2} color="gray.500">Loading classes...</Text>
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
      {!compact && (
        <Breadcrumb mb={4} fontSize="sm" color="gray.500">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/kindergarten">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {isSchoolSpecific && school ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/kindergarten/schools">Schools</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>{school.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Classes</BreadcrumbLink>
            </BreadcrumbItem>
          )}
        </Breadcrumb>
      )}
      
      {!compact && (
        <Flex justify="space-between" align="center" mb={6}>
          <Heading fontSize="xl" fontWeight="semibold">
          {isSchoolSpecific && school ? `Classes in ${school.name}` : 'All Kindergarten Classes'}
          </Heading>
          <HStack spacing={2}>
            <Button 
              size="sm"
              variant={showFinished ? "solid" : "outline"} 
              colorScheme={showFinished ? "blue" : "gray"}
              onClick={() => {
                // When toggling, reset any explicit status filter
                if (statusFilter === 'Completed') {
                  setStatusFilter('');
                }
                setShowFinished(!showFinished);
              }}
            >
              {showFinished ? "Show Active" : "Show Finished"}
            </Button>
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
              to="/kindergarten/classes/new" 
              leftIcon={<FaPlus />} 
              colorScheme="brand"
              size="sm"
          state={{ schoolId: schoolId }}
        >
              New Class
            </Button>
          </HStack>
        </Flex>
      )}
      
      {isFiltersVisible && (
        <Box bg={bgColor} p={4} borderRadius="md" mb={6} borderWidth="1px" borderColor={borderColor}>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }} gap={4}>
            <Box>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
              placeholder="Search classes or teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
              </InputGroup>
            </Box>
          
            <Box>
              <Select 
                placeholder="All Statuses" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </Box>
        
            <Box>
              <Select 
                placeholder="All Teachers" 
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
                isDisabled={loadingFilters}
            >
              {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
              ))}
              </Select>
            </Box>
          
            {!isSchoolSpecific && (
              <>
                <Box>
                  <Select 
                    placeholder="All Regions" 
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
                    isDisabled={loadingFilters}
            >
              {regions.map(region => (
                      <option key={region._id} value={region._id}>
                        {region.name}
                      </option>
              ))}
                  </Select>
                </Box>
          
                <Box>
                  <Select 
                    placeholder="All Schools" 
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
                    isDisabled={loadingFilters}
            >
                    {schools.map(school => (
                      <option key={school._id} value={school._id}>
                        {school.name}
                      </option>
                    ))}
                  </Select>
                </Box>
              </>
            )}
          </Grid>
          
          <Flex justify="flex-end" mt={4}>
            <Button 
              variant="outline" 
              size="sm" 
            onClick={resetFilters}
          >
              Clear Filters
            </Button>
          </Flex>
        </Box>
      )}
      
      {displayedClasses.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500" mb={4}>
            {searchTerm || statusFilter || teacherFilter || regionFilter || (!isSchoolSpecific && schoolFilter) ? 
              'No classes match your filters. Try adjusting your search criteria.' :
              'No classes found. Add your first class to get started.'
          }
          </Text>
          {!(searchTerm || statusFilter || teacherFilter || regionFilter || (!isSchoolSpecific && schoolFilter)) && (
            <Button 
              as={Link} 
              to="/kindergarten/classes/new" 
              leftIcon={<FaPlus />} 
              colorScheme="brand"
              size="sm"
              state={{ schoolId: schoolId }}
            >
              Add Class
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {displayedClasses.map(kClass => {
            const statusColorScheme = getStatusColor(kClass.status);
            
            return (
              <Box 
                  key={kClass._id} 
                bg={bgColor}
                borderWidth="1px" 
                borderColor={borderColor}
                borderRadius="md"
                p={4}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => handleClassClick(kClass._id)}
                _hover={{ shadow: "md", borderColor: "brand.200", transform: "translateY(-2px)" }}
                >
                <Flex mb={2} justify="space-between" align="flex-start">
                  <Box>
                    <Flex align="center" gap={2}>
                      <Heading size="sm" margin="0">{kClass.name}</Heading>
                      <Badge px={2} py={1} bg={statusColorScheme.bg} color={statusColorScheme.color} alignSelf="center" marginTop="1px">
                        {kClass.status}
                      </Badge>
                    </Flex>
                  </Box>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<FaEllipsisV />}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <MenuList onClick={(e) => e.stopPropagation()}>
                      <MenuItem 
                        as={Link} 
                        to={`/kindergarten/classes/${kClass._id}`}
                        icon={<FaEye />}
                      >
                        View Details
                      </MenuItem>
                      <MenuItem 
                        as={Link} 
                        to={`/kindergarten/classes/edit/${kClass._id}`}
                        icon={<FaEdit />}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem 
                        as={Link} 
                        to={`/kindergarten/classes/${kClass._id}/schedule`}
                        icon={<FaCalendarAlt />}
                      >
                        Schedule
                      </MenuItem>
                      <MenuItem 
                        icon={<FaTrash />} 
                        color="red.500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(kClass._id);
                            }} 
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
                
                <VStack align="stretch" spacing={3} fontSize="sm">
                  <Box>
                    <Flex>
                      <Box width="24px" textAlign="center" mr={1}>
                        <FaChalkboardTeacher style={{
                          display: 'inline-block',
                          verticalAlign: 'middle',
                          position: 'relative',
                          top: '-1px',
                          color: '#3182CE'
                        }} />
                      </Box>
                      <Box as="span" fontWeight="medium" width="70px">Teacher:</Box>
                      <Box as="span" flexGrow={1}>{getTeacherName(kClass)}</Box>
                    </Flex>
                  </Box>
                  
                  {kClass.school && (
                    <Box>
                      <Flex>
                        <Box width="24px" textAlign="center" mr={1}>
                          <FaSchool style={{
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            position: 'relative',
                            top: '-1px',
                            color: '#38A169'
                          }} />
                        </Box>
                        <Box as="span" fontWeight="medium" width="70px">School:</Box>
                        <Box as="span" flexGrow={1}>{kClass.school.name}</Box>
                      </Flex>
                    </Box>
                  )}
                  
                  {kClass.daySchedule && (
                    <Box>
                      <Flex>
                        <Box width="24px" textAlign="center" mr={1}>
                          <FaCalendarAlt style={{
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            position: 'relative',
                            top: '-1px',
                            color: '#3182CE'
                          }} />
                        </Box>
                        <Box as="span" fontWeight="medium" width="70px">Schedule:</Box>
                        <Box as="span" flexGrow={1}>{kClass.daySchedule}</Box>
                      </Flex>
                    </Box>
                  )}
                </VStack>
              </Box>
                            );
                          })}
        </SimpleGrid>
      )}
      
      {limit && filteredClasses.length > limit && (
        <Flex justify="center" mt={4}>
          <Button 
            as={Link}
            to="/kindergarten/classes"
            size="sm"
            colorScheme="brand"
            variant="link"
          >
            View All Classes ({filteredClasses.length})
          </Button>
        </Flex>
        )}
    </Box>
  );
};

export default ClassList; 