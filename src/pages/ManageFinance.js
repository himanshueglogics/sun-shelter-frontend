import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { Plus } from 'lucide-react';
import './ManagePage.css';

const ManageFinance = () => {
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const response = await axios.get('/finance');
      setFinances(response.data);
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>Manage Finance</h1>
          <button className="add-button">
            <Plus size={20} />
            <span>Add Transaction</span>
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading finance records...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Beach</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {finances.length > 0 ? (
                  finances.map((finance) => (
                    <tr key={finance._id}>
                      <td>
                        <span className={`status-badge ${finance.type}`}>
                          {finance.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{finance.description}</td>
                      <td className={finance.type === 'expense' ? 'text-red' : 'text-green'}>
                        ${finance.amount.toFixed(2)}
                      </td>
                      <td>{finance.beach?.name || 'N/A'}</td>
                      <td>{new Date(finance.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No finance records found</td>
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

export default ManageFinance;
