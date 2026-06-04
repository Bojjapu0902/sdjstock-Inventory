import './ProjectDetails.css';
import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  MdWarehouse, MdLocationOn, MdPerson, MdPhone, MdEmail,
  MdInbox, MdOutbox, MdLogout, MdRestaurant,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdInfo,
  MdCheckCircle, MdLock,
} from 'react-icons/md';
import { getCurrentUser } from '../data/loginDb';
import { useProjects }    from '../contexts/ProjectsContext';
import { useAuth }        from '../contexts/AuthContext';

const STATUS_STYLE = {
  Active:              { bg: '#ECFDF5', color: '#10B981', border: 'rgba(16,185,129,0.2)' },
  Inactive:            { bg: '#FEF2F2', color: '#EF4444', border: 'rgba(239,68,68,0.2)'  },
  'Under Maintenance': { bg: '#FFFBEB', color: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
};

const ProjectDetails = () => {
  const { projectId }  = useParams();
  const { user: ctxUser, logout } = useAuth();
  const { projects, stockReceived: allReceived, stockUsed: allUsed, approveSubmission } = useProjects();
  const currentUser = ctxUser || getCurrentUser();

  /* ── UI state ── */
  const [activeTab, setActiveTab]         = useState('received');
  const [expandedIds, setExpandedIds]     = useState(new Set());
  const [approvalDraft, setApprovalDraft] = useState({});

  /* ── derived data ── */
  const project       = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId]);
  const stockReceived = allReceived[projectId] || [];
  const stockUsed     = allUsed[projectId]     || [];

  /* ── all hooks must be declared before any early return ── */
  const toggleExpand = useCallback((id) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

  const grandTotal = stockReceived.reduce((s, sub) => s + Number(sub.totalValue || 0), 0);

  /* Return draft array for a submission — falls back to stored per-item values */
  const getDraft = useCallback((sub) =>
    approvalDraft[sub.id] ?? (sub.items || []).map((it) => ({
      approved: it.userApproved ?? false,
      comment:  it.userComment  ?? '',
    })), [approvalDraft]);

  /* Toggle one item's "approved" checkbox */
  const setItemApproved = useCallback((subId, subItems, idx, val) =>
    setApprovalDraft((prev) => {
      const base    = prev[subId] ?? (subItems || []).map((it) => ({ approved: it.userApproved ?? false, comment: it.userComment ?? '' }));
      const updated = [...base];
      updated[idx]  = { ...(updated[idx] || { approved: false, comment: '' }), approved: val };
      return { ...prev, [subId]: updated };
    }), []);

  /* Update one item's comment text */
  const setItemComment = useCallback((subId, subItems, idx, val) =>
    setApprovalDraft((prev) => {
      const base    = prev[subId] ?? (subItems || []).map((it) => ({ approved: it.userApproved ?? false, comment: it.userComment ?? '' }));
      const updated = [...base];
      updated[idx]  = { ...(updated[idx] || { approved: false, comment: '' }), comment: val };
      return { ...prev, [subId]: updated };
    }), []);

  /* Submit approval for a whole submission */
  const handleApprove = useCallback((sub) => {
    const draft = approvalDraft[sub.id] ?? (sub.items || []).map((it) => ({
      approved: it.userApproved ?? false,
      comment:  it.userComment  ?? '',
    }));
    approveSubmission(projectId, sub.id, draft, currentUser?.username || 'Project User');
    setApprovalDraft((prev) => { const n = { ...prev }; delete n[sub.id]; return n; });
  }, [approvalDraft, approveSubmission, projectId, currentUser]);

  /* ── security guard: must own this project ── */
  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.projectId !== projectId)) {
    return <Navigate to="/" replace />;
  }

  /* ── project not found ── */
  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏭</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Project Not Found</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>ID: {projectId}</div>
        </div>
      </div>
    );
  }

  const sc = STATUS_STYLE[project.status] || STATUS_STYLE.Active;

  /* ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 14, color: '#0F172A' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: '#1E1B4B', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#818CF8,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            <MdRestaurant style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{project.name}</div>
            <div style={{ color: 'rgba(199,210,254,0.55)', fontSize: 11 }}>{project.id} · {project.location}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(199,210,254,0.9)', fontSize: 13, fontWeight: 600 }}>{currentUser?.username}</div>
            <div style={{ color: 'rgba(199,210,254,0.45)', fontSize: 11 }}>User</div>
          </div>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, color: 'rgba(252,165,165,0.9)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <MdLogout /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Page body ── */}
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Project Info Card */}
        <div className="fsp-card" style={{ marginBottom: 20, padding: '22px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 62, height: 62, borderRadius: 16, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
              <MdWarehouse />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: '#0F172A' }}>{project.name}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                  {project.status}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>ID: {project.id} · Created: {project.createdAt || '—'}</div>
              {project.description && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#64748B', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <MdInfo style={{ marginTop: 1, flexShrink: 0, color: '#94A3B8' }} />
                  {project.description}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Submissions', val: stockReceived.length, sub: `${stockReceived.reduce((s, r) => s + (r.items?.length || 0), 0)} items`, icon: '📥', color: '#4F46E5' },
                { label: 'Stock Used',  val: stockUsed.length,     sub: 'records', icon: '📤', color: '#F59E0B' },
                { label: 'Total Value', val: `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: 'received', icon: '💰', color: '#10B981' },
              ].map((k) => (
                <div key={k.label} style={{ padding: '12px 18px', borderRadius: 12, background: '#F8FAFF', border: '1px solid #E2E8F0', minWidth: 120, textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>{k.icon}</div>
                  <div style={{ fontSize: typeof k.val === 'string' ? 15 : 22, fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{k.label}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1' }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            {[
              { icon: <MdLocationOn />, label: 'Location', value: project.location        },
              { icon: <MdWarehouse />,  label: 'Address',  value: project.address         },
              { icon: <MdPerson />,     label: 'Manager',  value: project.manager  || '—' },
              { icon: <MdPhone />,      label: 'Phone',    value: project.phone    || '—' },
              { icon: <MdEmail />,      label: 'Email',    value: project.email    || '—' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, marginTop: 1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="page-tabs">
          <button className={`page-tab ${activeTab === 'received' ? 'active' : ''}`} onClick={() => setActiveTab('received')}>
            <MdInbox /> Stock Received <span className="page-tab-count">{stockReceived.length}</span>
          </button>
          <button className={`page-tab ${activeTab === 'used' ? 'active' : ''}`} onClick={() => setActiveTab('used')}>
            <MdOutbox /> Stock Used <span className="page-tab-count">{stockUsed.length}</span>
          </button>
        </div>

        {/* ══ STOCK RECEIVED — Accordion ══ */}
        {activeTab === 'received' && (
          <div className="fsp-card">
            {stockReceived.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                <MdInbox style={{ fontSize: 48 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>No Stock Received Yet</div>
                <div style={{ fontSize: 13 }}>The admin has not assigned any stock to this project yet.</div>
              </div>
            ) : (
              <div style={{ padding: '12px 16px 16px' }}>
                {stockReceived.map((sub, idx) => {
                  const isOpen      = expandedIds.has(sub.id);
                  const isApproved  = sub.approvalStatus === 'approved';
                  const subTotal    = Number(sub.totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  const draft       = getDraft(sub);
                  const approvedCnt = draft.filter((d) => d.approved).length;

                  return (
                    <div key={sub.id} style={{ marginBottom: 10, borderRadius: 12, border: `1.5px solid ${isApproved ? '#10B981' : isOpen ? '#4F46E5' : '#E2E8F0'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>

                      {/* ── Accordion Header ── */}
                      <div
                        onClick={() => toggleExpand(sub.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', background: isApproved ? '#F0FDF4' : isOpen ? '#EEF2FF' : '#fff', transition: 'background 0.2s', flexWrap: 'wrap' }}
                      >
                        <div style={{ color: isApproved ? '#10B981' : '#4F46E5', fontSize: 22, display: 'flex', alignItems: 'center' }}>
                          {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isApproved ? '#10B981' : isOpen ? '#4F46E5' : '#F1F5F9', color: isApproved || isOpen ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Submission #{idx + 1}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                            👤 {sub.adminName} &nbsp;·&nbsp; 📅 {sub.date} &nbsp;·&nbsp; 🕐 {sub.time}
                          </div>
                          {isApproved && (
                            <div style={{ fontSize: 11, color: '#059669', marginTop: 2, fontWeight: 600 }}>
                              ✅ Approved by {sub.approvedBy} on {new Date(sub.approvedAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {sub.items?.length || 0} items
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ₹{subTotal}
                        </span>
                        {isApproved ? (
                          <span style={{ padding: '4px 11px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            <MdCheckCircle /> Approved
                          </span>
                        ) : (
                          <span style={{ padding: '4px 11px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⏳ Pending Review
                          </span>
                        )}
                      </div>

                      {/* ── Accordion Body ── */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid #F1F5F9' }}>

                          {/* Instruction banner — only for pending */}
                          {!isApproved && (
                            <div style={{ padding: '10px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#92400E' }}>
                              <span style={{ fontSize: 16 }}>📋</span>
                              <span>
                                Tick <strong>✓</strong> next to each item you have received. Add a comment in the <strong>Issue / Comment</strong> column if anything is wrong or missing. Then click <strong>Submit Approval</strong>.
                              </span>
                            </div>
                          )}

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: '#F8FAFF' }}>
                                  {(isApproved
                                    ? ['#', 'Item Name', 'Category', 'Qty / Unit', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Status', 'Your Comment']
                                    : ['✓', '#', 'Item Name', 'Category', 'Qty / Unit', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Issue / Comment']
                                  ).map((h) => (
                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(sub.items || []).map((it, i) => {
                                  const rowBg = i % 2 === 0 ? '#fff' : '#F8FAFF';
                                  return (
                                    <tr key={i} style={{ background: isApproved && it.userApproved ? '#F0FDF4' : rowBg }}>
                                      {isApproved ? (
                                        <>
                                          <td style={{ padding: '9px 14px', color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700 }}>{it.itemName}</td>
                                          <td style={{ padding: '9px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category || '—'}</span>
                                          </td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#4F46E5' }}>{it.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span></td>
                                          <td style={{ padding: '9px 14px', color: '#475569' }}>{it.rate ? `₹${Number(it.rate).toFixed(2)}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#10B981' }}>{it.total ? `₹${Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontSize: 12.5, color: '#475569' }}>{it.supplier || '—'}</td>
                                          <td style={{ padding: '9px 14px' }}>
                                            {it.userApproved
                                              ? <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}><MdCheckCircle /> OK</span>
                                              : <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 12 }}>✗ Issue</span>
                                            }
                                          </td>
                                          <td style={{ padding: '9px 14px', fontSize: 12, color: it.userComment ? '#DC2626' : '#94A3B8', fontStyle: it.userComment ? 'normal' : 'italic' }}>
                                            {it.userComment || 'No comment'}
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                                            <input
                                              type="checkbox"
                                              checked={draft[i]?.approved ?? false}
                                              onChange={(e) => setItemApproved(sub.id, sub.items, i, e.target.checked)}
                                              style={{ width: 17, height: 17, cursor: 'pointer', accentColor: '#10B981' }}
                                            />
                                          </td>
                                          <td style={{ padding: '9px 14px', color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700 }}>{it.itemName}</td>
                                          <td style={{ padding: '9px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category || '—'}</span>
                                          </td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#4F46E5' }}>{it.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span></td>
                                          <td style={{ padding: '9px 14px', color: '#475569' }}>{it.rate ? `₹${Number(it.rate).toFixed(2)}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#10B981' }}>{it.total ? `₹${Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontSize: 12.5, color: '#475569' }}>{it.supplier || '—'}</td>
                                          <td style={{ padding: '6px 14px', minWidth: 210 }}>
                                            <input
                                              type="text"
                                              placeholder="Issue or comment (optional)..."
                                              value={draft[i]?.comment ?? ''}
                                              onChange={(e) => setItemComment(sub.id, sub.items, i, e.target.value)}
                                              style={{
                                                width: '100%', padding: '6px 9px',
                                                border: `1px solid ${draft[i]?.comment ? '#FCA5A5' : '#E2E8F0'}`,
                                                borderRadius: 6, fontSize: 12, outline: 'none',
                                                background: draft[i]?.comment ? '#FFF5F5' : '#FAFAFA',
                                                transition: 'border-color 0.2s',
                                              }}
                                            />
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: isApproved ? '#ECFDF5' : '#EEF2FF', fontWeight: 700 }}>
                                  <td colSpan={isApproved ? 5 : 6} style={{ padding: '9px 14px', fontSize: 13, color: '#475569' }}>
                                    {sub.items?.length} item{sub.items?.length !== 1 ? 's' : ''} in this submission
                                  </td>
                                  <td style={{ padding: '9px 14px', color: '#10B981', fontSize: 13 }}>₹{subTotal}</td>
                                  <td colSpan={isApproved ? 2 : 2} />
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* ── Submit Approval bar — pending only ── */}
                          {!isApproved && (
                            <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                              <div style={{ fontSize: 12.5, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: approvedCnt > 0 ? '#10B981' : '#94A3B8' }}>
                                  {approvedCnt} of {sub.items?.length}
                                </span> items checked
                                {draft.some((d) => d.comment) && (
                                  <span style={{ marginLeft: 10, color: '#DC2626', fontWeight: 600 }}>
                                    · {draft.filter((d) => d.comment).length} issue{draft.filter((d) => d.comment).length !== 1 ? 's' : ''} noted
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleApprove(sub)}
                                disabled={approvedCnt === 0}
                                style={{
                                  padding: '9px 22px',
                                  background: approvedCnt > 0 ? '#10B981' : '#E2E8F0',
                                  color: approvedCnt > 0 ? '#fff' : '#94A3B8',
                                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                  cursor: approvedCnt > 0 ? 'pointer' : 'not-allowed',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  transition: 'background 0.2s',
                                }}
                              >
                                <MdCheckCircle /> Submit Approval
                              </button>
                            </div>
                          )}

                          {/* ── Approved lock footer ── */}
                          {isApproved && (
                            <div style={{ padding: '10px 16px', borderTop: '1px solid #BBF7D0', background: '#ECFDF5', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <MdLock style={{ color: '#10B981', fontSize: 15 }} />
                              <span style={{ fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                                Approved by {sub.approvedBy} · {new Date(sub.approvedAt).toLocaleString('en-IN')}
                              </span>
                              <span style={{ color: '#6EE7B7', marginLeft: 6, fontSize: 12 }}>
                                · {(sub.items || []).filter((it) => it.userApproved).length}/{sub.items?.length} items OK
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grand total footer */}
                <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: '#F8FAFF', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: '#475569' }}>
                    {stockReceived.length} submission{stockReceived.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    {stockReceived.reduce((s, sub) => s + (sub.items?.length || 0), 0)} total items
                    {stockReceived.filter((s) => s.approvalStatus === 'approved').length > 0 && (
                      <span style={{ marginLeft: 8, color: '#10B981', fontWeight: 600 }}>
                        · {stockReceived.filter((s) => s.approvalStatus === 'approved').length} approved
                      </span>
                    )}
                  </span>
                  <span style={{ fontWeight: 800, color: '#10B981', fontSize: 15 }}>
                    Grand Total: ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STOCK USED — Table ══ */}
        {activeTab === 'used' && (
          <div className="fsp-card">
            {stockUsed.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                <MdOutbox style={{ fontSize: 48 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>No Stock Used Records</div>
                <div style={{ fontSize: 13 }}>No stock has been recorded as used for this project yet.</div>
              </div>
            ) : (
              <>
                <div className="fsp-table-wrap">
                  <table className="fsp-table">
                    <thead>
                      <tr>
                        {['#', 'Item Name', 'Category', 'Quantity', 'Purpose / Used For', 'Date', 'Notes'].map((h) => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {stockUsed.map((rec, idx) => (
                        <tr key={rec.id}>
                          <td style={{ color: '#94A3B8', fontSize: 12 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 700 }}>{rec.itemName}</td>
                          <td>
                            {rec.category
                              ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{rec.category}</span>
                              : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>—</span>}
                          </td>
                          <td style={{ fontWeight: 700, color: '#F59E0B' }}>
                            {rec.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{rec.unit}</span>
                          </td>
                          <td style={{ fontSize: 12.5, color: '#475569' }}>{rec.purpose || '—'}</td>
                          <td style={{ fontSize: 12.5, color: '#94A3B8' }}>{rec.date}</td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>{rec.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', fontSize: 12.5, color: '#94A3B8' }}>
                  {stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''} · {stockUsed.reduce((s, r) => s + Number(r.quantity || 0), 0)} units consumed
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectDetails;
