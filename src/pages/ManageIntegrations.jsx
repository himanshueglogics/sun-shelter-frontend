import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Trash } from "lucide-react";
import './ManagePage.css';
import './ManageIntegrations.css';

const ManageIntegrations = () => {
  const [activeTab, setActiveTab] = useState('integrations');

  // Add/Edit Integration Modal
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    id: null,
    name: '',
    type: '',
    provider: '',
    apiKey: '',
    enabled: true
  });

  // Add Document modal
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    type: '',
    lastUpdated: ''
  });

  // Confirm modal
  const [confirm, setConfirm] = useState({
    visible: false,
    message: '',
    onConfirm: null
  });

  // Real DB Integrations
  const [integrations, setIntegrations] = useState([]);

  // Overview data
  const [errorLogs, setErrorLogs] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [payoutReports, setPayoutReports] = useState([]);
  const [occupancyChartData, setOccupancyChartData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageOccupancy, setAverageOccupancy] = useState(0);
  const [legalDocuments, setLegalDocuments] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Payment gateways (Stripe / PayPal)
  const [stripeGateway, setStripeGateway] = useState({
    apiKey: '',
    secretKey: '',
    merchantId: '',
    enabled: false,
  });
  const [paypalGateway, setPaypalGateway] = useState({
    apiKey: '',
    secretKey: '',
    merchantId: '',
    enabled: false,
  });
  const [savingStripe, setSavingStripe] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);

  // Helper to push errors to UI log
  const addErrorLog = (source, message, severity = 'Error') => {
    try {
      const newLog = {
        timestamp: new Date().toISOString(),
        source: source || 'ManageIntegrations',
        message: message || 'Unknown error',
        severity: severity || 'Error'
      };
      setErrorLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.error('Failed to add error log', e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchIntegrations();
    fetchOverview();
    fetchPaymentGateways();
  }, []);

  // GET payment gateway settings
  const fetchPaymentGateways = async () => {
    try {
      const res = await axios.get('/integrations/payment-gateways');
      const data = res.data || {};

      if (data.stripe) setStripeGateway(data.stripe);
      if (data.paypal) setPaypalGateway(data.paypal);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load payment gateways';
      addErrorLog('Fetch Payment Gateways', msg);
      toast.error('Failed to load payment gateways');
    }
  };

  // SAVE Stripe
  const saveStripeGateway = async () => {
    setSavingStripe(true);
    try {
      const res = await axios.put('/integrations/payment-gateways/stripe', stripeGateway);
      setStripeGateway(res.data || stripeGateway);
      toast.success('Stripe settings saved');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save Stripe settings';
      addErrorLog('Save Stripe', msg);
      toast.error('Failed to save Stripe settings');
    } finally {
      setSavingStripe(false);
    }
  };

  // SAVE PayPal
  const savePaypalGateway = async () => {
    setSavingPaypal(true);
    try {
      const res = await axios.put('/integrations/payment-gateways/paypal', paypalGateway);
      setPaypalGateway(res.data || paypalGateway);
      toast.success('PayPal settings saved');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save PayPal settings';
      addErrorLog('Save PayPal', msg);
      toast.error('Failed to save PayPal settings');
    } finally {
      setSavingPaypal(false);
    }
  };

  // GET Integrations from DB
  const fetchIntegrations = async () => {
    try {
      const res = await axios.get('/integrations');
      setIntegrations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load integrations';
      addErrorLog('Fetch Integrations', msg);
      toast.error('Failed to load integrations');
      setIntegrations([]);
    }
  };

  // Delete integration
  const confirmDeleteIntegration = (id) => {
    setConfirm({
      visible: true,
      message: 'Delete this integration?',
      onConfirm: async () => {
        setConfirm({ visible: false, message: '', onConfirm: null });
        const prev = integrations;
        setIntegrations(prev.filter(i => String(i.id) !== String(id)));

        try {
          await axios.delete(`/integrations/${id}`);
          toast.success('Integration deleted');
        } catch (err) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to delete integration';
          addErrorLog('Delete Integration', msg);
          setIntegrations(prev);
          toast.error('Failed to delete integration');
        }
      }
    });
  };

  // GET Overview reports
  const fetchOverview = async () => {
    try {
      const res = await axios.get('/integrations/overview');
      const data = res.data || {};

      setErrorLogs(Array.isArray(data.errorLogs) ? data.errorLogs : []);
      setRecentTransactions(Array.isArray(data.recentTransactions) ? data.recentTransactions : []);
      setOccupancyData(Array.isArray(data.occupancyData) ? data.occupancyData : []);
      setPayoutReports(Array.isArray(data.payoutReports) ? data.payoutReports : []);
      setOccupancyChartData(Array.isArray(data.occupancyChartData) ? data.occupancyChartData : []);
      setTotalRevenue(typeof data.totalRevenue === 'number' ? data.totalRevenue : 0);
      setAverageOccupancy(typeof data.averageOccupancy === 'number' ? data.averageOccupancy : 0);
      setLegalDocuments(Array.isArray(data.legalDocuments) ? data.legalDocuments : []);
      setLanguages(Array.isArray(data.languages) ? data.languages : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch overview';
      addErrorLog('Fetch Overview', msg);
      toast.error('Failed to fetch overview');
    }
  };

  // Add or Edit Integration (single handler)
  const handleSaveIntegration = async () => {
    // Basic validation - require name/type/provider/apiKey
    if (!newIntegration.name || !newIntegration.type || !newIntegration.provider || !newIntegration.apiKey) {
      toast.error('Name, Type, Provider and API Key are required');
      return;
    }

    // Prepare payload (strip id if null)
    const payload = {
      name: newIntegration.name,
      type: newIntegration.type,
      provider: newIntegration.provider,
      apiKey: newIntegration.apiKey,
      enabled: !!newIntegration.enabled
    };

    // EDIT MODE
    if (newIntegration.id) {
      const id = newIntegration.id;
      // Optimistic local update
      const prev = integrations;
      setIntegrations(prev.map(item => (String(item.id) === String(id) ? { ...item, ...payload, id } : item)));

      try {
        const res = await axios.put(`/integrations/${id}`, payload);
        // prefer server response if provided
        if (res?.data) {
          setIntegrations(prev => prev.map(item => (String(item.id) === String(id) ? res.data : item)));
        }
        toast.success('Integration updated');
      } catch (e) {
        addErrorLog('Update Integration', e?.response?.data?.message || e?.message || 'Failed to update');
        setIntegrations(prev);
        toast.error('Failed to update integration');
      } finally {
        // reset modal state
        setNewIntegration({ id: null, name: '', type: '', provider: '', apiKey: '', enabled: true });
        setShowAddIntegration(false);
      }
    } 
    
    // ADD MODE
    else {
      try {
        const res = await axios.post('/integrations', payload);
        if (res?.data && res.data.id) {
          setIntegrations(prev => [res.data, ...prev]);
        } else {
          // If the server doesn't return an object, refetch
          fetchIntegrations();
        }
        toast.success('Integration added');
        setNewIntegration({ id: null, name: '', type: '', provider: '', apiKey: '', enabled: true });
        setShowAddIntegration(false);
      } catch (e) {
        addErrorLog('Add Integration', e?.response?.data?.message || e?.message || 'Failed to add integration');
        toast.error('Failed to add integration');
      }
    }
  };

  // Open Add modal (cleared)
  const openAddIntegrationModal = () => {
    setNewIntegration({ id: null, name: '', type: '', provider: '', apiKey: '', enabled: true });
    setShowAddIntegration(true);
  };

  // Edit integration - populate modal and open
  const openEditIntegrationModal = (integration) => {
    setNewIntegration({
      id: integration.id,
      name: integration.name || '',
      type: integration.type || '',
      provider: integration.provider || '',
      apiKey: integration.apiKey || '',
      enabled: typeof integration.enabled === 'boolean' ? integration.enabled : !!Number(integration.enabled)
    });
    setShowAddIntegration(true);
  };

  // Add Document
  const handleAddDocument = async () => {
    if (!newDocument.type) {
      toast.error('Document type is required');
      return;
    }

    // Optimistic UI
    const doc = { type: newDocument.type, lastUpdated: newDocument.lastUpdated || new Date().toISOString() };
    setLegalDocuments(prev => [doc, ...prev]);

    setNewDocument({ type: '', lastUpdated: '' });
    setShowAddDocumentModal(false);
    toast.success('Document added locally');

    try {
      await axios.post('/legal-documents', doc);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to persist document';
      addErrorLog('Add Document', msg);
    }
  };

  // Clear Logs
  const clearLogs = async () => {
    try {
      await axios.post('/integrations/logs/clear');
      setErrorLogs([]);
      toast.info('Logs cleared');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to clear logs';
      addErrorLog('Clear Logs', msg);
      toast.error('Failed to clear logs');
    }
  };

  // Mask API key display
  const maskApiKey = (key = '') => {
    if (!key) return '—';
    return key.length > 8 ? `${key.slice(0, 4)}****${key.slice(-4)}` : key;
  };

  // English language only
  const getEnglishLanguage = () => {
    const english = (languages || []).find(l => l.key === 'english');
    if (english) return english;
    return { key: 'english', name: 'English (US)', statusLabel: 'Primary Translation', enabled: true };
  };

  // Confirm Modal component (inline)
  const ConfirmModal = ({ visible, message, onCancel, onConfirm }) => {
    if (!visible) return null;
    return (
      <div className="modal-overlay" onMouseDown={onCancel}>
        <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <h3>{message}</h3>
          <div className="modal-actions">
            <button className="modal-cancel" onClick={onCancel}>Cancel</button>
            <button className="modal-save" onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    );
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

        {/* ------------------ INTEGRATIONS TAB ------------------ */}
        {activeTab === 'integrations' ? (
          <div className="integrations-content">

            <p className="subtitle">
              Manage and configure third-party services for your beach rental PMS.
            </p>

            <div className="add-integration-wrapper">
              <button
                className="btn-add-integration"
                onClick={openAddIntegrationModal}
              >
                + Add Integration
              </button>
            </div>

            {/* ---- INTEGRATIONS LIST ---- */}
            <div className="integration-grid">
              {integrations.length === 0 ? (
                <div className="integration-card">
                  <h3>No integrations found</h3>
                  <p className="card-subtitle">Use the Add button to create new integrations.</p>
                </div>
              ) : (
                integrations.map(integration => (
                  <div className="integration-card" key={integration.id || integration.name}>
                    <div className="integration-main-container">
                      <h3>{integration.name}</h3>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn-edit"
                          onClick={() => openEditIntegrationModal(integration)}
                          title="Edit Integration"
                        >
                          Edit
                        </button>

                        <button
                          className="icon-button"
                          onClick={() => confirmDeleteIntegration(integration.id)}
                          title="Delete Integration"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>

                    <p className="card-subtitle">{integration.type || 'Integration'}</p>

                    <div className="integration-field">
                      <label>Provider:</label>
                      <strong>{integration.provider || '—'}</strong>
                    </div>

                    <div className="integration-field">
                      <label>API Key:</label>
                      <strong>{maskApiKey(integration.apiKey)}</strong>
                    </div>

                    <div className="integration-field">
                      <label>Status:</label>
                      <span className={`status-badge ${integration.enabled ? 'active' : 'inactive'}`}>
                        {integration.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="integration-field">
                      <label>Created:</label>
                      <strong>{integration.createdAt ? new Date(integration.createdAt).toLocaleDateString() : '—'}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ---------------- PAYMENT GATEWAY SETTINGS ---------------- */}
            <div className="section-header payment-header-main">
              <h2>Payment Gateway Settings</h2>
              <p className="payment-subtitle">Manage Stripe and PayPal configurations.</p>
            </div>

            <div className="payment-gateway-wrapper">

              {/* ----- STRIPE ----- */}
              <div className="payment-gateway-card">
                <div className="payment-gateway-title-row">
                  <h3>Stripe</h3>
                  <span className={`gateway-status ${stripeGateway.enabled ? 'enabled' : 'disabled'}`}>
                    {stripeGateway.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="payment-gateway-grid">
                  <div className="payment-field-column">
                    <label>API Key</label>
                    <input
                      className="payment-input"
                      value={stripeGateway.apiKey}
                      onChange={(e) => setStripeGateway({ ...stripeGateway, apiKey: e.target.value })}
                    />
                  </div>

                  <div className="payment-field-column">
                    <label>Secret Key</label>
                    <input
                      className="payment-input"
                      value={stripeGateway.secretKey}
                      onChange={(e) => setStripeGateway({ ...stripeGateway, secretKey: e.target.value })}
                    />
                  </div>
                </div>

                <div className="payment-field-column">
                  <label>Merchant ID</label>
                  <input
                    className="payment-input"
                    value={stripeGateway.merchantId}
                    onChange={(e) => setStripeGateway({ ...stripeGateway, merchantId: e.target.value })}
                  />
                </div>

                <div className="payment-gateway-footer">
                  <div className="payment-toggle">
                    <span>Enable Gateway</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={stripeGateway.enabled}
                        onChange={(e) => setStripeGateway({ ...stripeGateway, enabled: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <button
                    className="btn-save-gateway"
                    onClick={saveStripeGateway}
                    disabled={savingStripe}
                  >
                    {savingStripe ? 'Saving...' : 'Save Gateway Settings'}
                  </button>
                </div>
              </div>

              {/* ----- PAYPAL ----- */}
              <div className="payment-gateway-card">
                <div className="payment-gateway-title-row">
                  <h3>PayPal</h3>
                  <span className={`gateway-status ${paypalGateway.enabled ? 'enabled' : 'disabled'}`}>
                    {paypalGateway.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="payment-gateway-grid">
                  <div className="payment-field-column">
                    <label>API Key</label>
                    <input
                      className="payment-input"
                      value={paypalGateway.apiKey}
                      onChange={(e) => setPaypalGateway({ ...paypalGateway, apiKey: e.target.value })}
                    />
                  </div>

                  <div className="payment-field-column">
                    <label>Secret Key</label>
                    <input
                      className="payment-input"
                      value={paypalGateway.secretKey}
                      onChange={(e) => setPaypalGateway({ ...paypalGateway, secretKey: e.target.value })}
                    />
                  </div>
                </div>

                <div className="payment-field-column">
                  <label>Merchant ID</label>
                  <input
                    className="payment-input"
                    value={paypalGateway.merchantId}
                    onChange={(e) => setPaypalGateway({ ...paypalGateway, merchantId: e.target.value })}
                  />
                </div>

                <div className="payment-gateway-footer">
                  <div className="payment-toggle">
                    <span>Enable Gateway</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={paypalGateway.enabled}
                        onChange={(e) => setPaypalGateway({ ...paypalGateway, enabled: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <button
                    className="btn-save-gateway"
                    onClick={savePaypalGateway}
                    disabled={savingPaypal}
                  >
                    {savingPaypal ? 'Saving...' : 'Save Gateway Settings'}
                  </button>
                </div>
              </div>

            </div>

            {/* ---------------- LEGAL DOCUMENTS ---------------- */}
            <div className="section-header">
              <h2>Legal Document Management</h2>
              <button className="btn-add" onClick={() => setShowAddDocumentModal(true)}>+ Add Document</button>
            </div>

            {legalDocuments.length === 0 ? (
              <div className="integration-card">
                <h3>No legal documents found</h3>
                <p className="card-subtitle">Add a document to get started.</p>
              </div>
            ) : (
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {legalDocuments.map((doc, idx) => (
                    <tr key={idx}>
                      <td>{doc.type}</td>
                      <td>{doc.lastUpdated}</td>
                      <td><button className="btn-view">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ---------------- LANGUAGES ---------------- */}
            <div className="section-header">
              <h2>Language Settings</h2>
            </div>

            <div className="language-cards">
              {(() => {
                const lang = getEnglishLanguage();
                return (
                  <div className="language-card" key={lang.key}>
                    <div className="language-info">
                      <h4>{lang.name}</h4>

                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={!!lang.enabled}
                          onChange={() => toast.warn("Only 1 language exist")}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <span className="language-status">{lang.statusLabel}</span>
                  </div>
                );
              })()}
            </div>

            {/* ---------------- ERROR LOGS ---------------- */}
            <div className="section-header">
              <h2>Integration Error Log</h2>

              <button className="btn-clear" onClick={clearLogs}>
                Clear Logs
              </button>
            </div>

            {errorLogs.length === 0 ? (
              <div className="integration-card">
                <h3>No error logs found</h3>
                <p className="card-subtitle">All systems running smoothly.</p>
              </div>
            ) : (
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
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.source}</td>
                      <td>{log.message}</td>
                      <td>
                        <span className={`severity-badge ${String(log.severity || 'error').toLowerCase()}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        ) : (
          /* ------------------ REPORTS TAB ------------------ */
          <div className="reports-content">

            <div className="reports-header">
              <h2>Reports & Analytics</h2>
              <div className="total-revenue-card">
                <span className="label">Total Revenue</span>
                <span className="value">
                  {totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div className="kpi-section">
              <h3>Key Performance Indicators</h3>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-label">Total Revenue</div>
                  <div className="kpi-value">
                    {totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </div>
                  <div className="kpi-change positive">↑ 12%</div>
                  <div className="kpi-subtitle">From previous earnings</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Average Occupancy Rate</div>
                  <div className="kpi-value">{averageOccupancy}%</div>
                  <div className="kpi-change positive">↑ 5%</div>
                  <div className="kpi-subtitle">Across all properties</div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="revenue-section">
              <h3>Recent Transactions</h3>

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
                  {recentTransactions.map(txn => (
                    <tr key={txn.id}>
                      <td>{txn.id}</td>
                      <td>{txn.date}</td>
                      <td>{txn.amount}</td>
                      <td>
                        <span className={`status-pill ${txn.status.toLowerCase()}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Occupancy */}
            <div className="occupancy-section">
              <h3>Occupancy Rate Reports</h3>

              <div className="occupancy-grid">
                <div className="occupancy-chart-card">
                  <h4>Occupancy Overview</h4>

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
                          <Cell key={index} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="occupancy-details-card">
                  <h4>Occupancy Details by Property</h4>

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
                      {occupancyData.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.property}</td>
                          <td>{row.unitType}</td>
                          <td>
                            <span className="occupancy-rate">{row.occupancy}</span>
                          </td>
                          <td>{row.available}</td>
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
                  {payoutReports.map(payout => (
                    <tr key={payout.id}>
                      <td>{payout.id}</td>
                      <td>{payout.date}</td>
                      <td>{payout.amount}</td>
                      <td>
                        <span className={`status-pill ${payout.status.toLowerCase()}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td>{payout.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        )}

      </div>

      {/* ADD / EDIT INTEGRATION MODAL */}
      {showAddIntegration && (
        <div className="modal-overlay" onMouseDown={() => setShowAddIntegration(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{newIntegration.id ? 'Edit Integration' : 'Add New Integration'}</h2>

            <label className="modal-label">Integration Name</label>
            <input
              className="modal-input"
              value={newIntegration.name}
              onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
            />

            <label className="modal-label">Integration Type</label>
            <select
              className="modal-input"
              value={newIntegration.type}
              onChange={(e) => setNewIntegration({ ...newIntegration, type: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="storage">Storage</option>
              <option value="communication">Communication</option>
              <option value="analytics">Analytics</option>
              <option value="other">Other</option>
            </select>

            <label className="modal-label">Provider</label>
            <input
              className="modal-input"
              value={newIntegration.provider}
              onChange={(e) => setNewIntegration({ ...newIntegration, provider: e.target.value })}
            />

            <label className="modal-label">API Key / Credentials</label>
            <input
              className="modal-input"
              value={newIntegration.apiKey}
              onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
            />

            <label className="modal-label">Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <label className="switch" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={!!newIntegration.enabled}
                  onChange={(e) => setNewIntegration({ ...newIntegration, enabled: e.target.checked })}
                />
                <span className="slider"></span>
              </label>
              <span>{newIntegration.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => { setShowAddIntegration(false); setNewIntegration({ id: null, name: '', type: '', provider: '', apiKey: '', enabled: true }); }}>Cancel</button>
              <button className="modal-save" onClick={handleSaveIntegration}>{newIntegration.id ? 'Save Changes' : 'Add Integration'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DOCUMENT MODAL */}
      {showAddDocumentModal && (
        <div className="modal-overlay" onMouseDown={() => setShowAddDocumentModal(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Add Legal Document</h2>

            <label className="modal-label">Document Type</label>
            <input
              className="modal-input"
              value={newDocument.type}
              onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
            />

            <label className="modal-label">Last Updated (optional)</label>
            <input
              className="modal-input"
              type="date"
              value={newDocument.lastUpdated}
              onChange={(e) => setNewDocument({ ...newDocument, lastUpdated: e.target.value })}
            />

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddDocumentModal(false)}>Cancel</button>
              <button className="modal-save" onClick={handleAddDocument}>Add Document</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        visible={confirm.visible}
        message={confirm.message}
        onCancel={() => setConfirm({ visible: false, message: '', onConfirm: null })}
        onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
      />
    </div>
  );
};

export default ManageIntegrations;
