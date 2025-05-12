import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { schoolsAPI, regionsAPI } from '../../api';
import './SchoolForm.css';

const SchoolForm = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!schoolId;

  // Check if a default region was passed through location state
  const defaultRegionId = location.state?.regionId || '';

  const [school, setSchool] = useState({
    name: '',
    region: defaultRegionId,
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });
  
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all regions for the dropdown
        const regionsResponse = await regionsAPI.getAll();
        setRegions(regionsResponse.data);
        
        // If in edit mode, fetch the school details
        if (isEditMode) {
          const schoolResponse = await schoolsAPI.getById(schoolId);
          const schoolData = schoolResponse.data;
          
          // Ensure region is properly set to the ID value
          if (schoolData.region && typeof schoolData.region === 'object') {
            schoolData.region = schoolData.region._id;
          }
          
          setSchool(schoolData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [schoolId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSchool(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!school.name.trim()) {
      setError('School name is required.');
      return;
    }
    
    if (!school.region) {
      setError('Please select a region.');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await schoolsAPI.update(schoolId, school);
      } else {
        await schoolsAPI.create(school);
      }
      
      // If we came from a specific region, go back to that region's schools page
      if (defaultRegionId) {
        navigate(`/kindergarten/regions/${defaultRegionId}/schools`);
      } else {
        // Otherwise, go to the general schools list
        navigate('/kindergarten/schools');
      }
    } catch (err) {
      console.error('Error saving school:', err);
      setError('Failed to save school. Please check all fields and try again.');
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading school data...</div>;
  }

  return (
    <div className="school-form-container">
      <div className="school-form-header">
        <h1>{isEditMode ? 'Edit School' : 'Create New School'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="school-form">
        <div className="form-group">
          <label htmlFor="name">School Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={school.name}
            onChange={handleInputChange}
            required
            disabled={formSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="region">Region</label>
          <select
            id="region"
            name="region"
            value={school.region}
            onChange={handleInputChange}
            required
            disabled={formSubmitting}
          >
            <option value="">Select a region</option>
            {regions.map(region => (
              <option key={region._id} value={region._id}>{region.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Address (Optional)</label>
          <input
            type="text"
            id="address"
            name="address"
            value={school.address || ''}
            onChange={handleInputChange}
            disabled={formSubmitting}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contactPerson">Contact Person (Optional)</label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={school.contactPerson || ''}
              onChange={handleInputChange}
              disabled={formSubmitting}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email (Optional)</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={school.contactEmail || ''}
              onChange={handleInputChange}
              disabled={formSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone (Optional)</label>
            <input
              type="text"
              id="contactPhone"
              name="contactPhone"
              value={school.contactPhone || ''}
              onChange={handleInputChange}
              disabled={formSubmitting}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <Link 
            to={defaultRegionId ? `/kindergarten/regions/${defaultRegionId}/schools` : '/kindergarten/schools'} 
            className="cancel-btn"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Saving...' : 'Save School'}
          </button>
        </div>
      </form>
      
      <div className="breadcrumb-navigation">
        <Link to="/kindergarten" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/kindergarten/schools" className="breadcrumb-link">Schools</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">
          {isEditMode ? 'Edit School' : 'New School'}
        </span>
      </div>
    </div>
  );
};

export default SchoolForm; 