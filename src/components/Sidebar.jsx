import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Waves, CalendarDays, Wallet, Users, Plug, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Persisted hidden state so you can hide/show the sidebar without UI changes
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('sidebarHidden') === '1';
    } catch {
      return false;
    }
  });

  const toggleHidden = () => {
    setHidden((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebarHidden', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  useEffect(() => {
    // Reflect state on <body> so layout can adjust via CSS
    try {
      document.body.classList.toggle('sidebar-collapsed', hidden);
    } catch {}
  }, [hidden]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Waves, label: 'Manage Beaches', path: '/manage-beaches' },
    { icon: CalendarDays, label: 'Manage Bookings', path: '/manage-bookings' },
    { icon: Wallet, label: 'Manage Finance', path: '/manage-finance' },
    { icon: Users, label: 'Manage Admins', path: '/manage-admins' },
    { icon: Plug, label: 'Manage Integrations', path: '/manage-integrations' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      {/* Visible toggle button */}
      <button
        className="sidebar-toggle"
        onClick={toggleHidden}
        aria-label={hidden ? 'Open sidebar' : 'Hide sidebar'}
        title={hidden ? 'Open sidebar' : 'Hide sidebar'}
      >
        {hidden ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#ffffff" strokeWidth="2" />
            <path d="M15 20C15 17.2386 17.2386 15 20 15C22.7614 15 25 17.2386 25 20" stroke="#ffffff" strokeWidth="2" />
            <circle cx="20" cy="12" r="3" fill="#ffffff" />
          </svg>
        </div>
        <div className="sidebar-title">Sun Shelter</div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=4A90E2&color=fff" alt="User" />
          </div>
          <div className="user-info">
            <div className="user-name">{user.name || 'Admin User'}</div>
            <div className="user-role">Super Admin</div>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
