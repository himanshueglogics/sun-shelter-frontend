import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { ChevronLeft, Plus, X, Umbrella } from 'lucide-react';
import './AddNewBeach.css';
import { toast } from 'react-toastify';
import { joinBeach, leaveBeach, getSocket } from '../services/socket';

const AddNewBeach = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get beach ID from URL if editing
  const isEditMode = Boolean(id);
  const [form, setForm] = useState({
    name: '',
    location: '',
    status: 'active',
    services: [],
    pricePerDay: 0
  });
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(15);
  const [sunbeds, setSunbeds] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  // Live occupancy metrics
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [currentBookings, setCurrentBookings] = useState(0);

  const servicesList = ['Parking', 'Bars', 'Wheelchair Accessible', 'Water Sports', 'Lifeguard', 'Restaurants', 'Blue Flag'];

  // Load beach data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadBeachData();
    }
  }, [id, isEditMode]);

  // Join socket room for this beach in edit mode and listen for real-time updates
  useEffect(() => {
    if (!isEditMode || !id) return;
    joinBeach(id);
    const s = getSocket();
    const onSunbedUpdate = (payload) => {
      if (!payload || payload.beachId !== id) return;
      // Only update if the event relates to the currently selected zone (if any)
      if (selectedZone && payload.zoneId !== String(selectedZone)) return;
      setSunbeds(prev => prev.map(b => {
        // Match by _id if available, otherwise by row/col
        const match = b._id ? String(b._id) === String(payload.sunbed?._id) : (b.row === payload.sunbed?.row && b.col === payload.sunbed?.col);
        return match ? { ...b, ...payload.sunbed } : b;
      }));
    };
    const onZoneUpdate = (payload) => {
      if (!payload || payload.beachId !== id) return;
      if (!payload.zone || String(payload.zone._id) !== String(selectedZone)) return;
      setRows(payload.zone.rows || rows);
      setCols(payload.zone.cols || cols);
      if (Array.isArray(payload.zone.sunbeds)) {
        setSunbeds(payload.zone.sunbeds);
      }
    };
    const onBeachOccupancy = (payload) => {
      if (!payload || payload.beachId !== id) return;
      if (typeof payload.occupancyRate === 'number') setOccupancyRate(payload.occupancyRate);
      if (typeof payload.capacity === 'number') setTotalCapacity(payload.capacity);
      if (typeof payload.currentBookings === 'number') setCurrentBookings(payload.currentBookings);
    };
    s.on('sunbed:update', onSunbedUpdate);
    s.on('zone:update', onZoneUpdate);
    s.on('beach:occupancy', onBeachOccupancy);
    return () => {
      s.off('sunbed:update', onSunbedUpdate);
      s.off('zone:update', onZoneUpdate);
      s.off('beach:occupancy', onBeachOccupancy);
      leaveBeach(id);
    };
  }, [isEditMode, id, selectedZone]);

  const loadBeachData = async () => {
    try {
      const response = await axios.get(`/beaches/${id}`);
      const beach = response.data;
      setForm({
        name: beach.name || '',
        location: beach.location || '',
        status: beach.status || 'active',
        services: beach.services || [],
        pricePerDay: beach.pricePerDay || 0
      });
      // Initialize metrics from backend
      if (typeof beach.occupancyRate === 'number') setOccupancyRate(beach.occupancyRate);
      if (typeof beach.capacity === 'number') setTotalCapacity(beach.capacity);
      if (typeof beach.currentBookings === 'number') setCurrentBookings(beach.currentBookings);
      if (beach.zones && beach.zones.length > 0) {
        setZones(beach.zones);
        // Default to first zone if none selected
        const firstZoneId = beach.zones[0]?._id || beach.zones[0]?.id;
        setSelectedZone(prev => prev || firstZoneId);
      }
      if (beach.image) {
        setImagePreview(beach.image);
      }
    } catch (err) {
      console.error('Failed to load beach data:', err);
      toast.error('Failed to load beach data');
    }
  };

  const toggleService = (service) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const addZone = () => {
    const newZone = { id: Date.now(), name: `Zone ${zones.length + 1}`, rows: 0, cols: 0, sunbeds: [] };
    setZones([...zones, newZone]);
  };

  const removeZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
    if (selectedZone === id) setSelectedZone(null);
  };

  const generateSunbeds = () => {
    if (!selectedZone || rows < 1 || cols < 1) return;
    const beds = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        // Randomly assign different states for demonstration
        beds.push({ row: r, col: c, status: 'available', code: `R${r}C${c}` });
      }
    }
    setSunbeds(beds);
    setZones(zones.map(z => z.id === selectedZone ? { ...z, rows, cols, sunbeds: beds } : z));
  };

  // When selectedZone changes or zones load, set rows/cols and sunbeds from backend zone data (edit mode)
  useEffect(() => {
    if (!selectedZone) return;
    const z = zones.find(zz => String(zz._id || zz.id) === String(selectedZone));
    if (z) {
      setRows(z.rows || rows);
      setCols(z.cols || cols);
      if (Array.isArray(z.sunbeds) && z.sunbeds.length > 0) {
        // Use backend-provided sunbeds when present
        setSunbeds(z.sunbeds);
      } else if (rows > 0 && cols > 0) {
        // Fallback generator for new zones without saved beds
        const beds = [];
        for (let r = 1; r <= (z.rows || rows); r++) {
          for (let c = 1; c <= (z.cols || cols); c++) {
            beds.push({ row: r, col: c, status: 'available', code: `R${r}C${c}` });
          }
        }
        setSunbeds(beds);
      }
    }
  }, [selectedZone, JSON.stringify(zones)]);

  // Ensure sunbeds are visible when creating a new beach or no zone/back-end data yet
  useEffect(() => {
    // If there are already sunbeds (from backend), don't overwrite
    if (sunbeds.length > 0) return;
    const z = zones.find(zz => String(zz._id || zz.id) === String(selectedZone));
    const r = (z && z.rows) || rows;
    const c = (z && z.cols) || cols;
    if (r > 0 && c > 0) {
      const beds = [];
      for (let i = 1; i <= r; i++) {
        for (let j = 1; j <= c; j++) {
          beds.push({ row: i, col: j, status: 'available', code: `R${i}C${j}` });
        }
      }
      setSunbeds(beds);
    }
  }, [rows, cols, selectedZone, JSON.stringify(zones)]);

  // Rebuild grid when rows/cols change
  useEffect(() => {
    // If either dimension is zero, clear grid
    if (rows === 0 || cols === 0) {
      setSunbeds([]);
      if (selectedZone) {
        setZones(prev => prev.map(zz => String(zz._id || zz.id) === String(selectedZone) ? { ...zz, rows, cols, sunbeds: [] } : zz));
      }
      if (isEditMode && id && selectedZone) {
        const timer = setTimeout(async () => {
          try {
            const res = await axios.put(`/beaches/${id}/zones/${selectedZone}`, { rows, cols });
            const updated = res.data;
            const updatedZone = (updated.zones || []).find(zz => String(zz._id || zz.id) === String(selectedZone));
            if (updatedZone) {
              setZones(updated.zones);
              setSunbeds([]);
            }
          } catch (_) {}
        }, 200);
        return () => clearTimeout(timer);
      }
      return; // nothing else to do when 0 clears
    }

    if (isEditMode && id && selectedZone) {
      // Persist new layout to backend and use returned sunbeds
      const timer = setTimeout(async () => {
        try {
          const res = await axios.put(`/beaches/${id}/zones/${selectedZone}`, { rows, cols });
          const updated = res.data;
          const updatedZone = (updated.zones || []).find(zz => String(zz._id || zz.id) === String(selectedZone));
          if (updatedZone) {
            setZones(updated.zones);
            setSunbeds(Array.isArray(updatedZone.sunbeds) ? updatedZone.sunbeds : []);
          }
        } catch (e) {
          // no-op
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Local generation for new beach
      const beds = [];
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          beds.push({ row: r, col: c, status: 'available', code: `R${r}C${c}` });
        }
      }
      setSunbeds(beds);
      if (selectedZone) {
        setZones(prev => prev.map(zz => String(zz._id || zz.id) === String(selectedZone) ? { ...zz, rows, cols, sunbeds: beds } : zz));
      }
    }
  }, [rows, cols, selectedZone, isEditMode, id]);

  const toggleSunbed = (row, col) => {
    // Support both backend beds (with _id) and generated ones (row/col)
    setSunbeds(prev => prev.map(b => {
      const isTarget = (b.row === row && b.col === col);
      if (isTarget) {
        // Disallow interaction for locked states, including previously selected
        if (b.status === 'reserved' || b.status === 'unavailable' || b.status === 'selected') return b;
        const nextStatus = 'selected';
        // Persist to backend in edit mode when we have IDs
        if (isEditMode && id && selectedZone && b._id) {
          axios.put(`/beaches/${id}/zones/${selectedZone}/sunbeds/${b._id}`, { status: nextStatus }).catch(() => {});
        }
        return { ...b, status: nextStatus };
      }
      return b;
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const saveBeach = async () => {
    try {
      const payload = {
        name: form.name,
        location: form.location,
        status: form.status,
        services: form.services,
        pricePerDay: Number(form.pricePerDay) || 0
      };
      
      let beachId;
      if (isEditMode) {
        // Update existing beach
        await axios.put(`/beaches/${id}`, payload);
        beachId = id;
        toast.success('Beach updated successfully!');
      } else {
        // Create new beach
        const res = await axios.post('/beaches', payload);
        beachId = res.data._id;
        toast.success('Beach created successfully!');
      }
      
      // Create/update zones (only for new beaches or if zones changed)
      if (!isEditMode) {
        for (const zone of zones) {
          if (zone.sunbeds.length > 0) {
            await axios.post(`/beaches/${beachId}/zones`, {
              name: zone.name,
              rows: zone.rows,
              cols: zone.cols,
              sunbeds: zone.sunbeds
            });
          }
        }
      }
      
      navigate('/manage-beaches');
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} beach:`, err);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} beach`);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content add-beach-page">
        
        <div className="beach-form-container">
          <div className="image-upload-section">
        <button className='backbuttonmain' onClick={() => navigate('/manage-beaches')}>
          <ChevronLeft size={24} />
          <span>{isEditMode ? 'Edit Beach' : 'Add New Beach'}</span>
        </button>
            
            <div className="image-preview">
              {imagePreview ? (
                <img src={imagePreview} alt="Beach preview" />
              ) : (
                <div className="placeholder-image">
                  <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600" alt="Beach" />
                </div>
              )}
              <button className="add-more-btn" onClick={() => document.getElementById('imageInput').click()}>
                Add More
              </button>
              <input id="imageInput" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>
            
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Beach Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sunset Beach" required />
            </div>
            <div className="form-field">
              <label>Beach Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Beach Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="USA"
                required
              />
              {form.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`}
                  className="view-map-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Google Maps
                </a>
              ) : <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`}
                  className="view-map-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Google Maps
                </a>}
            </div>
            {/* <div className="form-field">
              <label>Price Per Day ($)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01"
                value={form.pricePerDay} 
                onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} 
                placeholder="50.00" 
              />
            </div> */}
          </div>

          <div className="services-section">
            <h3>Services</h3>
            <div className="services-grid">
              {servicesList.map(service => (
                <label key={service} className="service-checkbox">
                  <input
                    type="checkbox"
                    checked={form.services.includes(service)}
                    onChange={() => toggleService(service)}
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="zones-section">
            <div className="section-header">
              <h3>Zones</h3>
              <button className="add-zone-btn" onClick={addZone}>
                <Plus size={16} />
                Add New Zone
              </button>
            </div>
            <div className="zones-list">
              {zones.map(zone => {
                const zid = String(zone._id || zone.id);
                return (
                <div key={zid} className={`zone-chip ${String(selectedZone) === zid ? 'selected' : ''}`} onClick={() => setSelectedZone(zid)}>
                  <span>{zone.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeZone(zone.id); }}>
                    <X size={14} />
                  </button>
                </div>
              );})}
            </div>
          </div>

          <div className="sunbed-section">
            <h3>Select Sunbed</h3>
            
            {/* Zone Selection Checkboxes */}
            <div className="zone-checkboxes">
              {zones.map((zone, idx) => {
                const zid = String(zone._id || zone.id);
                return (
                <label key={zid} className="zone-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={String(selectedZone) === zid} 
                    onChange={() => setSelectedZone(String(selectedZone) === zid ? null : zid)} 
                  />
                  <span>Zone {idx + 1}</span>
                </label>
              );})}
            </div>

            {/* Grid Controls with Date Pickers */}
            <div className="grid-controls-row">
              <div className="control-field">
                <label>Select number of rows</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    value={rows} 
                    onChange={(e) => setRows(Number(e.target.value) || 0)} 
                    placeholder="Select number of rows"
                  />
                  <span className="calendar-icon">📅</span>
                </div>
              </div>
              <div className="control-field">
                <label>Select number of columns</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    value={cols} 
                    onChange={(e) => setCols(Number(e.target.value) || 0)} 
                    placeholder="Select number of columns"
                  />
                  <span className="calendar-icon">📅</span>
                </div>
              </div>
            </div>

            {/* Sunbed Grid with Action Buttons */}
            {sunbeds.length > 0 && (
              <div className="sunbed-grid-container">
                <div className="sunbed-grid-wrapper">
                  <div className="sunbed-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {sunbeds.map((bed, idx) => (
                      <div
                        key={idx}
                        className={`sunbed-item ${bed.status}`}
                        onClick={() => toggleSunbed(bed.row, bed.col)}
                      >
                        <Umbrella size={28} strokeWidth={1.5} />
                        <span>{bed.code || `R${bed.row}C${bed.col}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={() => navigate('/manage-beaches')}>Cancel</button>
            <button className="btn-primary" onClick={saveBeach}>
              {isEditMode ? 'Update Beach' : 'Save Beach'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewBeach;
