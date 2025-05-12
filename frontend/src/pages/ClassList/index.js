import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { kindergartenClassesAPI, schoolsAPI, regionsAPI, teachersAPI } from '../../api';
import './ClassList.css';

const ClassList = () => {
  const { schoolId } = useParams();
  const location = useLocation();
  
  const [classes, setClasses] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState(schoolId || '');
  
  // Data for filters
  const [teachers, setTeachers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  
  // For responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Determine if we're viewing classes for a specific school
  const isSchoolSpecific = !!schoolId;

  // State to track which dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Check window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoadingFilters(true);
        
        // Load teachers, regions, and schools in parallel
        const [teachersRes, regionsRes, schoolsRes] = await Promise.all([
          teachersAPI.getAll(),
          regionsAPI.getAll(),
          schoolsAPI.getAll()
        ]);
        
        setTeachers(teachersRes.data);
        setRegions(regionsRes.data);
        setSchools(schoolsRes.data);
        setLoadingFilters(false);
      } catch (err) {
        console.error('Error loading filter data:', err);
        setLoadingFilters(false);
      }
    };
    
    loadFilterData();
  }, []);

  // Load classes based on filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If a school ID is provided in the URL, it takes precedence
        if (isSchoolSpecific) {
          const [schoolResponse, classesResponse] = await Promise.all([
            schoolsAPI.getById(schoolId),
            schoolsAPI.getClasses(schoolId, statusFilter)
          ]);
          
          setSchool(schoolResponse.data);
          setClasses(classesResponse.data);
        } else {
          // Build filters for API request
          const filters = {};
          
          if (statusFilter) filters.status = statusFilter;
          if (teacherFilter) filters.teacher = teacherFilter;
          if (schoolFilter) filters.school = schoolFilter;
          // Region filter needs to be handled by filtering the results client-side
          
          const classesResponse = await kindergartenClassesAPI.getAll(filters);
          let filteredClasses = classesResponse.data;
          
          // Filter by region if needed
          if (regionFilter && schools.length > 0) {
            // Get schools in the selected region
            const schoolsInRegion = schools
              .filter(school => school.region === regionFilter || 
                               (school.region && school.region._id === regionFilter))
              .map(school => school._id);
              
            // Filter classes by these schools
            filteredClasses = filteredClasses.filter(cls => 
              cls.school && schoolsInRegion.includes(cls.school._id));
          }
          
          setClasses(filteredClasses);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching classes data:', err);
        setError('Failed to load classes data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [schoolId, isSchoolSpecific, statusFilter, teacherFilter, regionFilter, schoolFilter, schools]);

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await kindergartenClassesAPI.remove(classId);
        
        // Refresh the classes list with current filters
        setClasses(classes.filter(c => c._id !== classId));
      } catch (err) {
        console.error('Error deleting class:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to delete class. Please try again later.');
        }
      }
    }
  };

  // Handle reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTeacherFilter('');
    setRegionFilter('');
    if (!isSchoolSpecific) {
      setSchoolFilter('');
    }
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(kClass => 
    kClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // Check teacher name from either teacher object or teacherName field
    (kClass.teacher && kClass.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (kClass.teacherName && kClass.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to get teacher name
  const getTeacherName = (kClass) => {
    if (kClass.teacher && kClass.teacher.name) {
      return kClass.teacher.name;
    }
    return kClass.teacherName || 'Not assigned';
  };

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownId && !event.target.closest('.action-dropdown-container')) {
        setOpenDropdownId(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Toggle dropdown
  const toggleDropdown = (classId, event) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === classId ? null : classId);
  };

  if (loading) {
    return <div className="loading-spinner">Loading classes...</div>;
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
    <div className="class-list-container">
      <div className="class-list-header">
        <h1>
          {isSchoolSpecific && school ? `Classes in ${school.name}` : 'All Kindergarten Classes'}
        </h1>
        <Link to="/kindergarten/classes/new" 
          className="new-class-btn"
          state={{ schoolId: schoolId }}
        >
          + New Class
        </Link>
      </div>
      
      <div className="class-filters">
        <div className="search-filter-bar">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search classes or teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Teacher</label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="filter-select"
              disabled={loadingFilters}
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Region</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="filter-select"
              disabled={loadingFilters || isSchoolSpecific}
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region._id} value={region._id}>{region.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>School</label>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="filter-select"
              disabled={loadingFilters || isSchoolSpecific}
            >
              <option value="">All Schools</option>
              {schools
                .filter(school => !regionFilter || 
                  school.region === regionFilter || 
                  (school.region && school.region._id === regionFilter))
                .map(school => (
                  <option key={school._id} value={school._id}>{school.name}</option>
                ))
              }
            </select>
          </div>
          
          <button 
            className="reset-filters-btn"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {filteredClasses.length === 0 ? (
        <div className="no-data-message">
          {searchTerm || statusFilter || teacherFilter || regionFilter || schoolFilter ? 
            <p>No classes found with the current filters. Try different filters or add a new class.</p> :
            <p>No classes found. Add your first class to get started.</p>
          }
        </div>
      ) : (
        <div className="classes-table-container">
          {isMobile ? (
            // Mobile compact view
            <div className="classes-mobile-grid">
              {filteredClasses.map(kClass => (
                <div key={kClass._id} className="class-mobile-card">
                  <div className="class-mobile-header">
                    <h3>{kClass.name}</h3>
                    <span className={`class-status status-${kClass.status.toLowerCase()}`}>
                      {kClass.status}
                    </span>
                  </div>
                  
                  <div className="class-mobile-details">
                    {!isSchoolSpecific && (
                      <div className="detail-item">
                        <span className="detail-label">School:</span>
                        <span className="detail-value">{kClass.school ? kClass.school.name : 'Unknown'}</span>
                      </div>
                    )}
                    
                    <div className="detail-item">
                      <span className="detail-label">Teacher:</span>
                      <span className="detail-value">{getTeacherName(kClass)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Students:</span>
                      <span className="detail-value">{kClass.studentCount}</span>
                    </div>
                  </div>
                  
                  <div className="class-mobile-actions">
                    <div className="action-dropdown-container">
                      <button 
                        className="action-dropdown-toggle"
                        onClick={(e) => toggleDropdown(kClass._id, e)}
                      >
                        Actions <span className="dropdown-caret">▼</span>
                      </button>
                      {openDropdownId === kClass._id && (
                        <div className="action-dropdown-menu">
                          <Link to={`/kindergarten/classes/${kClass._id}`} className="dropdown-item">
                            <span className="dropdown-icon">👁️</span> View
                          </Link>
                          <Link to={`/kindergarten/classes/edit/${kClass._id}`} className="dropdown-item">
                            <span className="dropdown-icon">✏️</span> Edit
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(kClass._id);
                            }} 
                            className="dropdown-item delete-action"
                          >
                            <span className="dropdown-icon">🗑️</span> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop view - table
            <table className={`classes-table ${!isSchoolSpecific ? 'with-school' : ''}`}>
              <thead>
                <tr>
                  <th>Name</th>
                  {!isSchoolSpecific && <th>School</th>}
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>Age Group</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map(kClass => (
                  <tr key={kClass._id}>
                    <td>{kClass.name}</td>
                    {!isSchoolSpecific && (
                      <td>{kClass.school ? kClass.school.name : 'Unknown'}</td>
                    )}
                    <td>{getTeacherName(kClass)}</td>
                    <td className="center-align">{kClass.studentCount}</td>
                    <td>{kClass.ageGroup}</td>
                    <td>
                      {kClass.weeklySchedule && kClass.weeklySchedule.length > 0 ? (
                        <div className="schedule-info">
                          {kClass.weeklySchedule.map((schedule, index) => {
                            // Get first 3 letters of day and capitalize
                            const shortDay = schedule.day.substring(0, 3);
                            
                            return (
                              <div key={index} className="schedule-day">
                                <span className="day">{shortDay}:</span>
                                <span className="time">{schedule.startTime} - {schedule.endTime}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        'No schedule set'
                      )}
                    </td>
                    <td>
                      <span className={`class-status status-${kClass.status.toLowerCase()}`}>
                        {kClass.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-dropdown-container">
                        <button 
                          className="action-dropdown-toggle"
                          onClick={(e) => toggleDropdown(kClass._id, e)}
                        >
                          Actions <span className="dropdown-caret">▼</span>
                        </button>
                        {openDropdownId === kClass._id && (
                          <div className="action-dropdown-menu">
                            <Link to={`/kindergarten/classes/${kClass._id}`} className="dropdown-item">
                              <span className="dropdown-icon">👁️</span> View
                            </Link>
                            <Link to={`/kindergarten/classes/edit/${kClass._id}`} className="dropdown-item">
                              <span className="dropdown-icon">✏️</span> Edit
                            </Link>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClass(kClass._id);
                              }} 
                              className="dropdown-item delete-action"
                            >
                              <span className="dropdown-icon">🗑️</span> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      <div className="breadcrumb-navigation">
        <Link to="/kindergarten" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        {isSchoolSpecific && school && (
          <>
            <Link to="/kindergarten/schools" className="breadcrumb-link">Schools</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{school.name}</span>
          </>
        )}
        {!isSchoolSpecific && (
          <span className="breadcrumb-current">Classes</span>
        )}
      </div>
    </div>
  );
};

export default ClassList; 