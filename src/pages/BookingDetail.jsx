import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, Umbrella } from 'lucide-react';
import axios from '../api/axios';
import './ManagePage.css';
import './BookingDetail.css';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    beachName: 'Sunset Beach',
    customerName: 'Alice Johnson',
    status: 'confirmed',
    checkInDate: '2024-07-15',
    checkOutDate: '2024-07-20',
    numberOfGuests: 4,
    sunbeds: 4
  });
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(14);
  const [sunbeds, setSunbeds] = useState([]);

  useEffect(() => {
    loadBooking();
  }, [id]);

  useEffect(() => {
    generateSunbeds();
  }, [rows, cols]);

  const loadBooking = async () => {
    try {
      const res = await axios.get(`/bookings/${id}`);
      if (res.data) {
        setBooking({
          beachName: res.data.beach?.name || 'Sunset Beach',
          customerName: res.data.customerName || 'Alice Johnson',
          status: res.data.status || 'confirmed',
          checkInDate: res.data.checkInDate ? res.data.checkInDate.substring(0, 10) : '2024-07-15',
          checkOutDate: res.data.checkOutDate ? res.data.checkOutDate.substring(0, 10) : '2024-07-20',
          numberOfGuests: res.data.numberOfGuests || 4,
          sunbeds: res.data.sunbeds || 4
        });
      }
    } catch (e) {
      console.log('Using dummy booking data');
    } finally {
      setLoading(false);
    }
  };

  const generateSunbeds = () => {
    const beds = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const isSelected = (r === 1 && c === 1); // First sunbed selected as example
        const isReserved = Math.random() > 0.7; // Random reserved sunbeds
        const isUnavailable = Math.random() > 0.85; // Random unavailable
        
        let status = 'available';
        if (isUnavailable) status = 'unavailable';
        else if (isReserved) status = 'reserved';
        else if (isSelected) status = 'selected';
        
        beds.push({
          row: r,
          col: c,
          code: `D${r}`,
          status
        });
      }
    }
    setSunbeds(beds);
  };

  const toggleSunbed = (index) => {
    setSunbeds(prev => prev.map((bed, idx) => {
      if (idx === index && bed.status !== 'unavailable' && bed.status !== 'reserved') {
        return { ...bed, status: bed.status === 'selected' ? 'available' : 'selected' };
      }
      return bed;
    }));
  };

  const updateField = (key, value) => {
    setBooking(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content"><div className="loading">Loading...</div></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content booking-detail-page">
        {/* Header with Back Button */}
        <div className="booking-detail-header">
          <button className="back-btn" onClick={() => navigate('/manage-bookings')}>
            <ChevronLeft size={20} />
            <span>Manage Beach</span>
          </button>
        </div>

        {/* Beach Name Header */}
        <div className="beach-name-header">
          <button className="back-btn-small" onClick={() => navigate('/manage-bookings')}>
            <ChevronLeft size={18} />
          </button>
          <h2>{booking.beachName}</h2>
        </div>

        {/* Booking Form */}
        <div className="booking-form-grid">
          <div className="form-field">
            <label>Beach Name</label>
            <input 
              type="text" 
              value={booking.beachName} 
              onChange={(e) => updateField('beachName', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Customer Name</label>
            <input 
              type="text" 
              value={booking.customerName} 
              onChange={(e) => updateField('customerName', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Status</label>
            <select 
              value={booking.status} 
              onChange={(e) => updateField('status', e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-field">
            <label>Check In</label>
            <input 
              type="date" 
              value={booking.checkInDate} 
              onChange={(e) => updateField('checkInDate', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Check Out</label>
            <input 
              type="date" 
              value={booking.checkOutDate} 
              onChange={(e) => updateField('checkOutDate', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Guests</label>
            <input 
              type="number" 
              min="1" 
              value={booking.numberOfGuests} 
              onChange={(e) => updateField('numberOfGuests', Number(e.target.value))}
            />
          </div>
          <div className="form-field">
            <label>Sunbeds</label>
            <input 
              type="number" 
              min="1" 
              value={booking.sunbeds} 
              onChange={(e) => updateField('sunbeds', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Select Sunbed Section */}
        <div className="select-sunbed-section">
          <div className="sunbed-header">
            <h3>Select Sunbed</h3>
            <button className="btn-add-sunbed">+ Add Sunbed</button>
          </div>

          {/* Legend */}
          <div className="sunbed-legend">
            <div className="legend-item">
              <div className="legend-box available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-box selected"></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div className="legend-box reserved"></div>
              <span>Reserved</span>
            </div>
            <div className="legend-item">
              <div className="legend-box unavailable"></div>
              <span>Unavailable</span>
            </div>
          </div>

          {/* Row and Column Selectors */}
          <div className="grid-controls">
            <div className="control-field">
              <label>Select number of rows</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={rows} 
                onChange={(e) => setRows(Number(e.target.value))}
              />
            </div>
            <div className="control-field">
              <label>Select number of columns</label>
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={cols} 
                onChange={(e) => setCols(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Sunbed Grid */}
          <div className="sunbed-grid">
            {sunbeds.map((bed, idx) => (
              <div
                key={idx}
                className={`sunbed-item ${bed.status}`}
                onClick={() => toggleSunbed(idx)}
              >
                <Umbrella size={24} />
                <span>{bed.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
