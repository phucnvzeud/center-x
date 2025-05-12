import React, { useState, useEffect } from 'react';
import { teachersAPI, coursesAPI } from '../../api';
import { Chart } from 'react-google-charts';
import NotificationWidget from '../../components/NotificationWidget';
import './Dashboard.css';

const Dashboard = () => {
  const [teachersCount, setTeachersCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursesByStatus, setCoursesByStatus] = useState([]);
  const [teachersByBranch, setTeachersByBranch] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [teachersResponse, coursesResponse] = await Promise.all([
          teachersAPI.getAll(),
          coursesAPI.getAll()
        ]);
        
        // Set counts
        setTeachersCount(teachersResponse.data.length);
        setCoursesCount(coursesResponse.data.length);
        
        // Process course status data for chart
        processCourseStatusData(coursesResponse.data);
        
        // Process teacher branch data for chart
        processTeacherBranchData(teachersResponse.data);
        
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
        <div className="loading">Loading dashboard data...</div>
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
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon teacher-icon">👨‍🏫</div>
          <div className="stat-content">
            <div className="stat-value">{teachersCount}</div>
            <div className="stat-label">Teachers</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon course-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{coursesCount}</div>
            <div className="stat-label">Courses</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-charts">
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
        </div>
        
        <div className="dashboard-sidebar">
          <NotificationWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 