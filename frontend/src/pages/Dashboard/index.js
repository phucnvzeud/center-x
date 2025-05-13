import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teachersAPI, coursesAPI, studentsAPI, kindergartenClassesAPI, holidaysAPI } from '../../api';
import { Chart } from 'react-google-charts';
import NotificationWidget from '../../components/NotificationWidget';
import { FaUserGraduate, FaChalkboardTeacher, FaBook, FaCalendarAlt, FaSchool, FaUserFriends, FaExclamationTriangle } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
        
        // Extract upcoming sessions for the next 7 days
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        courses.forEach(course => {
          if (course.sessions) {
            totalSessions += course.sessions.length;
            
            course.sessions.forEach(session => {
              const sessionDate = new Date(session.date);
              
              if (session.status === 'Completed') {
                completedSessions++;
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* Main Stats */}
          <section className="dashboard-summary">
            <h2>System Overview</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon teacher-icon">
                  <FaChalkboardTeacher />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.teachers || 0}</div>
                  <div className="stat-label">Teachers</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon student-icon">
                  <FaUserGraduate />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.students || 0}</div>
                  <div className="stat-label">Students</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon course-icon">
                  <FaBook />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.courses || 0}</div>
                  <div className="stat-label">Courses</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon session-icon">
                  <FaCalendarAlt />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalSessions || 0}</div>
                  <div className="stat-label">Sessions</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon school-icon">
                  <FaSchool />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.schools && stats.schools.total ? stats.schools.total : 0}</div>
                  <div className="stat-label">Schools</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon class-icon">
                  <FaUserFriends />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.classes && stats.classes.total ? stats.classes.total : 0}</div>
                  <div className="stat-label">Classes</div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Course Stats Detail */}
          <section className="dashboard-detail-stats">
            <h2>Course Status</h2>
            <div className="detail-stats-container">
              <div className="detail-stat-card active-stat">
                <div className="detail-stat-number">{stats.activeCourses || 0}</div>
                <div className="detail-stat-label">Active Courses</div>
              </div>
              <div className="detail-stat-card upcoming-stat">
                <div className="detail-stat-number">{stats.upcomingCourses || 0}</div>
                <div className="detail-stat-label">Upcoming Courses</div>
              </div>
              <div className="detail-stat-card complete-stat">
                <div className="detail-stat-number">{stats.completedCourses || 0}</div>
                <div className="detail-stat-label">Completed Courses</div>
              </div>
              <div className="detail-stat-card cancelled-stat">
                <div className="detail-stat-number">{stats.cancelledCourses || 0}</div>
                <div className="detail-stat-label">Cancelled Courses</div>
              </div>
            </div>
          </section>
          
          {/* Session Progress */}
          <section className="dashboard-progress">
            <h2>Session Progress</h2>
            <div className="progress-bar-container">
              <div className="progress-info">
                <span>Completed: {stats.completedSessions}</span>
                <span>{stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0}%` }}>
                </div>
              </div>
              <div className="progress-total">
                Total Sessions: {stats.totalSessions}
              </div>
            </div>
          </section>
          
          {/* Charts */}
          <section className="dashboard-charts">
            <div className="chart-container">
              <h2>Courses by Status</h2>
              {coursesByStatus.length > 1 ? (
                <Chart
                  width={'100%'}
                  height={'300px'}
                  chartType="PieChart"
                  loader={<div>Loading Chart...</div>}
                  data={coursesByStatus}
                  options={{
                    pieHole: 0.4,
                    colors: ['#4CAF50', '#2196F3', '#F44336', '#FFC107'],
                    chartArea: { width: '90%', height: '90%' },
                    legend: { position: 'right' }
                  }}
                />
              ) : (
                <div className="no-data">No course data available</div>
              )}
            </div>
            
            <div className="chart-container">
              <h2>Teachers by Branch</h2>
              {teachersByBranch.length > 1 ? (
                <Chart
                  width={'100%'}
                  height={'300px'}
                  chartType="BarChart"
                  loader={<div>Loading Chart...</div>}
                  data={teachersByBranch}
                  options={{
                    chartArea: { width: '70%' },
                    hAxis: { title: 'Teachers' },
                    vAxis: { title: 'Branch' },
                    colors: ['#673AB7']
                  }}
                />
              ) : (
                <div className="no-data">No teacher data available</div>
              )}
            </div>
          </section>
          
          {/* Quick Insights */}
          <section className="dashboard-insights">
            <div className="insight-column">
              <h2>Upcoming Sessions</h2>
              <div className="insight-list">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session, index) => (
                    <Link to={`/courses/${session.courseId}`} key={index} className="insight-item">
                      <div className="insight-date">{format(session.date, 'MMM dd')}</div>
                      <div className="insight-content">
                        <div className="insight-title">{session.courseName}</div>
                        <div className="insight-details">{format(session.date, 'h:mm a')}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="no-data">No upcoming sessions</div>
                )}
              </div>
            </div>
            
            <div className="insight-column">
              <h2>Recent Courses</h2>
              <div className="insight-list">
                {recentCourses.length > 0 ? (
                  recentCourses.map(course => (
                    <Link to={`/courses/${course._id}`} key={course._id} className="insight-item">
                      <div className="insight-icon">
                        <FaBook />
                      </div>
                      <div className="insight-content">
                        <div className="insight-title">{course.name}</div>
                        <div className="insight-details">
                          Status: <span className={`status-badge status-${course.status?.toLowerCase()}`}>{course.status}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="no-data">No courses available</div>
                )}
              </div>
            </div>
            
            <div className="insight-column holidays-column">
              <h2>Upcoming Holidays</h2>
              <div className="insight-list">
                {nextHolidays.length > 0 ? (
                  nextHolidays.map(holiday => (
                    <div key={holiday._id} className="insight-item holiday-item">
                      <div className="insight-icon holiday-icon">
                        <FaExclamationTriangle />
                      </div>
                      <div className="insight-content">
                        <div className="insight-title">{holiday.name}</div>
                        <div className="insight-details">
                          {format(new Date(holiday.startDate), 'MMM dd')} - {format(new Date(holiday.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No upcoming holidays</div>
                )}
              </div>
            </div>
          </section>
        </div>
        
        <div className="dashboard-sidebar">
          <NotificationWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 