/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { schoolsAPI, regionsAPI } from '../../api';
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
  Select,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Text,
  VStack,
  Grid,
  GridItem,
  useColorModeValue
} from '@chakra-ui/react';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';

const SchoolForm = () => {
  const { t } = useTranslation();
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!schoolId;

  // Check if a default region was passed through location state
  const defaultRegionId = location.state?.regionId || '';

  const [school, setSchool] = useState({
    name: '',
    region: defaultRegionId,
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });
  
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all regions for the dropdown
        const regionsResponse = await regionsAPI.getAll();
        setRegions(regionsResponse.data);
        
        // If in edit mode, fetch the school details
        if (isEditMode) {
          const schoolResponse = await schoolsAPI.getById(schoolId);
          const schoolData = schoolResponse.data;
          
          // Ensure region is properly set to the ID value
          if (schoolData.region && typeof schoolData.region === 'object') {
            schoolData.region = schoolData.region._id;
          }
          
          setSchool(schoolData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError(t('kindergarten.school.error'));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [schoolId, isEditMode, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSchool(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!school.name.trim()) {
      setError(t('kindergarten.school.name_required'));
      return;
    }
    
    if (!school.region) {
      setError(t('kindergarten.school.region_required'));
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await schoolsAPI.update(schoolId, school);
      } else {
        await schoolsAPI.create(school);
      }
      
      // If we came from a specific region, go back to that region's schools page
      if (defaultRegionId) {
        navigate(`/kindergarten/regions/${defaultRegionId}/schools`);
      } else {
        // Otherwise, go to the general schools list
        navigate('/kindergarten/schools');
      }
    } catch (err) {
      console.error('Error saving school:', err);
      setError(t('kindergarten.school.save_error'));
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} fontSize="lg" color="gray.600">{t('kindergarten.school.loading')}</Text>
      </Flex>
    );
  }

  return (
    <Container maxW="container.md" py={6}>
      <Flex mb={6} justify="space-between" alignItems="center">
        <Heading size="lg">{isEditMode ? t('kindergarten.school.edit') : t('kindergarten.school.create')}</Heading>
        <Button 
          as={Link} 
          to={defaultRegionId ? `/kindergarten/regions/${defaultRegionId}/schools` : '/kindergarten/schools'} 
          leftIcon={<FaArrowLeft />} 
          size="sm" 
          colorScheme="gray" 
          variant="outline"
        >
          {t('kindergarten.school.back_to_schools')}
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
            <FormLabel>{t('kindergarten.school.name')}</FormLabel>
            <Input
              id="name"
              name="name"
              value={school.name}
              onChange={handleInputChange}
              isDisabled={formSubmitting}
            />
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>{t('kindergarten.school.region')}</FormLabel>
            <Select
              id="region"
              name="region"
              value={school.region}
              onChange={handleInputChange}
              isDisabled={formSubmitting}
            >
              <option value="">{t('kindergarten.school.select_region')}</option>
              {regions.map(region => (
                <option key={region._id} value={region._id}>{region.name}</option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>{t('kindergarten.school.address')}</FormLabel>
            <Input
              id="address"
              name="address"
              value={school.address || ''}
              onChange={handleInputChange}
              isDisabled={formSubmitting}
            />
          </FormControl>
          
          <Heading size="sm" mt={2}>{t('kindergarten.school.contact_info')}</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <GridItem>
              <FormControl>
                <FormLabel>{t('kindergarten.school.contact_person')}</FormLabel>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={school.contactPerson || ''}
                  onChange={handleInputChange}
                  isDisabled={formSubmitting}
                />
              </FormControl>
            </GridItem>
            
            <GridItem>
              <FormControl>
                <FormLabel>{t('kindergarten.school.contact_email')}</FormLabel>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={school.contactEmail || ''}
                  onChange={handleInputChange}
                  isDisabled={formSubmitting}
                />
              </FormControl>
            </GridItem>
            
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl>
                <FormLabel>{t('kindergarten.school.contact_phone')}</FormLabel>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={school.contactPhone || ''}
                  onChange={handleInputChange}
                  isDisabled={formSubmitting}
                />
              </FormControl>
            </GridItem>
          </Grid>
          
          <Flex justify="flex-end" gap={3} mt={4}>
            <Button 
              as={Link}
              to={defaultRegionId ? `/kindergarten/regions/${defaultRegionId}/schools` : '/kindergarten/schools'}
              variant="outline" 
              isDisabled={formSubmitting}
            >
              {t('kindergarten.school.cancel')}
            </Button>
            <Button 
              type="submit" 
              colorScheme="blue"
              isLoading={formSubmitting}
              loadingText={t('common.loading')}
            >
              {isEditMode ? t('kindergarten.school.update') : t('kindergarten.school.create_button')}
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
          <BreadcrumbLink as={Link} to="/kindergarten/schools">{t('kindergarten.schools')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <Text fontWeight="medium">{isEditMode ? t('kindergarten.school.edit') : t('kindergarten.school.create')}</Text>
        </BreadcrumbItem>
      </Breadcrumb>
    </Container>
  );
};

export default SchoolForm; 