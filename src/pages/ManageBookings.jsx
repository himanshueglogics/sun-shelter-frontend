import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ManagePage.css';
import './ManageBookings.css';

const ManageBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [beach, setBeach] = useState('');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [beaches, setBeaches] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, cancelled: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, bookingId: null, customerName: '' });

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // fetch beaches for dropdown
    (async () => {
      try {
        const res = await axios.get('/beaches');
        const data = res.data;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setBeaches(list);
      } catch (e) {
        console.error('Error loading beaches list:', e);
      }
    })();
  }, []);

  const fetchBookings = async () => {
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (beach) params.beach = beach;
      if (checkInFrom) params.checkInFrom = checkInFrom;
      if (checkInTo) params.checkInTo = checkInTo;
      const response = await axios.get('/bookings', { params });
      setBookings(response.data.items || []);
      setPages(response.data.pages || 1);
      
      // Fetch real statistics from API
      try {
        const statsResponse = await axios.get('/bookings/stats');
        setStats({
          total: statsResponse.data.total || 0,
          active: statsResponse.data.active || 0,
          cancelled: statsResponse.data.cancelled || 0
        });
      } catch (statsError) {
        console.error('Error fetching booking stats:', statsError);
        // Fallback: calculate from all bookings if stats endpoint fails
        const allBookingsResponse = await axios.get('/bookings', { params: { limit: 10000 } });
        const allBookings = allBookingsResponse.data.items || [];
        const activeCount = allBookings.filter(b => 
          b.status === 'confirmed' || b.status === 'pending' || b.status === 'completed'
        ).length;
        const cancelledCount = allBookings.filter(b => b.status === 'cancelled').length;
        setStats({ 
          total: allBookings.length, 
          active: activeCount, 
          cancelled: cancelledCount 
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Set default stats on error
      setStats({ total: 0, active: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    setLoading(true);
    fetchBookings();
  };

  const handleDeleteBooking = async () => {
    try {
      await axios.delete(`/bookings/${deleteConfirm.bookingId}`);
      setDeleteConfirm({ open: false, bookingId: null, customerName: '' });
      await fetchBookings();
      alert('Booking cancelled successfully!');
    } catch (err) {
      console.error('Delete booking failed:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleEditBooking = (bookingId) => {
    // Navigate to edit booking page (you can create this page later)
    navigate(`/edit-booking/${bookingId}`);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="manage-header">
          <h1>Manage Bookings</h1>
          {/* <button className="add-button">
            <Plus size={20} />
            <span>Add Booking</span>
          </button> */}
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Total Bookings</div>
              <div className="stat-value">{stats.total.toLocaleString()}</div>
            </div>
            <div className="stat-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Active Bookings</div>
              <div className="stat-value">{stats.active.toLocaleString()}</div>
            </div>
            <div className="stat-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Cancelled Bookings</div>
              <div className="stat-value">{stats.cancelled.toLocaleString()}</div>
            </div>
            <div className="stat-icon red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
        </div>

        <div className="filters-panel">
          <div className="filters-grid">
            <div className="field">
              <label>Check-in Date</label>
              <input type="date" value={checkInFrom} onChange={(e) => setCheckInFrom(e.target.value)} />
            </div>
            <div className="field">
              <label>Check-out Date</label>
              <input type="date" value={checkInTo} onChange={(e) => setCheckInTo(e.target.value)} />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="field">
              <label>Beach Name</label>
              <select value={beach} onChange={(e)=>setBeach(e.target.value)}>
                <option value="">All Beaches</option>
                {(Array.isArray(beaches) ? beaches : []).map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filters-actions">
            <button className="btn-outline" onClick={() => { setStatus(''); setBeach(''); setCheckInFrom(''); setCheckInTo(''); }}>Clear Filters</button>
            <button className="btn-primary" onClick={applyFilters}>Apply Filters</button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : (
          <div className="table-container bookings-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Beach Name</th>
                  <th>Customer Name</th>
                  <th>Check-in Date & Time</th>
                  <th>Check-out Date & Time</th>
                  <th>Status</th>
                  <th>Guests</th>
                  <th>Booking Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking.bookingId || (booking._id ? `BBK${String(booking._id).slice(-3).toUpperCase()}` : '—')}</td>
                      <td>{booking.beach?.name || 'N/A'}</td>
                      <td>{booking.customerName}</td>
                      <td>{new Date(booking.checkInDate).toLocaleString()}</td>
                      <td>{new Date(booking.checkOutDate).toLocaleString()}</td>
                      <td><span className={`badge ${booking.status}`}>{booking.status}</span></td>
                      <td>{booking.numberOfGuests}</td>
                      <td>${Number(booking.totalAmount || 0).toFixed(2)}</td>
                      <td>
                        <div className="row-actions">
                          <button 
                            className="btn" 
                            title="Modify" 
                            onClick={() => handleEditBooking(booking._id)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn" 
                            title="Cancel" 
                            onClick={() => setDeleteConfirm({ 
                              open: true, 
                              bookingId: booking._id, 
                              customerName: booking.customerName 
                            })}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="btn view" onClick={() => navigate(`/bookings/${booking._id}`)}>View Booking</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">No bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="table-footer">
              <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</button>
              <span className="pagination-text">Page {page} of {pages}</span>
              <button disabled={page>=pages} onClick={() => setPage(p => Math.min(pages, p+1))}>Next</button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.open && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm({ open: false, bookingId: null, customerName: '' })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Cancel Booking</h3>
              <p style={{ marginTop: '16px', marginBottom: '24px', color: '#666' }}>
                Are you sure you want to cancel the booking for <strong>{deleteConfirm.customerName}</strong>? This action cannot be undone.
              </p>
              <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setDeleteConfirm({ open: false, bookingId: null, customerName: '' })}
                >
                  No, Keep It
                </button>
                <button 
                  className="btn-primary" 
                  style={{ background: '#e53935' }}
                  onClick={handleDeleteBooking}
                >
                  Yes, Cancel Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
