import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teachersAPI } from '../../api';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Badge,
  Spinner,
  Avatar,
  Grid,
  GridItem,
  Divider,
  useColorModeValue,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { FaArrowLeft, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import './TeacherDetail.css';

const TeacherDetail = () => {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        const response = await teachersAPI.getById(teacherId);
        setTeacher(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teacher details:', err);
        setError('Failed to load teacher details. Please try again later.');
        setLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [teacherId]);

  const handleDelete = async () => {
    try {
      await teachersAPI.remove(teacherId);
      toast({
        title: 'Teacher deleted',
        description: 'The teacher has been successfully removed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/teachers');
    } catch (err) {
      console.error('Error deleting teacher:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete teacher. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    onClose();
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner color="brand.500" size="lg" />
        <Text mt={2} color="gray.500">Loading teacher details...</Text>
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

  if (!teacher) {
    return (
      <Box p={4} bg="yellow.50" borderWidth="1px" borderColor="yellow.200">
        <Heading size="md" mb={2} color="yellow.600">Teacher Not Found</Heading>
        <Text mb={4}>The requested teacher could not be found.</Text>
        <Button as={Link} to="/teachers" leftIcon={<FaArrowLeft />} colorScheme="yellow" variant="outline">
          Back to Teachers
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex align="center" mb={6}>
        <IconButton
          as={Link}
          to="/teachers"
          icon={<FaArrowLeft />}
          aria-label="Back to teachers"
          mr={4}
          variant="outline"
        />
        <Heading fontSize="xl" fontWeight="semibold">Teacher Details</Heading>
      </Flex>

      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
        <Flex p={6} direction={{ base: 'column', md: 'row' }} alignItems={{ base: 'center', md: 'flex-start' }}>
          <Avatar 
            size="xl"
            name={teacher.name}
            src={teacher.avatar}
            mb={{ base: 4, md: 0 }}
            mr={{ md: 6 }}
          />
          
          <Box flex="1">
            <Flex justifyContent="space-between" mb={2} direction={{ base: 'column', sm: 'row' }}>
              <Heading size="lg">{teacher.name}</Heading>
              <Flex mt={{ base: 2, sm: 0 }} gap={2}>
                <IconButton
                  as={Link}
                  to={`/teachers/${teacherId}/edit`}
                  icon={<FaEdit />}
                  colorScheme="blue"
                  variant="outline"
                  aria-label="Edit teacher"
                />
                <IconButton
                  icon={<FaTrash />}
                  colorScheme="red"
                  variant="outline"
                  aria-label="Delete teacher"
                  onClick={onOpen}
                />
                <IconButton
                  as={Link}
                  to={`/teachers/${teacherId}/schedule`}
                  icon={<FaCalendarAlt />}
                  colorScheme="brand"
                  aria-label="View schedule"
                />
              </Flex>
            </Flex>

            <Badge bg="brand.50" color="brand.700" fontWeight="medium" px={2} py={1} mb={4}>
              {teacher.specialization || 'No specialization'}
            </Badge>

            <Divider my={4} />

            <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={4}>
              <GridItem>
                <Text fontWeight="bold">Email:</Text>
                <Text>{teacher.email}</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">Phone:</Text>
                <Text>{teacher.phone || 'Not provided'}</Text>
              </GridItem>
              {teacher.location && (
                <GridItem>
                  <Text fontWeight="bold">Location:</Text>
                  <Text>{teacher.location}</Text>
                </GridItem>
              )}
              {teacher.joinedDate && (
                <GridItem>
                  <Text fontWeight="bold">Joined:</Text>
                  <Text>{new Date(teacher.joinedDate).toLocaleDateString()}</Text>
                </GridItem>
              )}
            </Grid>

            {teacher.bio && (
              <>
                <Divider my={4} />
                <Text fontWeight="bold">Biography:</Text>
                <Text>{teacher.bio}</Text>
              </>
            )}
          </Box>
        </Flex>
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Teacher
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {teacher.name}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default TeacherDetail; 