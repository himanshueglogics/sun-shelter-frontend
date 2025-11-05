import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { ChevronLeft, Plus, X, Umbrella } from 'lucide-react';
import './AddNewBeach.css';
import { toast } from 'react-toastify';

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

  const servicesList = ['Parking', 'Bars', 'Wheelchair Accessible', 'Water Sports', 'Lifeguard', 'Restaurants', 'Blue Flag'];

  // Load beach data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadBeachData();
    }
  }, [id, isEditMode]);

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
      if (beach.zones && beach.zones.length > 0) {
        setZones(beach.zones);
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
        const random = Math.random();
        let status = 'available';
        if (random > 0.85) status = 'selected';
        else if (random > 0.75) status = 'reserved';
        else if (random > 0.95) status = 'unavailable';
        
        beds.push({ row: r, col: c, status, code: `D${r}` });
      }
    }
    setSunbeds(beds);
    setZones(zones.map(z => z.id === selectedZone ? { ...z, rows, cols, sunbeds: beds } : z));
  };

  // Generate sunbed grid whenever rows or cols change
  React.useEffect(() => {
    if (rows > 0 && cols > 0) {
      const beds = [];
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          const random = Math.random();
          let status = 'available';
          if (random > 0.85) status = 'selected';
          else if (random > 0.75) status = 'reserved';
          else if (random > 0.95) status = 'unavailable';
          
          beds.push({ row: r, col: c, status, code: `D${r}` });
        }
      }
      setSunbeds(beds);
      
      // Update zone data if a zone is selected
      if (selectedZone) {
        setZones(zones.map(z => z.id === selectedZone ? { ...z, rows, cols, sunbeds: beds } : z));
      }
    }
  }, [rows, cols]);

  const toggleSunbed = (row, col) => {
    setSunbeds(sunbeds.map(b => {
      if (b.row === row && b.col === col) {
        // Don't allow toggling reserved or unavailable beds
        if (b.status === 'reserved' || b.status === 'unavailable') {
          return b;
        }
        // Toggle between available and selected
        return { ...b, status: b.status === 'available' ? 'selected' : 'available' };
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
              {zones.map(zone => (
                <div key={zone.id} className={`zone-chip ${selectedZone === zone.id ? 'selected' : ''}`} onClick={() => setSelectedZone(zone.id)}>
                  <span>{zone.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeZone(zone.id); }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sunbed-section">
            <h3>Select Sunbed</h3>
            
            {/* Zone Selection Checkboxes */}
            <div className="zone-checkboxes">
              {zones.map((zone, idx) => (
                <label key={zone.id} className="zone-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={selectedZone === zone.id} 
                    onChange={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)} 
                  />
                  <span>Zone {idx + 1}</span>
                </label>
              ))}
            </div>

            {/* Grid Controls with Date Pickers */}
            <div className="grid-controls-row">
              <div className="control-field">
                <label>Select number of rows</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    value={rows} 
                    onChange={(e) => setRows(Number(e.target.value) || 1)} 
                    placeholder="Select number of rows"
                  />
                  {/* <span className="calendar-icon">📅</span> */}
                </div>
              </div>
              <div className="control-field">
                <label>Select number of columns</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    value={cols} 
                    onChange={(e) => setCols(Number(e.target.value) || 1)} 
                    placeholder="Select number of columns"
                  />
                  {/* <span className="calendar-icon">📅</span> */}
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
                        <span>{bed.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                {/* <div className="sunbed-actions">
                  <button className="action-btn assign-btn" type="button">
                    Assign
                  </button>
                  <button className="action-btn remove-btn" type="button">
                    Remove
                  </button>
                </div> */}
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
