import React, { useState, useEffect } from 'react';
import { teachersAPI, coursesAPI } from '../../api';
import './TeachersManagement.css';

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [teacherKindergartenClasses, setTeacherKindergartenClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    active: true
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers. Please try again.');
      setLoading(false);
    }
  };

  const fetchTeacherCourses = async (teacherId) => {
    try {
      setLoading(true);
      const response = await teachersAPI.getCourses(teacherId);
      setTeacherCourses(response.data);
      
      // Fetch kindergarten classes taught by this teacher
      const classesResponse = await teachersAPI.getKindergartenClasses(teacherId);
      setTeacherKindergartenClasses(classesResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
      setError('Failed to load teacher courses. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    await fetchTeacherCourses(teacher._id);
  };
  
  const handleViewSchedule = (teacherId) => {
    window.location.href = `/teachers/${teacherId}/schedule`;
  };

  const handleNewTeacher = () => {
    setSelectedTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      qualification: '',
      active: true
    });
    setIsFormVisible(true);
  };

  const handleEditTeacher = () => {
    setFormData({
      name: selectedTeacher.name,
      email: selectedTeacher.email,
      phone: selectedTeacher.phone || '',
      specialization: selectedTeacher.specialization || '',
      qualification: selectedTeacher.qualification || '',
      active: selectedTeacher.active
    });
    setIsFormVisible(true);
  };

  const handleDeleteTeacher = async () => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      await teachersAPI.remove(selectedTeacher._id);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher. They may have courses assigned.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedTeacher) {
        // Update existing teacher
        await teachersAPI.update(selectedTeacher._id, formData);
      } else {
        // Create new teacher
        await teachersAPI.create(formData);
      }
      
      setIsFormVisible(false);
      fetchTeachers();
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError('Failed to save teacher. Please check the form and try again.');
    }
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
  };

  if (loading && teachers.length === 0) {
    return <div className="loading-state">Loading teachers...</div>;
  }

  return (
    <div className="teachers-management-container">
      <div className="teachers-management-header">
        <h1>Teachers Management</h1>
        <button 
          className="new-teacher-btn"
          onClick={handleNewTeacher}
        >
          Add New Teacher
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="teachers-management-content">
        <div className="teachers-list-container">
          <h2>Teachers</h2>
          {teachers.length === 0 ? (
            <p className="no-data-message">No teachers found.</p>
          ) : (
            <ul className="teachers-list">
              {teachers.map(teacher => (
                <li 
                  key={teacher._id} 
                  className={`teacher-item ${selectedTeacher && selectedTeacher._id === teacher._id ? 'active' : ''} ${!teacher.active ? 'inactive' : ''}`}
                  onClick={() => handleSelectTeacher(teacher)}
                >
                  <div className="teacher-name">{teacher.name}</div>
                  <div className="teacher-email">{teacher.email}</div>
                  {!teacher.active && <span className="inactive-badge">Inactive</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="teacher-details-container">
          {!selectedTeacher && !isFormVisible ? (
            <div className="no-selection-message">
              <p>Select a teacher from the list or add a new one.</p>
            </div>
          ) : isFormVisible ? (
            <div className="teacher-form-container">
              <h2>{selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <form onSubmit={handleSubmitForm} className="teacher-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="qualification">Qualification</label>
                  <input
                    type="text"
                    id="qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleCheckboxChange}
                  />
                  <label htmlFor="active">Active</label>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-btn"
                  >
                    {selectedTeacher ? 'Update Teacher' : 'Add Teacher'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="teacher-details">
              <h2>{selectedTeacher.name}</h2>
              <div className="teacher-info">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{selectedTeacher.email}</span>
                </div>
                
                {selectedTeacher.phone && (
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{selectedTeacher.phone}</span>
                  </div>
                )}
                
                {selectedTeacher.specialization && (
                  <div className="info-row">
                    <span className="info-label">Specialization:</span>
                    <span className="info-value">{selectedTeacher.specialization}</span>
                  </div>
                )}
                
                {selectedTeacher.qualification && (
                  <div className="info-row">
                    <span className="info-label">Qualification:</span>
                    <span className="info-value">{selectedTeacher.qualification}</span>
                  </div>
                )}
                
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge ${selectedTeacher.active ? 'active' : 'inactive'}`}>
                    {selectedTeacher.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Joined:</span>
                  <span className="info-value">
                    {new Date(selectedTeacher.joiningDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="teacher-actions">
                <button 
                  className="edit-btn"
                  onClick={handleEditTeacher}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={handleDeleteTeacher}
                >
                  Delete
                </button>
              </div>

              <div className="teacher-courses">
                <h3>Assigned Courses</h3>
                {loading ? (
                  <p>Loading courses...</p>
                ) : teacherCourses.length === 0 ? (
                  <p className="no-data-message">No courses assigned to this teacher.</p>
                ) : (
                  <table className="courses-table">
                    <thead>
                      <tr>
                        <th>Course Name</th>
                        <th>Level</th>
                        <th>Status</th>
                        <th>Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherCourses.map(course => (
                        <tr key={course._id}>
                          <td>
                            <a href={`/courses/${course._id}`}>{course.name}</a>
                          </td>
                          <td>{course.level}</td>
                          <td>
                            <span className={`course-status ${getStatusClass(course.status)}`}>
                              {course.status}
                            </span>
                          </td>
                          <td>{course.branch.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="teacher-kindergarten-classes">
                <h3>Kindergarten Classes</h3>
                {loading ? (
                  <p>Loading kindergarten classes...</p>
                ) : teacherKindergartenClasses.length === 0 ? (
                  <p className="no-data-message">No kindergarten classes assigned to this teacher.</p>
                ) : (
                  <table className="courses-table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>School</th>
                        <th>Age Group</th>
                        <th>Status</th>
                        <th>Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherKindergartenClasses.map(kClass => (
                        <tr key={kClass._id}>
                          <td>
                            <a href={`/kindergarten/classes/${kClass._id}`}>{kClass.name}</a>
                          </td>
                          <td>{kClass.school?.name || 'N/A'}</td>
                          <td>{kClass.ageGroup}</td>
                          <td>
                            <span className={`course-status ${getStatusClass(kClass.status)}`}>
                              {kClass.status}
                            </span>
                          </td>
                          <td>{kClass.studentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function
const getStatusClass = (status) => {
  switch (status) {
    case 'Active': return 'status-active';
    case 'Upcoming': return 'status-upcoming';
    case 'Finished': return 'status-finished';
    case 'Cancelled': return 'status-cancelled';
    default: return '';
  }
};

export default TeachersManagement;