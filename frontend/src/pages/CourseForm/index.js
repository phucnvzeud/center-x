import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { coursesAPI, teachersAPI, branchesAPI } from '../../api';
import './CourseForm.css';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const LEVEL_OPTIONS = [
  'Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Proficient'
];

const CourseForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!courseId;

  const [course, setCourse] = useState({
    name: '',
    branch: '',
    teacher: '',
    previousCourse: '',
    startDate: '',
    endDate: '',
    totalSessions: 0,
    weeklySchedule: [],
    description: '',
    level: 'Beginner',
    maxStudents: 15,
    price: 0
  });

  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [previousCourses, setPreviousCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch teachers
        const teachersRes = await teachersAPI.getAll();
        setTeachers(teachersRes.data);
        
        // Fetch branches
        const branchesRes = await branchesAPI.getAll();
        setBranches(branchesRes.data);
        
        // Fetch previous courses for selection
        const coursesRes = await coursesAPI.getAll();
        setPreviousCourses(coursesRes.data);
        
        // If editing an existing course, fetch its details
        if (isEditMode) {
          const courseRes = await coursesAPI.getById(courseId);
          const courseData = courseRes.data;
          
          console.log("Loaded course data:", JSON.stringify(courseData, null, 2));
          
          // Format dates for input fields
          if (courseData.startDate) {
            courseData.startDate = new Date(courseData.startDate).toISOString().split('T')[0];
          }
          if (courseData.endDate) {
            courseData.endDate = new Date(courseData.endDate).toISOString().split('T')[0];
          }
          
          // Ensure references are properly set
          if (courseData.teacher && typeof courseData.teacher === 'object') {
            courseData.teacher = courseData.teacher._id;
          }
          
          if (courseData.branch && typeof courseData.branch === 'object') {
            courseData.branch = courseData.branch._id;
          }
          
          if (courseData.previousCourse && typeof courseData.previousCourse === 'object') {
            courseData.previousCourse = courseData.previousCourse._id;
          }
          
          // Remove totalStudent from course data as we'll derive it from maxStudents
          delete courseData.totalStudent;
          
          setCourse(courseData);
          
          // Initialize schedule from weeklySchedule
          if (courseData.weeklySchedule && courseData.weeklySchedule.length > 0) {
            console.log("Initializing schedule from weeklySchedule:", JSON.stringify(courseData.weeklySchedule, null, 2));
            
            // Make a deep copy of the weeklySchedule to avoid reference issues
            const scheduleData = courseData.weeklySchedule.map(item => ({
              day: item.day,
              startTime: item.startTime,
              endTime: item.endTime
            }));
            
            setSchedule(scheduleData);
          } else {
            // Add default schedule item if none exists
            setSchedule([{ day: 'Monday', startTime: '09:00', endTime: '11:00' }]);
          }
        } else {
          // For new courses, set default start date to today
          const today = new Date().toISOString().split('T')[0];
          setCourse(prev => ({ ...prev, startDate: today }));
          
          // Add a default schedule item for new courses
          setSchedule([{ day: 'Monday', startTime: '09:00', endTime: '11:00' }]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: parseInt(value, 10) || 0 });
  };

  const handleAddSchedule = () => {
    setSchedule([...schedule, { day: 'Monday', startTime: '09:00', endTime: '11:00' }]);
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setSchedule(updatedSchedule);
  };

  const handleRemoveSchedule = (index) => {
    const updatedSchedule = [...schedule];
    updatedSchedule.splice(index, 1);
    setSchedule(updatedSchedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Add validation for required fields
      if (schedule.length === 0) {
        setError('Please add at least one weekly schedule item.');
        return;
      }
      
      // Set totalStudent to match maxStudents
      const totalStudent = parseInt(course.maxStudents) || 0;
      
      // Prepare data for submission
      const courseData = {
        ...course,
        weeklySchedule: schedule, // Ensure schedule is correctly passed
        totalStudent, // Ensure totalStudent is correctly set
        maxStudents: parseInt(course.maxStudents) || 15 // Ensure maxStudents is a number
      };
      
      // Handle previousCourse - must be null (not empty string) when not selected
      if (courseData.previousCourse === "") {
        courseData.previousCourse = null;
      }
      
      // Log the data we're sending
      console.log("Submitting course data:", JSON.stringify(courseData, null, 2));
      
      let savedCourse;
      
      if (isEditMode) {
        // Ensure weeklySchedule is properly formatted for update
        console.log("Weekly schedule before update:", JSON.stringify(courseData.weeklySchedule, null, 2));
        
        // Make sure each schedule item has the required fields
        const formattedSchedule = courseData.weeklySchedule.map(item => ({
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime
        }));
        
        courseData.weeklySchedule = formattedSchedule;
        
        // Send the update request
        savedCourse = await coursesAPI.update(courseId, courseData);
      } else {
        savedCourse = await coursesAPI.create(courseData);
      }
      
      if (savedCourse && savedCourse.data) {
        console.log("Course saved successfully:", savedCourse.data);
        console.log("Weekly schedule in saved course:", savedCourse.data.weeklySchedule);
        console.log("Total students in saved course:", savedCourse.data.totalStudent);
      }
      
      navigate('/courses');
    } catch (err) {
      console.error('Error saving course:', err);
      if (err.response) {
        console.error('Server response:', err.response.data);
        setError(`Failed to save course: ${err.response.data.message || 'Unknown error'}`);
      } else {
        setError('Failed to save course. Please check all fields and try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="course-form-container">
      <div className="course-form-header">
        <h1>{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Course Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={course.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="level">Level</label>
              <select
                id="level"
                name="level"
                value={course.level}
                onChange={handleInputChange}
                required
              >
                {LEVEL_OPTIONS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <select
                id="branch"
                name="branch"
                value={course.branch}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="teacher">Teacher</label>
              <select
                id="teacher"
                name="teacher"
                value={course.teacher}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="previousCourse">Previous Course (Optional)</label>
              <select
                id="previousCourse"
                name="previousCourse"
                value={course.previousCourse || ''}
                onChange={handleInputChange}
              >
                <option value="">None</option>
                {previousCourses.map(prevCourse => (
                  <option key={prevCourse._id} value={prevCourse._id}>
                    {prevCourse.name} ({prevCourse.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={course.description}
              onChange={handleInputChange}
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Schedule & Duration</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={course.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date (Optional)</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={course.endDate || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalSessions">Total Sessions</label>
              <input
                type="number"
                id="totalSessions"
                name="totalSessions"
                min="1"
                value={course.totalSessions}
                onChange={handleNumberInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="maxStudents">Enrolled Students</label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                min="1"
                value={course.maxStudents}
                onChange={handleNumberInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Weekly Schedule</label>
            <div className="schedule-list">
              {schedule.map((item, index) => (
                <div key={index} className="schedule-item">
                  <select
                    value={item.day}
                    onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                    required
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  
                  <div className="time-inputs">
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      required
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      required
                    />
                  </div>
                  
                  <button
                    type="button"
                    className="remove-schedule-btn"
                    onClick={() => handleRemoveSchedule(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                className="add-schedule-btn"
                onClick={handleAddSchedule}
              >
                + Add Schedule
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Pricing</h2>
          
          <div className="form-group">
            <label htmlFor="price">Course Price</label>
            <div className="price-input">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={course.price}
                onChange={handleNumberInputChange}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/courses')}
          >
            Cancel
          </button>
          
          <button type="submit" className="save-btn">
            {isEditMode ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm; 