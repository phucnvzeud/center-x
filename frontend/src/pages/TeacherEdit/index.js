import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teachersAPI } from '../../api';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  
  const isCreating = teacherId === 'new';

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
        setError(t('teachers.error'));
        setLoading(false);
      }
    };

    if (isCreating) {
      // If creating a new teacher, just initialize the form with empty values
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        location: '',
        bio: ''
      });
      setLoading(false);
    } else {
      // Only fetch teacher data if editing an existing teacher
      fetchTeacher();
    }
  }, [teacherId, isCreating, t]);

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
      newErrors.name = t('teachers.required_field');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('teachers.required_field');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t('teachers.invalid_email');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: t('teachers.validation_error'),
        description: t('teachers.validation_error_message'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSaving(true);
      if (!isCreating) {
        await teachersAPI.update(teacherId, formData);
        toast({
          title: t('teachers.teacher_updated'),
          description: t('teachers.teacher_updated'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate(`/teachers/${teacherId}`);
      } else {
        const response = await teachersAPI.create(formData);
        toast({
          title: t('teachers.teacher_created'),
          description: t('teachers.teacher_created'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate(`/teachers/${response.data._id}`);
      }
    } catch (err) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} teacher:`, err);
      toast({
        title: isCreating ? t('teachers.creation_failed') : t('teachers.update_failed'),
        description: `${t('teachers.update_failed')} ${t('teachers.retry')}`,
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
        <Text mt={2} color="gray.500">{t('teachers.loading')}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">{t('common.error')}</Heading>
        <Text mb={4}>{error}</Text>
        <Button colorScheme="red" variant="outline" onClick={() => window.location.reload()}>
          {t('teachers.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex align="center" mb={6}>
        <IconButton
          as={Link}
          to={isCreating ? '/teachers' : `/teachers/${teacherId}`}
          icon={<FaArrowLeft />}
          aria-label={isCreating ? t('teachers.back_to_teachers') : t('teachers.back_to_teachers')}
          mr={4}
          variant="outline"
        />
        <Heading fontSize="xl" fontWeight="semibold">
          {isCreating ? t('teachers.create_new') : t('teachers.edit_teacher')}
        </Heading>
      </Flex>

      <Box as="form" onSubmit={handleSubmit} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={6}>
        <Stack spacing={4}>
          <FormControl isInvalid={errors.name}>
            <FormLabel htmlFor="name">{t('teachers.name')}</FormLabel>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('teachers.name')}
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={errors.email}>
            <FormLabel htmlFor="email">{t('teachers.email')}</FormLabel>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('teachers.email')}
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="phone">{t('teachers.phone')}</FormLabel>
            <Input 
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('teachers.phone')}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="specialization">{t('teachers.specialization')}</FormLabel>
            <Input 
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder={t('teachers.specialization')}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel htmlFor="location">{t('teachers.location')}</FormLabel>
            <Input 
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={t('teachers.location')}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="bio">{t('teachers.bio')}</FormLabel>
            <Textarea 
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t('teachers.bio')}
              rows={5}
            />
          </FormControl>

          <Flex justify="flex-end" mt={6} gap={4}>
            <Button 
              as={Link}
              to={isCreating ? '/teachers' : `/teachers/${teacherId}`}
              variant="outline"
            >
              {t('teachers.cancel')}
            </Button>
            <Button 
              type="submit"
              colorScheme="brand"
              leftIcon={<FaSave />}
              isLoading={saving}
              loadingText={t('teachers.saving')}
            >
              {t('teachers.save_changes')}
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default TeacherEdit; 