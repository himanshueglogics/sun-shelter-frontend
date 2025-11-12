import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ManagePage.css';
import './ManageBookings.css';
import { toast } from 'react-toastify';
import { getSocket } from '../services/socket';

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
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page,status,beach,checkInFrom,checkInTo]);

  useEffect(()=>{
    const socket=getSocket();
    const handleBookingCancelled=(payload)=>{
      console.log("Booking Cancelled",payload)
      fetchBookings();
    }
    const handleBookingCreated=(payload)=>{
      console.log("Booking created",payload)
      fetchBookings();
    }
    socket.on("booking:cancelled",handleBookingCancelled);
    socket.on("booking:created",handleBookingCreated);
    return ()=>{
      socket.off("booking:cancelled",handleBookingCancelled);
      socket.off("booking:created",handleBookingCreated);
    }
  },[])

  useEffect(() => {
    // fetch beaches for dropdown
    (async () => {
      try {
        const res = await axios.get('/beaches');
        const data = res.data;
        const list = Array.isArray(data?.beaches) ? data.beaches : (Array.isArray(data) ? data : []);
        setBeaches(list);
      } catch (e) {
        console.error('Error loading beaches list:', e);
      }
    })();
  }, []);

  const fetchBookings = async () => {
    try {
      if (checkInFrom && checkInTo && new Date(checkInTo)<new Date(checkInFrom)){
        toast.error("Check-out date cannot be before Check-in date")
        setLoading(false)
        return;
      }
      setLoading(true)
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (beach) params.beach = beach;
      if (checkInFrom) params.checkInFrom = checkInFrom;
      if (checkInTo) params.checkInTo = checkInTo;
      const response = await axios.get('/bookings', { params });
      setBookings(response.data.bookings || []);
      setPages(response.data.totalPages || 1);
      
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
        const allBookings = allBookingsResponse.data.bookings || [];
        const activeCount = allBookings.filter(b => 
         [  'confirmed','pending', 'completed'].includes(b.status)
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
    // setLoading(true);
    // fetchBookings();
  };

  const handleDeleteBooking = async () => {
    try {
      await axios.delete(`/bookings/${deleteConfirm.bookingId}`);
      setDeleteConfirm({ open: false, bookingId: null, customerName: '' });
      await fetchBookings();
      toast.success('Booking cancelled successfully!');
    } catch (err) {
      console.error('Delete booking failed:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleEditBooking = (bookingId) => {
    navigate(`/editbooking/${bookingId}`);
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
          <div className="stat-card stat-total-bookings">
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
          <div className="stat-card stat-active-bookings">
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
          <div className="stat-card stat-cancelled-bookings">
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
                  <option key={b.id} value={b.id}>{b.name}</option>
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
                  {/* <th>Sunbeds Booked</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.bookingId || (booking.id ? `BBK${String(booking.id).slice(-3).toUpperCase()}` : '—')}</td>
                      <td>{booking.beach?.name || 'N/A'}</td>
                      <td>{booking.customerName}</td>
                      <td>{new Date(booking.checkInDate).toLocaleString()}</td>
                      <td>{new Date(booking.checkOutDate).toLocaleString()}</td>
                      <td><span className={`badge ${booking.status}`}>{booking.status}</span></td>
                      <td>{booking.numberOfGuests}</td>
                      <td>${Number(booking.totalAmount || 0).toFixed(2)}</td>
                      <td>{booking.bookedSunbedsCount || 0}</td>
                      <td>
                        <div className="row-actions">
                          <button 
                            className="btn" 
                            title="Modify" 
                            onClick={() => handleEditBooking(booking.id)}
                            
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn" 
                            title="Cancel" 
                            onClick={() => setDeleteConfirm({ 
                              open: true, 
                              bookingId: booking.id, 
                              customerName: booking.customerName 
                            })}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="btn view" onClick={() => setSelectedBooking(booking) }>View Booking</button>
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
       {selectedBooking && (
          <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <h3>Booking Details</h3>
              <p><strong>Customer:</strong> {selectedBooking.customerName}</p>
              <p><strong>Beach:</strong> {selectedBooking.beach?.name}</p>
              <p><strong>Status:</strong> <span className={`badge ${selectedBooking.status}`}>{selectedBooking.status}</span></p>
              <p><strong>Check-in:</strong> {new Date(selectedBooking.checkInDate).toLocaleString()}</p>
              <p><strong>Check-out:</strong> {new Date(selectedBooking.checkOutDate).toLocaleString()}</p>

              <h4>Booked Sunbeds</h4>
              {selectedBooking.sunbeds?.length > 0 ? (
                <div className="sunbed-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${selectedBooking.zone?.cols || 5}, 1fr)`,
                  gap: '4px'
                }}>
                  {selectedBooking.zone?.sunbeds?.map((bed) => {
                    const isBooked = selectedBooking.sunbeds.some(s => s.id === bed.id);
                    return (
                      <div key={bed.id} className={`sunbed-item ${isBooked ? 'booked' : ''}`}>
                        {bed.code}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No sunbeds booked</p>
              )}

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
