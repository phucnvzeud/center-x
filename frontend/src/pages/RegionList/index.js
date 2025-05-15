import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { regionsAPI } from '../../api';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Spinner,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSchool } from 'react-icons/fa';

const RegionList = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await regionsAPI.getAll();
      setRegions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Failed to load regions. Please try again later.');
      setLoading(false);
    }
  };

  const handleDeleteRegion = async (regionId) => {
    if (window.confirm('Are you sure you want to delete this region? This will not delete schools within the region.')) {
      try {
        await regionsAPI.remove(regionId);
        // Refresh the regions list
        fetchRegions();
      } catch (err) {
        console.error('Error deleting region:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to delete region. Please try again later.');
        }
      }
    }
  };

  // Filter regions based on search term
  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading regions...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">Error</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => { setError(null); fetchRegions(); }}>
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
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Regions</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">Regions</Heading>
        <Button 
          as={Link} 
          to="/kindergarten/regions/new" 
          leftIcon={<FaPlus />} 
          colorScheme="blue" 
          size="sm"
        >
          New Region
        </Button>
      </Flex>
      
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search regions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderColor={borderColor}
          />
        </InputGroup>
      </Box>
      
      {filteredRegions.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500" mb={4}>
            {searchTerm ? 
              `No regions found matching "${searchTerm}". Try a different search term or add a new region.` :
              'No regions found. Add your first region to get started.'
            }
          </Text>
          {!searchTerm && (
            <Button 
              as={Link} 
              to="/kindergarten/regions/new" 
              leftIcon={<FaPlus />} 
              colorScheme="blue"
              size="sm"
            >
              Add Region
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
                <Th>Description</Th>
                <Th>Schools</Th>
                <Th width="150px" textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRegions.map(region => (
                <Tr key={region._id}>
                  <Td fontWeight="medium">{region.name}</Td>
                  <Td>{region.description || 'No description'}</Td>
                  <Td>
                    <Button
                      as={Link}
                      to={`/kindergarten/regions/${region._id}/schools`}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      leftIcon={<FaSchool />}
                    >
                      View Schools
                    </Button>
                  </Td>
                  <Td textAlign="right">
                    <HStack spacing={2} justify="flex-end">
                      <IconButton
                        as={Link}
                        to={`/kindergarten/regions/edit/${region._id}`}
                        icon={<FaEdit />}
                        aria-label="Edit region"
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                      />
                      <IconButton
                        icon={<FaTrash />}
                        aria-label="Delete region"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteRegion(region._id)}
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

export default RegionList; 