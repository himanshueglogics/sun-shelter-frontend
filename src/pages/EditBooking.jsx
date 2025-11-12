import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar";
import { getSocket } from "../services/socket";
import "./EditBooking.css";

const EditBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [beaches, setBeaches] = useState([]);

  useEffect(() => {
    fetchBooking();
    fetchBeaches();

    const socket = getSocket();
    socket.on("booking:updated", (payload) => {
      if (payload.id === Number(id)) {
        toast.info("Booking was updated by another user, refreshing...");
        fetchBooking();
      }
    });

    return () => {
      socket.off("booking:updated");
    };
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`/bookings/${id}`);   
      setBooking(res.data);
    } catch (err) {
      console.error("Error loading booking:", err);
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBeaches = async () => {
    try {
      const res = await axios.get("/beaches");
      setBeaches(res.data.beaches || []);
    } catch (err) {
      console.error("Error loading beaches:", err);
    }
  };

  const handleChange = (field, value) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/bookings/${id}`, booking);
      toast.success("Booking updated successfully!");
      const socket = getSocket();
      socket.emit("booking:update", booking); // broadcast change
      navigate("/manage-bookings");
    } catch (err) {
      console.error("Error saving booking:", err);
      toast.error("Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading booking...</div>;
  if (!booking) return <div className="error">Booking not found</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content edit-booking">
        <h1>Edit Booking</h1>

        <div className="form-grid">
          <div className="field">
            <label>Customer Name</label>
            <input
              type="text"
              value={booking.customerName || ""}
              onChange={(e) => handleChange("customerName", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={booking.customerEmail || ""}
              onChange={(e) => handleChange("customerEmail", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Phone</label>
            <input
              type="text"
              value={booking.customerPhone || ""}
              onChange={(e) => handleChange("customerPhone", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Beach</label>
            <select
              value={booking.beachId || ""}
              onChange={(e) => handleChange("beachId", e.target.value)}
            >
              <option value="">Select Beach</option>
              {beaches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Check-In</label>
            <input
              type="datetime-local"
              value={new Date(booking.checkInDate)
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => handleChange("checkInDate", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Check-Out</label>
            <input
              type="datetime-local"
              value={new Date(booking.checkOutDate)
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => handleChange("checkOutDate", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Status</label>
            <select
              value={booking.status || ""}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="field">
            <label>Total Amount ($)</label>
            <input
              type="number"
              value={booking.totalAmount || 0}
              onChange={(e) =>
                handleChange("totalAmount", parseFloat(e.target.value))
              }
            />
          </div>

          <div className="field">
            <label>Guests</label>
            <input
              type="number"
              value={booking.numberOfGuests || 1}
              onChange={(e) =>
                handleChange("numberOfGuests", parseInt(e.target.value))
              }
            />
          </div>
        </div>

        <div className="actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/manage-bookings")}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBooking;
