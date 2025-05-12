import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { schoolsAPI, regionsAPI } from '../../api';
import './SchoolList.css';

const SchoolList = () => {
  const { regionId } = useParams();
  const location = useLocation();
  
  const [schools, setSchools] = useState([]);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Determine if we're viewing schools for a specific region
  const isRegionSpecific = !!regionId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If a region ID is provided, fetch both the region details and its schools
        if (isRegionSpecific) {
          const [regionResponse, schoolsResponse] = await Promise.all([
            regionsAPI.getById(regionId),
            schoolsAPI.getAll(regionId)
          ]);
          
          setRegion(regionResponse.data);
          setSchools(schoolsResponse.data);
        } else {
          // Fetch all schools
          const schoolsResponse = await schoolsAPI.getAll();
          setSchools(schoolsResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schools data:', err);
        setError('Failed to load schools data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [regionId, isRegionSpecific]);

  const handleDeleteSchool = async (schoolId) => {
    if (window.confirm('Are you sure you want to delete this school? This will not delete classes within the school.')) {
      try {
        await schoolsAPI.remove(schoolId);
        
        // Refresh the schools list
        if (isRegionSpecific) {
          const response = await schoolsAPI.getAll(regionId);
          setSchools(response.data);
        } else {
          const response = await schoolsAPI.getAll();
          setSchools(response.data);
        }
      } catch (err) {
        console.error('Error deleting school:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to delete school. Please try again later.');
        }
      }
    }
  };

  // Filter schools based on search term
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-spinner">Loading schools...</div>;
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
    <div className="school-list-container">
      <div className="school-list-header">
        <h1>
          {isRegionSpecific && region ? `Schools in ${region.name}` : 'All Schools'}
        </h1>
        <Link to="/kindergarten/schools/new" 
          className="new-school-btn"
          state={{ regionId: regionId }}
        >
          + New School
        </Link>
      </div>
      
      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search schools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {filteredSchools.length === 0 ? (
        <div className="no-data-message">
          {searchTerm ? 
            <p>No schools found matching "{searchTerm}". Try a different search term or add a new school.</p> :
            <p>No schools found. Add your first school to get started.</p>
          }
        </div>
      ) : (
        <div className="schools-table-container">
          <table className="schools-table">
            <thead>
              <tr>
                <th>Name</th>
                {!isRegionSpecific && <th>Region</th>}
                <th>Contact Person</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th>Classes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map(school => (
                <tr key={school._id}>
                  <td>{school.name}</td>
                  {!isRegionSpecific && (
                    <td>{school.region ? school.region.name : 'Unknown'}</td>
                  )}
                  <td>{school.contactPerson || 'Not specified'}</td>
                  <td>
                    {school.contactEmail && (
                      <div className="contact-info">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{school.contactEmail}</span>
                      </div>
                    )}
                    {school.contactPhone && (
                      <div className="contact-info">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{school.contactPhone}</span>
                      </div>
                    )}
                    {!school.contactEmail && !school.contactPhone && 'Not specified'}
                  </td>
                  <td>{school.address || 'Not specified'}</td>
                  <td className="classes-cell">
                    <Link to={`/kindergarten/schools/${school._id}/classes`}>
                      View Classes
                    </Link>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/kindergarten/schools/edit/${school._id}`} className="edit-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteSchool(school._id)} 
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="breadcrumb-navigation">
        <Link to="/kindergarten" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        {isRegionSpecific && region ? (
          <>
            <Link to="/kindergarten/regions" className="breadcrumb-link">Regions</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{region.name}</span>
          </>
        ) : (
          <span className="breadcrumb-current">Schools</span>
        )}
      </div>
    </div>
  );
};

export default SchoolList; 