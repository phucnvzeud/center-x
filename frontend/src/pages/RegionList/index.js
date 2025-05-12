import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { regionsAPI } from '../../api';
import './RegionList.css';

const RegionList = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await regionsAPI.getAll();
      setRegions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Failed to load regions. Please try again later.');
      setLoading(false);
    }
  };

  const handleDeleteRegion = async (regionId) => {
    if (window.confirm('Are you sure you want to delete this region? This will not delete schools within the region.')) {
      try {
        await regionsAPI.remove(regionId);
        // Refresh the regions list
        fetchRegions();
      } catch (err) {
        console.error('Error deleting region:', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to delete region. Please try again later.');
        }
      }
    }
  };

  // Filter regions based on search term
  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-spinner">Loading regions...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => { setError(null); fetchRegions(); }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="region-list-container">
      <div className="region-list-header">
        <h1>Regions</h1>
        <Link to="/kindergarten/regions/new" className="new-region-btn">+ New Region</Link>
      </div>
      
      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search regions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {filteredRegions.length === 0 ? (
        <div className="no-data-message">
          {searchTerm ? 
            <p>No regions found matching "{searchTerm}". Try a different search term or add a new region.</p> :
            <p>No regions found. Add your first region to get started.</p>
          }
        </div>
      ) : (
        <div className="regions-table-container">
          <table className="regions-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Schools</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegions.map(region => (
                <tr key={region._id}>
                  <td>{region.name}</td>
                  <td>{region.description || 'No description'}</td>
                  <td className="schools-cell">
                    <Link to={`/kindergarten/regions/${region._id}/schools`}>
                      View Schools
                    </Link>
                  </td>
                  <td className="actions-cell">
                    <Link to={`/kindergarten/regions/edit/${region._id}`} className="edit-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteRegion(region._id)} 
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
        <span className="breadcrumb-current">Regions</span>
      </div>
    </div>
  );
};

export default RegionList; 