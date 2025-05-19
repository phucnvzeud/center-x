import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('branches.error'));
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
      setError(t('branches.save_error'));
    }
  };

  const handleDelete = async (branchId) => {
    if (window.confirm(t('branches.delete_confirm'))) {
      try {
        await axios.delete(`/api/branches/${branchId}`);
        fetchBranches();
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError(t('branches.delete_error'));
      }
    }
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">{t('branches.loading')}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">{t('common.error')}</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => fetchBranches()}>
          {t('kindergarten.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">{t('branches.management')}</Heading>
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="brand" 
          size="sm" 
          onClick={() => openModal()}
        >
          {t('branches.new_branch')}
        </Button>
      </Flex>
      
      {branches.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center" borderRadius="md">
          <Text color="gray.500" mb={4}>{t('branches.no_branches')}</Text>
          <Button leftIcon={<FaPlus />} colorScheme="brand" size="sm" onClick={() => openModal()}>
            {t('branches.add_branch')}
          </Button>
        </Box>
      ) :
        <Box 
          borderWidth="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          overflow="hidden"
        >
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>{t('branches.branch_name')}</Th>
                <Th>{t('branches.address')}</Th>
                <Th width="150px">{t('branches.actions')}</Th>
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
                        aria-label={t('branches.edit_branch')}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => openModal(branch)}
                      />
                      <IconButton
                        icon={<FaTrash />}
                        aria-label={t('branches.delete_branch')}
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
      }

      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingBranch ? t('branches.edit_branch') : t('branches.new_branch')}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody pb={6}>
              <FormControl isRequired>
                <FormLabel htmlFor="name">{t('branches.branch_name')}</FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={editingBranch ? editingBranch.name : newBranch.name}
                  onChange={handleInputChange}
                  placeholder={t('branches.enter_name')}
                />
              </FormControl>

              <FormControl mt={4} isRequired>
                <FormLabel htmlFor="address">{t('branches.address')}</FormLabel>
                <Input
                  id="address"
                  name="address"
                  value={editingBranch ? editingBranch.address : newBranch.address}
                  onChange={handleInputChange}
                  placeholder={t('branches.enter_address')}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="gray" mr={3} onClick={closeModal}>
                {t('branches.cancel')}
              </Button>
              <Button type="submit" colorScheme="brand">
                {editingBranch ? t('branches.update') : t('branches.save')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Branches; 