import React, { useState, useCallback } from 'react';
import './Layout.css';
import Sidebar from './Sidebar';
import Header  from './Header';

const Layout = ({ children }) => {
  const [collapsed,     setCollapsed]     = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);

  const handleMenuClick = useCallback(() => {
    if (window.innerWidth < 992) {
      setMobileVisible((v) => !v);
    } else {
      setCollapsed((c) => !c);
    }
  }, []);

  const handleMobileClose = useCallback(() => setMobileVisible(false), []);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
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
