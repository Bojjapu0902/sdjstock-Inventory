import './Settings.css';
import React, { useState, useEffect } from 'react';
import { MdSave, MdPerson, MdSecurity, MdAccessTime, MdCheckCircle, MdError, MdWarning } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { changePassword } from '../services/loginDb';

const STORAGE_KEY = 'sdjstock_idle_timeout';
const TIMEOUT_OPTIONS = [5, 10, 15, 30, 60];
const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };

function readIdleSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { enabled: Boolean(p.enabled), minutes: Number(p.minutes) || 10 };
    }
  } catch {}
  return { enabled: true, minutes: 10 };
}

const SettingsSection = ({ icon, title, children }) => (
  <div className="fsp-card settings-card">
    <div className="fsp-card-header">
      <div className="settings-card-heading">
        <div className="settings-card-icon">{icon}</div>
        <div className="fsp-card-title">{title}</div>
      </div>
    </div>
    <div className="fsp-card-body">{children}</div>
  </div>
);

const Notice = ({ notice }) => {
  if (!notice) return null;
  const Icon = notice.type === 'success' ? MdCheckCircle : MdError;
  return (
    <div className={`settings-notice ${notice.type}`} role="status">
      <Icon /> {notice.text}
    </div>
  );
};

const Settings = () => {
  const { user, login } = useAuth();

  const [account, setAccount]             = useState({ name: '', email: '', phone: '' });
  const [accountNotice, setAccountNotice] = useState(null);
  const [accountSaving, setAccountSaving] = useState(false);

  const [passwords, setPasswords]           = useState(EMPTY_PASSWORDS);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [idle, setIdle]             = useState(readIdleSettings);
  const [idleNotice, setIdleNotice] = useState(null);

  useEffect(() => {
    setAccount({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  }, [user]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountNotice(null);
    const name  = account.name.trim();
    const email = account.email.trim();
    if (!name) { setAccountNotice({ type: 'error', text: 'Name cannot be empty.' }); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAccountNotice({ type: 'error', text: 'Enter a valid email address.' });
      return;
    }
    setAccountSaving(true);
    try {
      const updated = await api.put(`/users/${user.id}`, { name, email, phone: account.phone.trim() });
      login({ ...user, name: updated.name, email: updated.email, phone: updated.phone });
      setAccountNotice({ type: 'success', text: 'Account details saved.' });
    } catch (err) {
      setAccountNotice({ type: 'error', text: err.message || 'Could not save account details.' });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordNotice(null);
    const fail = (text) => setPasswordNotice({ type: 'error', text });
    if (!passwords.current)                     return fail('Enter your current password.');
    if (passwords.next.trim().length < 6)       return fail('New password must be at least 6 characters.');
    if (passwords.next !== passwords.confirm)   return fail('New passwords do not match.');
    if (passwords.next === passwords.current)   return fail('New password must differ from the current one.');
    setPasswordSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords(EMPTY_PASSWORDS);
      setPasswordNotice({ type: 'success', text: 'Password updated. Use the new password next time you sign in.' });
    } catch (err) {
      fail(err.message || 'Could not update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveIdle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idle));
      window.dispatchEvent(new CustomEvent('idle-settings-changed'));
      setIdleNotice({ type: 'success', text: 'Session settings saved for this browser.' });
    } catch {
      setIdleNotice({ type: 'error', text: 'This browser blocked saving the setting.' });
    }
  };

  const changeAccount  = (field) => (e) => { setAccount((a) => ({ ...a, [field]: e.target.value })); setAccountNotice(null); };
  const changePasswordField = (field) => (e) => { setPasswords((p) => ({ ...p, [field]: e.target.value })); setPasswordNotice(null); };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Signed in as @{user?.username} ({user?.role})</p>
        </div>
      </div>

      <div className="settings-column">
        <SettingsSection icon={<MdPerson />} title="My Account">
          <form onSubmit={handleSaveAccount} noValidate>
            <div className="settings-form-grid">
              <div>
                <label className="fsp-label" htmlFor="settings-username">Username</label>
                <input id="settings-username" className="fsp-input" value={user?.username || ''} readOnly disabled />
              </div>
              <div>
                <label className="fsp-label" htmlFor="settings-role">Role</label>
                <input id="settings-role" className="fsp-input" value={user?.role || ''} readOnly disabled />
              </div>
              <div className="settings-form-full">
                <label className="fsp-label" htmlFor="settings-name">Full Name</label>
                <input id="settings-name" className="fsp-input" value={account.name} onChange={changeAccount('name')} autoComplete="name" />
              </div>
              <div>
                <label className="fsp-label" htmlFor="settings-email">Email</label>
                <input id="settings-email" className="fsp-input" type="email" value={account.email} onChange={changeAccount('email')} placeholder="your@email.com" autoComplete="email" />
              </div>
              <div>
                <label className="fsp-label" htmlFor="settings-phone">Phone</label>
                <input id="settings-phone" className="fsp-input" type="tel" value={account.phone} onChange={changeAccount('phone')} placeholder="+91 00000 00000" autoComplete="tel" />
              </div>
            </div>

            {!user?.email && !user?.isDemo && (
              <div className="settings-notice warning">
                <MdWarning /> Add an email address. Password reset codes (OTP) are sent there, so without one you can't use "Forgot password".
              </div>
            )}
            <Notice notice={accountNotice} />

            <div className="settings-actions">
              <button type="submit" className="btn-primary-fsp" disabled={accountSaving}>
                <MdSave /> {accountSaving ? 'Saving…' : 'Save Account'}
              </button>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection icon={<MdSecurity />} title="Change Password">
          {user?.isDemo ? (
            <div className="settings-notice info">The demo account's password can't be changed.</div>
          ) : (
            <form onSubmit={handleChangePassword} noValidate>
              <div className="settings-stack">
                <div>
                  <label className="fsp-label" htmlFor="settings-current-password">Current Password</label>
                  <input id="settings-current-password" className="fsp-input" type="password" value={passwords.current} onChange={changePasswordField('current')} autoComplete="current-password" />
                </div>
                <div>
                  <label className="fsp-label" htmlFor="settings-new-password">New Password</label>
                  <input id="settings-new-password" className="fsp-input" type="password" value={passwords.next} onChange={changePasswordField('next')} placeholder="At least 6 characters" autoComplete="new-password" />
                </div>
                <div>
                  <label className="fsp-label" htmlFor="settings-confirm-password">Confirm New Password</label>
                  <input id="settings-confirm-password" className="fsp-input" type="password" value={passwords.confirm} onChange={changePasswordField('confirm')} autoComplete="new-password" />
                </div>
              </div>

              <Notice notice={passwordNotice} />

              <div className="settings-actions">
                <button type="submit" className="btn-primary-fsp" disabled={passwordSaving}>
                  <MdSecurity /> {passwordSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </SettingsSection>

        <SettingsSection icon={<MdAccessTime />} title="Session Timeout">
          <div className="settings-field-row">
            <div>
              <div className="settings-field-label">Auto Logout on Inactivity</div>
              <div className="settings-field-desc">Sign out automatically after a period with no activity in this browser</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={idle.enabled}
              aria-label="Auto logout on inactivity"
              className={`settings-toggle ${idle.enabled ? 'on' : ''}`}
              onClick={() => { setIdle((s) => ({ ...s, enabled: !s.enabled })); setIdleNotice(null); }}
            >
              <span className="settings-toggle-thumb" />
            </button>
          </div>

          {idle.enabled ? (
            <div className="settings-form-grid settings-idle-grid">
              <div>
                <label className="fsp-label" htmlFor="settings-timeout">Timeout Duration</label>
                <select
                  id="settings-timeout"
                  className="fsp-select"
                  value={idle.minutes}
                  onChange={(e) => { setIdle((s) => ({ ...s, minutes: Number(e.target.value) })); setIdleNotice(null); }}
                >
                  {TIMEOUT_OPTIONS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </div>
              <div className="settings-notice info settings-notice-inline">
                A 60-second warning appears before logout. Any activity resets the timer.
              </div>
            </div>
          ) : (
            <div className="settings-notice info">Auto logout is off. Sessions stay active until you sign out or close the tab.</div>
          )}

          <Notice notice={idleNotice} />

          <div className="settings-actions">
            <button type="button" className="btn-primary-fsp" onClick={handleSaveIdle}>
              <MdSave /> Save Session Settings
            </button>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
};

export default Settings;
