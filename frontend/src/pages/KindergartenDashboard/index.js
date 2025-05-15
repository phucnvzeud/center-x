import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kindergartenClassesAPI, regionsAPI, schoolsAPI } from '../../api';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardFooter,
  Stack,
  Divider,
  Icon,
  HStack,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { FaGlobeAsia, FaSchool, FaChalkboardTeacher, FaUserGraduate, FaPlus, FaArrowRight, FaEdit } from 'react-icons/fa';

const KindergartenDashboard = () => {
  const [stats, setStats] = useState({
    classes: { total: 0, active: 0, inactive: 0 },
    students: { total: 0 },
    schools: { total: 0 },
    regions: { total: 0 }
  });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statCardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch overview statistics
        const statsResponse = await kindergartenClassesAPI.getStats();
        setStats(statsResponse.data);
        
        // Fetch regions for the dashboard
        const regionsResponse = await regionsAPI.getAll();
        setRegions(regionsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching kindergarten dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading kindergarten system data...</Text>
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
        <Heading fontSize="xl" fontWeight="semibold">Kindergarten English Class Management</Heading>
        <HStack spacing={2}>
          <Button as={Link} to="/kindergarten/regions/new" leftIcon={<FaPlus />} size="sm" colorScheme="blue">
            New Region
          </Button>
          <Button as={Link} to="/kindergarten/schools/new" leftIcon={<FaPlus />} size="sm" colorScheme="green">
            New School
          </Button>
          <Button as={Link} to="/kindergarten/classes/new" leftIcon={<FaPlus />} size="sm" colorScheme="brand">
            New Class
          </Button>
        </HStack>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Stat bg={statCardBg} p={4} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={2}>
            <Icon as={FaGlobeAsia} color="blue.500" boxSize={6} mr={2} />
            <StatLabel>Regions</StatLabel>
          </Flex>
          <StatNumber>{stats.regions.total}</StatNumber>
          <StatHelpText mb={0}>
            <Button as={Link} to="/kindergarten/regions" size="xs" rightIcon={<FaArrowRight />} colorScheme="blue" variant="link">
              View All
            </Button>
          </StatHelpText>
        </Stat>
        
        <Stat bg={statCardBg} p={4} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={2}>
            <Icon as={FaSchool} color="green.500" boxSize={6} mr={2} />
            <StatLabel>Schools</StatLabel>
          </Flex>
          <StatNumber>{stats.schools.total}</StatNumber>
          <StatHelpText mb={0}>
            <Button as={Link} to="/kindergarten/schools" size="xs" rightIcon={<FaArrowRight />} colorScheme="green" variant="link">
              View All
            </Button>
          </StatHelpText>
        </Stat>
        
        <Stat bg={statCardBg} p={4} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={2}>
            <Icon as={FaChalkboardTeacher} color="brand.500" boxSize={6} mr={2} />
            <StatLabel>Classes</StatLabel>
          </Flex>
          <StatNumber>{stats.classes.total}</StatNumber>
          <StatHelpText>
            <HStack spacing={4} fontSize="xs">
              <Text color="green.500">{stats.classes.active} Active</Text>
              <Text color="gray.500">{stats.classes.inactive} Inactive</Text>
            </HStack>
          </StatHelpText>
        </Stat>
        
        <Stat bg={statCardBg} p={4} borderRadius="md" shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={2}>
            <Icon as={FaUserGraduate} color="purple.500" boxSize={6} mr={2} />
            <StatLabel>Students</StatLabel>
          </Flex>
          <StatNumber>{stats.students.total}</StatNumber>
          <StatHelpText mb={0}>&nbsp;</StatHelpText>
        </Stat>
      </SimpleGrid>
      
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading fontSize="md" fontWeight="semibold">Regions</Heading>
          <Button as={Link} to="/kindergarten/regions" size="sm" variant="outline" rightIcon={<FaArrowRight />}>
            View All
          </Button>
        </Flex>
        
          {regions.length === 0 ? (
          <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
            <Text color="gray.500" mb={4}>No regions found. Add your first region to get started.</Text>
            <Button as={Link} to="/kindergarten/regions/new" leftIcon={<FaPlus />} colorScheme="blue" size="sm">
              Add New Region
            </Button>
          </Box>
          ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {regions.map(region => (
              <Box 
                key={region._id} 
                p={4} 
                bg={bgColor} 
                borderWidth="1px" 
                borderColor={borderColor} 
                borderRadius="md"
                transition="all 0.2s"
                _hover={{ shadow: "md", borderColor: "blue.200", transform: "translateY(-2px)" }}
              >
                <Heading size="sm" mb={3}>{region.name}</Heading>
                <Flex justify="flex-end" mt={2} gap={2}>
                  <Button 
                    as={Link} 
                    to={`/kindergarten/regions/${region._id}/schools`} 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                  >
                    View Schools
                  </Button>
                  <Button 
                    as={Link} 
                    to={`/kindergarten/regions/edit/${region._id}`}
                    size="sm"
                    leftIcon={<FaEdit />}
                    variant="ghost"
                  >
                    Edit
                  </Button>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
      
      <Box 
        p={5} 
        bg={bgColor} 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="md" 
        mb={6}
      >
        <Heading size="sm" mb={4}>Navigation</Heading>
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          align="center" 
          justify="space-between"
          textAlign="center"
        >
          <Link to="/kindergarten/regions">
            <Box 
              align="center" 
              p={4} 
              maxW="150px" 
              bg="transparent" 
              transition="all 0.2s"
              _hover={{ bg: hoverBg }}
              cursor="pointer"
            >
              <Icon as={FaGlobeAsia} boxSize={10} color="blue.500" mb={2} />
              <Text fontWeight="medium">Regions</Text>
            </Box>
          </Link>
          
          <Icon as={FaArrowRight} boxSize={5} color="gray.300" display={{ base: 'none', md: 'block' }} />
          <Box display={{ base: 'block', md: 'none' }} w="full" h="1px" bg="gray.100" my={2} />
          
          <Link to="/kindergarten/schools">
            <Box 
              align="center" 
              p={4} 
              maxW="150px" 
              bg="transparent" 
              transition="all 0.2s"
              _hover={{ bg: hoverBg }}
              cursor="pointer"
            >
              <Icon as={FaSchool} boxSize={10} color="green.500" mb={2} />
              <Text fontWeight="medium">Schools</Text>
            </Box>
          </Link>
          
          <Icon as={FaArrowRight} boxSize={5} color="gray.300" display={{ base: 'none', md: 'block' }} />
          <Box display={{ base: 'block', md: 'none' }} w="full" h="1px" bg="gray.100" my={2} />
          
          <Link to="/kindergarten/classes">
            <Box 
              align="center" 
              p={4} 
              maxW="150px" 
              bg="transparent" 
              transition="all 0.2s"
              _hover={{ bg: hoverBg }}
              cursor="pointer"
            >
              <Icon as={FaChalkboardTeacher} boxSize={10} color="brand.500" mb={2} />
              <Text fontWeight="medium">Classes</Text>
            </Box>
          </Link>
        </Flex>
      </Box>
    </Box>
  );
};

export default KindergartenDashboard; 