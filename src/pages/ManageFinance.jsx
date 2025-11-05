import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './ManagePage.css';
import './ManageFinance.css';

const ManageFinance = () => {
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [loadingBeachRevenue, setLoadingBeachRevenue] = useState(false);
  const [loadingServiceFees, setLoadingServiceFees] = useState(false);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
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
    // Kick off independent fetches so only each section updates
    fetchOverview();
    fetchPayouts();
    fetchBeachRevenue();
    fetchServiceFees();
    fetchDetailedReport();
    fetchInsights();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await axios.get('/finance/overview').catch(() => ({ data: { totalRevenue: 0, pendingPayouts: 0, totalExpenses: 0 } }));
      setOverview(res.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const res = await axios.get('/finance/payouts').catch(() => ({ data: [] }));
      const mapped = res.data.map(p => ({
        id: p._id,
        beach: p.beach?.name || 'Unknown Beach',
        amount: p.amount,
        date: new Date(p.requestedDate).toLocaleDateString(),
        status: p.status.charAt(0).toUpperCase() + p.status.slice(1)
      }));
      setPayouts(mapped.length > 0 ? mapped : [
        { id: 'demo1', beach: 'Sunset Beach', amount: 12500, date: '2024-07-15', status: 'Pending' },
        { id: 'demo2', beach: 'Crystal Cove', amount: 9200, date: '2024-07-14', status: 'Pending' }
      ]);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const fetchBeachRevenue = async () => {
    try {
      setLoadingBeachRevenue(true);
      const res = await axios.get('/finance/beach-revenue').catch(() => ({ data: [] }));
      const colors = ['#3b82f6', '#f59e0b', '#1e3a8a', '#fbbf24', '#10b981', '#ef4444'];
      const mapped = res.data.map((item, idx) => ({ name: item.name, value: item.value, color: colors[idx % colors.length] }));
      setBeachRevenue(mapped.length > 0 ? mapped : [
        { name: 'Sunset Beach', value: 35, color: '#3b82f6' },
        { name: 'Crystal Cove', value: 28, color: '#f59e0b' }
      ]);
    } catch (error) {
      console.error('Error fetching beach revenue:', error);
    } finally {
      setLoadingBeachRevenue(false);
    }
  };

  const fetchServiceFees = async (paramsStr = '') => {
    try {
      setLoadingServiceFees(true);
      const res = await axios.get(`/finance/service-fees${paramsStr ? `?${paramsStr}` : ''}`).catch(() => ({ data: [] }));
      setServiceFees(res.data.length > 0 ? res.data : [
        { beach: 'Sunset Beach', bookings: 245, vip: 120, guests: 890, revenue: '$125,000' },
        { beach: 'Crystal Cove', bookings: 198, vip: 95, guests: 720, revenue: '$98,500' }
      ]);
    } catch (error) {
      console.error('Error fetching service fees:', error);
    } finally {
      setLoadingServiceFees(false);
    }
  };

  const fetchDetailedReport = async (paramsStr = '') => {
    try {
      setLoadingDetailed(true);
      const res = await axios.get(`/finance/detailed-report${paramsStr ? `?${paramsStr}` : ''}`).catch(() => ({ data: [] }));
      setDetailedReport(res.data.length > 0 ? res.data : [
        { beach: 'Sunset Beach', bookingRevenue: '$125,000', serviceFees: '$8,750', totalRevenue: '$133,750' },
        { beach: 'Crystal Cove', bookingRevenue: '$98,500', serviceFees: '$6,895', totalRevenue: '$105,395' }
      ]);
    } catch (error) {
      console.error('Error fetching detailed report:', error);
    } finally {
      setLoadingDetailed(false);
    }
  };

  const fetchInsights = async (paramsStr = '') => {
    try {
      setLoadingInsights(true);
      const res = await axios.get(`/finance/insights${paramsStr ? `?${paramsStr}` : ''}`).catch(() => ({ data: [] }));
      setInsightsData(res.data.length > 0 ? res.data : [
        { month: 'Jan', revenue: 52000 },
        { month: 'Feb', revenue: 48000 },
        { month: 'Mar', revenue: 61000 },
        { month: 'Apr', revenue: 78000 },
        { month: 'May', revenue: 92000 },
        { month: 'Jun', revenue: 105000 }
      ]);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`/finance/payouts/${id}/approve`);
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
      // Update pending payouts count
      setOverview(prev => ({ ...prev, pendingPayouts: Math.max(0, prev.pendingPayouts - 1) }));
      toast.success('Payout approved successfully');
    } catch (e) {
      console.error('Error approving payout:', e);
      toast.error('Failed to approve payout');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`/finance/payouts/${id}/reject`);
      setPayouts(prev => prev.filter(p => p.id !== id));
      // Update pending payouts count
      setOverview(prev => ({ ...prev, pendingPayouts: Math.max(0, prev.pendingPayouts - 1) }));
      toast.success('Payout rejected successfully');
    } catch (e) {
      console.error('Error rejecting payout:', e);
      toast.error('Failed to reject payout');
    }
  };

  const applyFilters = async () => {
    try {
      const params = new URLSearchParams();
      if (filterBeach) params.append('beach', filterBeach);
      if (filterMonth) params.append('month', filterMonth);
      if (filterYear) params.append('year', filterYear);
      
      const qs = params.toString();
      // Reload only the affected sections
      await Promise.all([
        fetchServiceFees(qs),
        fetchDetailedReport(qs),
        fetchInsights(qs)
      ]);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const clearFilters = () => {
    setFilterBeach('');
    setFilterMonth('');
    setFilterYear('');
    // Reload only sections influenced by filters with default params
    fetchServiceFees('');
    fetchDetailedReport('');
    fetchInsights('');
  };

  const seedDummyData = async () => {
    if (!window.confirm('This will replace all existing finance data with dummy data. Continue?')) {
      return;
    }
    
    try {
      const response = await axios.post('/finance/seed');
      toast.success(`Created ${response.data.financeRecords} finance records and ${response.data.payouts} payouts`);
      // Refresh all sections without blocking the whole page
      fetchOverview();
      fetchPayouts();
      fetchBeachRevenue();
      fetchServiceFees('');
      fetchDetailedReport('');
      fetchInsights('');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed data: ' + (error.response?.data?.message || error.message));
    }
  };

  const downloadStatement = () => {
    // Create CSV content
    let csvContent = "Beach,Amount,Date,Status\n";
    payouts.forEach(payout => {
      csvContent += `${payout.beach},${payout.amount},${payout.date},${payout.status}\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payout_statement_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Note: Removing global blocking loader to avoid full component reload

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="finance-header">
          <h1>Financial Dashboard</h1>
          <button 
            onClick={seedDummyData} 
            style={{
              padding: '8px 16px',
              background: '#4A90E2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Generate Dummy Data
          </button>
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
              <button className="btn-filter clear" onClick={clearFilters}>Clear Filters</button>
              <button className="btn-filter apply" onClick={applyFilters}>Apply Filters</button>
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
            <span className="link-text" onClick={downloadStatement} style={{ cursor: 'pointer' }}>Download Statement</span>
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
                <Tooltip />
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
