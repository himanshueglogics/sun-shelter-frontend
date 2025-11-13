import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getSocket } from '../services/socket';

import './ManagePage.css';
import './ManageBookings.css';

const ManageBookings = () => {

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

  /** ---------------- NEW: Edit Modal States ---------------- */
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { fetchBookings(); }, [page, status, beach, checkInFrom, checkInTo]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("booking:cancelled", fetchBookings);
    socket.on("booking:created", fetchBookings);
    socket.on("booking:updated", fetchBookings);

    return () => {
      socket.off("booking:cancelled", fetchBookings);
      socket.off("booking:created", fetchBookings);
      socket.off("booking:updated", fetchBookings);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/beaches');
        const data = res.data;
        const list = Array.isArray(data?.beaches) ? data.beaches : Array.isArray(data) ? data : [];
        setBeaches(list);
      } catch (e) {
        console.error('Error loading beaches list:', e);
      }
    })();
  }, []);

  const fetchBookings = async () => {
    try {
      if (checkInFrom && checkInTo && new Date(checkInTo) < new Date(checkInFrom)) {
        toast.error("Check-out date cannot be before Check-in date");
        setLoading(false);
        return;
      }

      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (beach) params.beach = beach;
      if (checkInFrom) params.checkInFrom = checkInFrom;
      if (checkInTo) params.checkInTo = checkInTo;

      const response = await axios.get('/bookings', { params });
      setBookings(response.data.bookings || []);
      setPages(response.data.totalPages || 1);

      try {
        const statsResp = await axios.get('/bookings/stats');
        setStats(statsResp.data);
      } catch (err) {
        console.error("Stats error:", err);
        setStats({ total: 0, active: 0, cancelled: 0 });
      }

    } catch (error) {
      console.error("Error fetching bookings:", error);
      setStats({ total: 0, active: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => setPage(1);

  /** ---------------- DELETE BOOKING ---------------- */
  const handleDeleteBooking = async () => {
    try {
      await axios.delete(`/bookings/${deleteConfirm.bookingId}`);
      setDeleteConfirm({ open: false, bookingId: null, customerName: '' });
      fetchBookings();
      toast.success("Booking cancelled successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  /** ---------------- EDIT BOOKING MODAL HANDLERS ---------------- */

  // Open Edit Modal
  const handleEditBooking = (booking) => {
    setEditModal({ open: true, data: { ...booking } });
  };

  // Update fields
  const updateEditField = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  };

  // Save edited booking
  const saveEditedBooking = async () => {
    try {
      setSavingEdit(true);
      await axios.put(`/bookings/${editModal.data.id}`, editModal.data);

      const socket = getSocket();
      socket.emit("booking:update", editModal.data);

      toast.success("Booking updated successfully!");
      setEditModal({ open: false, data: null });
      fetchBookings();
    } catch (err) {
      console.error("Error saving booking:", err);
      toast.error("Failed to update booking");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="manage-header">
          <h1>Manage Bookings</h1>
        </div>

        {/* ---------- STATS ---------- */}
        <div className="stats-cards">
          <div className="stat-card stat-total-bookings">
            <div className="stat-content">
              <div className="stat-label">Total Bookings</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-icon blue"></div>
          </div>

          <div className="stat-card stat-active-bookings">
            <div className="stat-content">
              <div className="stat-label">Active Bookings</div>
              <div className="stat-value">{stats.active}</div>
            </div>
            <div className="stat-icon green"></div>
          </div>

          <div className="stat-card stat-cancelled-bookings">
            <div className="stat-content">
              <div className="stat-label">Cancelled</div>
              <div className="stat-value">{stats.cancelled}</div>
            </div>
            <div className="stat-icon red"></div>
          </div>
        </div>

        {/* ---------- FILTERS ---------- */}
        <div className="filters-panel">
          <div className="filters-grid">

            <div className="field">
              <label>Check-in</label>
              <input type="date" value={checkInFrom} onChange={(e) => setCheckInFrom(e.target.value)} />
            </div>

            <div className="field">
              <label>Check-out</label>
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
              <label>Beach</label>
              <select value={beach} onChange={(e) => setBeach(e.target.value)}>
                <option value="">All Beaches</option>
                {beaches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

          </div>

          <div className="filters-actions">
            <button className="btn-outline" onClick={() => {
              setStatus(''); setBeach(''); setCheckInFrom(''); setCheckInTo('');
            }}>
              Clear Filters
            </button>

            <button className="btn-primary" onClick={applyFilters}>Apply</button>
          </div>
        </div>

        {/* ---------- TABLE ---------- */}
        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : (
          <div className="table-container bookings-card">
            <table className="data-table">

              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Beach</th>
                  <th>Customer</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Guests</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.bookingId}</td>
                    <td>{booking.beach?.name}</td>
                    <td>{booking.customerName}</td>
                    <td>{new Date(booking.checkInDate).toLocaleString()}</td>
                    <td>{new Date(booking.checkOutDate).toLocaleString()}</td>
                    <td><span className={`badge ${booking.status}`}>{booking.status}</span></td>
                    <td>{booking.numberOfGuests}</td>
                    <td>${Number(booking.totalAmount).toFixed(2)}</td>

                    <td>
                      <div className="row-actions">

                        {/* EDIT BUTTON (Modal) */}
                        <button className="btn" onClick={() => handleEditBooking(booking)}>
                          <Edit size={16} />
                        </button>

                        {/* DELETE */}
                        <button className="btn" onClick={() =>
                          setDeleteConfirm({
                            open: true,
                            bookingId: booking.id,
                            customerName: booking.customerName
                          })
                        }>
                          <Trash2 size={16} />
                        </button>

                        {/* VIEW */}
                        <button className="btn view" onClick={() => setSelectedBooking(booking)}>
                          View
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

            <div className="table-footer">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}

        {/* ----------- EDIT MODAL ----------- */}
        {editModal.open && editModal.data && (
          <div className="modal-overlay" onClick={() => setEditModal({ open: false, data: null })}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <h3>Edit Booking</h3>

              <div className="form-grid">

                <div className="field">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={editModal.data.customerName}
                    onChange={(e) => updateEditField("customerName", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editModal.data.customerEmail || ""}
                    onChange={(e) => updateEditField("customerEmail", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={editModal.data.customerPhone || ""}
                    onChange={(e) => updateEditField("customerPhone", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Status</label>
                  <select
                    value={editModal.data.status}
                    onChange={(e) => updateEditField("status", e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="field">
                  <label>Check-in</label>
                  <input
                    type="datetime-local"
                    value={new Date(editModal.data.checkInDate).toISOString().slice(0, 16)}
                    onChange={(e) => updateEditField("checkInDate", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Check-out</label>
                  <input
                    type="datetime-local"
                    value={new Date(editModal.data.checkOutDate).toISOString().slice(0, 16)}
                    onChange={(e) => updateEditField("checkOutDate", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    value={editModal.data.totalAmount}
                    onChange={(e) => updateEditField("totalAmount", Number(e.target.value))}
                  />
                </div>

                <div className="field">
                  <label>Guests</label>
                  <input
                    type="number"
                    value={editModal.data.numberOfGuests}
                    onChange={(e) => updateEditField("numberOfGuests", Number(e.target.value))}
                  />
                </div>

              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditModal({ open: false, data: null })}>
                  Cancel
                </button>

                <button className="btn-primary" disabled={savingEdit} onClick={saveEditedBooking}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ----------- VIEW MODAL (unchanged) ----------- */}
        {selectedBooking && (
          <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <h3>Booking Details</h3>
              <p><strong>Customer:</strong> {selectedBooking.customerName}</p>
              <p><strong>Beach:</strong> {selectedBooking.beach?.name}</p>
              <p><strong>Status:</strong> {selectedBooking.status}</p>
              <p><strong>Check-in:</strong> {new Date(selectedBooking.checkInDate).toLocaleString()}</p>
              <p><strong>Check-out:</strong> {new Date(selectedBooking.checkOutDate).toLocaleString()}</p>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ----------- DELETE CONFIRM MODAL ----------- */}
        {deleteConfirm.open && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm({ open: false, bookingId: null, customerName: '' })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Cancel Booking</h3>
              <p>Are you sure you want to cancel booking for <strong>{deleteConfirm.customerName}</strong>?</p>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm({ open: false, bookingId: null, customerName: '' })}>No</button>
                <button className="btn-primary" style={{ background: "#e53935" }} onClick={handleDeleteBooking}>Yes, Cancel</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManageBookings;
