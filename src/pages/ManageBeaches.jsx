import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './ManagePage.css';
import { toast } from 'react-toastify';

const ManageBeaches = () => {
  const navigate = useNavigate();
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalBeaches: 0, activeAdmins: 0 });
  const [admins, setAdmins] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [occupancy, setOccupancy] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, beachId: null, beachName: '' });
  const [form, setForm] = useState({
    name: '',
    location: '',
    pricePerDay: 0,
    status: 'active',
    amenities: [],
    services: [],
    zoneName: '',
    zoneRows: 0,
    zoneCols: 0
  });
  const [assignModal, setAssignModal] = useState({ open: false, beachId: null, beachName: '', userId: '', role: '', grantAdmin: false });
  const [addAdminModal, setAddAdminModal] = useState({ open: false, name: '', email: '', phone: '', password: '', role: 'Admin' });

  useEffect(() => {
    fetchBeaches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchBeaches = async () => {
    try {
      const response = await axios.get('/beaches', { params: { page, limit: 10 } });
      setBeaches(response.data.items || []);
      setPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
      const s = await axios.get('/beaches/stats/summary');
      setStats(s.data || { totalBeaches: 0, activeAdmins: 0 });
      const a = await axios.get('/admins');
      setAdmins(a.data || []);
      try {
        const occ = await axios.get('/beaches/occupancy-overview');
        setOccupancy(Array.isArray(occ.data) ? occ.data : []);
      } catch (e) {
        setOccupancy([]);
      }
    } catch (error) {
      console.error('Error fetching beaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBeach = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        location: form.location,
        pricePerDay: Number(form.pricePerDay) || 0,
        status: form.status,
        amenities: form.amenities,
        services: form.services
      };
      const res = await axios.post('/beaches', payload);
      const newBeach = res.data;
      if (form.zoneName && (form.zoneRows > 0 || form.zoneCols > 0)) {
        await axios.post(`/beaches/${newBeach._id}/zones`, {
          name: form.zoneName,
          rows: Number(form.zoneRows) || 0,
          cols: Number(form.zoneCols) || 0
        });
      }
      setShowAdd(false);
      setForm({ name: '', location: '', pricePerDay: 0, status: 'active', amenities: [], services: [], zoneName: '', zoneRows: 0, zoneCols: 0 });
      setLoading(true);
      await fetchBeaches();
    } catch (err) {
      console.error('Create beach failed:', err);
    }
  };

  const openAssign = (beach) => setAssignModal({ open: true, beachId: beach._id, beachName: beach.name, userId: '', role: '', grantAdmin: false });
  const closeAssign = () => setAssignModal({ open: false, beachId: null, beachName: '', userId: '', role: '', grantAdmin: false });
  const assignAdmin = async (e) => {
    e.preventDefault();
    if (!assignModal.userId) return;
    try {
      await axios.post(`/beaches/${assignModal.beachId}/admins`, { userId: assignModal.userId });
      closeAssign();
      await fetchBeaches();
    } catch (err) {
      console.error('Assign admin failed:', err);
    }
  };

  const deleteBeach = async () => {
    try {
      await axios.delete(`/beaches/${deleteConfirm.beachId}`);
      setDeleteConfirm({ open: false, beachId: null, beachName: '' });
      await fetchBeaches();
    } catch (err) {
      console.error('Delete beach failed:', err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>Beach Management</h1>
          <div className="header-actions">
            <button className="add-button" onClick={() => setAddAdminModal({ open: true, name: '', email: '', phone: '', role: 'user' })}>
              <Plus size={20} />
              <span>Add New Admin</span>
            </button>
            <button className="add-button" onClick={() => navigate('/add-new-beach')}>
              <Plus size={20} />
              <span>Add New Beach</span>
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-total-beaches">
            <div className="stat-info">
              <div className="stat-label">Total Beaches Managed</div>
              <div className="stat-value">{stats.totalBeaches}</div>
            </div>
          </div>
          <div className="stat-card stat-active-admins">
            <div className="stat-info">
              <div className="stat-label">Active Admins</div>
              <div className="stat-value">{stats.activeAdmins}</div>
            </div>
          </div>
        </div>

        {Array.isArray(occupancy) && occupancy.length > 0 && (
          <div className="table-container" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Beach Occupancy Overview</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis unit="%" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="occupancy" fill="#4A90E2" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {showAdd && (
          <div className="modal-overlay">
            <div className="modal">
            <h3>Add New Beach</h3>
              <form onSubmit={createBeach} className="modal-form">
                <div className="form-grid">
                  <label>
                    <span>Beach Name</span>
                    <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
                  </label>
                  <label>
                    <span>Location</span>
                    <input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} required />
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </label>
                  <label>
                    <span>Price/Day ($)</span>
                    <input type="number" min="0" value={form.pricePerDay} onChange={(e)=>setForm({...form,pricePerDay:e.target.value})} required />
                  </label>
                </div>

                <div className="section">
                  <h4>Services</h4>
                  <div className="checkbox-grid">
                    {['Parking','Bars','Wheelchair Accessible','Water Sports','Lifeguard','Restaurants','Blue Flag'].map(s => (
                      <label key={s} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={form.services.includes(s)}
                          onChange={(e)=>{
                            const checked = e.target.checked;
                            setForm(prev => ({
                              ...prev,
                              services: checked ? [...prev.services, s] : prev.services.filter(x=>x!==s)
                            }));
                          }}
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="section">
                  <h4>Initial Zone (optional)</h4>
                  <div className="form-grid">
                    <label>
                      <span>Zone Name</span>
                      <input value={form.zoneName} onChange={(e)=>setForm({...form,zoneName:e.target.value})} />
                    </label>
                    <label>
                      <span>Rows</span>
                      <input type="number" min="0" value={form.zoneRows} onChange={(e)=>setForm({...form,zoneRows:e.target.value})} />
                    </label>
                    <label>
                      <span>Cols</span>
                      <input type="number" min="0" value={form.zoneCols} onChange={(e)=>setForm({...form,zoneCols:e.target.value})} />
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {assignModal.open && (
          <div className="modal-overlay">
            <div className="modal assign-modal">
              <h3>Assign New Beach Admin</h3>
              <p className="modal-subtitle">Fill out the details to assign an admin to a specific beach</p>
              <form onSubmit={assignAdmin} className="modal-form">
                <div className="form-field">
                  <label>Beach Name</label>
                  <input value={assignModal.beachName} placeholder="e.g., Ocean View Beach" disabled />
                </div>
                <div className="form-field">
                  <label>Select Admin User</label>
                  <select value={assignModal.userId} onChange={(e)=>setAssignModal(m=>({...m,userId:e.target.value}))} required>
                    <option value="">Select a user</option>
                    {admins.map(u => (
                      <option key={u._id} value={u._id}>{u.name} - {u.email}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Assign Role</label>
                  <select value={assignModal.role} onChange={(e)=>setAssignModal(m=>({...m,role:e.target.value}))}>
                    <option value="">Select a role</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div className="checkbox-field">
                  <input type="checkbox" id="grantAdmin" checked={assignModal.grantAdmin} onChange={(e)=>setAssignModal(m=>({...m,grantAdmin:e.target.checked}))} />
                  <label htmlFor="grantAdmin">Grant full administrative access</label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeAssign}>Cancel</button>
                  <button type="submit" className="btn-primary">Assign Admin</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm.open && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm({ open: false, beachId: null, beachName: '' })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Beach</h3>
              <p className="modal-subtitle">Are you sure you want to delete "{deleteConfirm.beachName}"? This action cannot be undone.</p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setDeleteConfirm({ open: false, beachId: null, beachName: '' })}>Cancel</button>
                <button type="button" className="btn-primary" style={{ background: '#dc2626' }} onClick={deleteBeach}>Delete Beach</button>
              </div>
            </div>
          </div>
        )}

        {addAdminModal.open && (
          <div className="modal-overlay">
            <div className="modal add-admin-modal">
              <h3>Add New Beach Admin</h3>
              <p className="modal-subtitle">Fill out the details to add a new admin</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    name: addAdminModal.name,
                    email: addAdminModal.email,
                    phone: addAdminModal.phone,
                    password: addAdminModal.password || 'TempPassword123!',
                    role: addAdminModal.role
                  };
                  await axios.post('/admins', payload);
                  setAddAdminModal({ open: false, name: '', email: '', phone: '', password: '', role: 'user' });
                  await fetchBeaches();
                } catch (err) {
                  console.error('Add admin failed:', err);
                  toast.error(err.response?.data?.message || 'Failed to create admin');
                }
              }} className="modal-form">
                <div className="form-field">
                  <label>Name</label>
                  <input value={addAdminModal.name} onChange={(e)=>setAddAdminModal(m=>({...m,name:e.target.value}))} placeholder="Enter name" required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={addAdminModal.email} onChange={(e)=>setAddAdminModal(m=>({...m,email:e.target.value}))} placeholder="Enter email" required />
                </div>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input type="tel" value={addAdminModal.phone} onChange={(e)=>setAddAdminModal(m=>({...m,phone:e.target.value}))} placeholder="+1 234 567 8900" />
                </div>
                <div className="form-field">
                  <label>Password</label>
                  <input 
                    type="password" 
                    value={addAdminModal.password} 
                    onChange={(e)=>setAddAdminModal(m=>({...m,password:e.target.value}))} 
                    placeholder="Leave blank for default password"
                    minLength="6"
                  />
                </div>
                <div className="form-field">
                  <label>Select Role</label>
                  <select value={addAdminModal.role} onChange={(e)=>setAddAdminModal(m=>({...m,role:e.target.value}))}>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={()=>setAddAdminModal({ open: false, name: '', email: '', phone: '', password: '', role: 'Admin' })}>Cancel</button>
                  <button type="submit" className="btn-primary">Add Admin</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading beaches...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beach Name</th>
                  <th>Location</th>
                  <th>Current Admin(s)</th>
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
                      <td>
                        <div className="avatars">
                          {(beach.admins || []).slice(0,3).map((u) => (
                            <img key={u._id} className="avatar" alt={u.name}
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Admin')}&background=4A90E2&color=fff`} />
                          ))}
                          {(beach.admins || []).length > 3 && (
                            <span className="avatar-more">+{(beach.admins || []).length - 3}</span>
                          )}
                          {(beach.admins || []).length === 0 && (
                            <span className="muted">No admin assigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${beach.status}`}>
                          {beach.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-assign" onClick={()=>openAssign(beach)}>Assign Admin</button>
                          <button className="icon-button danger" onClick={() => setDeleteConfirm({ open: true, beachId: beach._id, beachName: beach.name })}>
                            <Trash2 size={18} />
                          </button>
                          <button className="icon-button" onClick={() => navigate(`/edit-beach/${beach._id}`)}>
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No beaches found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="pagination-new">
              <button className="pagination-arrow" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>
                <span>‹</span> Previous
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-number ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button className="pagination-arrow" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>
                 <span>Next›</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBeaches;
