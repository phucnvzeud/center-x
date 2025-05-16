import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teachersAPI, coursesAPI, kindergartenClassesAPI } from '../../api';
import * as XLSX from 'xlsx';
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
  Select,
  HStack
} from '@chakra-ui/react';
import { FaArrowLeft, FaEdit, FaTrash, FaCalendarAlt, FaFileExport } from 'react-icons/fa';
import './TeacherDetail.css';

const TeacherDetail = () => {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [kindergartenClasses, setKindergartenClasses] = useState([]);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth());
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isExportModalOpen, 
    onOpen: onExportModalOpen, 
    onClose: onExportModalClose 
  } = useDisclosure();
  const cancelRef = React.useRef();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        const response = await teachersAPI.getById(teacherId);
        setTeacher(response.data);
        
        // Also fetch teacher's courses and classes
        const coursesResponse = await teachersAPI.getCourses(teacherId);
        setCourses(coursesResponse.data);
        
        const classesResponse = await teachersAPI.getKindergartenClasses(teacherId);
        setKindergartenClasses(classesResponse.data);
        
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
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Function to export teacher's sessions to Excel
  const exportSessionsToExcel = async () => {
    try {
      setExportLoading(true);
      
      // Create new workbook
      const wb = XLSX.utils.book_new();
      
      // 1. Teacher Info Sheet
      const teacherData = [
        ['Teacher Information', ''],
        ['Name', teacher.name],
        ['Email', teacher.email],
        ['Phone', teacher.phone || 'N/A'],
        ['Specialization', teacher.specialization || 'N/A'],
        ['Location', teacher.location || 'N/A'],
        ['Joined Date', formatDate(teacher.joinedDate)],
        ['', ''],
        ['Report Information', ''],
        ['Month/Year', `${new Date(exportYear, exportMonth, 1).toLocaleString('default', { month: 'long' })} ${exportYear}`],
        ['Report Generated', new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()],
        ['', ''],
      ];
      
      const teacherSheet = XLSX.utils.aoa_to_sheet(teacherData);
      
      // Set column widths for better readability
      teacherSheet['!cols'] = [
        { wch: 20 }, // Column A width
        { wch: 40 }  // Column B width
      ];
      
      XLSX.utils.book_append_sheet(wb, teacherSheet, "Teacher Info");
      
      // Date range for filtered month
      const startOfMonth = new Date(exportYear, exportMonth, 1);
      const endOfMonth = new Date(exportYear, exportMonth + 1, 0);
      
      const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
      
      // 2. Course Sessions Sheet
      let courseSessionsData = [];
      
      // Add title and explanation
      courseSessionsData.push([`Courses Taught by ${teacher.name} - ${monthName} ${exportYear}`]);
      courseSessionsData.push(['A value of "1" indicates that a session was taught on that day']);
      courseSessionsData.push([]);
      
      // Header row with dates 1-31
      const courseHeaderRow = ['Course Name'];
      const daysInMonth = endOfMonth.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        courseHeaderRow.push(i); // Add days 1-31 as columns
      }
      courseSessionsData.push(courseHeaderRow);
      
      // Fetch and process sessions for each course
      for (const course of courses) {
        try {
          const sessionsResponse = await coursesAPI.getSessions(course._id);
          const allSessions = sessionsResponse.data || [];
          
          // Filter sessions for the selected month
          const sessionsInMonth = allSessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
          });
          
          // Create a row for this course
          const courseRow = [course.name];
          
          // Initialize all days to empty
          for (let i = 1; i <= daysInMonth; i++) {
            courseRow.push("");
          }
          
          // Mark days with sessions
          sessionsInMonth.forEach(session => {
            const sessionDate = new Date(session.date);
            const day = sessionDate.getDate();
            
            // Only mark taught sessions
            if (session.status === 'Taught') {
              courseRow[day] = 1; // 1 indicates a session was taught
            }
          });
          
          // Add to data array
          courseSessionsData.push(courseRow);
        } catch (err) {
          console.error(`Error fetching sessions for course ${course._id}:`, err);
        }
      }
      
      // Add a total row
      const totalRow = ['TOTAL SESSIONS'];
      for (let i = 1; i <= daysInMonth; i++) {
        let count = 0;
        // Start from index 4 to skip the header rows
        for (let j = 4; j < courseSessionsData.length; j++) {
          if (courseSessionsData[j][i] === 1) {
            count++;
          }
        }
        totalRow.push(count > 0 ? count : '');
      }
      courseSessionsData.push([]);
      courseSessionsData.push(totalRow);
      
      // Add the courses sessions sheet
      const coursesSessionsSheet = XLSX.utils.aoa_to_sheet(courseSessionsData);
      
      // Set column widths for better readability
      const courseColWidths = [{ wch: 30 }]; // Column A width (course name)
      for (let i = 0; i < daysInMonth; i++) {
        courseColWidths.push({ wch: 5 }); // Date columns width
      }
      coursesSessionsSheet['!cols'] = courseColWidths;
      
      XLSX.utils.book_append_sheet(wb, coursesSessionsSheet, `Courses - ${monthName}`);
      
      // 3. Kindergarten Classes Sessions Sheet
      let kgSessionsData = [];
      
      // Add title and explanation
      kgSessionsData.push([`Kindergarten Classes Taught by ${teacher.name} - ${monthName} ${exportYear}`]);
      kgSessionsData.push(['A value of "1" indicates that a session was taught on that day']);
      kgSessionsData.push([]);
      
      // Header row with dates 1-31
      const kgHeaderRow = ['Class Name'];
      for (let i = 1; i <= daysInMonth; i++) {
        kgHeaderRow.push(i); // Add days 1-31 as columns
      }
      kgSessionsData.push(kgHeaderRow);
      
      // Fetch and process sessions for each kindergarten class
      for (const kgClass of kindergartenClasses) {
        try {
          const kgSessionsResponse = await kindergartenClassesAPI.getSessions(kgClass._id);
          const allKgSessions = kgSessionsResponse.data || [];
          
          // Filter sessions for the selected month
          const kgSessionsInMonth = allKgSessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
          });
          
          // Create a row for this kindergarten class
          const kgClassRow = [kgClass.name];
          
          // Initialize all days to empty
          for (let i = 1; i <= daysInMonth; i++) {
            kgClassRow.push("");
          }
          
          // Mark days with sessions
          kgSessionsInMonth.forEach(session => {
            const sessionDate = new Date(session.date);
            const day = sessionDate.getDate();
            
            // Only mark taught sessions
            if (session.status === 'Completed') {
              kgClassRow[day] = 1; // 1 indicates a session was taught
            }
          });
          
          // Add to data array
          kgSessionsData.push(kgClassRow);
        } catch (err) {
          console.error(`Error fetching sessions for kindergarten class ${kgClass._id}:`, err);
        }
      }
      
      // Add a total row
      const kgTotalRow = ['TOTAL SESSIONS'];
      for (let i = 1; i <= daysInMonth; i++) {
        let count = 0;
        // Start from index 4 to skip the header rows
        for (let j = 4; j < kgSessionsData.length; j++) {
          if (kgSessionsData[j][i] === 1) {
            count++;
          }
        }
        kgTotalRow.push(count > 0 ? count : '');
      }
      kgSessionsData.push([]);
      kgSessionsData.push(kgTotalRow);
      
      // Add the kindergarten sessions sheet
      const kgSessionsSheet = XLSX.utils.aoa_to_sheet(kgSessionsData);
      
      // Set column widths for better readability
      const kgColWidths = [{ wch: 30 }]; // Column A width (class name)
      for (let i = 0; i < daysInMonth; i++) {
        kgColWidths.push({ wch: 5 }); // Date columns width
      }
      kgSessionsSheet['!cols'] = kgColWidths;
      
      XLSX.utils.book_append_sheet(wb, kgSessionsSheet, `Classes - ${monthName}`);
      
      // Generate filename
      const fileName = `${teacher.name.replace(/\s+/g, '_')}_Sessions_${monthName}_${exportYear}.xlsx`;
      
      // Export
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: 'Export successful',
        description: `Sessions exported to ${fileName}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting teacher sessions:', err);
      toast({
        title: 'Export failed',
        description: 'Failed to export teacher sessions.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExportLoading(false);
      onExportModalClose();
    }
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
                <IconButton
                  icon={<FaFileExport />}
                  colorScheme="green"
                  aria-label="Export sessions"
                  onClick={onExportModalOpen}
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
      
      {/* Export Sessions Modal */}
      <Modal isOpen={isExportModalOpen} onClose={onExportModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Teacher Sessions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Export {teacher.name}'s sessions for the selected month. The export will include all courses and kindergarten classes taught by this teacher.
            </Text>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Month</FormLabel>
                <Select 
                  value={exportMonth} 
                  onChange={(e) => setExportMonth(parseInt(e.target.value))}
                >
                  <option value={0}>January</option>
                  <option value={1}>February</option>
                  <option value={2}>March</option>
                  <option value={3}>April</option>
                  <option value={4}>May</option>
                  <option value={5}>June</option>
                  <option value={6}>July</option>
                  <option value={7}>August</option>
                  <option value={8}>September</option>
                  <option value={9}>October</option>
                  <option value={10}>November</option>
                  <option value={11}>December</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Year</FormLabel>
                <Select 
                  value={exportYear} 
                  onChange={(e) => setExportYear(parseInt(e.target.value))}
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </Select>
              </FormControl>
            </HStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              leftIcon={<FaFileExport />}
              onClick={exportSessionsToExcel}
              isLoading={exportLoading}
            >
              Export
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TeacherDetail; 