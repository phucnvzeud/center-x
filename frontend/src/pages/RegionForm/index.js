/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { regionsAPI } from '../../api';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';

const RegionForm = () => {
  const { t } = useTranslation();
  const { regionId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!regionId;

  const [region, setRegion] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (isEditMode) {
      const fetchRegion = async () => {
        try {
          setLoading(true);
          const response = await regionsAPI.getById(regionId);
          setRegion(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching region:', err);
          setError(t('kindergarten.region.error'));
          setLoading(false);
        }
      };
      
      fetchRegion();
    }
  }, [regionId, isEditMode, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegion(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!region.name.trim()) {
      setError(t('kindergarten.region.name_required'));
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await regionsAPI.update(regionId, region);
      } else {
        await regionsAPI.create(region);
      }
      
      navigate('/kindergarten/regions');
    } catch (err) {
      console.error('Error saving region:', err);
      setError(t('kindergarten.region.save_error'));
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">{t('kindergarten.region.loading')}</Text>
      </Flex>
    );
  }

  return (
    <Container maxW="container.md" py={6}>
      <Flex mb={6} justify="space-between" alignItems="center">
        <Heading size="lg">{isEditMode ? t('kindergarten.region.edit') : t('kindergarten.region.create')}</Heading>
        <Button 
          as={Link} 
          to="/kindergarten/regions" 
          leftIcon={<FaArrowLeft />} 
          size="sm" 
          colorScheme="gray" 
          variant="outline"
        >
          {t('kindergarten.region.back_to_regions')}
        </Button>
      </Flex>
      
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <Box 
        as="form" 
        onSubmit={handleSubmit} 
        bg={bgColor} 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderRadius="md" 
        p={6} 
        shadow="sm"
      >
        <VStack spacing={6} align="stretch">
          <FormControl isRequired>
            <FormLabel>{t('kindergarten.region.name')}</FormLabel>
            <Input
              id="name"
              name="name"
              value={region.name}
              onChange={handleInputChange}
              isDisabled={formSubmitting}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>{t('kindergarten.region.description_optional')}</FormLabel>
            <Textarea
              id="description"
              name="description"
              value={region.description || ''}
              onChange={handleInputChange}
              rows={4}
              resize="vertical"
              isDisabled={formSubmitting}
            />
          </FormControl>
          
          <Flex justify="flex-end" gap={3} mt={4}>
            <Button 
              as={Link}
              to="/kindergarten/regions"
              variant="outline" 
              isDisabled={formSubmitting}
            >
              {t('kindergarten.region.cancel')}
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue"
              isLoading={formSubmitting}
              loadingText={t('common.loading')}
            >
              {isEditMode ? t('kindergarten.region.update') : t('kindergarten.region.create_button')}
            </Button>
          </Flex>
        </VStack>
      </Box>
      
      <Breadcrumb 
        separator={<FaChevronRight color="gray.500" />} 
        mt={6}
        fontSize="sm"
        color="gray.500"
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/kindergarten">{t('kindergarten.dashboard')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/kindergarten/regions">{t('kindergarten.regions')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text fontWeight="medium">{isEditMode ? t('kindergarten.region.edit') : t('kindergarten.region.create')}</Text>
        </BreadcrumbItem>
      </Breadcrumb>
    </Container>
  );
};

export default RegionForm; 