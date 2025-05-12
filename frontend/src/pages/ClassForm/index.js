import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { kindergartenClassesAPI, schoolsAPI, teachersAPI } from '../../api';
import './ClassForm.css';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const AGE_GROUPS = [
  '2-3 years', '3-4 years', '4-5 years', '5-6 years'
];

const ClassForm = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!classId;

  // Check if a default school was passed through location state
  const defaultSchoolId = location.state?.schoolId || '';

  const [kClass, setKClass] = useState({
    name: '',
    school: defaultSchoolId,
    teacher: '',
    teacherName: '',
    studentCount: 0,
    ageGroup: AGE_GROUPS[0],
    status: 'Active',
    startDate: '',
    totalSessions: 10,
    weeklySchedule: [],
    holidays: []
  });

  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Default time slots for new schedules
  const defaultStartTime = '09:00';
  const defaultEndTime = '10:30';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all schools and teachers for the dropdowns
        const [schoolsResponse, teachersResponse] = await Promise.all([
          schoolsAPI.getAll(),
          teachersAPI.getAll()
        ]);
        
        setSchools(schoolsResponse.data);
        setTeachers(teachersResponse.data);
        
        // If in edit mode, fetch the class details
        if (isEditMode) {
          const classResponse = await kindergartenClassesAPI.getById(classId);
          const classData = classResponse.data;
          
          // Ensure school is properly set to the ID value
          if (classData.school && typeof classData.school === 'object') {
            classData.school = classData.school._id;
          }
          
          // Ensure teacher is properly set to the ID value
          if (classData.teacher && typeof classData.teacher === 'object') {
            classData.teacher = classData.teacher._id;
          }
          
          // Format dates for input fields
          if (classData.startDate) {
            classData.startDate = new Date(classData.startDate).toISOString().split('T')[0];
          }
          
          // If there's no weekly schedule, initialize an empty array
          if (!classData.weeklySchedule || !Array.isArray(classData.weeklySchedule)) {
            classData.weeklySchedule = [];
          }
          
          // If there's no holidays array, initialize it
          if (!classData.holidays || !Array.isArray(classData.holidays)) {
            classData.holidays = [];
          }
          
          setKClass(classData);
        } else {
          // Set default startDate to current date if creating a new class
          const today = new Date();
          const formattedDate = today.toISOString().split('T')[0];
          setKClass(prev => ({
            ...prev,
            startDate: formattedDate
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'studentCount' || name === 'totalSessions') {
      // Ensure these fields are numeric
      setKClass(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else if (name === 'teacher') {
      // When teacher selection changes, also update teacherName for compatibility
      const selectedTeacher = teachers.find(t => t._id === value);
      setKClass(prev => ({ 
        ...prev, 
        teacher: value,
        teacherName: selectedTeacher ? selectedTeacher.name : ''
      }));
    } else {
      setKClass(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSchedule = () => {
    setKClass(prev => ({
      ...prev,
      weeklySchedule: [
        ...prev.weeklySchedule,
        {
          day: DAYS_OF_WEEK[0],
          startTime: defaultStartTime,
          endTime: defaultEndTime
        }
      ]
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...kClass.weeklySchedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setKClass(prev => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedule = [...kClass.weeklySchedule];
    updatedSchedule.splice(index, 1);
    setKClass(prev => ({ ...prev, weeklySchedule: updatedSchedule }));
  };

  const handleAddHoliday = () => {
    // Set default holiday date to current date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setKClass(prev => ({
      ...prev,
      holidays: [
        ...prev.holidays,
        {
          date: formattedDate,
          name: 'Holiday'
        }
      ]
    }));
  };

  const handleHolidayChange = (index, field, value) => {
    const updatedHolidays = [...kClass.holidays];
    updatedHolidays[index] = { ...updatedHolidays[index], [field]: value };
    setKClass(prev => ({ ...prev, holidays: updatedHolidays }));
  };

  const handleRemoveHoliday = (index) => {
    const updatedHolidays = [...kClass.holidays];
    updatedHolidays.splice(index, 1);
    setKClass(prev => ({ ...prev, holidays: updatedHolidays }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!kClass.name.trim()) {
      setError('Class name is required.');
      return;
    }
    
    if (!kClass.school) {
      setError('Please select a school.');
      return;
    }
    
    if (!kClass.teacher) {
      setError('Please select a teacher.');
      return;
    }
    
    if (!kClass.startDate) {
      setError('Start date is required.');
      return;
    }
    
    if (kClass.weeklySchedule.length === 0) {
      setError('At least one weekly schedule item is required.');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await kindergartenClassesAPI.update(classId, kClass);
      } else {
        await kindergartenClassesAPI.create(kClass);
      }
      
      // If we came from a specific school, go back to that school's classes page
      if (defaultSchoolId) {
        navigate(`/kindergarten/schools/${defaultSchoolId}/classes`);
      } else {
        // Otherwise, go to the general classes list
        navigate('/kindergarten/classes');
      }
    } catch (err) {
      console.error('Error saving class:', err);
      setError('Failed to save class. Please check all fields and try again.');
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading class data...</div>;
  }

  return (
    <div className="class-form-container">
      <div className="class-form-header">
        <h1>{isEditMode ? 'Edit Class' : 'Create New Class'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="class-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Class Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={kClass.name}
                onChange={handleInputChange}
                required
                disabled={formSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="school">School</label>
              <select
                id="school"
                name="school"
                value={kClass.school}
                onChange={handleInputChange}
                required
                disabled={formSubmitting}
              >
                <option value="">Select a school</option>
                {schools.map(school => (
                  <option key={school._id} value={school._id}>{school.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="teacher">Teacher</label>
              <select
                id="teacher"
                name="teacher"
                value={kClass.teacher}
                onChange={handleInputChange}
                required
                disabled={formSubmitting}
              >
                <option value="">Select a teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={kClass.status}
                onChange={handleInputChange}
                disabled={formSubmitting}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ageGroup">Age Group</label>
              <select
                id="ageGroup"
                name="ageGroup"
                value={kClass.ageGroup}
                onChange={handleInputChange}
                disabled={formSubmitting}
              >
                {AGE_GROUPS.map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="studentCount">Number of Students</label>
              <input
                type="number"
                id="studentCount"
                name="studentCount"
                value={kClass.studentCount}
                onChange={handleInputChange}
                min="0"
                disabled={formSubmitting}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Schedule Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={kClass.startDate}
                onChange={handleInputChange}
                required
                disabled={formSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="totalSessions">Total Number of Sessions</label>
              <input
                type="number"
                id="totalSessions"
                name="totalSessions"
                value={kClass.totalSessions}
                onChange={handleInputChange}
                min="1"
                required
                disabled={formSubmitting}
              />
            </div>
          </div>
          
          <div className="schedule-section">
            <div className="section-header">
              <h3>Weekly Schedule</h3>
            </div>
            
            <div className="schedule-list">
              {kClass.weeklySchedule.length === 0 ? (
                <div className="no-data-message small">
                  <p>No schedule items added yet. Add your first schedule item.</p>
                </div>
              ) : (
                kClass.weeklySchedule.map((schedule, index) => (
                  <div key={index} className="schedule-item">
                    <div className="day-select">
                      <label>Day</label>
                      <select
                        value={schedule.day}
                        onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                        disabled={formSubmitting}
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        disabled={formSubmitting}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        disabled={formSubmitting}
                      />
                    </div>
                    
                    <button
                      type="button"
                      className="remove-schedule-btn"
                      onClick={() => handleRemoveSchedule(index)}
                      disabled={formSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
              
              <button
                type="button"
                className="add-schedule-btn"
                onClick={handleAddSchedule}
                disabled={formSubmitting}
              >
                + Add Schedule
              </button>
            </div>
          </div>
          
          <div className="holiday-section">
            <div className="section-header">
              <h3>Holidays/Breaks (Optional)</h3>
            </div>
            
            <div className="holiday-list">
              {kClass.holidays.length === 0 ? (
                <div className="no-data-message small">
                  <p>No holidays added. Add holidays if needed for schedule calculation.</p>
                </div>
              ) : (
                kClass.holidays.map((holiday, index) => (
                  <div key={index} className="holiday-item">
                    <div className="holiday-inputs">
                      <div className="date-input">
                        <label>Date</label>
                        <input
                          type="date"
                          value={holiday.date}
                          onChange={(e) => handleHolidayChange(index, 'date', e.target.value)}
                          disabled={formSubmitting}
                        />
                      </div>
                      
                      <div className="desc-input">
                        <label>Description</label>
                        <input
                          type="text"
                          value={holiday.name}
                          onChange={(e) => handleHolidayChange(index, 'name', e.target.value)}
                          placeholder="e.g. Christmas Break"
                          disabled={formSubmitting}
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="remove-holiday-btn"
                      onClick={() => handleRemoveHoliday(index)}
                      disabled={formSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
              
              <button
                type="button"
                className="add-holiday-btn"
                onClick={handleAddHoliday}
                disabled={formSubmitting}
              >
                + Add Holiday
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <Link 
            to={defaultSchoolId ? `/kindergarten/schools/${defaultSchoolId}/classes` : '/kindergarten/classes'} 
            className="cancel-btn"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Saving...' : 'Save Class'}
          </button>
        </div>
      </form>
      
      <div className="breadcrumb-navigation">
        <Link to="/kindergarten" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/kindergarten/classes" className="breadcrumb-link">Classes</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">
          {isEditMode ? 'Edit Class' : 'New Class'}
        </span>
      </div>
    </div>
  );
};

export default ClassForm; 