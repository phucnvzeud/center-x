import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kindergartenClassesAPI, regionsAPI, schoolsAPI } from '../../api';
import ClassList from '../ClassList';
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
  Divider,
  Icon,
  HStack,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { FaGlobeAsia, FaSchool, FaChalkboardTeacher, FaUserGraduate, FaPlus } from 'react-icons/fa';

const KindergartenDashboard = () => {
  const [stats, setStats] = useState({
    classes: { total: 0, active: 0, inactive: 0 },
    students: { total: 0 },
    schools: { total: 0 },
    regions: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statCardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch overview statistics
        const statsResponse = await kindergartenClassesAPI.getStats();
        setStats(statsResponse.data);
        
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
      {/* Header with Quick Actions */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading fontSize="xl" fontWeight="semibold">Kindergarten Management</Heading>
        <HStack spacing={2}>
          <Button as={Link} to="/kindergarten/regions/new" leftIcon={<FaPlus />} size="sm" colorScheme="blue" variant="outline">
            New Region
          </Button>
          <Button as={Link} to="/kindergarten/schools/new" leftIcon={<FaPlus />} size="sm" colorScheme="green" variant="outline">
            New School
          </Button>
          <Button as={Link} to="/kindergarten/classes/new" leftIcon={<FaPlus />} size="sm" colorScheme="brand">
            New Class
          </Button>
        </HStack>
      </Flex>
      
      {/* Clickable Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
        <Box 
          as={Link} 
          to="/kindergarten/regions"
          borderRadius="md" 
          overflow="hidden"
          _hover={{ 
            transform: "translateY(-2px)", 
            shadow: "md", 
            borderColor: "blue.300" 
          }}
          transition="all 0.2s"
          role="group"
        >
          <Stat 
            bg={statCardBg} 
            p={3} 
            borderRadius="md" 
            shadow="xs" 
            borderWidth="1px" 
            borderColor={borderColor} 
            size="sm"
            _groupHover={{ borderColor: "blue.300" }}
          >
            <Flex align="center">
              <Icon as={FaGlobeAsia} color="blue.500" boxSize={5} mr={2} />
              <Box>
                <StatLabel fontSize="xs">Regions</StatLabel>
                <Flex align="center">
                  <StatNumber fontSize="lg">{stats.regions.total}</StatNumber>
                  <Text 
                    ml={2}
                    fontSize="xs"
                    color="blue.500"
                    fontWeight="medium"
                  >
                    View
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Stat>
        </Box>
        
        <Box 
          as={Link} 
          to="/kindergarten/schools"
          borderRadius="md" 
          overflow="hidden"
          _hover={{ 
            transform: "translateY(-2px)", 
            shadow: "md", 
            borderColor: "green.300" 
          }}
          transition="all 0.2s"
          role="group"
        >
          <Stat 
            bg={statCardBg} 
            p={3} 
            borderRadius="md" 
            shadow="xs" 
            borderWidth="1px" 
            borderColor={borderColor} 
            size="sm"
            _groupHover={{ borderColor: "green.300" }}
          >
            <Flex align="center">
              <Icon as={FaSchool} color="green.500" boxSize={5} mr={2} />
              <Box>
                <StatLabel fontSize="xs">Schools</StatLabel>
                <Flex align="center">
                  <StatNumber fontSize="lg">{stats.schools.total}</StatNumber>
                  <Text 
                    ml={2}
                    fontSize="xs"
                    color="green.500"
                    fontWeight="medium"
                  >
                    View
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Stat>
        </Box>
        
        <Box 
          as={Link} 
          to="/kindergarten/classes"
          borderRadius="md" 
          overflow="hidden"
          _hover={{ 
            transform: "translateY(-2px)", 
            shadow: "md", 
            borderColor: "brand.300" 
          }}
          transition="all 0.2s"
          role="group"
        >
          <Stat 
            bg={statCardBg} 
            p={3} 
            borderRadius="md" 
            shadow="xs" 
            borderWidth="1px" 
            borderColor={borderColor} 
            size="sm"
            _groupHover={{ borderColor: "brand.300" }}
          >
            <Flex align="center">
              <Icon as={FaChalkboardTeacher} color="brand.500" boxSize={5} mr={2} />
              <Box>
                <StatLabel fontSize="xs">Classes</StatLabel>
                <Flex align="center">
                  <StatNumber fontSize="lg">{stats.classes.total}</StatNumber>
                  <HStack ml={2} spacing={1} fontSize="2xs">
                    <Text color="green.500" fontWeight="medium">{stats.classes.active} A</Text>
                    <Text color="gray.500">{stats.classes.inactive} I</Text>
                  </HStack>
                </Flex>
              </Box>
            </Flex>
          </Stat>
        </Box>
      
        <Stat bg={statCardBg} p={3} borderRadius="md" shadow="xs" borderWidth="1px" borderColor={borderColor} size="sm">
          <Flex align="center">
            <Icon as={FaUserGraduate} color="purple.500" boxSize={5} mr={2} />
            <Box>
              <StatLabel fontSize="xs">Students</StatLabel>
              <StatNumber fontSize="lg">{stats.students.total}</StatNumber>
            </Box>
          </Flex>
        </Stat>
      </SimpleGrid>
      
      {/* Quick Links Row - Removed since we now have clickable cards */}
      
      <Divider mb={5} />
      
      {/* Classes Management - Full View */}
      <Box>
        <Heading fontSize="lg" fontWeight="semibold" mb={4}>Kindergarten Classes</Heading>
        <ClassList />
      </Box>
    </Box>
  );
};

export default KindergartenDashboard; 