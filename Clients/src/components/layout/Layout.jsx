import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Layout.css';
import Sidebar from './Sidebar';
import Header  from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';

const STORAGE_KEY   = 'sdjstock_idle_timeout';
const WARN_BEFORE_MS = 60000; // 1-minute warning

function readTimeoutSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { enabled: Boolean(p.enabled), minutes: Number(p.minutes) || 10 };
    }
  } catch {}
  return { enabled: true, minutes: 10 };
}

/* ── Idle Warning Modal ──────────────────────────────────── */
const IdleWarningModal = ({ countdown, onStay, onLogout }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'idle-fade-in 0.2s ease',
  }}>
    <div style={{
      background: '#fff', borderRadius: 20, padding: '36px 40px',
      maxWidth: 420, width: '90%', textAlign: 'center',
      boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
      animation: 'idle-pop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
        background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
        border: '3px solid #F59E0B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
      }}>
        ⏱️
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.4px' }}>
        Session Expiring Soon
      </div>
      <div style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
        You've been inactive. You will be automatically logged out in
      </div>

      {/* Countdown ring */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
        background: countdown <= 10
          ? 'linear-gradient(135deg,#FEE2E2,#FECACA)'
          : 'linear-gradient(135deg,#EEF2FF,#E0E7FF)',
        border: `3px solid ${countdown <= 10 ? '#EF4444' : '#4F46E5'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.5s ease',
      }}>
        <span style={{
          fontSize: 28, fontWeight: 800,
          color: countdown <= 10 ? '#DC2626' : '#4F46E5',
          lineHeight: 1,
        }}>
          {countdown}
        </span>
        <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>seconds</span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onLogout}
          style={{
            padding: '10px 22px', borderRadius: 10,
            border: '1.5px solid #E2E8F0', background: '#fff',
            fontSize: 13.5, fontWeight: 600, color: '#64748B',
            cursor: 'pointer', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          Logout Now
        </button>
        <button
          onClick={onStay}
          style={{
            padding: '10px 22px', borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#4F46E5,#4338CA)',
            fontSize: 13.5, fontWeight: 700, color: '#fff',
            cursor: 'pointer', transition: 'all 0.18s ease',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.35)'; }}
        >
          Stay Logged In
        </button>
      </div>
    </div>

    <style>{`
      @keyframes idle-fade-in { from { opacity:0 } to { opacity:1 } }
      @keyframes idle-pop { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }
    `}</style>
  </div>
);

/* ── Layout ──────────────────────────────────────────────── */
const Layout = ({ children }) => {
  const { logout } = useAuth();

  const [collapsed,     setCollapsed]     = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [settings,      setSettings]      = useState(readTimeoutSettings);
  const [warning,       setWarning]       = useState(false);
  const [countdown,     setCountdown]     = useState(60);
  const tickRef = useRef(null);

  /* Sync settings when changed from Settings page (same tab via custom event, cross-tab via storage) */
  useEffect(() => {
    const handler = () => setSettings(readTimeoutSettings());
    window.addEventListener('idle-settings-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('idle-settings-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  /* Start/clear countdown ticker */
  useEffect(() => {
    if (!warning) { clearInterval(tickRef.current); return; }
    const warnSecs = Math.round(WARN_BEFORE_MS / 1000);
    setCountdown(warnSecs);
    tickRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tickRef.current);
  }, [warning]);

  const handleIdle = useCallback(() => {
    setWarning(false);
    logout();
  }, [logout]);

  const handleWarn = useCallback(() => setWarning(true), []);

  const resetIdle = useIdleTimeout({
    timeoutMs:    settings.enabled ? settings.minutes * 60 * 1000 : null,
    onWarn:       handleWarn,
    onIdle:       handleIdle,
    warnBeforeMs: WARN_BEFORE_MS,
    enabled:      settings.enabled,
  });

  const handleStayActive = useCallback(() => {
    setWarning(false);
    resetIdle();
  }, [resetIdle]);

  const handleMenuClick = useCallback(() => {
    if (window.innerWidth < 992) setMobileVisible(v => !v);
    else                          setCollapsed(c => !c);
  }, []);

  const handleMobileClose = useCallback(() => setMobileVisible(false), []);

  return (
    <div className="app-shell">
      {warning && (
        <IdleWarningModal
          countdown={countdown}
          onStay={handleStayActive}
          onLogout={handleIdle}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileVisible={mobileVisible}
        onMobileClose={handleMobileClose}
      />
      <div className="main-content">
        <Header onMenuClick={handleMenuClick} />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
