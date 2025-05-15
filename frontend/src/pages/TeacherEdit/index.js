import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teachersAPI } from '../../api';
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Flex,
  Spinner,
  Text,
  IconButton,
  useToast,
  FormErrorMessage,
  Stack,
  useColorModeValue
} from '@chakra-ui/react';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const TeacherEdit = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    location: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        const response = await teachersAPI.getById(teacherId);
        const teacherData = response.data;
        
        setFormData({
          name: teacherData.name || '',
          email: teacherData.email || '',
          phone: teacherData.phone || '',
          specialization: teacherData.specialization || '',
          location: teacherData.location || '',
          bio: teacherData.bio || ''
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teacher:', err);
        setError('Failed to load teacher information. Please try again later.');
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSaving(true);
      await teachersAPI.update(teacherId, formData);
      
      toast({
        title: 'Teacher updated',
        description: 'Teacher information has been updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate(`/teachers/${teacherId}`);
    } catch (err) {
      console.error('Error updating teacher:', err);
      toast({
        title: 'Update failed',
        description: 'Failed to update teacher information. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading teacher information...</Text>
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
      <Flex align="center" mb={6}>
        <IconButton
          as={Link}
          to={`/teachers/${teacherId}`}
          icon={<FaArrowLeft />}
          aria-label="Back to teacher details"
          mr={4}
          variant="outline"
        />
        <Heading fontSize="xl" fontWeight="semibold">Edit Teacher</Heading>
      </Flex>

      <Box as="form" onSubmit={handleSubmit} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={6}>
        <Stack spacing={4}>
          <FormControl isInvalid={errors.name}>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter teacher's name"
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={errors.email}>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="phone">Phone</FormLabel>
            <Input 
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="specialization">Specialization</FormLabel>
            <Input 
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="Enter specialization (e.g. Mathematics, Science)"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel htmlFor="location">Location</FormLabel>
            <Input 
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="bio">Biography</FormLabel>
            <Textarea 
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Enter teacher's biography"
              rows={5}
            />
          </FormControl>

          <Flex justify="flex-end" mt={6} gap={4}>
            <Button 
              as={Link}
              to={`/teachers/${teacherId}`}
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              colorScheme="brand"
              leftIcon={<FaSave />}
              isLoading={saving}
              loadingText="Saving"
            >
              Save Changes
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default TeacherEdit; 