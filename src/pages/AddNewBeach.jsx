import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { ChevronLeft, Plus, X, Umbrella, Rows } from 'lucide-react';
import './AddNewBeach.css';
import { toast } from 'react-toastify';
import { joinBeach, leaveBeach, getSocket } from '../services/socket';

const AddNewBeach = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [sunbeds, setSunbeds] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
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

        const match = b.id ? String(b.id) === String(payload.sunbed?.id) : (b.row === payload.sunbed?.row && b.col === payload.sunbed?.col);
        return match ? { ...b, ...payload.sunbed } : b;
      }));
    };
    const onZoneUpdate = (payload) => {
      if (!payload || payload.beachId !== id) return;
      if (!payload.zone || String(payload.zone.id) !== String(selectedZone)) return;
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
        const firstZone = beach.zones[0];
        const firstZoneId = String(firstZone?.id)
        setSelectedZone(prev => prev || firstZoneId);

        // Immediately set rows/cols from first zone to avoid showing 0
        if (firstZone) {
          setRows(firstZone.rows || 0);
          setCols(firstZone.cols || 0);
          if (firstZone.sunbeds && firstZone.sunbeds.length > 0) {
            setSunbeds(firstZone.sunbeds);
          }
        }
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
    const newZone = { id: Date.now(), name: `Zone ${zones.length + 1}`, rows: 5, cols: 15, sunbeds: [] };
    setZones([...zones, newZone]);
    setSelectedZone(newZone.id);
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

  // When selectedZone changes, set rows/cols and sunbeds from that zone's data
  useEffect(() => {
    if (!selectedZone) return;
    const z = zones.find(zz => String(zz.id) === String(selectedZone));
    if (z) {
      // Always use zone's actual rows/cols values
      setRows(z.rows || 0);
      setCols(z.cols || 0);

      if (Array.isArray(z.sunbeds) && z.sunbeds.length > 0) {
        // Use backend-provided sunbeds when present
        setSunbeds(z.sunbeds);
      } else if (z.rows > 0 && z.cols > 0) {
        // Fallback generator for new zones without saved beds
        const beds = [];
        for (let r = 1; r <= z.rows; r++) {
          for (let c = 1; c <= z.cols; c++) {
            beds.push({ row: r, col: c, status: 'available', code: `R${r}C${c}` });
          }
        }
        setSunbeds(beds);
      } else {
        setSunbeds([]);
      }
    }
  }, [selectedZone]);

  // Ensure sunbeds are visible when creating a new beach or no zone/back-end data yet
  useEffect(() => {
    // If there are already sunbeds (from backend), don't overwrite
    if (sunbeds.length > 0) return;
    const z = zones.find(zz => String(zz.id) === String(selectedZone));
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
        setZones(prev => prev.map(zz => String(zz.id) === String(selectedZone) ? { ...zz, rows, cols, sunbeds: [] } : zz));
      }
      return; // nothing else to do when 0 clears
    }

    // Keep layout changes local (no backend write until Save)
    const beds = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        beds.push({ row: r, col: c, status: 'available', code: `R${r}C${c}` });
      }
    }
    setSunbeds(beds);
    if (selectedZone) {
      setZones(prev => prev.map(zz => String(zz.id) === String(selectedZone) ? { ...zz, rows, cols, sunbeds: beds } : zz));
    }
  }, [rows, cols, selectedZone, isEditMode, id]);

  const toggleSunbed = async (row, col) => {
    let changed = null;
    setSunbeds(prev => {
      const updated = prev.map(b => {
        const isTarget = (b.row === row && b.col === col);
        if (isTarget) {
          // Disallow interaction for locked states
          if (b.status === 'reserved' || b.status === 'unavailable') return b;
          // Toggle between available <-> selected
          const nextStatus = b.status === 'selected' ? 'available' : 'selected';
          if (!changed) changed = { id: b.id, nextStatus };
          return { ...b, status: nextStatus };
        }
        return b;
      });

      if (selectedZone) {
        setZones(prev => prev.map(z =>
          String(z.id) === String(selectedZone)
            ? { ...z, sunbeds: updated }
            : z
        ));
      }

      return updated;
    });

    // Persist immediately in edit mode when we have a real bed id
    try {
      if (isEditMode && changed && changed.id) {
        await axios.put(`/beaches/${id}/zones/${selectedZone}/sunbeds/${changed.id}`, { status: changed.nextStatus });
      }
    } catch (e) {
      // Non-blocking: backend will still be corrected on Save, but log for debugging
      console.error('Failed to update sunbed status:', e);
    }
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
    const trimmedName = (form.name || '').trim();
    const trimmedLocation = (form.location || '').trim();
    if (!trimmedName || !trimmedLocation) {
      toast.error('Please provide both beach name and location before saving.');
      return;
    }
    try {
      if (!isEditMode) {
        const hasValidZone = Array.isArray(zones) && zones.some(z => Number(z.rows) > 0 && Number(z.cols) > 0);
        if (!hasValidZone) {
          toast.error('Please add at least one zone with rows and columns before creating the beach.');
          return;
        }
      }
      const payload = {
        name: trimmedName,
        location: trimmedLocation,
        status: form.status,
        services: form.services,
        pricePerDay: Number(form.pricePerDay) || 0
      };

      let beachId;
      if (isEditMode) {
        // Update existing beach
        await axios.put(`/beaches/${id}`, payload);
        beachId = id;

        // Update zones with current sunbed state
        for (const zone of zones) {
          if (zone.id && zone.sunbeds && zone.sunbeds.length > 0) {
            await axios.put(`/beaches/${beachId}/zones/${zone.id}`, {
              name: zone.name,
              rows: zone.rows,
              cols: zone.cols,
              sunbeds: zone.sunbeds
            });
          }
        }
        console.log(zones)
        toast.success('Beach updated successfully!');
      } else {
        // Create new beach
        console.log(zones)
        if (zones.length === 0) {
          toast.error('Please add at least one zone before creating the beach.');
          return;
        }
        const res = await axios.post('/beaches', payload);
        beachId = res.data.id;

        // Create zones with sunbed data
        for (const zone of zones) {
          if (zone.rows > 0 && zone.cols > 0) {
            await axios.post(`/beaches/${beachId}/zones`, {
              name: zone.name,
              rows: zone.rows,
              cols: zone.cols,
              sunbeds: zone.sunbeds || []
            });
          }
        }

        toast.success('Beach created successfully!');
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
                const zid = String(zone.id);
                return (
                  <div key={zid} className={`zone-chip ${String(selectedZone) === zid ? 'selected' : ''}`} onClick={() => setSelectedZone(zid)}>
                    <span>{zone.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeZone(zone.id); }}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sunbed-section">
            <h3>Select Sunbed</h3>

            {/* Zone Selection Checkboxes */}
            <div className="zone-checkboxes">
              {zones.map((zone, idx) => {
                const zid = String(zone.id);
                return (
                  <label key={zid} className="zone-checkbox-item">
                    <input
                      type="checkbox"
                      checked={String(selectedZone) === zid}
                      onChange={() => setSelectedZone(String(selectedZone) === zid ? null : zid)}
                    />
                    <span>Zone {idx + 1}</span>
                  </label>
                );
              })}
            </div>

            {/* Grid Controls with Date Pickers */}
            <div className="grid-controls-row">
              <div className="control-field">
                <label>Select number of rows</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
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
                    onChange={(e) => setCols(Number(e.target.value))}
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
            <button className="btn-primary" onClick={saveBeach} disabled={!isEditMode && !(Array.isArray(zones) && zones.some(z => Number(z.rows) > 0 && Number(z.cols) > 0))}>
              {isEditMode ? 'Update Beach' : 'Save Beach'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewBeach;
