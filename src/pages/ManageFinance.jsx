import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './ManagePage.css';
import './ManageFinance.css';

const ManageFinance = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ totalRevenue: 0, pendingPayouts: 0, totalExpenses: 0 });
  const [payouts, setPayouts] = useState([]);
  const [beachRevenue, setBeachRevenue] = useState([]);
  const [serviceFees, setServiceFees] = useState([]);
  const [detailedReport, setDetailedReport] = useState([]);
  const [insightsData, setInsightsData] = useState([]);
  const [filterBeach, setFilterBeach] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      // Set dummy data immediately (will be replaced if API succeeds)
      setOverview({ totalRevenue: 1234567.89, pendingPayouts: 27, totalExpenses: 687664.32 });
      
      // Try to fetch overview from API
      try {
        const overviewRes = await axios.get('/finance/overview');
        if (overviewRes.data) {
          setOverview(overviewRes.data);
        }
      } catch (err) {
        console.log('Using dummy overview data');
      }

      // Set dummy data for all sections
      setPayouts([
        { id: 'PAY001', beach: 'Sunset Beach', amount: 12500, date: '2024-07-15', status: 'Pending' },
        { id: 'PAY002', beach: 'Crystal Cove Management', amount: 9200, date: '2024-07-14', status: 'Pending' },
        { id: 'PAY003', beach: 'Palm Oasis', amount: 15600, date: '2024-07-13', status: 'Pending' },
        { id: 'PAY004', beach: 'SEA Golden Sands', amount: 11000, date: '2024-07-12', status: 'Pending' }
      ]);

      setBeachRevenue([
        { name: 'Sunset Beach', value: 35, color: '#3b82f6' },
        { name: 'Crystal Cove', value: 28, color: '#f59e0b' },
        { name: 'Palm Oasis', value: 22, color: '#1e3a8a' },
        { name: 'Golden Sands', value: 15, color: '#fbbf24' }
      ]);

      setServiceFees([
        { beach: 'Sunset Beach', bookings: 245, vip: 120, guests: 890, revenue: '$125,000' },
        { beach: 'Crystal Cove', bookings: 198, vip: 95, guests: 720, revenue: '$98,500' },
        { beach: 'Palm Oasis', bookings: 167, vip: 78, guests: 610, revenue: '$82,300' },
        { beach: 'Golden Sands', bookings: 134, vip: 62, guests: 490, revenue: '$67,800' }
      ]);

      setDetailedReport([
        { beach: 'Sunset Beach', bookingRevenue: '$125,000', serviceFees: '$8,750', totalRevenue: '$133,750' },
        { beach: 'Crystal Cove', bookingRevenue: '$98,500', serviceFees: '$6,895', totalRevenue: '$105,395' },
        { beach: 'Palm Oasis', bookingRevenue: '$82,300', serviceFees: '$5,761', totalRevenue: '$88,061' },
        { beach: 'Golden Sands', bookingRevenue: '$67,800', serviceFees: '$4,746', totalRevenue: '$72,546' },
        { beach: 'Ocean Breeze', bookingRevenue: '$54,200', serviceFees: '$3,794', totalRevenue: '$57,994' }
      ]);

      setInsightsData([
        { month: 'Jan', revenue: 52000 },
        { month: 'Feb', revenue: 48000 },
        { month: 'Mar', revenue: 61000 },
        { month: 'Apr', revenue: 78000 },
        { month: 'May', revenue: 92000 },
        { month: 'Jun', revenue: 105000 },
        { month: 'Jul', revenue: 118000 },
        { month: 'Aug', revenue: 112000 },
        { month: 'Sep', revenue: 98000 },
        { month: 'Oct', revenue: 85000 },
        { month: 'Nov', revenue: 72000 },
        { month: 'Dec', revenue: 88000 }
      ]);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/finance/payouts/${id}/approve`);
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
    } catch (e) {
      console.error('Error approving payout:', e);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`/finance/payouts/${id}/reject`);
      setPayouts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Error rejecting payout:', e);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content">
          <div className="loading">Loading financial dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="finance-header">
          <h1>Financial Dashboard</h1>
        </div>

        {/* Overview Section */}
        <div className="overview-section">
          <h2 className="overview-title">Overview</h2>
          <div className="overview-cards">
            <div className="overview-card">
              <div className="card-value">${overview.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="card-label">Total Revenue</div>
              <div className="card-icon blue">
                <TrendingUp size={20} color="#3b82f6" />
              </div>
            </div>
            <div className="overview-card">
              <div className="card-value">{overview.pendingPayouts}</div>
              <div className="card-label">Pending Payouts</div>
              <div className="card-icon red">
                <AlertCircle size={20} color="#ef4444" />
              </div>
            </div>
            <div className="overview-card">
              <div className="card-value">${overview.totalExpenses?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="card-label">Total Expenses</div>
              <div className="card-icon green">
                <DollarSign size={20} color="#10b981" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bookings */}
        <div className="filter-bookings">
          <h3>Filter Bookings</h3>
          <div className="filter-row">
            <div className="filter-field">
              <label>Beach Name</label>
              <input type="text" placeholder="e.g., Sunset Beach" value={filterBeach} onChange={(e) => setFilterBeach(e.target.value)} />
            </div>
            <div className="filter-field">
              <label>Select Month</label>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Select Year</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn-filter clear" onClick={() => { setFilterBeach(''); setFilterMonth(''); setFilterYear(''); }}>Clear Filters</button>
              <button className="btn-filter apply">Apply Filters</button>
            </div>
          </div>
        </div>

        {/* Insights Chart */}
        <div className="insights-section">
          <h3>Insights</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={insightsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#4A90E2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payout Approval Queue */}
        <div className="payout-section">
          <div className="payout-header">
            <h3>Payout Approval Queue</h3>
            <span className="link-text">Download Statement</span>
          </div>
          <table className="payout-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Beach</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.id}</td>
                  <td>{payout.beach}</td>
                  <td>${payout.amount?.toLocaleString()}</td>
                  <td>{payout.date}</td>
                  <td><span className={`status-pill ${payout.status.toLowerCase()}`}>{payout.status}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-approve" onClick={() => handleApprove(payout.id)}>Approve</button>
                      <button className="btn-sm btn-reject" onClick={() => handleReject(payout.id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Beach Revenue Reports */}
        <div className="revenue-grid">
          {/* Beach Revenue Distribution (Donut Chart) */}
          <div className="revenue-card">
            <h3>Beach Revenue Distribution</h3>
            <p className="subtitle">Percentage breakdown of revenue by beach location</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={beachRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {beachRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend">
              {beachRevenue.map((item, idx) => (
                <div className="legend-item" key={idx}>
                  <div className="legend-color" style={{ background: item.color }}></div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Service Fee Table */}
          <div className="revenue-card">
            <h3>Dynamic Service Fee Table</h3>
            <p className="subtitle">Real-time service fee calculations based on bookings</p>
            <table className="service-table">
              <thead>
                <tr>
                  <th>Beach</th>
                  <th>Bookings</th>
                  <th>VIP</th>
                  <th>Guests</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {serviceFees.map((fee, idx) => (
                  <tr key={idx}>
                    <td>{fee.beach}</td>
                    <td>{fee.bookings}</td>
                    <td>{fee.vip}</td>
                    <td>{fee.guests}</td>
                    <td>{fee.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Beach Revenue Report */}
        <div className="detailed-report">
          <h3>Detailed Beach Revenue Report</h3>
          <p className="subtitle">Comprehensive revenue breakdown for each beach location</p>
          <table className="detailed-table">
            <thead>
              <tr>
                <th>Beach</th>
                <th>Booking Revenue</th>
                <th>Service Fees</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {detailedReport.map((report, idx) => (
                <tr key={idx}>
                  <td>{report.beach}</td>
                  <td>{report.bookingRevenue}</td>
                  <td>{report.serviceFees}</td>
                  <td>{report.totalRevenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageFinance;
