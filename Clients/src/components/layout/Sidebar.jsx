import React from 'react';
import './Sidebar.css';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdInventory, MdShoppingCart, MdPeople,
  MdBarChart, MdSettings, MdLogout,
  MdRestaurant, MdSystemUpdateAlt, MdWarehouse, MdPlaylistAdd,
  MdManageAccounts, MdDeleteSweep,
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
const LOGO_SRC = `${process.env.PUBLIC_URL}/asserts/images/logo.webp`;

const Sidebar = ({ collapsed, onToggle, mobileVisible, onMobileClose }) => {
  const location              = useLocation();
  const { user, logout }      = useAuth();

  const navItems = [
    {
      section: 'Main',
      links: [
        { to: '/inventory',     icon: <MdInventory />,       label: 'Inventory',       badge: null },
        { to: '/add-items',     icon: <MdPlaylistAdd />,     label: 'Add Items',       badge: null },
        // { to: '/stock-update',  icon: <MdSystemUpdateAlt />, label: 'Update Stock',    badge: null },
        // { to: '/orders',        icon: <MdShoppingCart />,    label: 'Purchase Orders', badge: null },
        { to: '/suppliers',     icon: <MdPeople />,          label: 'Suppliers',       badge: null },
        { to: '/projects',      icon: <MdWarehouse />,       label: 'Projects',        badge: null },
        // { to: '/wastage',       icon: <MdDeleteSweep />,     label: 'Wastage',         badge: null },
      ],
    },
    // {
    //   section: 'Analytics',
    //   links: [
    //     { to: '/reports', icon: <MdBarChart />, label: 'Reports', badge: null },
    //   ],
    // },
    {
      section: 'System',
      links: [
        ...(user?.role === 'Admin' ? [{ to: '/users', icon: <MdManageAccounts />, label: 'Users', badge: null }] : []),
        { to: '/settings', icon: <MdSettings />, label: 'Settings', badge: null },
      ],
    },
  ];

  const displayName = user?.username ? user.username.toUpperCase() : 'AU';
  const initials    = displayName.slice(0, 2);
  const role        = user?.role || 'Operations Manager';

  const sidebarClass = [
    'sidebar',
    collapsed     ? 'collapsed'     : '',
    !mobileVisible ? 'mobile-hidden' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileVisible ? 'visible' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={sidebarClass}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'start', gap: 14, marginBottom: 60, position: 'relative', zIndex: 1 }}>
          <div style={{
            width:42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #818CF8, #4F46E5)',
            display: 'flex', alignItems: 'start', justifyContent: 'center',
            fontSize: 24,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
          }}>
            <img
                  src={LOGO_SRC}
                  alt="SDJ Marine"
                  style={{ width: 48, height: 48, objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'block';
                  }}
                />
           
          </div>
          </div>
          <div className="sidebar-brand-text" style={{ position: 'relative', zIndex: 1, marginTop:"8px" }}>
            <div className="sidebar-brand-title">SDJ MARINE PVT. LTD</div>
            <div className="sidebar-brand-sub">AN ISO 9001:2015 CERTIFIED COMPANY</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.links.map((link) => {
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={onMobileClose}
                    title={collapsed ? link.label : ''}
                  >
                    <span className="sidebar-icon">{link.icon}</span>
                    <span className="sidebar-label">{link.label}</span>
                    {link.badge && <span className="sidebar-badge">{link.badge}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="sidebar-user" title={collapsed ? displayName : ''}>
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{role}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="sidebar-link"
            title={collapsed ? 'Sign Out' : ''}
            style={{ marginTop: 4, color: 'rgba(252,165,165,0.9)', width: '100%' }}
          >
            <span className="sidebar-icon"><MdLogout /></span>
            <span className="sidebar-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
