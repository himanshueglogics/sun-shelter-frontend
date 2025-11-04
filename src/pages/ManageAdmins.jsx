import React from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Mail, Phone } from 'lucide-react';
import axios from '../api/axios';
import { logAuthDebugInfo } from '../utils/auth';
import './ManagePage.css';
import './ManageAdmins.css';

const ManageAdmins = () => {
  const [admins, setAdmins] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Office Manager'
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/admins');
      setAdmins(res.data);
    } catch (e) {
      console.error('Error fetching admins:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`/admins/${id}`);
      setAdmins(prev => prev.filter(a => a._id !== id));
    } catch (e) {
      console.error('Error removing admin:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    // Log auth info for debugging
    console.log('=== ATTEMPTING TO CREATE ADMIN ===');
    logAuthDebugInfo();
    
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password || 'TempPassword123!',
        role: form.role
      };
      
      console.log('Payload being sent:', payload);
      
      const res = await axios.post('/admins', payload);
      
      // Add new admin to the list
      setAdmins(prev => [res.data, ...prev]);
      
      // Show success message
      setSuccess(`Admin "${form.name}" created successfully!`);
      
      // Close modal and reset form after 1 second
      setTimeout(() => {
        setOpen(false);
        setForm({ name: '', email: '', phone: '', password: '', role: 'Office Manager' });
        setSuccess('');
      }, 1500);
      
    } catch (e) {
      console.error('Error creating admin:', e);
      console.error('Error response:', e.response);
      console.error('Current user:', localStorage.getItem('user'));
      console.error('Token:', localStorage.getItem('token'));
      
      let errorMessage = 'Failed to create admin. Please try again.';
      
      if (e.response?.status === 403) {
        errorMessage = 'Access denied. You need super admin privileges. Please contact your administrator.';
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="admins-header page-header">
          <h1>Beach Admins</h1>
          <button className="add-button" onClick={() => setOpen(true)}>
            <Plus size={20} />
            <span>Add New Admin</span>
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading admins...</div>
        ) : (
          <div className="admins-grid">
            {admins && admins.length ? (
              admins
                .filter(u => u.role !== 'super_admin') // Hide super admin from list
                .map((u) => (
                  <div className="admin-card" key={u._id}>
                    <div className="admin-top">
                      <div className="admin-avatar">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'Admin')}&background=f59e0b&color=fff`} alt={u.name} />
                      </div>
                      <div>
                        <div className="admin-name">{u.name}</div>
                        <div className="admin-role">{u.role || 'Office Manager'}</div>
                      </div>
                    </div>
                    <div className="admin-info">
                      <div className="info-row"><Mail size={16} color="#4A90E2" /> {u.email}</div>
                      <div className="info-row"><Phone size={16} color="#4A90E2" /> {u.phone || '—'}</div>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemove(u._id)}>Remove</button>
                  </div>
                ))
            ) : (
              <div className="empty-state" style={{gridColumn: '1/-1'}}>
                <p>No admins found</p>
              </div>
            )}
          </div>
        )}

        {open && (
          <div className="modal-overlay" onClick={() => setOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add New Admin</h3>
              <div className="modal-subtitle">Create an admin who can manage a beach</div>
              
              {error && (
                <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                  {error}
                </div>
              )}
              
              {success && (
                <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                  {success}
                </div>
              )}
              
              <form className="modal-form admin-form" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="field">
                    <label>Name</label>
                    <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Phone</label>
                    <input type="tel" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} placeholder="+1 234 567 8900" />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input 
                      type="password" 
                      value={form.password} 
                      onChange={(e)=>setForm({...form, password: e.target.value})} 
                      placeholder="Leave blank for default"
                      minLength="6"
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Role</label>
                    <select value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
                      <option>Office Manager</option>
                      <option>Supervisor</option>
                      <option>Assistant</option>
                      <option>Admin</option>
                      <option>Super Admin</option>
                    </select>
                  </div>
                  <div className="field"></div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Admin'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAdmins;
