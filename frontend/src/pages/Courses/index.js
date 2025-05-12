import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../../api';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Upcoming': return 'status-upcoming';
      case 'Finished': return 'status-finished';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await coursesAPI.remove(courseId);
        // Refresh the course list
        fetchCourses();
      } catch (err) {
        console.error('Error deleting course:', err);
        setError('Failed to delete course. Please try again later.');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h1>Courses</h1>
        <Link to="/courses/new" className="new-course-btn">+ New Course</Link>
      </div>
      
      {courses.length === 0 ? (
        <div className="no-data-message">
          <p>No courses found. Add your first course to get started.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-card-header">
                <div className="course-name-wrapper">
                  <h3 className="course-name">{course.name}</h3>
                  <span className="course-level">{course.level}</span>
                </div>
                <span className={`course-status ${getStatusClass(course.status)}`}>
                  {course.status}
                </span>
              </div>
              
              <div className="course-card-content">
                <div className="course-detail">
                  <span className="detail-label">Branch:</span>
                  <span className="detail-value">{course.branch?.name || 'Unknown Branch'}</span>
                </div>
                
                <div className="course-detail">
                  <span className="detail-label">Teacher:</span>
                  <span className="detail-value">{course.teacher?.name || 'Unknown Teacher'}</span>
                </div>
                
                <div className="course-detail">
                  <span className="detail-label">Total enrolled students:</span>
                  <span className="detail-value">
                    {course.maxStudents || 0}
                  </span>
                </div>
                
                <div className="course-detail">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(course.startDate)}</span>
                </div>
                
                <div className="course-detail">
                  <span className="detail-label">End Date:</span>
                  <span className="detail-value">{formatDate(course.endDate)}</span>
                </div>
                
                <div className="course-detail">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">${course.price}</span>
                </div>
                
                <div className="course-progress">
                  <span className="detail-label">Progress:</span>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                    <span className="progress-text">{course.progress}%</span>
                  </div>
                </div>
              </div>
              
              <div className="course-card-actions">
                <Link to={`/courses/${course._id}`} className="action-btn view-btn">
                  View
                </Link>
                <Link to={`/courses/edit/${course._id}`} className="action-btn edit-btn">
                  Edit
                </Link>
                <button 
                  onClick={() => handleDeleteCourse(course._id)} 
                  className="action-btn delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses; 