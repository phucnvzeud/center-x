import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Branches.css';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });
  const [editingBranch, setEditingBranch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/branches');
      setBranches(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingBranch) {
      setEditingBranch({ ...editingBranch, [name]: value });
    } else {
      setNewBranch({ ...newBranch, [name]: value });
    }
  };

  const openModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
    } else {
      setNewBranch({ name: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        await axios.put(`/api/branches/${editingBranch._id}`, editingBranch);
      } else {
        await axios.post('/api/branches', newBranch);
      }
      
      fetchBranches();
      closeModal();
    } catch (err) {
      console.error('Error saving branch:', err);
      setError('Failed to save branch. Please try again.');
    }
  };

  const handleDelete = async (branchId) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await axios.delete(`/api/branches/${branchId}`);
        fetchBranches();
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError('Failed to delete branch. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading branches...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => fetchBranches()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="branches-container">
      <div className="branches-header">
        <h1>Branches</h1>
        <button className="new-branch-btn" onClick={() => openModal()}>+ New Branch</button>
      </div>
      
      {branches.length === 0 ? (
        <div className="no-data-message">
          <p>No branches found. Add your first branch to get started.</p>
        </div>
      ) : (
        <div className="branches-list">
          <table className="branches-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch._id}>
                  <td>{branch.name}</td>
                  <td>{branch.address}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => openModal(branch)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(branch._id)}
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

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Branch Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editingBranch ? editingBranch.name : newBranch.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={editingBranch ? editingBranch.address : newBranch.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingBranch ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches; 