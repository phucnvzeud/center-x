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
import { useTranslation } from 'react-i18next';

const TeacherDetail = () => {
  const { t } = useTranslation();
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
        
        // Skip API calls if we're in the "new" teacher route
        if (teacherId === 'new' || !teacherId) {
          setError(t('teachers.cannot_view_details'));
          setLoading(false);
          return;
        }
        
        const response = await teachersAPI.getById(teacherId);
        
        // Check if valid response
        if (!response.data || (typeof response.data === 'object' && Object.keys(response.data).length === 0)) {
          setError(t('teachers.teacher_not_found', { id: teacherId }));
          setLoading(false);
          return;
        }
        
        setTeacher(response.data);
        
        // Also fetch teacher's courses and classes
        const coursesResponse = await teachersAPI.getCourses(teacherId);
        setCourses(coursesResponse.data);
        
        const classesResponse = await teachersAPI.getKindergartenClasses(teacherId);
        setKindergartenClasses(classesResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teacher details:', err);
        setError(t('teachers.error_loading_details', { 
          errorType: err.response?.status === 404 ? t('teachers.not_found') : t('teachers.try_again')
        }));
        setLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [teacherId, t]);

  const handleDelete = async () => {
    try {
      await teachersAPI.remove(teacherId);
      toast({
        title: t('teachers.teacher_deleted'),
        description: t('teachers.teacher_deleted_success'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/teachers');
    } catch (err) {
      console.error('Error deleting teacher:', err);
      toast({
        title: t('common.error'),
        description: t('teachers.delete_error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    onClose();
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t('common.not_provided');
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
        [t('teachers.export.teacher_information'), ''],
        [t('teachers.name'), teacher.name],
        [t('teachers.email'), teacher.email],
        [t('teachers.phone'), teacher.phone || t('common.not_provided')],
        [t('teachers.specialization'), teacher.specialization || t('common.not_provided')],
        [t('teachers.location'), teacher.location || t('common.not_provided')],
        [t('teachers.joined'), formatDate(teacher.joinedDate)],
        ['', ''],
        [t('teachers.export.report_information'), ''],
        [t('teachers.export.month_year'), `${new Date(exportYear, exportMonth, 1).toLocaleString('default', { month: 'long' })} ${exportYear}`],
        [t('teachers.export.report_generated'), new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()],
        ['', ''],
      ];
      
      const teacherSheet = XLSX.utils.aoa_to_sheet(teacherData);
      
      // Set column widths for better readability
      teacherSheet['!cols'] = [
        { wch: 20 }, // Column A width
        { wch: 40 }  // Column B width
      ];
      
      XLSX.utils.book_append_sheet(wb, teacherSheet, t('teachers.export.teacher_info'));
      
      // Date range for filtered month
      const startOfMonth = new Date(exportYear, exportMonth, 1);
      const endOfMonth = new Date(exportYear, exportMonth + 1, 0);
      
      const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
      
      // 2. Course Sessions Sheet
      let courseSessionsData = [];
      
      // Add title and explanation
      courseSessionsData.push([t('teachers.export.courses_taught_by', { name: teacher.name, month: monthName, year: exportYear })]);
      courseSessionsData.push([t('teachers.export.value_explanation')]);
      courseSessionsData.push([]);
      
      // Header row with dates 1-31
      const courseHeaderRow = [t('courses.course_name')];
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
      const totalRow = [t('teachers.export.total_sessions')];
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
      
      XLSX.utils.book_append_sheet(wb, coursesSessionsSheet, `${t('courses.title')} - ${monthName}`);
      
      // 3. Kindergarten Classes Sessions Sheet
      let kgSessionsData = [];
      
      // Add title and explanation
      kgSessionsData.push([t('teachers.export.kindergarten_taught_by', { name: teacher.name, month: monthName, year: exportYear })]);
      kgSessionsData.push([t('teachers.export.value_explanation')]);
      kgSessionsData.push([]);
      
      // Header row with dates 1-31
      const kgHeaderRow = [t('kindergarten.class.name')];
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
      const kgTotalRow = [t('teachers.export.total_sessions')];
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
      
      XLSX.utils.book_append_sheet(wb, kgSessionsSheet, `${t('kindergarten.classes')} - ${monthName}`);
      
      // Generate filename
      const fileName = `${teacher.name.replace(/\s+/g, '_')}_${t('teachers.export.sessions')}_${monthName}_${exportYear}.xlsx`;
      
      // Export
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: t('teachers.export.success'),
        description: t('teachers.export.success_description', { fileName }),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting teacher sessions:', err);
      toast({
        title: t('teachers.export.failed'),
        description: t('teachers.export.failed_description'),
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

  if (!teacher) {
    return (
      <Box p={4} bg="yellow.50" borderWidth="1px" borderColor="yellow.200">
        <Heading size="md" mb={2} color="yellow.600">{t('teachers.teacher_not_found_title')}</Heading>
        <Text mb={4}>{t('teachers.teacher_not_found_description')}</Text>
        <Button as={Link} to="/teachers" leftIcon={<FaArrowLeft />} colorScheme="yellow" variant="outline">
          {t('teachers.back_to_teachers')}
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
          aria-label={t('teachers.back_to_teachers')}
          mr={4}
          variant="outline"
        />
        <Heading fontSize="xl" fontWeight="semibold">{t('teachers.teacher_details')}</Heading>
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
                  aria-label={t('teachers.edit_teacher')}
                />
                <IconButton
                  icon={<FaTrash />}
                  colorScheme="red"
                  variant="outline"
                  aria-label={t('teachers.delete_teacher')}
                  onClick={onOpen}
                />
                <IconButton
                  as={Link}
                  to={`/teachers/${teacherId}/schedule`}
                  icon={<FaCalendarAlt />}
                  colorScheme="brand"
                  aria-label={t('teachers.view_schedule')}
                />
                <IconButton
                  icon={<FaFileExport />}
                  colorScheme="green"
                  aria-label={t('teachers.export_sessions')}
                  onClick={onExportModalOpen}
                />
              </Flex>
            </Flex>

            <Badge bg="brand.50" color="brand.700" fontWeight="medium" px={2} py={1} mb={4}>
              {teacher.specialization || t('teachers.no_specialization')}
            </Badge>

            <Divider my={4} />

            <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }} gap={4}>
              <GridItem>
                <Text fontWeight="bold">{t('teachers.email')}:</Text>
                <Text>{teacher.email}</Text>
              </GridItem>
              <GridItem>
                <Text fontWeight="bold">{t('teachers.phone')}:</Text>
                <Text>{teacher.phone || t('common.not_provided')}</Text>
              </GridItem>
              {teacher.location && (
                <GridItem>
                  <Text fontWeight="bold">{t('teachers.location')}:</Text>
                  <Text>{teacher.location}</Text>
                </GridItem>
              )}
              {teacher.joinedDate && (
                <GridItem>
                  <Text fontWeight="bold">{t('teachers.joined')}:</Text>
                  <Text>{new Date(teacher.joinedDate).toLocaleDateString()}</Text>
                </GridItem>
              )}
            </Grid>

            {teacher.bio && (
              <>
                <Divider my={4} />
                <Text fontWeight="bold">{t('teachers.bio')}:</Text>
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
              {t('teachers.delete_teacher')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('teachers.delete_confirmation', { name: teacher.name })}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                {t('common.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Export Sessions Modal */}
      <Modal isOpen={isExportModalOpen} onClose={onExportModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('teachers.export.title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              {t('teachers.export.description', { name: teacher.name })}
            </Text>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>{t('teachers.export.month')}</FormLabel>
                <Select 
                  value={exportMonth} 
                  onChange={(e) => setExportMonth(parseInt(e.target.value))}
                >
                  <option value={0}>{t('teachers.export.january')}</option>
                  <option value={1}>{t('teachers.export.february')}</option>
                  <option value={2}>{t('teachers.export.march')}</option>
                  <option value={3}>{t('teachers.export.april')}</option>
                  <option value={4}>{t('teachers.export.may')}</option>
                  <option value={5}>{t('teachers.export.june')}</option>
                  <option value={6}>{t('teachers.export.july')}</option>
                  <option value={7}>{t('teachers.export.august')}</option>
                  <option value={8}>{t('teachers.export.september')}</option>
                  <option value={9}>{t('teachers.export.october')}</option>
                  <option value={10}>{t('teachers.export.november')}</option>
                  <option value={11}>{t('teachers.export.december')}</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>{t('teachers.export.year')}</FormLabel>
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
              {t('common.cancel')}
            </Button>
            <Button 
              colorScheme="green" 
              leftIcon={<FaFileExport />}
              onClick={exportSessionsToExcel}
              isLoading={exportLoading}
            >
              {t('teachers.export.download')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TeacherDetail; 