import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MapPin, TrendingUp, Calendar, Bell, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import './Dashboard.css';
import { getSocket } from '../services/socket';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const alertsPerPage = 4;

  useEffect(() => {
    fetchDashboardData();
    const id = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(id);
  }, []);

  // Live-update occupancy from socket events
  useEffect(() => {
    const s = getSocket();
    const onOccupancy = (payload) => {
      if (!payload) return;
      setStats((prev) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.beachOccupancy) ? [...prev.beachOccupancy] : [];
        const idx = list.findIndex((b) => String(b.beachId || b._id) === String(payload.beachId));
        const nextItem = {
          ...(idx >= 0 ? list[idx] : {}),
          beachId: payload.beachId,
          name: payload.name || (idx >= 0 ? list[idx].name : 'Unknown Beach'),
          occupancyRate: payload.occupancyRate,
        };
        if (idx >= 0) list[idx] = nextItem; else list.push(nextItem);
        return { ...prev, beachOccupancy: list };
      });
    };
    s.on('beach:occupancy', onOccupancy);
    return () => {
      s.off('beach:occupancy', onOccupancy);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/alerts')
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    setCurrentPage(1);
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  const revenueData = [
    { name: 'Rental Income', value: stats?.revenueBreakdown?.rentalPercentage || 60 },
    { name: 'Service Fees', value: stats?.revenueBreakdown?.servicePercentage || 40 }
  ];

  const COLORS = ['#2c5282', '#4A90E2'];

  const totalAlerts = alerts.length;
  const totalPages = Math.ceil(totalAlerts / alertsPerPage);
  const startIndex = (currentPage - 1) * alertsPerPage;
  const endIndex = startIndex + alertsPerPage;
  const currentAlerts = alerts.slice(startIndex, endIndex);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'info':
        return <Bell size={20} color="#4A90E2" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      default:
        return <AlertTriangle size={20} color="#ef4444" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInMinutes = Math.floor((now - alertDate) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
              <MapPin size={24} color="#f59e0b" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Bookings</div>
              <div className="stat-value">{stats?.totalBookings?.toLocaleString() || '1,245'}</div>
              <div className="stat-change positive">{stats?.bookingsIncrease || '+15%'} since last month</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fce7f3' }}>
              <TrendingUp size={24} color="#ec4899" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Average Occupancy</div>
              <div className="stat-value">{stats?.avgOccupancy || '78%'}</div>
              <div className="stat-change positive">{stats?.occupancyChange || '+5%'} compared to last year</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
              <Calendar size={24} color="#f59e0b" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Upcoming Bookings</div>
              <div className="stat-value">{stats?.upcomingBookings || '320'}</div>
              <div className="stat-change">Next 7 days</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="chart-card">
            <div className="card-header">
              <div>
                <h3>Revenue Breakdown</h3>
                <p className="card-subtitle">Service Fee vs Rental income</p>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#2c5282' }}></span>
                  <span>Rental Income</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#4A90E2' }}></span>
                  <span>Service Fees</span>
                </div>
              </div>
            </div>
          </div>

          <div className="occupancy-card">
            <div className="card-header">
              <div>
                <h3>Beach Occupancy Overview</h3>
                <p className="card-subtitle">Current rates for all managed beaches</p>
              </div>
            </div>
            <div className="occupancy-list">
              {console.log(stats)}
              {stats.beachOccupancy.map((beach, index) => (
                <div key={index} className="occupancy-item">
                  <div className="occupancy-info">
                    <span className="beach-name">{beach.name}</span>
                    <span className="occupancy-rate">{beach.occupancyRate}%</span>
                  </div>
                  <div className="occupancy-bar">
                    <div 
                      className="occupancy-fill" 
                      style={{ width: `${beach.occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              )) }
            </div>
          </div>
        </div>

        <div className="alerts-card">
          <div className="card-header">
            <h3>Recent Alerts</h3>
          </div>
          <div className="alerts-list">
            {currentAlerts.map((alert, index) => (
              <div key={alert._id || index} className="alert-item">
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">{formatTimeAgo(alert.createdAt)}</div>
                </div>
              </div>
            ))}
            {currentAlerts.length === 0 && (
              <>
                <div className="alert-item">
                  <div className="alert-icon"><Bell size={20} color="#4A90E2" /></div>
                  <div className="alert-content">
                    <div className="alert-message">High booking rate for Sunset Cove.</div>
                    <div className="alert-time">2 minutes ago</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon"><AlertTriangle size={20} color="#ef4444" /></div>
                  <div className="alert-content">
                    <div className="alert-message">Unusual cancellation activity in Malibu Beach.</div>
                    <div className="alert-time">1 hour ago</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon"><CheckCircle size={20} color="#10b981" /></div>
                  <div className="alert-content">
                    <div className="alert-message">New beach property "Azure Bay" added.</div>
                    <div className="alert-time">3 hours ago</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon"><AlertTriangle size={20} color="#ef4444" /></div>
                  <div className="alert-content">
                    <div className="alert-message">Unusual cancellation activity in Malibu Beach.</div>
                    <div className="alert-time">1 hour ago</div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="alerts-footer">
            {/* <div className="pagination">
              <span className="pagination-text">{currentPage} / {totalPages || 13}</span>
            </div> */}
            {/* <button className="restart-button" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Restart</span>
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
