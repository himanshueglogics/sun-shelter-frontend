import React, { useState } from 'react';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './ManagePage.css';
import './ManageIntegrations.css';

const ManageIntegrations = () => {
  const [activeTab, setActiveTab] = useState('integrations');

  // Dummy data for integrations
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [mapsEnabled, setMapsEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [englishEnabled, setEnglishEnabled] = useState(true);
  const [portugueseEnabled, setPortugueseEnabled] = useState(false);

  const [errorLogs, setErrorLogs] = useState([
    { timestamp: '2024-11-04 14:32:15', source: 'Weather API', message: 'API rate limit exceeded. Upgrade needed.', severity: 'Critical' },
    { timestamp: '2024-11-04 12:18:42', source: 'Maps Integration', message: 'Unable to fetch location coordinates for beach', severity: 'Warning' },
    { timestamp: '2024-11-04 09:45:23', source: 'Stripe', message: 'Payment webhook validation failed. Check endpoint.', severity: 'Warning' },
    { timestamp: '2024-11-03 18:22:10', source: 'PayPal', message: 'Connection timeout after 30s', severity: 'Error' }
  ]);

  const [recentTransactions] = useState([
    { id: 'TXN001', date: '2024-10-29', amount: '$1,120.00', status: 'Completed' },
    { id: 'TXN002', date: '2024-10-24', amount: '$3,150.00', status: 'Pending' },
    { id: 'TXN003', date: '2024-10-20', amount: '$890.00', status: 'Completed' },
    { id: 'TXN004', date: '2024-10-22', amount: '$1,920.00', status: 'Pending' },
    { id: 'TXN005', date: '2024-10-21', amount: '$1,450.00', status: 'Completed' },
    { id: 'TXN006', date: '2024-10-20', amount: '$750.00', status: 'Pending' },
    { id: 'TXN007', date: '2024-10-16', amount: '$1,185.00', status: 'Completed' }
  ]);

  const [occupancyData] = useState([
    { property: 'Coastal Breeze Suites', unitType: 'Studio', occupancy: '92%', available: 3 },
    { property: 'Mountain View Lodge', unitType: '2-Bedroom', occupancy: '85%', available: 5 },
    { property: 'City Central Apartments', unitType: '1-Bedroom', occupancy: '88%', available: 4 },
    { property: 'Riverside Cottages', unitType: '3-Bedroom', occupancy: '78%', available: 7 },
    { property: 'Suburban Manor Homes', unitType: '2-Bedroom', occupancy: '91%', available: 2 }
  ]);

  const [payoutReports] = useState([
    { id: 'PAY7001', date: '2024-09-30', amount: '$3,500.00', status: 'Processed', method: 'Bank Transfer' },
    { id: 'PAY7002', date: '2024-08-15', amount: '$2,100.00', status: 'Pending', method: 'PayPal' },
    { id: 'PAY7003', date: '2024-08-24', amount: '$650.00', status: 'Completed', method: 'Stripe' },
    { id: 'PAY7004', date: '2024-08-22', amount: '$3,220.00', status: 'Pending', method: 'Bank Transfer' },
    { id: 'PAY7005', date: '2024-08-22', amount: '$1,900.00', status: 'Processed', method: 'PayPal' },
    { id: 'PAY7006', date: '2024-08-22', amount: '$850.00', status: 'Pending', method: 'Stripe' }
  ]);

  const [occupancyChartData] = useState([
    { name: 'Occupied', value: 67, color: '#4A90E2' },
    { name: 'Available', value: 33, color: '#E8F1FA' }
  ]);

  // Handlers: keep UI unchanged, add functionality
  const testWeatherConnection = async () => {
    try {
      const res = await axios.post('/integrations/weather/test');
      alert(res.data?.message || 'Weather API connection successful');
    } catch (e) {
      alert(e.response?.data?.message || 'Weather API test failed');
    }
  };

  const testMapsConnection = async () => {
    try {
      const res = await axios.post('/integrations/maps/test');
      alert(res.data?.message || 'Maps API connection successful');
    } catch (e) {
      alert(e.response?.data?.message || 'Maps API test failed');
    }
  };

  const toggleWeather = async () => {
    const next = !weatherEnabled;
    setWeatherEnabled(next);
    try {
      await axios.post('/integrations/weather/toggle', { enabled: next });
    } catch (e) {
      // revert on failure
      setWeatherEnabled(!next);
      alert(e.response?.data?.message || 'Failed to update Weather setting');
    }
  };

  const toggleMaps = async () => {
    const next = !mapsEnabled;
    setMapsEnabled(next);
    try {
      await axios.post('/integrations/maps/toggle', { enabled: next });
    } catch (e) {
      setMapsEnabled(!next);
      alert(e.response?.data?.message || 'Failed to update Maps setting');
    }
  };

  const toggleStripeWebhook = async () => {
    const next = !stripeEnabled;
    setStripeEnabled(next);
    try {
      await axios.post('/integrations/stripe/webhook-toggle', { enabled: next });
    } catch (e) {
      setStripeEnabled(!next);
      alert(e.response?.data?.message || 'Failed to update Stripe webhook');
    }
  };

  const togglePaypalWebhook = async () => {
    const next = !paypalEnabled;
    setPaypalEnabled(next);
    try {
      await axios.post('/integrations/paypal/webhook-toggle', { enabled: next });
    } catch (e) {
      setPaypalEnabled(!next);
      alert(e.response?.data?.message || 'Failed to update PayPal webhook');
    }
  };

  const reconnectStripe = async () => {
    try {
      const res = await axios.post('/integrations/stripe/reconnect');
      alert(res.data?.message || 'Stripe reconnected');
    } catch (e) {
      alert(e.response?.data?.message || 'Stripe reconnect failed');
    }
  };

  const reconnectPaypal = async () => {
    try {
      const res = await axios.post('/integrations/paypal/reconnect');
      alert(res.data?.message || 'PayPal reconnected');
    } catch (e) {
      alert(e.response?.data?.message || 'PayPal reconnect failed');
    }
  };

  const clearErrorLogs = async () => {
    try {
      await axios.post('/integrations/logs/clear');
    } catch (_) {
      // ignore API failure, still clear locally to keep UI responsive
    }
    setErrorLogs([]);
  };

  const addNewPayment = () => {
    alert('Add New payment method flow coming soon.');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="integrations-header">
          <h1>Integrations Management</h1>
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('integrations')}
            >
              Integrations
            </button>
            <button 
              className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports & Analytics
            </button>
          </div>
        </div>

        {activeTab === 'integrations' ? (
          <div className="integrations-content">
            <p className="subtitle">Manage and configure third-party services for your beach rental PMS. Check all integrations.</p>

            {/* Weather & Maps Section */}
            <div className="integration-grid">
              <div className="integration-card">
                <h3>Weather API Management</h3>
                <p className="card-subtitle">Real-time weather updates</p>
                <div className="integration-field">
                  <label>API Provider: <strong>OpenWeatherMap</strong></label>
                </div>
                <div className="integration-field">
                  <label>API Key: <strong>sk_test_51M...****</strong></label>
                </div>
                <div className="integration-field">
                  <label>Status: <span className="status-badge active">Active</span></label>
                </div>
                <div className="integration-field">
                  <label>Last Synced: <strong>2 hours ago</strong></label>
                </div>
                <div className="integration-toggle">
                  <span>Enable Toggle</span>
                  <label className="switch">
                    <input type="checkbox" checked={weatherEnabled} onChange={toggleWeather} />
                    <span className="slider"></span>
                  </label>
                </div>
                <button className="btn-configure" onClick={testWeatherConnection}>Test Connection</button>
              </div>

              <div className="integration-card">
                <h3>Maps API Management</h3>
                <p className="card-subtitle">Location services</p>
                <div className="integration-field">
                  <label>API Provider: <strong>Google Maps</strong></label>
                </div>
                <div className="integration-field">
                  <label>API Key: <strong>AIza...****</strong></label>
                </div>
                <div className="integration-field">
                  <label>Status: <span className="status-badge active">Active</span></label>
                </div>
                <div className="integration-field">
                  <label>Usage Quota: <strong>8,542 / 10,000</strong></label>
                </div>
                <div className="integration-toggle">
                  <span>Enable Toggle</span>
                  <label className="switch">
                    <input type="checkbox" checked={mapsEnabled} onChange={toggleMaps} />
                    <span className="slider"></span>
                  </label>
                </div>
                <button className="btn-configure" onClick={testMapsConnection}>Test Connection</button>
              </div>
            </div>

            {/* Payment Gateway Settings */}
            <div className="section-header">
              <h2>Payment Gateway Settings</h2>
              <button className="btn-add" onClick={addNewPayment}>+ Add New</button>
            </div>

            <div className="payment-cards">
              <div className="payment-card">
                <div className="payment-header">
                  <h3>Stripe</h3>
                  <span className="status-badge connected">Connected</span>
                </div>
                <div className="payment-field">
                  <label>Account ID</label>
                  <span>acc_1234567890</span>
                </div>
                <div className="payment-field">
                  <label>Connected At</label>
                  <span>Oct 15, 2024</span>
                </div>
                <div className="payment-field">
                  <label>Last Payment</label>
                  <span>2 days ago</span>
                </div>
                <div className="payment-toggle">
                  <span>Enable Webhook</span>
                  <label className="switch">
                    <input type="checkbox" checked={stripeEnabled} onChange={toggleStripeWebhook} />
                    <span className="slider"></span>
                  </label>
                </div>
                <button className="btn-reconnect" onClick={reconnectStripe}>Reconnect Account</button>
              </div>

              <div className="payment-card">
                <div className="payment-header">
                  <h3>PayPal</h3>
                  <span className="status-badge pending">Pending</span>
                </div>
                <div className="payment-field">
                  <label>Account ID</label>
                  <span>pp_9876543210</span>
                </div>
                <div className="payment-field">
                  <label>Connected At</label>
                  <span>Oct 20, 2024</span>
                </div>
                <div className="payment-field">
                  <label>Last Payment</label>
                  <span>5 days ago</span>
                </div>
                <div className="payment-toggle">
                  <span>Enable Webhook</span>
                  <label className="switch">
                    <input type="checkbox" checked={paypalEnabled} onChange={togglePaypalWebhook} />
                    <span className="slider"></span>
                  </label>
                </div>
                <button className="btn-reconnect" onClick={reconnectPaypal}>Reconnect Account</button>
              </div>
            </div>

            {/* Legal Document Management */}
            <div className="section-header">
              <h2>Legal Document Management</h2>
            </div>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Terms of Service</td>
                  <td>2024-10-15</td>
                  <td><button className="btn-view">View</button></td>
                </tr>
                <tr>
                  <td>Privacy Policy</td>
                  <td>2024-09-28</td>
                  <td><button className="btn-view">View</button></td>
                </tr>
                <tr>
                  <td>Data Processing Agreement</td>
                  <td>2024-10-01</td>
                  <td><button className="btn-view">View</button></td>
                </tr>
                <tr>
                  <td>Refund Policy</td>
                  <td>2024-09-15</td>
                  <td><button className="btn-view">View</button></td>
                </tr>
                <tr>
                  <td>License Agreement</td>
                  <td>2024-10-12</td>
                  <td><button className="btn-view">View</button></td>
                </tr>
              </tbody>
            </table>

            {/* Language Settings */}
            <div className="section-header">
              <h2>Language Settings</h2>
            </div>
            <div className="language-cards">
              <div className="language-card">
                <div className="language-info">
                  <h4>English (US)</h4>
                  <label className="switch">
                    <input type="checkbox" checked={englishEnabled} onChange={() => setEnglishEnabled(!englishEnabled)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <span className="language-status">Primary Translation</span>
              </div>
              <div className="language-card">
                <div className="language-info">
                  <h4>Portuguese (PT)</h4>
                  <label className="switch">
                    <input type="checkbox" checked={portugueseEnabled} onChange={() => setPortugueseEnabled(!portugueseEnabled)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <span className="language-status">Inactive Translation</span>
              </div>
            </div>

            {/* Integration Error Log */}
            <div className="section-header">
              <h2>Integration Error Log</h2>
              <button className="btn-clear" onClick={clearErrorLogs}>Clear Logs</button>
            </div>
            <table className="error-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Message</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {errorLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.timestamp}</td>
                    <td>{log.source}</td>
                    <td>{log.message}</td>
                    <td><span className={`severity-badge ${log.severity.toLowerCase()}`}>{log.severity}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-content">
            <div className="reports-header">
              <h2>Reports & Analytics</h2>
              <div className="total-revenue-card">
                <span className="label">Total Revenue</span>
                <span className="value">$78,920</span>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="kpi-section">
              <h3>Key Performance Indicators</h3>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-label">Total Revenue</div>
                  <div className="kpi-value">$115,450</div>
                  <div className="kpi-change positive">↑ 12%</div>
                  <div className="kpi-subtitle">From previous earnings</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Average Occupancy Rate</div>
                  <div className="kpi-value">88%</div>
                  <div className="kpi-change positive">↑ 5%</div>
                  <div className="kpi-subtitle">Across all properties</div>
                </div>
              </div>
            </div>

            {/* Revenue Reports */}
            <div className="revenue-section">
              <h3>Revenue Reports</h3>
              <div className="revenue-subsection">
                <h4>Recent Transactions</h4>
                <p className="subsection-subtitle">Detailed list of recent activities</p>
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{txn.id}</td>
                        <td>{txn.date}</td>
                        <td>{txn.amount}</td>
                        <td><span className={`status-pill ${txn.status.toLowerCase()}`}>{txn.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Occupancy Rate Reports */}
            <div className="occupancy-section">
              <h3>Occupancy Rate Reports</h3>
              <div className="occupancy-grid">
                <div className="occupancy-chart-card">
                  <h4>Property Occupancy Overview</h4>
                  <p className="subsection-subtitle">Current occupancy of properties and available units</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={occupancyChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {occupancyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-dot" style={{ background: '#4A90E2' }}></div>
                      <span>67 Occupied</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot" style={{ background: '#E8F1FA' }}></div>
                      <span>33 Available</span>
                    </div>
                  </div>
                </div>

                <div className="occupancy-details-card">
                  <h4>Occupancy Details by Property</h4>
                  <p className="subsection-subtitle">Breakdown of occupancy rates per property</p>
                  <table className="occupancy-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Unit Type</th>
                        <th>Occupancy</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupancyData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.property}</td>
                          <td>{item.unitType}</td>
                          <td><span className="occupancy-rate">{item.occupancy}</span></td>
                          <td>{item.available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payout Reports */}
            <div className="payout-section">
              <h3>Payout Reports</h3>
              <table className="payout-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutReports.map((payout) => (
                    <tr key={payout.id}>
                      <td>{payout.id}</td>
                      <td>{payout.date}</td>
                      <td>{payout.amount}</td>
                      <td><span className={`status-pill ${payout.status.toLowerCase()}`}>{payout.status}</span></td>
                      <td>{payout.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageIntegrations;
