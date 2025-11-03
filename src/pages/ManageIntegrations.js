import React from 'react';
import Sidebar from '../components/Sidebar';
import { Plus } from 'lucide-react';
import './ManagePage.css';

const ManageIntegrations = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>Manage Integrations</h1>
          <button className="add-button">
            <Plus size={20} />
            <span>Add Integration</span>
          </button>
        </div>
        <div className="empty-state">
          <p>Integration management coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default ManageIntegrations;
