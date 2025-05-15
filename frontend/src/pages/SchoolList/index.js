import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { schoolsAPI, regionsAPI } from '../../api';
import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  IconButton,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaChalkboardTeacher, FaEnvelope, FaPhone } from 'react-icons/fa';

const SchoolList = () => {
  const { regionId } = useParams();
  
  const [schools, setSchools] = useState([]);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Determine if we're viewing schools for a specific region
  const isRegionSpecific = !!regionId;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If a region ID is provided, fetch both the region details and its schools
        if (isRegionSpecific) {
          const [regionResponse, schoolsResponse] = await Promise.all([
            regionsAPI.getById(regionId),
            schoolsAPI.getAll(regionId)
          ]);
          
          setRegion(regionResponse.data);
          setSchools(schoolsResponse.data);
        } else {
          // Fetch all schools
          const schoolsResponse = await schoolsAPI.getAll();
          setSchools(schoolsResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schools data:', err);
        setError('Failed to load schools data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [regionId, isRegionSpecific]);

  const handleDeleteSchool = async (schoolId) => {
    if (window.confirm('Are you sure you want to delete this school? This will not delete classes within the school.')) {
      try {
        await schoolsAPI.remove(schoolId);
        
        // Refresh the schools list
        if (isRegionSpecific) {
          const response = await schoolsAPI.getAll(regionId);
          setSchools(response.data);
        } else {
          const response = await schoolsAPI.getAll();
          setSchools(response.data);
        }
      } catch (err) {
        console.error('Error deleting school:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to delete school. Please try again later.');
        }
      }
    }
  };

  // Filter schools based on search term
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading schools...</Text>
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
      <Breadcrumb mb={4} fontSize="sm" color="gray.500">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/kindergarten">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {isRegionSpecific && region ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/kindergarten/regions">Regions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink>{region.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Schools</BreadcrumbLink>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">
          {isRegionSpecific && region ? `Schools in ${region.name}` : 'All Schools'}
        </Heading>
        <Button 
          as={Link} 
          to="/kindergarten/schools/new" 
          leftIcon={<FaPlus />} 
          colorScheme="green" 
          size="sm"
          state={{ regionId: regionId }}
        >
          New School
        </Button>
      </Flex>
      
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderColor={borderColor}
          />
        </InputGroup>
      </Box>
      
      {filteredSchools.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500" mb={4}>
            {searchTerm ? 
              `No schools found matching "${searchTerm}". Try a different search term or add a new school.` :
              'No schools found. Add your first school to get started.'
            }
          </Text>
          {!searchTerm && (
            <Button 
              as={Link} 
              to="/kindergarten/schools/new" 
              leftIcon={<FaPlus />} 
              colorScheme="green"
              size="sm"
              state={{ regionId: regionId }}
            >
              Add School
            </Button>
          )}
        </Box>
      ) : (
        <Box 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          overflow="hidden"
        >
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>Name</Th>
                {!isRegionSpecific && <Th>Region</Th>}
                <Th>Contact Person</Th>
                <Th>Contact Info</Th>
                <Th>Address</Th>
                <Th>Classes</Th>
                <Th width="150px" textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredSchools.map(school => (
                <Tr key={school._id}>
                  <Td fontWeight="medium">{school.name}</Td>
                  {!isRegionSpecific && (
                    <Td>{school.region ? school.region.name : 'Unknown'}</Td>
                  )}
                  <Td>{school.contactPerson || 'Not specified'}</Td>
                  <Td>
                    {(school.contactEmail || school.contactPhone) ? (
                      <VStack align="flex-start" spacing={1}>
                        {school.contactEmail && (
                          <Flex align="center">
                            <Box as={FaEnvelope} color="gray.500" mr={1} fontSize="xs" />
                            <Text fontSize="sm">{school.contactEmail}</Text>
                          </Flex>
                        )}
                        {school.contactPhone && (
                          <Flex align="center">
                            <Box as={FaPhone} color="gray.500" mr={1} fontSize="xs" />
                            <Text fontSize="sm">{school.contactPhone}</Text>
                          </Flex>
                        )}
                      </VStack>
                    ) : 'Not specified'}
                  </Td>
                  <Td>{school.address || 'Not specified'}</Td>
                  <Td>
                    <Button
                      as={Link}
                      to={`/kindergarten/schools/${school._id}/classes`}
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      leftIcon={<FaChalkboardTeacher />}
                    >
                      View Classes
                    </Button>
                  </Td>
                  <Td textAlign="right">
                    <HStack spacing={2} justify="flex-end">
                      <IconButton
                        as={Link}
                        to={`/kindergarten/schools/edit/${school._id}`}
                        icon={<FaEdit />}
                        aria-label="Edit school"
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                      />
                      <IconButton
                        icon={<FaTrash />}
                        aria-label="Delete school"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteSchool(school._id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default SchoolList; 