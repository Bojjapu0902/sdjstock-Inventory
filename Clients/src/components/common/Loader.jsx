import React, { useEffect, useState } from 'react';
import './Loader.css';

const LOGO_SRC = `${process.env.PUBLIC_URL}/asserts/images/logo.webp`;

const MESSAGES = [
  'Initializing SDJ MARINE PVT. LTD…',
  'Loading inventory data…',
  'Syncing supplier records…',
  'Fetching purchase orders…',
  'Preparing your dashboard…',
];

const Loader = ({ onComplete }) => {
  const [progress, setProgress]   = useState(0);
  const [msgIndex, setMsgIndex]   = useState(0);
  const [fadeOut, setFadeOut]     = useState(false);

  useEffect(() => {
    // Progress ticker — reaches 100 in ~2.4s
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Ease-in-out feel: faster in the middle, slower at ends
        const increment = prev < 20 ? 1.5 : prev < 80 ? 3.5 : 1.2;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    // Cycle through status messages
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 520);

    // After 2.8s begin fade-out then call onComplete
    const finishTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className="loader-root" style={{ opacity: fadeOut ? 0 : 1 }}>

      {/* Floating orbs */}
      <div className="loader-orbs-wrap">
        {[
          { w: 320, h: 320, top: '-80px', left: '-80px', opacity: 0.06 },
          { w: 240, h: 240, bottom: '-60px', right: '-60px', opacity: 0.05 },
          { w: 180, h: 180, top: '30%', right: '8%', opacity: 0.04 },
          { w: 140, h: 140, bottom: '20%', left: '10%', opacity: 0.04 },
        ].map((orb, i) => (
          <div key={i} className="loader-orb" style={{
            width: orb.w, height: orb.h,
            opacity: orb.opacity,
            top: orb.top, left: orb.left,
            right: orb.right, bottom: orb.bottom,
            animation: `float-orb ${3 + i * 0.7}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Grid lines */}
      <div className="loader-grid" />

      {/* Center content */}
      <div className="loader-center">

        {/* Animated logo mark */}
        <div className="loader-logo-wrap">
          <div className="loader-logo-ring-wrap">
            <svg width="88" height="88" viewBox="0 0 88 88" className="loader-svg-spin">
              <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(129,140,248,0.3)" strokeWidth="2" />
              <circle cx="44" cy="44" r="40" fill="none" stroke="#818CF8" strokeWidth="2.5"
                strokeDasharray="60 192" strokeLinecap="round" strokeDashoffset="0" />
            </svg>
            <svg width="88" height="88" viewBox="0 0 88 88" className="loader-svg-spin-reverse">
              <circle cx="44" cy="44" r="32" fill="none" stroke="rgba(129,140,248,0.2)"
                strokeWidth="1.5" strokeDasharray="20 182" strokeLinecap="round" />
            </svg>
            <div className="loader-icon-center">
              <div className="loader-icon-box">
                <img
                  src={LOGO_SRC}
                  alt="SDJ Marine"
                  style={{ width: 72, height: 72, objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'block';
                  }}
                />
                {/* Fallback anchor icon shown only if logo fails to load */}
                <svg viewBox="0 0 24 24" width="30" height="30" fill="white" aria-hidden="true" style={{ display: 'none' }}>
                  <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm1 5.07V10h2a1 1 0 0 1 0 2h-2v6.93A7.002 7.002 0 0 0 19 12h-1a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1 8 8 0 0 1-16 0 1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H7a7.002 7.002 0 0 0 6 6.93V12H11a1 1 0 0 1 0-2h2V9.07a3.003 3.003 0 0 1-1-5.07z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="loader-brand-name">SDJ MARINE PVT. LTD</div>
        <div className="loader-brand-sub">AN ISO 9001:2015 CERTIFIED COMPANY</div>

        {/* Progress bar */}
        <div className="loader-progress-wrap">
          <div className="loader-progress-track">
            <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="loader-status-msg">{MESSAGES[msgIndex]}</div>
        <div className="loader-percent">{Math.round(progress)}%</div>
      </div>

      <div className="loader-footer">© 2026 SDJ MARINE PVT. LTD · All rights reserved</div>
    </div>
  );
};

export default Loader;
