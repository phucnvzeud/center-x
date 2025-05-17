/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import { Box, Flex, Text, Input, InputGroup, InputLeftElement, Button, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, VStack, HStack, Heading, Divider, useColorModeValue, Image } from '@chakra-ui/react';
import { FaGraduationCap, FaUserTie, FaBook, FaBuilding, FaHome, FaBell, FaBars, FaSearch, FaUserGraduate } from 'react-icons/fa';
import TeacherDetail from './pages/TeacherDetail';
import TeacherEdit from './pages/TeacherEdit';
import StudentManagement from './pages/StudentManagement';
import StudentForm from './pages/StudentForm';
import StudentDetail from './pages/StudentDetail';

// Layout component with sidebar
function Layout({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex w="100%" h="100vh">
      {/* Desktop Sidebar */}
      <Box 
        as="nav" 
        display={{ base: 'none', md: 'block' }}
        w="250px" 
        variant="sidebar"
        borderRightWidth="1px"
        borderColor="gray.200"
        bg="white"
        py={4}
        overflowY="auto"
      >
        <SidebarContent />
      </Box>
      
      {/* Mobile Sidebar Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Center X</DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* Main Content */}
      <Box flex="1" bg="gray.50" overflowY="auto">
        {/* Top Bar */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          px={4}
          py={2}
          bg="white"
          borderBottomWidth="1px"
          borderColor="gray.200"
        >
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            variant="ghost"
            icon={<FaBars />}
            onClick={onOpen}
            size="md"
          />
          
          <InputGroup maxW="400px" display={{ base: 'none', md: 'block' }}>
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input placeholder="Search..." borderColor="gray.200" />
          </InputGroup>
          
          <HStack spacing={4}>
            <Button 
              size="sm" 
              variant="outline"
            >
              Development
            </Button>
          </HStack>
        </Flex>
        
        {/* Page Content */}
        <Box as="main" p={6}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

// Sidebar content component
function SidebarContent() {
  const location = useLocation();
  
  const NavItem = ({ icon, children, to, section }) => {
    const isActive = location.pathname === to || (section && location.pathname.startsWith(section));
    
    return (
      <Flex
        align="center"
        px={4}
        py={3}
        mb={1}
        cursor="pointer"
        role="group"
        fontSize="sm"
        fontWeight="medium"
        color={isActive ? "brand.500" : "gray.600"}
        bg={isActive ? "brand.50" : "transparent"}
        borderLeftWidth={isActive ? "3px" : "0"}
        borderColor="brand.500"
        transition="all 0.2s"
        _hover={{
          bg: "gray.100",
        }}
        as={Link}
        to={to}
      >
        <Box mr={3} color={isActive ? "brand.500" : "gray.500"}>
          {icon}
        </Box>
        {children}
      </Flex>
    );
  };

  const SubNavItem = ({ children, to }) => {
    const isActive = location.pathname === to;
    
    return (
      <Flex
        align="center"
        pl={10}
        py={2}
        mb={1}
        cursor="pointer"
        role="group"
        fontSize="xs"
        fontWeight="medium"
        color={isActive ? "brand.500" : "gray.500"}
        transition="all 0.2s"
        _hover={{
          color: "brand.500",
        }}
        as={Link}
        to={to}
      >
        {children}
      </Flex>
    );
  };

  return (
    <Box>
      <Flex px={6} py={4} align="center" mb={6}>
        <Box mr={2} color="brand.500">
          <FaGraduationCap size="24px" />
        </Box>
        <Heading size="md" fontWeight="semibold">Center X</Heading>
      </Flex>
      
      <Box px={4} mb={8}>
        <Text color="gray.500" fontSize="xs" fontWeight="medium" mb={2} textTransform="uppercase">
          Projects
        </Text>
        <NavItem icon={<FaHome />} to="/">
          Dashboard
        </NavItem>
        <NavItem icon={<FaUserTie />} to="/teachers" section="/teachers">
          Teachers
        </NavItem>
        {location.pathname.startsWith('/teachers') && (
          <SubNavItem to="/teachers/manage">
            Manage Teachers
          </SubNavItem>
        )}
        <NavItem icon={<FaBook />} to="/courses" section="/courses">
          Courses
        </NavItem>
        <NavItem icon={<FaUserGraduate />} to="/students" section="/students">
          Students
        </NavItem>
        {location.pathname.startsWith('/students') && (
          <SubNavItem to="/students/manage">
            Manage Students
          </SubNavItem>
        )}
        <NavItem icon={<FaGraduationCap />} to="/kindergarten" section="/kindergarten">
          Kindergarten
        </NavItem>
        <NavItem icon={<FaBuilding />} to="/branches">
          Branches
        </NavItem>
        <NavItem icon={<FaBell />} to="/notifications">
          Notifications
        </NavItem>
      </Box>
      
      <Divider mb={8} />
      
      <Box px={4}>
        <Text color="gray.500" fontSize="xs" fontWeight="medium" mb={2} textTransform="uppercase">
          Workspace
        </Text>
        <NavItem icon={<Box as="span" w="4px" h="4px" bg="gray.400" />} to="/billing">
          Billing
        </NavItem>
        <NavItem icon={<Box as="span" w="4px" h="4px" bg="gray.400" />} to="/settings">
          Settings
        </NavItem>
      </Box>
    </Box>
  );
}

function App() {
  useEffect(() => {
    // Initialize AOS animation library
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
    });
  }, []);

  return (
    <NotificationProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/test" element={<TestComponent />} />
              <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/:teacherId" element={<TeacherDetail />} />
            <Route path="/teachers/:teacherId/edit" element={<TeacherEdit />} />
              <Route path="/teachers/manage" element={<TeachersManagement />} />
              <Route path="/teachers/:teacherId/schedule" element={<TeacherSchedule />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/new" element={<CourseForm />} />
              <Route path="/courses/edit/:courseId" element={<CourseForm />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/sessions" element={<Sessions />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/students/manage" element={<StudentManagement />} />
            <Route path="/students/new" element={<StudentForm />} />
            <Route path="/students/:studentId" element={<StudentDetail />} />
            <Route path="/students/:studentId/edit" element={<StudentForm />} />
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
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;