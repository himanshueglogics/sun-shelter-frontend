import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import './ManagePage.css';

const ManageBeaches = () => {
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeaches();
  }, []);

  const fetchBeaches = async () => {
    try {
      const response = await axios.get('/beaches');
      setBeaches(response.data);
    } catch (error) {
      console.error('Error fetching beaches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>Manage Beaches</h1>
          <button className="add-button">
            <Plus size={20} />
            <span>Add Beach</span>
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading beaches...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beach Name</th>
                  <th>Location</th>
                  <th>Occupancy Rate</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beaches.length > 0 ? (
                  beaches.map((beach) => (
                    <tr key={beach._id}>
                      <td>{beach.name}</td>
                      <td>{beach.location}</td>
                      <td>{beach.occupancyRate}%</td>
                      <td>{beach.totalCapacity}</td>
                      <td>
                        <span className={`status-badge ${beach.status}`}>
                          {beach.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-button"><Edit size={18} /></button>
                          <button className="icon-button danger"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">No beaches found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBeaches;
