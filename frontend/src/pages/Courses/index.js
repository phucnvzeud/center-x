import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { coursesAPI, branchesAPI, teachersAPI } from '../../api';
import './Courses.css';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  
  // Reference data
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchReferenceData();
  }, []);
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [courses, searchTerm, statusFilter, levelFilter, branchFilter, teacherFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data);
      setFilteredCourses(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchReferenceData = async () => {
    try {
      // Fetch branches
      const branchesResponse = await branchesAPI.getAll();
      setBranches(branchesResponse.data);
      
      // Fetch teachers
      const teachersResponse = await teachersAPI.getAll();
      setTeachers(teachersResponse.data);
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  };
  
  const applyFilters = () => {
    let result = [...courses];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(course => 
        course.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(course => course.status === statusFilter);
    }
    
    // Apply level filter
    if (levelFilter) {
      result = result.filter(course => course.level === levelFilter);
    }
    
    // Apply branch filter
    if (branchFilter) {
      result = result.filter(course => course.branch?._id === branchFilter);
    }
    
    // Apply teacher filter
    if (teacherFilter) {
      result = result.filter(course => course.teacher?._id === teacherFilter);
    }
    
    setFilteredCourses(result);
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
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLevelFilter('');
    setBranchFilter('');
    setTeacherFilter('');
  };
  
  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  // Handle click on course card to navigate to course details
  const handleCourseClick = (courseId, event) => {
    // If the click is on a button or link (action buttons), don't navigate
    if (event.target.closest('button') || 
        event.target.closest('a') || 
        event.target.closest('.course-card-actions')) {
      return;
    }
    
    // Navigate to course details page
    navigate(`/courses/${courseId}`);
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
        <div className="header-actions">
          <button 
            className="filter-toggle-btn"
            onClick={toggleFilters}
          >
            {isFiltersVisible ? 'Hide Filters' : 'Show Filters'}
          </button>
          <Link to="/courses/new" className="new-course-btn">+ New Course</Link>
        </div>
      </div>
      
      {isFiltersVisible && (
        <div className="courses-filters">
          <div className="filter-row">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-group">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Finished">Finished</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Elementary">Elementary</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Upper Intermediate">Upper Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Proficient">Proficient</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.name}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={teacherFilter} 
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
          
          <div className="filter-summary">
            Showing {filteredCourses.length} of {courses.length} courses
            {(searchTerm || statusFilter || levelFilter || branchFilter || teacherFilter) && (
              <span className="active-filters">
                {searchTerm && <span className="filter-tag">Search: "{searchTerm}"</span>}
                {statusFilter && <span className="filter-tag">Status: {statusFilter}</span>}
                {levelFilter && <span className="filter-tag">Level: {levelFilter}</span>}
                {branchFilter && <span className="filter-tag">Branch: {branches.find(b => b._id === branchFilter)?.name || 'Unknown'}</span>}
                {teacherFilter && <span className="filter-tag">Teacher: {teachers.find(t => t._id === teacherFilter)?.name || 'Unknown'}</span>}
              </span>
            )}
          </div>
        </div>
      )}
      
      {filteredCourses.length === 0 ? (
        <div className="no-data-message">
          {courses.length === 0 ? (
            <p>No courses found. Add your first course to get started.</p>
          ) : (
            <p>No courses match your filter criteria. <button onClick={clearFilters} className="clear-filters-link">Clear filters</button></p>
          )}
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div 
              key={course._id} 
              className="course-card" 
              onClick={(e) => handleCourseClick(course._id, e)}
              style={{ cursor: 'pointer' }}
            >
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
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                    <span className="progress-text">{course.progress || 0}%</span>
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