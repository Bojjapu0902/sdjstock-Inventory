import React, { useState, useRef, useEffect } from 'react';
import {
  MdClose, MdCameraAlt, MdDeleteForever, MdEdit, MdSave,
  MdPerson, MdEmail, MdPhone, MdShield, MdBadge,
  MdCalendarToday, MdLock, MdVisibility, MdVisibilityOff,
  MdCheckCircle, MdError, MdAdminPanelSettings,
} from 'react-icons/md';
import api from '../../services/api';
import { changePassword } from '../../services/loginDb';

/* ── helpers ─────────────────────────────────────── */
function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const SIZE  = 200;
        const scale = Math.min(SIZE / img.width, SIZE / img.height, 1);
        const cv    = document.createElement('canvas');
        cv.width    = Math.round(img.width  * scale);
        cv.height   = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  const score =
    (pw.length >= 6           ? 1 : 0) +
    (/[A-Z]/.test(pw)         ? 1 : 0) +
    (/\d/.test(pw)            ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
  const map = [
    null,
    { label:'Weak',   color:'#EF4444' },
    { label:'Fair',   color:'#F59E0B' },
    { label:'Good',   color:'#3B82F6' },
    { label:'Strong', color:'#10B981' },
  ];
  return { score, ...map[score] };
}

/* ── Toast ───────────────────────────────────────── */
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position:'fixed', bottom:28, right:28, zIndex:2000,
      display:'flex', alignItems:'center', gap:10,
      padding:'13px 18px', borderRadius:12, fontSize:13.5, fontWeight:600,
      boxShadow:'0 8px 28px rgba(0,0,0,0.14)',
      background:'#fff',
      border: type === 'success' ? '1.5px solid #D1FAE5' : '1.5px solid #FECACA',
      color:  type === 'success' ? '#065F46'             : '#991B1B',
      animation:'pd-toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {type === 'success'
        ? <MdCheckCircle style={{ fontSize:20, color:'#10B981', flexShrink:0 }} />
        : <MdError       style={{ fontSize:20, color:'#EF4444', flexShrink:0 }} />}
      {msg}
    </div>
  );
};

/* ── EyeBtn ──────────────────────────────────────── */
const EyeBtn = ({ show, onToggle }) => (
  <button type="button" onClick={onToggle}
    style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:18, display:'flex', alignItems:'center', padding:3 }}>
    {show ? <MdVisibilityOff /> : <MdVisibility />}
  </button>
);

/* ════════════════════════════════════════════════════
   PROFILE DRAWER
   ════════════════════════════════════════════════════ */
const ProfileDrawer = ({ user, onClose, onUpdate }) => {
  const fileInputRef = useRef(null);

  /* ── avatar ── */
  const [avatarLoading, setAvatarLoading] = useState(false);

  /* ── info ── */
  const [info, setInfo]         = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [editInfo, setEditInfo] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);

  /* ── password ── */
  const [pw, setPw]         = useState({ current:'', newPw:'', confirm:'' });
  const [showPw, setShowPw] = useState({ current:false, newPw:false, confirm:false });
  const [pwLoading, setPwLoading] = useState(false);

  /* ── toast ── */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  /* ── close on Escape ── */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  /* ── Avatar ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/'))   { showToast('Please select an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)      { showToast('Image must be under 5 MB.', 'error');    return; }
    setAvatarLoading(true);
    try {
      const base64 = await compressAvatar(file);
      await api.put(`/users/${user.id}`, { avatar: base64 });
      onUpdate({ ...user, avatar: base64 });
      showToast('Profile photo updated.');
    } catch {
      showToast('Failed to update photo.', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await api.put(`/users/${user.id}`, { avatar: '' });
      onUpdate({ ...user, avatar: '' });
      showToast('Profile photo removed.');
    } catch {
      showToast('Failed to remove photo.', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  /* ── Personal info ── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!info.name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    setInfoLoading(true);
    try {
      const updated = await api.put(`/users/${user.id}`, {
        name:  info.name.trim(),
        email: info.email.trim(),
        phone: info.phone.trim(),
      });
      onUpdate({ ...user, name: updated.name, email: updated.email, phone: updated.phone });
      setEditInfo(false);
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setInfoLoading(false);
    }
  };

  /* ── Password ── */
  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!pw.current)             { showToast('Enter your current password.', 'error'); return; }
    if (pw.newPw.length < 6)     { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (pw.newPw !== pw.confirm) { showToast('New passwords do not match.', 'error'); return; }
    if (pw.current === pw.newPw) { showToast('New password must differ from current.', 'error'); return; }
    setPwLoading(true);
    try {
      await changePassword(pw.current, pw.newPw);
      setPw({ current:'', newPw:'', confirm:'' });
      showToast('Password changed successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const strength   = pwStrength(pw.newPw);
  const initials   = (user?.name || user?.username || 'U').slice(0, 2).toUpperCase();
  const isAdmin    = user?.role === 'Admin';

  const inp = (overrides = {}) => ({
    style: {
      width:'100%', padding:'8px 12px', border:'1.5px solid #E2E8F0',
      borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box',
      fontFamily:"'Inter',sans-serif",
      ...overrides,
    },
  });

  const label = (text, req = false) => (
    <label style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:5 }}>
      {text}{req && <span style={{ color:'#EF4444' }}> *</span>}
    </label>
  );

  const section = (title, icon) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:'1px solid #F1F5F9', background:'#FAFBFF', flexShrink:0 }}>
      <div style={{ width:32, height:32, borderRadius:8, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, color:'#4F46E5' }}>{icon}</div>
      <span style={{ fontWeight:800, fontSize:14, color:'#0F172A' }}>{title}</span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:500 }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'min(480px,100vw)',
        background:'#fff', zIndex:501, display:'flex', flexDirection:'column',
        boxShadow:'-4px 0 40px rgba(0,0,0,0.22)',
        fontFamily:"'Inter',-apple-system,sans-serif",
        animation:'pd-slide-in 0.28s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Header */}
        <div style={{ background:'#1E1B4B', padding:'18px 20px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}>My Profile</div>
            <div style={{ color:'rgba(199,210,254,0.55)', fontSize:11.5, marginTop:2 }}>Edit your info &amp; security settings</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:20 }}>
            <MdClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* ── Avatar strip ── */}
          <div style={{ background:'linear-gradient(135deg,#1E1B4B,#3730A3)', padding:'28px 24px', display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:80, height:80, borderRadius:'50%',
                background:'linear-gradient(135deg,#818CF8,#4F46E5)',
                border:'3px solid rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:28, fontWeight:800, color:'#fff',
                overflow:'hidden', position:'relative',
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : initials}
                {avatarLoading && (
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ display:'inline-block', width:22, height:22, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'pd-spin 0.7s linear infinite' }} />
                  </div>
                )}
              </div>
              {/* Camera button */}
              <div
                onClick={() => !avatarLoading && fileInputRef.current?.click()}
                title="Change photo"
                style={{ position:'absolute', bottom:-2, right:-2, width:26, height:26, borderRadius:'50%', background:'#fff', border:'2px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#4F46E5', fontSize:13, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <MdCameraAlt />
              </div>
              {/* Remove button */}
              {user?.avatar && !avatarLoading && (
                <div
                  onClick={handleRemoveAvatar}
                  title="Remove photo"
                  style={{ position:'absolute', bottom:-2, left:-2, width:22, height:22, borderRadius:'50%', background:'#EF4444', border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                >
                  <MdDeleteForever style={{ fontSize:12, color:'white' }} />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />

            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:18, letterSpacing:'-0.3px' }}>{user?.name || user?.username || 'User'}</div>
              <div style={{ color:'rgba(199,210,254,0.6)', fontSize:12.5, marginBottom:10 }}>@{user?.username}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 11px', borderRadius:20, fontSize:11.5, fontWeight:700, background: isAdmin ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#10B981,#059669)', color:'#fff' }}>
                  {isAdmin ? <MdAdminPanelSettings style={{ fontSize:12 }} /> : <MdPerson style={{ fontSize:12 }} />}
                  {user?.role || 'User'}
                </span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 11px', borderRadius:20, fontSize:11.5, fontWeight:600, background:'rgba(16,185,129,0.18)', color:'#6EE7B7', border:'1px solid rgba(16,185,129,0.28)' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', display:'inline-block', animation:'pd-pulse 2s infinite' }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── Account info (read-only) ── */}
          {section('Account Details', <MdShield />)}
          <div style={{ padding:'8px 20px 4px' }}>
            {[
              { icon:<MdBadge />,         label:'User ID',      value: user?.id       || '—' },
              { icon:<MdPerson />,        label:'Username',     value: user?.username || '—' },
              { icon:<MdShield />,        label:'Role',         value: user?.role     || '—', highlight: true },
              { icon:<MdCalendarToday />, label:'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—' },
            ].map(({ icon, label: lbl, value, highlight }) => (
              <div key={lbl} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid #F8FAFC' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#4F46E5', flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{lbl}</div>
                  <div style={{ fontSize:13.5, fontWeight:700, color: highlight ? (isAdmin ? '#D97706' : '#10B981') : '#0F172A', marginTop:1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Personal Information ── */}
          {section('Personal Information', <MdPerson />)}
          <div style={{ padding:'12px 20px' }}>
            {editInfo ? (
              <form onSubmit={handleSaveInfo} noValidate>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    {label('Full Name', true)}
                    <input {...inp()} value={info.name} onChange={(e) => setInfo((s) => ({ ...s, name: e.target.value }))} placeholder="Your full name" />
                  </div>
                  <div>
                    {label('Email Address')}
                    <input {...inp()} type="email" value={info.email} onChange={(e) => setInfo((s) => ({ ...s, email: e.target.value }))} placeholder="your@email.com" />
                  </div>
                  <div>
                    {label('Phone Number')}
                    <input {...inp()} type="tel" value={info.phone} onChange={(e) => setInfo((s) => ({ ...s, phone: e.target.value }))} placeholder="+91 00000 00000" />
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button type="submit" disabled={infoLoading}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'#4F46E5', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor: infoLoading ? 'not-allowed' : 'pointer', opacity: infoLoading ? 0.7 : 1 }}>
                    {infoLoading ? 'Saving…' : <><MdSave style={{ fontSize:16 }} />Save Changes</>}
                  </button>
                  <button type="button"
                    onClick={() => { setEditInfo(false); setInfo({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' }); }}
                    style={{ padding:'8px 18px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', borderRadius:8, color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {[
                  { icon:<MdPerson />, label:'Full Name',     value: user?.name  || 'Not set' },
                  { icon:<MdEmail />,  label:'Email Address', value: user?.email || 'Not set' },
                  { icon:<MdPhone />,  label:'Phone Number',  value: user?.phone || 'Not set' },
                ].map(({ icon, label: lbl, value }) => (
                  <div key={lbl} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #F8FAFC' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#4F46E5', flexShrink:0 }}>{icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{lbl}</div>
                      <div style={{ fontSize:13.5, fontWeight:700, color:'#0F172A', marginTop:1 }}>{value}</div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEditInfo(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, marginTop:14, padding:'8px 18px', background:'#F8FAFF', border:'1.5px solid #E2E8F0', borderRadius:8, color:'#4F46E5', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  <MdEdit style={{ fontSize:16 }} /> Edit Information
                </button>
              </div>
            )}
          </div>

          {/* ── Change Password ── */}
          {section('Change Password', <MdLock />)}
          <div style={{ padding:'12px 20px 24px' }}>
            <form onSubmit={handleChangePw} noValidate>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                <div>
                  {label('Current Password')}
                  <div style={{ position:'relative' }}>
                    <input {...inp({ paddingRight:42 })} type={showPw.current ? 'text' : 'password'} value={pw.current}
                      onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} placeholder="Enter current password" />
                    <EyeBtn show={showPw.current} onToggle={() => setShowPw((s) => ({ ...s, current:!s.current }))} />
                  </div>
                </div>

                <div>
                  {label('New Password')}
                  <div style={{ position:'relative' }}>
                    <input {...inp({ paddingRight:42 })} type={showPw.newPw ? 'text' : 'password'} value={pw.newPw}
                      onChange={(e) => setPw((s) => ({ ...s, newPw: e.target.value }))} placeholder="Create new password" />
                    <EyeBtn show={showPw.newPw} onToggle={() => setShowPw((s) => ({ ...s, newPw:!s.newPw }))} />
                  </div>
                  {pw.newPw && (
                    <div style={{ marginTop:6 }}>
                      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                        {[1,2,3,4].map((n) => (
                          <div key={n} style={{ flex:1, height:4, borderRadius:4, background: n <= strength.score ? strength.color : '#E2E8F0', transition:'background 0.25s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color: strength.color }}>{strength.label}</div>
                    </div>
                  )}
                </div>

                <div>
                  {label('Confirm New Password')}
                  <div style={{ position:'relative' }}>
                    <input {...inp({ paddingRight:42, borderColor: pw.confirm && pw.confirm !== pw.newPw ? '#EF4444' : undefined })}
                      type={showPw.confirm ? 'text' : 'password'} value={pw.confirm}
                      onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))} placeholder="Repeat new password" />
                    <EyeBtn show={showPw.confirm} onToggle={() => setShowPw((s) => ({ ...s, confirm:!s.confirm }))} />
                    {pw.confirm && pw.confirm === pw.newPw && (
                      <MdCheckCircle style={{ position:'absolute', right:40, top:'50%', transform:'translateY(-50%)', color:'#10B981', fontSize:17 }} />
                    )}
                  </div>
                  {pw.confirm && pw.confirm !== pw.newPw && (
                    <div style={{ fontSize:11.5, color:'#EF4444', marginTop:4, fontWeight:500 }}>Passwords do not match</div>
                  )}
                </div>
              </div>

              {/* Rules */}
              <div style={{ margin:'14px 0 16px', padding:'12px 14px', background:'#EEF2FF', borderRadius:8, border:'1px solid rgba(79,70,229,0.15)' }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:'#4F46E5', marginBottom:8 }}>Password Requirements</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {[
                    { rule:'At least 6 characters',     met: pw.newPw.length >= 6 },
                    { rule:'One uppercase letter (A–Z)', met: /[A-Z]/.test(pw.newPw) },
                    { rule:'One number (0–9)',           met: /\d/.test(pw.newPw) },
                    { rule:'One special character',      met: /[^a-zA-Z0-9]/.test(pw.newPw) },
                  ].map(({ rule, met }) => (
                    <div key={rule} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color: met ? '#10B981' : '#94A3B8', fontWeight:500 }}>
                      <span style={{ fontSize:13 }}>{met ? '✓' : '○'}</span>{rule}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={pwLoading}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background: pwLoading ? '#94A3B8' : '#4F46E5', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
                {pwLoading
                  ? <><span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'pd-spin 0.7s linear infinite', marginRight:4 }} />Updating…</>
                  : <><MdLock style={{ fontSize:16 }} />Update Password</>}
              </button>
            </form>
          </div>

        </div>{/* end scrollable */}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <style>{`
        @keyframes pd-slide-in { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes pd-spin     { to   { transform:rotate(360deg); } }
        @keyframes pd-pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pd-toast-in { from{opacity:0;transform:translateY(12px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </>
  );
};

export default ProfileDrawer;
