import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { regionsAPI } from '../../api';
import './RegionForm.css';

const RegionForm = () => {
  const { regionId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!regionId;

  const [region, setRegion] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchRegion = async () => {
        try {
          setLoading(true);
          const response = await regionsAPI.getById(regionId);
          setRegion(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching region:', err);
          setError('Failed to load region data. Please try again later.');
          setLoading(false);
        }
      };
      
      fetchRegion();
    }
  }, [regionId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegion(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!region.name.trim()) {
      setError('Region name is required.');
      return;
    }
    
    try {
      setFormSubmitting(true);
      setError(null);
      
      if (isEditMode) {
        await regionsAPI.update(regionId, region);
      } else {
        await regionsAPI.create(region);
      }
      
      navigate('/kindergarten/regions');
    } catch (err) {
      console.error('Error saving region:', err);
      setError('Failed to save region. Please check all fields and try again.');
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading region data...</div>;
  }

  return (
    <div className="region-form-container">
      <div className="region-form-header">
        <h1>{isEditMode ? 'Edit Region' : 'Create New Region'}</h1>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="region-form">
        <div className="form-group">
          <label htmlFor="name">Region Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={region.name}
            onChange={handleInputChange}
            required
            disabled={formSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={region.description || ''}
            onChange={handleInputChange}
            rows="4"
            disabled={formSubmitting}
          />
        </div>
        
        <div className="form-actions">
          <Link to="/kindergarten/regions" className="cancel-btn">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Saving...' : 'Save Region'}
          </button>
        </div>
      </form>
      
      <div className="breadcrumb-navigation">
        <Link to="/kindergarten" className="breadcrumb-link">Dashboard</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/kindergarten/regions" className="breadcrumb-link">Regions</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">
          {isEditMode ? 'Edit Region' : 'New Region'}
        </span>
      </div>
    </div>
  );
};

export default RegionForm; 