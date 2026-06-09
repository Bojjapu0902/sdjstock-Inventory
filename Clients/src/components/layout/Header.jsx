import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { useLocation } from 'react-router-dom';
import {
  MdMenu, MdSearch, MdNotifications, MdRefresh,
  MdOutlineHelpOutline, MdKeyboardArrowDown,
  MdLogout, MdSettings, MdPerson,
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

const pageMap = {
  '/':             { title: 'Dashboard',       sub: 'Overview of your food stock & inventory' },
  '/inventory':    { title: 'Inventory',       sub: 'Manage all food items and stock levels' },
  '/add-items':    { title: 'Add Items',       sub: 'Add and manage your item catalogue' },
  '/stock-update': { title: 'Update Stock',    sub: 'Record stock-in and stock-out transactions' },
  '/orders':       { title: 'Purchase Orders', sub: 'Track and manage supplier orders' },
  '/suppliers':    { title: 'Suppliers',       sub: 'Manage your supplier directory' },
  '/wastage':      { title: 'Wastage Log',     sub: 'Track and reduce food wastage' },
  '/reports':      { title: 'Reports',         sub: 'Analytics and performance insights' },
  '/settings':     { title: 'Settings',        sub: 'System configuration and preferences' },
  '/projects':     { title: 'Projects',        sub: 'Manage project locations and stock' },
};

const Header = ({ onMenuClick }) => {
  const location         = useLocation();
  const { user, logout } = useAuth();

  const [searchVal, setSearchVal]   = useState('');
  const [dropdownOpen, setDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const page        = pageMap[location.pathname] || pageMap['/'];
  const displayName = user?.username ? user.username.toUpperCase() : 'Admin';
  const initials    = displayName.slice(0, 2);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="app-header">
        <button className="header-toggle-btn" onClick={onMenuClick} title="Toggle Sidebar">
          <MdMenu />
        </button>

        <div className="header-breadcrumb">
          <div className="header-page-title">{page.title}</div>
          <div className="header-page-sub">{today} · {page.sub}</div>
        </div>

        <div className="header-search-wrap">
          <MdSearch className="header-search-icon" />
          <input
            type="text"
            className="header-search"
            placeholder="Search items, orders, suppliers…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <button className="header-icon-btn" title="Refresh data"><MdRefresh /></button>
          <button className="header-icon-btn" title="Help"><MdOutlineHelpOutline /></button>
          <button className="header-icon-btn" title="Notifications">
            <MdNotifications />
            <span className="header-notif-dot" />
          </button>

          <div className="header-divider" />

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="header-user-btn"
              onClick={() => setDropdown((d) => !d)}
              aria-expanded={dropdownOpen}
            >
              <div className="header-avatar">{initials}</div>
              <span className="header-user-name">{displayName}</span>
              <MdKeyboardArrowDown style={{
                color: 'var(--text-muted)', fontSize: 18,
                transition: 'transform 0.2s',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              }} />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 220, background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden', zIndex: 200,
                animation: 'dropdown-in 0.18s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{ padding: '14px 16px', background: 'var(--primary-pale)', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role || 'Operations Manager'}</div>
                    </div>
                  </div>
                </div>

                {[
                  { icon: <MdPerson />,   label: 'My Profile' },
                  { icon: <MdSettings />, label: 'Settings'   },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setDropdown(false)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',sans-serif" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none';           e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}

                <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />

                <button
                  onClick={() => { setDropdown(false); logout(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', background: 'none', border: 'none', color: '#DC2626', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',sans-serif" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <MdLogout style={{ fontSize: 18 }} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <style>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Header;