/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teachersAPI } from '../../api';
import { Box, Heading, Text, SimpleGrid, Flex, Button, Badge, Spinner, useColorModeValue } from '@chakra-ui/react';
import { FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './Teachers.css';

const Teachers = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await teachersAPI.getAll();
        setTeachers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError(t('teachers.error'));
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [t]);

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
        <Box as="button" bg="red.100" px={4} py={2} color="red.700" fontWeight="medium" _hover={{ bg: "red.200" }} onClick={() => window.location.reload()}>
          {t('teachers.retry')}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading fontSize="xl" fontWeight="semibold">{t('teachers.teachers')}</Heading>
      </Flex>
      
      <Box 
        p={4} 
        mb={6} 
        bg="green.50" 
        borderWidth="1px" 
        borderColor="green.200" 
        borderRadius="md"
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Box>
            <Heading size="sm" color="green.700" mb={1}>
              {t('teachers.new_feature')}
            </Heading>
            <Text fontSize="sm" color="green.600">
              {t('teachers.new_feature_description')}
            </Text>
          </Box>
          <Button
            as={Link}
            to={teachers.length > 0 ? `/teachers/${teachers[0]?._id}` : '#'}
            isDisabled={teachers.length === 0}
            colorScheme="green"
            size="sm"
            mr={2}
            rightIcon={<FaArrowRight />}
          >
            {t('teachers.try_it_now')}
          </Button>
        </Flex>
      </Box>
      
      {teachers.length === 0 ? (
        <Box p={6} bg="gray.50" borderWidth="1px" borderColor="gray.200" textAlign="center">
          <Text color="gray.500">{t('teachers.no_teachers')}</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {teachers.map(teacher => (
            <Box 
              key={teacher._id} 
              bg="white" 
              borderWidth="1px" 
              borderColor="gray.200"
              p={4}
              transition="all 0.2s"
              _hover={{ shadow: "md", borderColor: "brand.200", transform: "translateY(-2px)" }}
            >
              <Box mb={4}>
                <Heading size="sm" mb={1}>{teacher.name}</Heading>
                <Text fontSize="sm" color="gray.500" mb={2}>{teacher.email}</Text>
                <Badge bg="brand.50" color="brand.700" fontWeight="medium" px={2} py={1}>{teacher.specialization || t('teachers.no_specialization')}</Badge>
              </Box>
              <Flex justifyContent="flex-end" mt={4} gap={2}>
                <Button 
                  as={Link} 
                  to={`/teachers/${teacher._id}`}
                  variant="outline" 
                  size="sm"
                  colorScheme="gray"
                >
                  {t('teachers.view_details')}
                </Button>
                <Button 
                  as={Link}
                  to={`/teachers/${teacher._id}/schedule`}
                  variant="solid" 
                  size="sm"
                  colorScheme="brand"
                >
                  {t('teachers.view_schedule')}
                </Button>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Teachers;