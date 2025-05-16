import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teachersAPI, coursesAPI, studentsAPI, kindergartenClassesAPI, holidaysAPI } from '../../api';
import { Chart } from 'react-google-charts';
import NotificationWidget from '../../components/NotificationWidget';
import { FaUserGraduate, FaChalkboardTeacher, FaBook, FaCalendarAlt, FaSchool, FaUserFriends, FaExclamationTriangle, FaChartPie, FaChartBar, FaBell, FaUsersCog, FaLayerGroup, FaCheckSquare, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Box, Grid, GridItem, Heading, Text, Flex, Stack, Stat, StatLabel, StatNumber, Badge, Table, Thead, Tbody, Tr, Th, Td, Divider, SimpleGrid, useColorModeValue, Progress, HStack } from '@chakra-ui/react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    courses: 0,
    activeCourses: 0,
    upcomingCourses: 0,
    completedCourses: 0,
    cancelledCourses: 0,
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    classes: { total: 0, active: 0, inactive: 0 },
    schools: { total: 0 },
    regions: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesByStatus, setCoursesByStatus] = useState([]);
  const [teachersByBranch, setTeachersByBranch] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [nextHolidays, setNextHolidays] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [revenue, setRevenue] = useState({
    monthly: 0,
    annual: 0,
    lastMonth: 0,
    growth: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get current month range
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        
        // Fetch all data in parallel
        const [
          teachersResponse, 
          coursesResponse, 
          studentsResponse,
          kindergartenStatsResponse,
          holidaysResponse
        ] = await Promise.all([
          teachersAPI.getAll(),
          coursesAPI.getAll(),
          studentsAPI.getAll(),
          kindergartenClassesAPI.getStats(),
          holidaysAPI.getAll()
        ]);
        
        const courses = coursesResponse.data;
        const teachers = teachersResponse.data;
        const students = studentsResponse.data;
        
        // Get course status counts
        const activeCourses = courses.filter(c => c.status === 'Active');
        const upcomingCourses = courses.filter(c => c.status === 'Upcoming');
        const completedCourses = courses.filter(c => c.status === 'Completed');
        const cancelledCourses = courses.filter(c => c.status === 'Cancelled');
        
        // Calculate session statistics
        let totalSessions = 0;
        let completedSessions = 0;
        let upcomingSessionsList = [];
        let todaysSessionsList = [];
        
        // Extract upcoming sessions for the next 7 days
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        // Mock revenue data (replace with actual API calls when available)
        const mockRevenue = {
          monthly: Math.floor(Math.random() * 50000) + 10000,
          annual: Math.floor(Math.random() * 500000) + 100000,
          lastMonth: Math.floor(Math.random() * 40000) + 10000
        };
        mockRevenue.growth = ((mockRevenue.monthly - mockRevenue.lastMonth) / mockRevenue.lastMonth) * 100;
        setRevenue(mockRevenue);
        
        courses.forEach(course => {
          if (course.sessions) {
            totalSessions += course.sessions.length;
            
            course.sessions.forEach(session => {
              const sessionDate = new Date(session.date);
              
              if (session.status === 'Completed') {
                completedSessions++;
              }
              
              // Get today's sessions
              if (isSameDay(sessionDate, now) && session.status !== 'Canceled') {
                todaysSessionsList.push({
                  date: sessionDate,
                  courseName: course.name,
                  courseId: course._id,
                  status: session.status,
                  time: format(sessionDate, 'h:mm a')
                });
              }
              
              // Get upcoming sessions for next 7 days
              if (sessionDate > now && sessionDate < nextWeek && session.status !== 'Canceled') {
                upcomingSessionsList.push({
                  date: sessionDate,
                  courseName: course.name,
                  courseId: course._id,
                  status: session.status
                });
              }
            });
          }
        });
        
        // Sort today's sessions by time
        todaysSessionsList.sort((a, b) => a.date - b.date);
        setTodaySessions(todaysSessionsList);
        
        // Sort upcoming sessions by date
        upcomingSessionsList.sort((a, b) => a.date - b.date);
        setUpcomingSessions(upcomingSessionsList.slice(0, 5)); // Get top 5
        
        // Get upcoming holidays
        const futureHolidays = holidaysResponse.data
          .filter(h => new Date(h.startDate) > now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setNextHolidays(futureHolidays.slice(0, 3)); // Get next 3 holidays
        
        // Get 5 most recent courses
        const sortedCourses = [...courses].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setRecentCourses(sortedCourses.slice(0, 5));
        
        // Ensure kindergartenStatsResponse data has proper structure
        const kindergartenStats = kindergartenStatsResponse.data || {};
        const processedStats = {
          classes: kindergartenStats.classes || { total: 0, active: 0, inactive: 0 },
          schools: kindergartenStats.schools || { total: 0 },
          regions: kindergartenStats.regions || { total: 0 }
        };
        
        // Set overall statistics
        setStats({
          teachers: teachers.length,
          students: students.length,
          courses: courses.length,
          activeCourses: activeCourses.length,
          upcomingCourses: upcomingCourses.length,
          completedCourses: completedCourses.length,
          cancelledCourses: cancelledCourses.length,
          totalSessions,
          completedSessions,
          upcomingSessions: upcomingSessionsList.length,
          ...processedStats
        });
        
        // Process course status data for chart
        processCourseStatusData(courses);
        
        // Process teacher branch data for chart
        processTeacherBranchData(teachers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Process course data by status for chart
  const processCourseStatusData = (courses) => {
    const statusCounts = {
      'Active': 0,
      'Completed': 0,
      'Cancelled': 0,
      'Upcoming': 0
    };
    
    courses.forEach(course => {
      const status = course.status || 'Unknown';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts['Unknown'] = (statusCounts['Unknown'] || 0) + 1;
      }
    });
    
    const chartData = [
      ['Status', 'Count'],
      ...Object.entries(statusCounts).map(([status, count]) => [status, count])
    ];
    
    setCoursesByStatus(chartData);
  };
  
  // Process teacher data by branch for chart
  const processTeacherBranchData = (teachers) => {
    const branchCounts = {};
    
    teachers.forEach(teacher => {
      const branchName = teacher.branch?.name || 'Unassigned';
      branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
    });
    
    const chartData = [
      ['Branch', 'Teachers'],
      ...Object.entries(branchCounts).map(([branch, count]) => [branch, count])
    ];
    
    setTeachersByBranch(chartData);
  };

  const chartOptions = {
    backgroundColor: 'transparent',
    colors: ['#805ad5', '#6b46c1', '#9f7aea', '#d6bfff'],
    legend: { position: 'bottom', textStyle: { color: '#4b5563', fontSize: 12 } },
    chartArea: { width: '90%', height: '80%' },
    is3D: false,
    pieHole: 0.4,
    sliceVisibilityThreshold: 0.05,
  };

  if (loading) {
    return (
      <Box p={4}>
        <Text color="gray.500">Loading dashboard data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200">
        <Heading size="md" mb={2} color="red.600">Error</Heading>
        <Text mb={4}>{error}</Text>
        <Box as="button" bg="red.100" px={4} py={2} color="red.700" fontWeight="medium" _hover={{ bg: "red.200" }} onClick={() => window.location.reload()}>
          Try Again
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6} fontSize="xl" fontWeight="semibold">Dashboard</Heading>
      
      {/* Recent Notifications - Now at the top and full width */}
      <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} mb={6} borderRadius="md" shadow="sm">
        <Flex align="center" mb={4}>
          <Box color="purple.500" mr={2}>
            <FaBell />
          </Box>
          <Heading size="sm">Recent Activity & Notifications</Heading>
        </Flex>
        <NotificationWidget limit={5} />
      </Box>
      
      {/* Key Metrics Overview */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={6}>
        <StatCard 
          icon={<FaChalkboardTeacher />} 
          title="Teachers" 
          value={stats.teachers} 
          iconBg="purple.100" 
          iconColor="purple.500" 
          to="/teachers" 
        />
        <StatCard 
          icon={<FaUserGraduate />} 
          title="Students" 
          value={stats.students} 
          iconBg="blue.100" 
          iconColor="blue.500" 
          to="/students" 
        />
        <StatCard 
          icon={<FaBook />} 
          title="Courses" 
          value={stats.courses} 
          iconBg="green.100" 
          iconColor="green.500" 
          to="/courses" 
        />
        <StatCard 
          icon={<FaSchool />} 
          title="Schools" 
          value={stats.schools.total} 
          iconBg="orange.100" 
          iconColor="orange.500" 
          to="/kindergarten/schools" 
        />
        <StatCard 
          icon={<FaUsersCog />} 
          title="Classes" 
          value={stats.classes.total} 
          iconBg="teal.100" 
          iconColor="teal.500" 
          to="/kindergarten/classes" 
        />
        <StatCard 
          icon={<FaLayerGroup />} 
          title="Sessions" 
          value={stats.totalSessions} 
          iconBg="yellow.100" 
          iconColor="yellow.500" 
          to="/sessions" 
        />
      </SimpleGrid>
      
      {/* Course Status Stats */}
      <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} mb={6} borderRadius="md" shadow="sm">
        <Flex align="center" mb={4}>
          <Box color="purple.500" mr={2}>
            <FaCheckSquare />
          </Box>
          <Heading size="sm">Course Status Overview</Heading>
        </Flex>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <StatusStatCard title="Active Courses" value={stats.activeCourses} colorScheme="green" />
          <StatusStatCard title="Upcoming" value={stats.upcomingCourses} colorScheme="blue" />
          <StatusStatCard title="Completed" value={stats.completedCourses} colorScheme="purple" />
          <StatusStatCard title="Cancelled" value={stats.cancelledCourses} colorScheme="red" />
        </SimpleGrid>
        <Box mt={4}>
          <Text fontSize="sm" fontWeight="medium" mb={1}>Sessions Completion</Text>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color="gray.500">
              {stats.completedSessions} of {stats.totalSessions} Total Sessions
            </Text>
            <Text fontSize="xs" fontWeight="bold" ml="auto">
              {stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
            </Text>
          </Flex>
          <Progress 
            value={stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0} 
            size="sm" 
            colorScheme="purple" 
            borderRadius="full"
          />
        </Box>
      </Box>
          
      {/* Revenue Overview (Mocked Data) */}
      <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} mb={6} borderRadius="md" shadow="sm">
        <Flex align="center" mb={4}>
          <Box color="purple.500" mr={2}>
            <FaMoneyBillWave />
          </Box>
          <Heading size="sm">Revenue Overview</Heading>
        </Flex>
        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
          <Box p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.500">Monthly Revenue</Text>
            <Text fontSize="2xl" fontWeight="bold">${revenue.monthly.toLocaleString()}</Text>
            <HStack mt={1}>
              <Badge colorScheme={revenue.growth >= 0 ? "green" : "red"}>
                {revenue.growth >= 0 ? "+" : ""}{revenue.growth.toFixed(1)}%
              </Badge>
              <Text fontSize="xs" color="gray.500">vs last month</Text>
            </HStack>
          </Box>
          <Box p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.500">Annual Revenue</Text>
            <Text fontSize="2xl" fontWeight="bold">${revenue.annual.toLocaleString()}</Text>
          </Box>
          <Box p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.500">Revenue Per Student</Text>
            <Text fontSize="2xl" fontWeight="bold">
              ${stats.students > 0 ? Math.round(revenue.annual / stats.students).toLocaleString() : 0}
            </Text>
          </Box>
        </SimpleGrid>
      </Box>
      
      <Grid templateColumns={{ base: "1fr", lg: "1fr 350px" }} gap={6}>
        <Box>
          {/* Today's Sessions */}
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} mb={6} borderRadius="md" shadow="sm">
            <Flex align="center" mb={4}>
              <Box color="purple.500" mr={2}>
                <FaClock />
              </Box>
              <Heading size="sm">Today's Schedule</Heading>
            </Flex>
            {todaySessions.length > 0 ? (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Time</Th>
                    <Th>Course</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {todaySessions.map((session, index) => (
                    <Tr key={index}>
                      <Td fontWeight="medium">{session.time}</Td>
                      <Td>
                        <Link to={`/courses/${session.courseId}`} style={{ color: '#805ad5' }}>
                          {session.courseName}
                        </Link>
                      </Td>
                      <Td>
                        <CourseStatusBadge status={session.status} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>No sessions scheduled for today</Text>
            )}
          </Box>
        
          {/* Course Status Distribution Chart */}
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} mb={6} borderRadius="md" shadow="sm">
            <Flex align="center" mb={4}>
              <Box color="purple.500" mr={2}>
                <FaChartPie />
              </Box>
              <Heading size="sm">Course Status Distribution</Heading>
            </Flex>
            <Box height="300px">
              {coursesByStatus.length > 1 && (
                <Chart
                  chartType="PieChart"
                  data={coursesByStatus}
                  options={{
                    ...chartOptions,
                    title: '',
                  }}
                  width="100%"
                  height="100%"
                />
              )}
            </Box>
          </Box>
          
          {/* Recent Courses */}
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} borderRadius="md" shadow="sm">
            <Flex align="center" mb={4}>
              <Box color="purple.500" mr={2}>
                <FaBook />
              </Box>
              <Heading size="sm">Recent Courses</Heading>
            </Flex>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Course Name</Th>
                  <Th>Status</Th>
                  <Th>Students</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentCourses.map((course) => (
                  <Tr key={course._id}>
                    <Td>
                      <Link to={`/courses/${course._id}`} style={{ color: '#805ad5' }}>
                        {course.name}
                      </Link>
                    </Td>
                    <Td>
                      <CourseStatusBadge status={course.status} />
                    </Td>
                    <Td>{course.students?.length || 0}</Td>
                  </Tr>
                ))}
                {recentCourses.length === 0 && (
                  <Tr>
                    <Td colSpan={3}>No courses found</Td>
                  </Tr>
              )}
              </Tbody>
            </Table>
          </Box>
        </Box>
        
        <Stack spacing={6}>
          {/* Teachers by Branch Chart */}
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} borderRadius="md" shadow="sm">
            <Flex align="center" mb={4}>
              <Box color="purple.500" mr={2}>
                <FaChartBar />
              </Box>
              <Heading size="sm">Teachers by Branch</Heading>
            </Flex>
            <Box height="300px">
              {teachersByBranch.length > 1 && (
                <Chart
                  chartType="BarChart"
                  data={teachersByBranch}
                  options={{
                    ...chartOptions,
                    title: '',
                    hAxis: { title: 'Teachers', titleTextStyle: { color: '#4b5563' } },
                    vAxis: { title: 'Branch', titleTextStyle: { color: '#4b5563' } },
                  }}
                  width="100%"
                  height="100%"
                />
              )}
            </Box>
          </Box>
          
          {/* Upcoming Sessions */}
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} borderRadius="md" shadow="sm">
            <Flex align="center" mb={4}>
              <Box color="purple.500" mr={2}>
                <FaCalendarAlt />
              </Box>
              <Heading size="sm">Upcoming Sessions</Heading>
            </Flex>
                {upcomingSessions.length > 0 ? (
              <Stack spacing={3}>
                {upcomingSessions.map((session, index) => (
                  <Box 
                    key={index} 
                    p={3} 
                    bg="gray.50" 
                    _hover={{ bg: "gray.100" }}
                    borderRadius="md"
                  >
                    <Text fontWeight="medium" fontSize="sm">
                      <Link to={`/courses/${session.courseId}`} style={{ color: '#805ad5' }}>
                        {session.courseName}
                    </Link>
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {format(new Date(session.date), 'MMM dd, yyyy • h:mm a')}
                    </Text>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text fontSize="sm" color="gray.500">No upcoming sessions</Text>
            )}
          </Box>
          
          {/* Upcoming Holidays */}
          <Box bg="white" borderWidth="1px" borderColor="gray.200" p={4} borderRadius="md" shadow="sm">
            <Flex align="center" mb={4}>
              <Box color="purple.500" mr={2}>
                <FaExclamationTriangle />
              </Box>
              <Heading size="sm">Upcoming Holidays</Heading>
            </Flex>
                {nextHolidays.length > 0 ? (
              <Stack spacing={3}>
                {nextHolidays.map((holiday) => (
                  <Box 
                    key={holiday._id} 
                    p={3} 
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <Text fontWeight="medium" fontSize="sm">{holiday.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                          {format(new Date(holiday.startDate), 'MMM dd')} - {format(new Date(holiday.endDate), 'MMM dd, yyyy')}
                    </Text>
                  </Box>
                ))}
              </Stack>
                ) : (
              <Text fontSize="sm" color="gray.500">No upcoming holidays</Text>
                )}
          </Box>
        </Stack>
      </Grid>
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, iconBg, iconColor, to }) => {
  return (
    <Box 
      as={Link}
      to={to}
      bg="white" 
      borderWidth="1px" 
      borderColor="gray.200"
      p={4}
      borderRadius="md"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: "md", borderColor: "purple.200", transform: "translateY(-2px)" }}
    >
      <Flex align="center" mb={2}>
        <Flex
          w="32px"
          h="32px"
          align="center"
          justify="center"
          bg={iconBg}
          color={iconColor}
          mr={3}
          fontSize="lg"
          borderRadius="md"
        >
          {icon}
        </Flex>
        <Text fontWeight="medium" color="gray.600" fontSize="sm">{title}</Text>
      </Flex>
      <Text fontSize="2xl" fontWeight="bold">{value.toLocaleString()}</Text>
    </Box>
  );
};

// Status Stat Card Component
const StatusStatCard = ({ title, value, colorScheme }) => {
  return (
    <Box
      bg={`${colorScheme}.50`}
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor={`${colorScheme}.200`}
    >
      <Text fontSize="sm" color={`${colorScheme}.700`} mb={1}>{title}</Text>
      <Text fontSize="2xl" fontWeight="bold" color={`${colorScheme}.700`}>{value}</Text>
    </Box>
  );
};

// Course Status Badge Component
const CourseStatusBadge = ({ status }) => {
  let color;
  switch (status) {
    case 'Active':
      color = 'green';
      break;
    case 'Upcoming':
      color = 'blue';
      break;
    case 'Completed':
      color = 'purple';
      break;
    case 'Cancelled':
      color = 'red';
      break;
    default:
      color = 'gray';
  }
  
  return (
    <Badge colorScheme={color} variant="subtle" px={2}>
      {status}
    </Badge>
  );
};

export default Dashboard; 