import React, { useState, useEffect } from 'react';
import { teachersAPI } from '../../api';
import './Teachers.css';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await teachersAPI.getAll();
        setTeachers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Failed to load teachers. Please try again later.');
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading teachers...</div>;
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
    <div className="teachers-container">
      <h1>Teachers</h1>
      
      {teachers.length === 0 ? (
        <div className="no-data-message">
          <p>No teachers found. Add your first teacher to get started.</p>
        </div>
      ) : (
        <div className="teachers-grid">
          {teachers.map(teacher => (
            <div key={teacher._id} className="teacher-card">
              <div className="teacher-info">
                <h3>{teacher.name}</h3>
                <p className="teacher-email">{teacher.email}</p>
                <p className="teacher-specialization">{teacher.specialization || 'No specialization'}</p>
              </div>
              <div className="teacher-actions">
                <button className="btn view-btn">View Details</button>
                <button 
                  className="btn schedule-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/teachers/${teacher._id}/schedule`;
                  }}
                >
                  View Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teachers;