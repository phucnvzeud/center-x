import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  HStack,
  useColorModeValue,
  IconButton
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });
  const [editingBranch, setEditingBranch] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/branches');
      setBranches(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingBranch) {
      setEditingBranch({ ...editingBranch, [name]: value });
    } else {
      setNewBranch({ ...newBranch, [name]: value });
    }
  };

  const openModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
    } else {
      setNewBranch({ name: '', address: '' });
    }
    onOpen();
  };

  const closeModal = () => {
    onClose();
    setEditingBranch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        await axios.put(`/api/branches/${editingBranch._id}`, editingBranch);
      } else {
        await axios.post('/api/branches', newBranch);
      }
      
      fetchBranches();
      closeModal();
    } catch (err) {
      console.error('Error saving branch:', err);
      setError('Failed to save branch. Please try again.');
    }
  };

  const handleDelete = async (branchId) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await axios.delete(`/api/branches/${branchId}`);
        fetchBranches();
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError('Failed to delete branch. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading branches...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">Error</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => fetchBranches()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">Branches</Heading>
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="brand" 
          size="sm" 
          onClick={() => openModal()}
        >
          New Branch
        </Button>
      </Flex>
      
      {branches.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500" mb={4}>No branches found. Add your first branch to get started.</Text>
          <Button leftIcon={<FaPlus />} colorScheme="brand" size="sm" onClick={() => openModal()}>
            Add Branch
          </Button>
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
                <Th>Address</Th>
                <Th width="150px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {branches.map(branch => (
                <Tr key={branch._id}>
                  <Td fontWeight="medium">{branch.name}</Td>
                  <Td>{branch.address}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<FaEdit />}
                        aria-label="Edit branch"
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => openModal(branch)}
                      />
                      <IconButton
                        icon={<FaTrash />}
                        aria-label="Delete branch"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(branch._id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody pb={6}>
              <FormControl isRequired>
                <FormLabel htmlFor="name">Branch Name</FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={editingBranch ? editingBranch.name : newBranch.name}
                  onChange={handleInputChange}
                  placeholder="Enter branch name"
                />
              </FormControl>

              <FormControl mt={4} isRequired>
                <FormLabel htmlFor="address">Address</FormLabel>
                <Input
                  id="address"
                  name="address"
                  value={editingBranch ? editingBranch.address : newBranch.address}
                  onChange={handleInputChange}
                  placeholder="Enter branch address"
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="gray" mr={3} onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="brand">
                {editingBranch ? 'Update' : 'Save'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Branches; 