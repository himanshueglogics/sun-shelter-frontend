import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import './ManageFinance.css';

const ManageFinance = () => {
  // loading states
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [loadingBeachRevenue, setLoadingBeachRevenue] = useState(false);
  const [loadingServiceFees, setLoadingServiceFees] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // data states
  const [overview, setOverview] = useState({ totalRevenue: 0, pendingPayouts: 0, totalExpenses: 0 });
  const [payouts, setPayouts] = useState([]);
  const [beachRevenue, setBeachRevenue] = useState([]);
  const [serviceFees, setServiceFees] = useState([]);
  const [serviceRules, setServiceRules] = useState([]);
  const [detailedReport, setDetailedReport] = useState([]);
  const [insightsData, setInsightsData] = useState([]);
  const [beaches, setBeaches] = useState([]);
  const [originalInsights, setOriginalInsights] = useState([]);

  // filters
  const [filterBeach, setFilterBeach] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchPayouts();
    fetchBeachRevenue();
    fetchServiceFees();
    fetchServiceRules();
    fetchDetailedReport();
    fetchInsights(); // initial load with no filters
    fetchBeaches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------ Fetch helpers ------------------ */

  const safeData = (res) => {
    // Accept either res.data (array/object) or res.data.data or entire res
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.data === undefined) return res;
    return res.data?.data ?? res.data;
  };

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await axios.get('/finance/overview').catch(() => ({ data: { totalRevenue: 0, pendingPayouts: 0, totalExpenses: 0 } }));
      const data = res?.data ?? { totalRevenue: 0, pendingPayouts: 0, totalExpenses: 0 };
      setOverview(data);
    } catch (error) {
      console.error('Overview error', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchBeaches = async () => {
    try {
      const res = await axios.get('/beaches');
      // backend might return { beaches: [...] } or an array directly
      const list = res?.data?.beaches ?? res?.data ?? [];
      setBeaches(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load beaches', err);
      setBeaches([]);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const res = await axios.get('/finance/payouts').catch(() => ({ data: [] }));
      const raw = safeData(res);
      const mapped = (Array.isArray(raw) ? raw : []).map((p) => ({
        id: p.id || `P_${Math.random().toString(36).slice(2, 8)}`,
        recipient: p.beach?.name || p.recipientName || 'Unknown Recipient',
        amount: p.amount ?? 0,
        date: p.requestedDate ? new Date(p.requestedDate).toLocaleDateString() : (p.date ? new Date(p.date).toLocaleDateString() : ''),
        status: (p.status || 'pending').charAt(0).toUpperCase() + (p.status || 'pending').slice(1)
      }));
      setPayouts(mapped.length > 0 ? mapped : [
        { id: 'P001', recipient: 'Paradise Beach Admin', amount: 1500, date: '2024-07-28', status: 'Pending' },
        { id: 'P002', recipient: 'Sunset Cove Management', amount: 2100, date: '2024-07-27', status: 'Pending' },
        { id: 'P003', recipient: 'Coral Reef Rentals', amount: 850, date: '2024-07-26', status: 'Approved' }
      ]);
    } catch (error) {
      console.error('Payouts error', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const fetchBeachRevenue = async () => {
    try {
      setLoadingBeachRevenue(true);
      const res = await axios.get('/finance/beach-revenue').catch(() => ({ data: [] }));
      const raw = safeData(res);
      const colors = ['#3b82f6', '#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#fbbf24'];
      const mapped = (Array.isArray(raw) ? raw : []).map((it, idx) => ({
        name: it.name || it.beachName || `Beach ${idx + 1}`,
        value: typeof it.value === 'number' ? it.value : (it.revenuePercent ?? (it.totalRevenue ? Number(((it.totalRevenue || 0) / 1000).toFixed(0)) : 0)),
        color: colors[idx % colors.length]
      }));
      setBeachRevenue(mapped.length > 0 ? mapped : [
        { name: 'Paradise Beach', value: 35, color: '#3b82f6' },
        { name: 'Sunset Cove', value: 25, color: '#1e3a8a' },
        { name: 'Coral Reef', value: 15, color: '#10b981' },
        { name: 'Blue Lagoon', value: 20, color: '#f59e0b' },
        { name: 'Golden Sands', value: 5, color: '#ef4444' },
      ]);
    } catch (error) {
      console.error('Beach revenue error', error);
    } finally {
      setLoadingBeachRevenue(false);
    }
  };

  const fetchServiceFees = async (paramsStr = '') => {
    try {
      setLoadingServiceFees(true);
      const url = paramsStr ? `/finance/service-fees?${paramsStr}` : '/finance/service-fees';
      const res = await axios.get(url).catch(() => ({ data: [] }));
      const raw = safeData(res);
      setServiceFees((Array.isArray(raw) && raw.length > 0) ? raw : [
        { beach: 'Sunset Beach', bookings: 245, vip: 120, guests: 890, revenue: '$125,000' },
        { beach: 'Crystal Cove', bookings: 198, vip: 95, guests: 720, revenue: '$98,500' }
      ]);
    } catch (error) {
      console.error('Service fees error', error);
    } finally {
      setLoadingServiceFees(false);
    }
  };

  const fetchServiceRules = async () => {
    try {
      setLoadingRules(true);
      const res = await axios.get('/finance/service-fees').catch(() => ({ data: [] }));
      const raw = safeData(res) || [];
      let mapped = [];
      if (Array.isArray(raw) && raw.length > 0) {
        mapped = raw.map((r, idx) => ({
          id: r.id || `R${String(idx + 1).padStart(3, '0')}`,
          ruleName: r.ruleName || r.name || `Rule ${idx + 1}`,
          condition: r.condition || r.criteria || '—',
          feePercent: (r.feePercent ?? r.fee ?? r.percentage) ? `${(r.feePercent ?? r.fee ?? r.percentage)}` + '%' : '—',
          status: (r.status || 'inactive').charAt(0).toUpperCase() + (r.status || 'inactive').slice(1)
        }));
      }
      setServiceRules(mapped);
    } catch (error) {
      console.error('Service rules error', error);
    } finally {
      setLoadingRules(false);
    }
  };

  const fetchDetailedReport = async (paramsStr = '') => {
    try {
      setLoadingDetailed(true);
      const url = paramsStr ? `/finance/detailed-report?${paramsStr}` : '/finance/detailed-report';
      const res = await axios.get(url).catch(() => ({ data: [] }));
      const raw = safeData(res);
      const mapped = (Array.isArray(raw) ? raw : []).map((r, idx) => ({
        id: r.id || r.beachId || `BCH${String(idx + 1).padStart(3, '0')}`,
        beachName: r.beach?.name || r.beachName || r.name || `Beach ${idx + 1}`,
        totalRevenue: r.totalRevenue ?? r.bookingRevenue ?? r.revenue ?? 0,
        serviceFees: r.serviceFees ?? r.serviceFeesAmount ?? r.fees ?? 0,
        payoutsMade: r.payoutsMade ?? r.payouts ?? 0
      }));
      setDetailedReport(mapped.length > 0 ? mapped : [
        { id: 'BCH001', beachName: 'Paradise Beach', totalRevenue: '$35,000.00', serviceFees: '$3,500.00', payoutsMade: '$1,500.00' },
        { id: 'BCH002', beachName: 'Sunset Cove', totalRevenue: '$25,000.00', serviceFees: '$2,500.00', payoutsMade: '$2,100.00' }
      ]);
    } catch (error) {
      console.error('Detailed report error', error);
    } finally {
      setLoadingDetailed(false);
    }
  };

 const fetchInsights = async () => {
  try {
    setLoadingInsights(true);

    const res = await axios.get('/finance'); // RAW FINANCE DATA
    const finances = safeData(res);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Create 12 empty month buckets
    const monthly = months.map((m) => ({
      month: m,
      revenue: 0,
      beach: "All"
    }));

    finances.forEach((item) => {
      if (!item.date) return;

      const dt = new Date(item.date);
      const monthIndex = dt.getMonth(); // 0–11

      const amount = Number(item.amount ?? 0);

      // extract beach from DB join
      const beachName = item.beach?.name || "Unknown";

      monthly[monthIndex].revenue += amount;
      monthly[monthIndex].beach = beachName;
    });

    setOriginalInsights(monthly);
    setInsightsData(monthly);

  } catch (err) {
    console.error("Insights fetch error", err);
  } finally {
    setLoadingInsights(false);
  }
};


  // Actions: Approve / Reject
  const handleApprove = async (id) => {
    try {
      await axios.post(`/finance/payouts/${id}/approve`);
      setPayouts(prev => prev.map(p => (p.id === id ? { ...p, status: 'Approved' } : p)));
      setOverview(prev => ({ ...prev, pendingPayouts: Math.max(0, (prev.pendingPayouts || 0) - 1) }));
      toast.success('Payout approved successfully');
    } catch (e) {
      console.error('Approve error', e);
      toast.error('Failed to approve payout');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`/finance/payouts/${id}/reject`);
      setPayouts(prev => prev.filter(p => p.id !== id));
      setOverview(prev => ({ ...prev, pendingPayouts: Math.max(0, (prev.pendingPayouts || 0) - 1) }));
      toast.success('Payout rejected successfully');
    } catch (e) {
      console.error('Reject error', e);
      toast.error('Failed to reject payout');
    }
  };

  // Filtering logic: builds querystring and reloads only the affected section (insights)
  const applyFilters = () => {
  let filtered = [...originalInsights];

  // ⭐ FILTER BY BEACH
  if (filterBeach) {
    filtered = filtered.filter(
      (item) => item.beach?.toLowerCase() === filterBeach.toLowerCase()
    );
  }

  // ⭐ FILTER BY TIME (monthly/weekly)
  if (filterMonth === "monthly") {
    // Show full 12 months (already built)
  }

  if (filterMonth === "weekly") {
    // Convert 12-month into 4 weekly groups
    const weekly = [
      { month: "Week 1", revenue: 0 },
      { month: "Week 2", revenue: 0 },
      { month: "Week 3", revenue: 0 },
      { month: "Week 4", revenue: 0 },
    ];

    filtered.forEach((item, i) => {
      weekly[i % 4].revenue += item.revenue;
    });

    filtered = weekly;
  }

  // Update graph
  setInsightsData(filtered);
};



  // Reset filters → only reset bar graph data
  const clearFilters = () => {
  setFilterBeach("");
  setFilterMonth("");
  setFilterYear("");

  fetchInsights({});
};

  const seedDummyData = async () => {
    if (!window.confirm('This will replace all existing finance data with dummy data. Continue?')) return;
    try {
      const response = await axios.post('/finance/seed');
      toast.success(`Created ${response.data.financeRecords} finance records and ${response.data.payouts} payouts`);
      // refresh
      fetchOverview();
      fetchPayouts();
      fetchBeachRevenue();
      fetchServiceFees('');
      fetchServiceRules();
      fetchDetailedReport();
      fetchInsights();
    } catch (error) {
      console.error('Seed error', error);
      toast.error('Failed to seed data');
    }
  };

  const downloadStatement = () => {
    let csvContent = "ID,Recipient,Amount,Date,Status\n";
    payouts.forEach(p => {
      csvContent += `${p.id},"${p.recipient}",${p.amount},"${p.date}","${p.status}"\n`;
    });
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

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="finance-header">
          <h1>Financial Dashboard</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-assign" onClick={seedDummyData}>Generate Dummy Data</button>
          </div>
        </div>

        {/* Overview */}
        <div className="overview-section">
          <h2 className="overview-title">Overview</h2>
          <div className="overview-cards">
            <div className="overview-card">
              <div className="card-value">
                ${Number(overview.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="card-label">Total Revenue</div>
              <div className="card-icon blue"><TrendingUp size={18} /></div>
            </div>

            <div className="overview-card">
              <div className="card-value">{overview.pendingPayouts ?? 0}</div>
              <div className="card-label">Pending Payouts</div>
              <div className="card-icon red"><AlertCircle size={18} /></div>
            </div>

            <div className="overview-card">
              <div className="card-value">
                ${Number(overview.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="card-label">Total Expenses</div>
              <div className="card-icon green"><DollarSign size={18} /></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bookings">
          <h3>Filter Bookings</h3>

          <div className="filter-row">
            {/* Select Time */}
            <div className="filter-field">
              <label>Select Time</label>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                <option value="">All / Monthly / Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Select Beach */}
            <div className="filter-field">
              <label>Select Beach</label>
              <select value={filterBeach} onChange={(e) => setFilterBeach(e.target.value)}>
                <option value="">Select beach</option>

                {beaches && beaches.length > 0 ? (
                  beaches.map((b) => (
                    // use b.id for key; value is b.name to match your backend filter expectation
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No beaches available</option>
                )}
              </select>
            </div>

            {/* Buttons */}
            <div className="filter-actions">
              <button className="btn-filter clear" onClick={clearFilters}>Clear Filters</button>
              <button className="btn-filter apply" onClick={applyFilters}>Apply Filters</button>
            </div>
          </div>
        </div>

        {/* Insights (interactive with filters) */}
        <div className="insights-section">
          <h3>Insights</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={insightsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={(n) => `$${(n / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payout Approval Queue */}
        <div className="payout-section">
          <div className="payout-header">
            <h3>Payout Approval Queue</h3>
            <span className="link-text" onClick={downloadStatement}>Download Statement</span>
          </div>

          <table className="payout-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.recipient}</td>
                  <td>${Number(p.amount || 0).toLocaleString()}</td>
                  <td>{p.date}</td>
                  <td><span className={`status-pill ${p.status.toLowerCase()}`}>{p.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-sm btn-approve"
                        onClick={() => handleApprove(p.id)}
                        disabled={p.status.toLowerCase() === 'approved'}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-sm btn-reject"
                        onClick={() => handleReject(p.id)}
                        disabled={p.status.toLowerCase() === 'approved'}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue Grid: donut + rules */}
        <div className="revenue-grid">
          <div className="revenue-card">
            <h3>Beach Revenue Distribution</h3>
            <p className="subtitle">Percentage of total revenue contributed by each beach.</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={beachRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {beachRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-legend" style={{ marginTop: 8 }}>
              {beachRevenue.map((item, idx) => (
                <div className="legend-item" key={idx}>
                  <div className="legend-color" style={{ background: item.color }}></div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="revenue-card">
            <h3>Dynamic Service Fee Rules</h3>
            <p className="subtitle">Manage rules for service fees based on booking conditions.</p>

            <table className="service-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rule Name</th>
                  <th>Condition</th>
                  <th>Fee %</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingRules && (
                  <tr><td colSpan="6" className="no-data">Loading rules...</td></tr>
                )}

                {!loadingRules && serviceRules.length === 0 && (
                  <tr><td colSpan="6" className="no-data">No service fee rules found</td></tr>
                )}

                {serviceRules.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.ruleName}</td>
                    <td>{r.condition}</td>
                    <td>{r.feePercent}</td>
                    <td><span className="status-badge">{r.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-button">↗</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Beach Revenue Report */}
        <div className="detailed-report">
          <h3>Detailed Beach Revenue Report</h3>
          <p className="subtitle">Comprehensive financial breakdown for each beach location.</p>

          <table className="detailed-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Beach Name</th>
                <th>Total Revenue</th>
                <th>Service Fees</th>
                <th>Payouts Made</th>
              </tr>
            </thead>
            <tbody>
              {detailedReport.length === 0 && <tr><td colSpan="5" className="no-data">No beach revenue data found</td></tr>}
              {detailedReport.map((rep) => (
                <tr key={rep.id}>
                  <td>{rep.id}</td>
                  <td>{rep.beachName}</td>
                  <td>{typeof rep.totalRevenue === 'number' ? `$${Number(rep.totalRevenue).toLocaleString()}` : rep.totalRevenue}</td>
                  <td>{typeof rep.serviceFees === 'number' ? `$${Number(rep.serviceFees).toLocaleString()}` : rep.serviceFees}</td>
                  <td>{typeof rep.payoutsMade === 'number' ? `$${Number(rep.payoutsMade).toLocaleString()}` : rep.payoutsMade}</td>
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
