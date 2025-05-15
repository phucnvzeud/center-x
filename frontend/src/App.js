import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import AOS from 'aos';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Courses from './pages/Courses';
import Branches from './pages/Branches';
import CourseForm from './pages/CourseForm';
import CourseDetail from './pages/CourseDetail';
import Sessions from './pages/Sessions';
import TeachersManagement from './pages/TeachersManagement';
import TeacherSchedule from './pages/TeacherSchedule';
import KindergartenDashboard from './pages/KindergartenDashboard';
import RegionList from './pages/RegionList';
import RegionForm from './pages/RegionForm';
import SchoolList from './pages/SchoolList';
import SchoolForm from './pages/SchoolForm';
import ClassList from './pages/ClassList';
import ClassForm from './pages/ClassForm';
import ClassDetail from './pages/ClassDetail';
import TestComponent from './pages/ClassDetail/TestComponent';
import Notifications from './pages/Notifications';
import { NotificationProvider } from './context/NotificationContext';
import NotificationIcon from './components/NotificationIcon';
import KindergartenNavBar from './components/KindergartenNavBar';
import { Box, Flex, Text, Button, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, VStack, HStack, Heading, useColorModeValue } from '@chakra-ui/react';
import { FaGraduationCap, FaUserTie, FaBook, FaBuilding, FaHome, FaBell, FaBars } from 'react-icons/fa';

function App() {
  const [location, setLocation] = useState(window.location.pathname);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // Initialize AOS animation library
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
    });
  }, []);

  // Listen for location changes
  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(window.location.pathname);
      // Close mobile drawer when navigating
      if (isOpen) onClose();
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [isOpen, onClose]);

  const isActive = (path) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <NotificationProvider>
      <Router>
        <Box className="app" minH="100vh">
          {/* Modern Header with Glassmorphism */}
          <Box 
            as="header" 
            className="glass-card" 
            position="sticky" 
            top="0" 
            zIndex="1000"
            py={3}
            px={5}
          >
            <Flex justify="space-between" align="center">
              <Flex align="center">
                <Box 
                  className="bg-gradient-primary" 
                  w="40px" 
                  h="40px" 
                  borderRadius="full" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  mr={3}
                >
                  <FaGraduationCap color="white" size="20px" />
                </Box>
                <Heading 
                  as="h1" 
                  size="md" 
                  className="text-gradient-primary"
                  display={{ base: 'none', md: 'block' }}
                >
                  Center X Education
                </Heading>
              </Flex>

              {/* Desktop Navigation */}
              <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
                <NavLink to="/" label="Dashboard" icon={<FaHome />} isActive={isActive('/')} />
                <NavLink to="/teachers" label="Teachers" icon={<FaUserTie />} isActive={isActive('/teachers')} />
                <NavLink to="/courses" label="Courses" icon={<FaBook />} isActive={isActive('/courses')} />
                <NavLink to="/kindergarten" label="Kindergarten" icon={<FaGraduationCap />} isActive={isActive('/kindergarten')} />
                <NavLink to="/branches" label="Branches" icon={<FaBuilding />} isActive={isActive('/branches')} />
              </HStack>

              <HStack>
                <Box position="relative">
                  <IconButton
                    aria-label="Notifications"
                    icon={<FaBell />}
                    variant="ghost"
                    colorScheme="brand"
                    as={Link}
                    to="/notifications"
                  />
                <NotificationIcon />
                </Box>
                
                {/* Mobile menu button */}
                <IconButton
                  display={{ base: 'flex', md: 'none' }}
                  aria-label="Open menu"
                  fontSize="20px"
                  variant="ghost"
                  icon={<FaBars />}
                  onClick={onOpen}
                />
              </HStack>
            </Flex>
          </Box>

          {/* Mobile Navigation Drawer */}
          <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
            <DrawerOverlay backdropFilter="blur(10px)" />
            <DrawerContent className="glass-card">
              <DrawerCloseButton />
              <DrawerHeader className="text-gradient-primary">Menu</DrawerHeader>
              <DrawerBody>
                <VStack spacing={4} align="stretch">
                  <MobileNavLink to="/" label="Dashboard" icon={<FaHome />} isActive={isActive('/')} onClick={onClose} />
                  <MobileNavLink to="/teachers" label="Teachers" icon={<FaUserTie />} isActive={isActive('/teachers')} onClick={onClose} />
                  <MobileNavLink to="/courses" label="Courses" icon={<FaBook />} isActive={isActive('/courses')} onClick={onClose} />
                  <MobileNavLink to="/kindergarten" label="Kindergarten" icon={<FaGraduationCap />} isActive={isActive('/kindergarten')} onClick={onClose} />
                  <MobileNavLink to="/branches" label="Branches" icon={<FaBuilding />} isActive={isActive('/branches')} onClick={onClose} />
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
          
          {/* Conditional Kindergarten NavBar */}
          {location.includes('/kindergarten') && <KindergartenNavBar />}
          
          <Box as="main" className="app-content" py={6} px={4}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/test" element={<TestComponent />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/teachers/manage" element={<TeachersManagement />} />
              <Route path="/teachers/:teacherId/schedule" element={<TeacherSchedule />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/new" element={<CourseForm />} />
              <Route path="/courses/edit/:courseId" element={<CourseForm />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/sessions" element={<Sessions />} />
              <Route path="/kindergarten" element={<KindergartenDashboard />} />
              <Route path="/kindergarten/regions" element={<RegionList />} />
              <Route path="/kindergarten/regions/new" element={<RegionForm />} />
              <Route path="/kindergarten/regions/edit/:regionId" element={<RegionForm />} />
              <Route path="/kindergarten/regions/:regionId/schools" element={<SchoolList />} />
              <Route path="/kindergarten/schools" element={<SchoolList />} />
              <Route path="/kindergarten/schools/new" element={<SchoolForm />} />
              <Route path="/kindergarten/schools/edit/:schoolId" element={<SchoolForm />} />
              <Route path="/kindergarten/schools/:schoolId/classes" element={<ClassList />} />
              <Route path="/kindergarten/classes" element={<ClassList />} />
              <Route path="/kindergarten/classes/new" element={<ClassForm />} />
              <Route path="/kindergarten/classes/edit/:classId" element={<ClassForm />} />
              <Route path="/kindergarten/classes/:classId" element={<ClassDetail />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </Box>
          
          <Box 
            as="footer" 
            className="glass-card" 
            py={3} 
            px={5} 
            textAlign="center"
            mt="auto"
          >
            <Text>&copy; 2024 Center X Education Management</Text>
          </Box>
        </Box>
      </Router>
    </NotificationProvider>
  );
}

// Navigation Link Component for desktop
const NavLink = ({ to, label, icon, isActive }) => (
  <Button
    as={Link}
    to={to}
    variant={isActive ? "primary" : "ghost"}
    colorScheme="brand"
    leftIcon={icon}
    fontWeight="medium"
    size="sm"
    borderRadius="full"
    transition="all 0.3s"
    _hover={{ transform: 'translateY(-2px)' }}
  >
    {label}
  </Button>
);

// Navigation Link Component for mobile
const MobileNavLink = ({ to, label, icon, isActive, onClick }) => (
  <Button
    as={Link}
    to={to}
    variant={isActive ? "primary" : "ghost"}
    colorScheme="brand"
    leftIcon={icon}
    justifyContent="flex-start"
    w="100%"
    onClick={onClick}
  >
    {label}
  </Button>
);

export default App;