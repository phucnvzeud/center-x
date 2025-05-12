import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { kindergartenClassesAPI, regionsAPI, schoolsAPI } from '../../api';
import './KindergartenDashboard.css';

const KindergartenDashboard = () => {
  const [stats, setStats] = useState({
    classes: { total: 0, active: 0, inactive: 0 },
    students: { total: 0 },
    schools: { total: 0 },
    regions: { total: 0 }
  });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch overview statistics
        const statsResponse = await kindergartenClassesAPI.getStats();
        setStats(statsResponse.data);
        
        // Fetch regions for the dashboard
        const regionsResponse = await regionsAPI.getAll();
        setRegions(regionsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching kindergarten dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading kindergarten system data...</div>;
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
    <div className="kindergarten-dashboard">
      <div className="dashboard-header">
        <h1>Kindergarten English Class Management</h1>
        <div className="action-buttons">
          <Link to="/kindergarten/regions/new" className="btn btn-primary">
            Add New Region
          </Link>
          <Link to="/kindergarten/schools/new" className="btn btn-primary">
            Add New School
          </Link>
          <Link to="/kindergarten/classes/new" className="btn btn-primary">
            Add New Class
          </Link>
        </div>
      </div>
      
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-title">Regions</div>
          <div className="stat-value">{stats.regions.total}</div>
          <Link to="/kindergarten/regions" className="stat-link">View All</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Schools</div>
          <div className="stat-value">{stats.schools.total}</div>
          <Link to="/kindergarten/schools" className="stat-link">View All</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Classes</div>
          <div className="stat-value">{stats.classes.total}</div>
          <div className="stat-details">
            <span className="active">{stats.classes.active} Active</span>
            <span className="inactive">{stats.classes.inactive} Inactive</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Students</div>
          <div className="stat-value">{stats.students.total}</div>
        </div>
      </div>
      
      <div className="regions-section">
        <h2>Regions</h2>
        <div className="regions-grid">
          {regions.length === 0 ? (
            <div className="no-data-message">
              <p>No regions found. Add your first region to get started.</p>
            </div>
          ) : (
            regions.map(region => (
              <div key={region._id} className="region-card">
                <div className="region-name">{region.name}</div>
                <div className="region-actions">
                  <Link to={`/kindergarten/regions/${region._id}/schools`} className="action-link">
                    View Schools
                  </Link>
                  <Link to={`/kindergarten/regions/edit/${region._id}`} className="action-link">
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="hierarchy-nav">
        <h2>Navigate Hierarchy</h2>
        <div className="hierarchy-links">
          <Link to="/kindergarten/regions" className="hierarchy-link">
            <div className="hierarchy-icon">🌍</div>
            <div className="hierarchy-label">Regions</div>
          </Link>
          <div className="hierarchy-arrow">→</div>
          <Link to="/kindergarten/schools" className="hierarchy-link">
            <div className="hierarchy-icon">🏫</div>
            <div className="hierarchy-label">Schools</div>
          </Link>
          <div className="hierarchy-arrow">→</div>
          <Link to="/kindergarten/classes" className="hierarchy-link">
            <div className="hierarchy-icon">👨‍👧‍👦</div>
            <div className="hierarchy-label">Classes</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default KindergartenDashboard; 