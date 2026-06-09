import './Projects.css';
import React, { useState, useMemo } from 'react';
import {
  MdRefresh, MdWarehouse,
  MdLocationOn, MdPerson, MdPhone, MdEmail,
  MdInfo, MdCheckCircle, MdSearch,
  MdArrowBack, MdInbox, MdOutbox,
  MdLock,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdFileDownload,
  MdPrint,
} from 'react-icons/md';
import { useProjects }    from '../contexts/ProjectsContext';
import { exportSnapshot } from '../services/projectsDb';

/* ── Constants ─────────────────────────────────────────── */
const STATUS_STYLE = {
  Active:              { bg: 'var(--success-bg)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
  Inactive:            { bg: 'var(--danger-bg)',  color: 'var(--danger)',  border: 'rgba(239,68,68,0.2)'  },
  'Under Maintenance': { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
};

/* ══════════════════════════════════════════════════════════
   PROJECT DETAIL  —  info card + two stock tabs (read-only)
   ══════════════════════════════════════════════════════════ */
const ProjectDetail = ({ project, onBack, stockReceived, stockUsed }) => {
  const [tab, setTab]               = useState('received');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const sc = STATUS_STYLE[project.status] || STATUS_STYLE.Active;

  const toggleExpand = (id) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ── Excel/CSV download ── */
  const downloadExcel = () => {
    if (!stockReceived.length) return;
    const headers = ['#', 'Admin', 'Date', 'Time', 'Item Name', 'Category', 'Qty', 'Unit', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Notes'];
    const rows = [];
    stockReceived.forEach((sub, si) => {
      sub.items.forEach((it) => {
        rows.push([si + 1, sub.adminName, sub.date, sub.time, it.itemName, it.category, it.quantity, it.unit, it.rate, it.total, it.supplier, it.notes || '']);
      });
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, '_')}_stock_received.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  /* ── Print invoice ── */
  const printInvoice = (sub) => {
    const subTotal = sub.totalValue
      ? Number(sub.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : sub.items?.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const rows = (sub.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${it.itemName}</strong></td>
        <td>${it.category}</td>
        <td>${it.quantity} ${it.unit}</td>
        <td>₹${Number(it.rate || 0).toFixed(2)}</td>
        <td class="amount">₹${Number(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${it.supplier || '—'}</td>
        <td>${it.notes || '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Stock Receipt — ${sub.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #0f172a; background: #fff; padding: 32px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    @page { margin: 18mm 14mm; size: A4 landscape; }
  }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #4F46E5; margin-bottom: 24px; }
  .inv-logo { display: flex; align-items: center; gap: 12px; }
  .inv-logo-icon { width: 48px; height: 48px; background: #4F46E5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: 800; }
  .inv-brand { font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.5px; }
  .inv-brand-sub { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
  .inv-meta { text-align: right; }
  .inv-title { font-size: 26px; font-weight: 800; color: #4F46E5; letter-spacing: -1px; text-transform: uppercase; }
  .inv-id { font-size: 12px; color: #64748b; margin-top: 4px; }
  .inv-date { font-size: 12px; color: #0f172a; font-weight: 600; margin-top: 2px; }
  .inv-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .inv-box { background: #f8faff; border: 1px solid #e0e7ff; border-radius: 10px; padding: 14px 18px; }
  .inv-box-title { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .inv-box-row { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px; }
  .inv-box-row span:first-child { color: #64748b; }
  .inv-box-row span:last-child { font-weight: 600; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; }
  thead tr { background: #1E1B4B; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #f8faff; }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tfoot tr { background: #eef2ff; font-weight: 700; }
  tfoot td { padding: 10px 12px; font-size: 13px; border-top: 2px solid #4F46E5; }
  .amount { font-weight: 700; color: #059669; }
  .total-amount { font-size: 15px; color: #4F46E5; font-weight: 800; }
  .inv-footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
  .sig-box { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; }
  .inv-note { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
  .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; background: #4F46E5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
  .print-btn:hover { background: #3730a3; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${sub.approvalStatus === 'approved' ? '#ECFDF5' : '#FFFBEB'}; color: ${sub.approvalStatus === 'approved' ? '#059669' : '#D97706'}; border: 1px solid ${sub.approvalStatus === 'approved' ? '#6EE7B7' : '#FCD34D'}; }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button class="print-btn" onclick="window.print()">🖨️ Print Invoice</button>
    <button class="print-btn" style="background:#64748b;margin-left:8px;" onclick="window.close()">✕ Close</button>
  </div>
  <div class="inv-header">
    <div class="inv-logo">
      <div class="inv-logo-icon">F</div>
      <div>
        <div class="inv-brand">SDJ MARINE PVT. LTD</div>
        <div class="inv-brand-sub">Inventory Management Suite</div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">Stock Receipt</div>
      <div class="inv-id">Receipt No: ${sub.id}</div>
      <div class="inv-date">Date: ${sub.date} &nbsp;·&nbsp; Time: ${sub.time}</div>
      <div style="margin-top:6px;"><span class="status-badge">${sub.approvalStatus === 'approved' ? '✓ Approved' : '⏳ Pending'}</span></div>
    </div>
  </div>
  <div class="inv-info">
    <div class="inv-box">
      <div class="inv-box-title">Project Details</div>
      <div class="inv-box-row"><span>Project Name</span><span>${project.name}</span></div>
      <div class="inv-box-row"><span>Project ID</span><span>${project.id}</span></div>
      <div class="inv-box-row"><span>Location</span><span>${project.location || '—'}</span></div>
      <div class="inv-box-row"><span>Manager</span><span>${project.manager || '—'}</span></div>
    </div>
    <div class="inv-box">
      <div class="inv-box-title">Submission Details</div>
      <div class="inv-box-row"><span>Submitted By</span><span>${sub.adminName}</span></div>
      <div class="inv-box-row"><span>Submission Date</span><span>${sub.date}</span></div>
      <div class="inv-box-row"><span>Submission Time</span><span>${sub.time}</span></div>
      <div class="inv-box-row"><span>Total Items</span><span>${sub.items?.length || 0} line items</span></div>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Item Name</th><th>Category</th><th>Quantity</th><th>Unit Rate</th><th>Amount</th><th>Supplier</th><th>Notes</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;color:#64748b;">Grand Total</td>
        <td class="total-amount">₹${subTotal}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
  <div class="inv-footer">
    <div><div class="sig-box">Prepared By: ${sub.adminName}</div></div>
    <div><div class="sig-box">Verified By</div></div>
    <div><div class="sig-box">Authorised Signatory</div></div>
  </div>
  <div class="inv-note">This is a system-generated stock receipt. SDJ MARINE PVT. LTD · ${new Date().getFullYear()}</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=750');
    win.document.write(html);
    win.document.close();
  };

  const totalReceived = stockReceived.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const totalUsed     = stockUsed.reduce((s, r) => s + Number(r.quantity || 0), 0);

  return (
    <div>
      {/* ── Back + header ── */}
      <div className="page-header">
        <div className="page-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-secondary-fsp"
            onClick={onBack}
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MdArrowBack /> Back to Projects
          </button>
          <div>
            <h1 style={{ margin: 0 }}>{project.name}</h1>
            <p style={{ margin: 0 }}>{project.id} · {project.location}</p>
          </div>
        </div>
      </div>

      {/* ── Project Info Card ── */}
      <div className="fsp-card" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            <MdWarehouse />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{project.name}</span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                {project.status}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>ID: {project.id} · Created: {project.createdAt || '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Stock Received', val: stockReceived.length, sub: `${totalReceived} units total`, icon: '📥', color: 'var(--primary)' },
              { label: 'Stock Used',     val: stockUsed.length,     sub: `${totalUsed} units total`,     icon: '📤', color: 'var(--warning)' },
            ].map((k) => (
              <div key={k.label} style={{ padding: '12px 18px', borderRadius: 10, background: 'var(--bg-main)', border: '1px solid var(--border-color)', minWidth: 130, textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{k.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
          {[
            { icon: <MdLocationOn />, label: 'Location',    value: project.location        },
            { icon: <MdInfo />,       label: 'Address',     value: project.address         },
            { icon: <MdPerson />,     label: 'Manager',     value: project.manager || '—'  },
            { icon: <MdPhone />,      label: 'Phone',       value: project.phone   || '—'  },
            { icon: <MdEmail />,      label: 'Email',       value: project.email   || '—'  },
            { icon: <MdInfo />,       label: 'Description', value: project.description || '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, marginTop: 1 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginTop: 1 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="page-tabs">
        <button className={`page-tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          <MdInbox /> Stock Received <span className="page-tab-count">{stockReceived.length}</span>
        </button>
        <button className={`page-tab ${tab === 'used' ? 'active' : ''}`} onClick={() => setTab('used')}>
          <MdOutbox /> Stock Used <span className="page-tab-count">{stockUsed.length}</span>
        </button>
      </div>

      {/* ══ STOCK RECEIVED TAB ══ */}
      {tab === 'received' && (
        <div className="fsp-card">
          <div className="filter-toolbar">
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Stock Received</span>
            <span className="filter-count" style={{ marginLeft: 4 }}>{stockReceived.length} submission{stockReceived.length !== 1 ? 's' : ''}</span>
            {stockReceived.length > 0 && (
              <button className="btn-secondary-fsp" onClick={downloadExcel} title="Download as Excel/CSV">
                <MdFileDownload /> Download Excel
              </button>
            )}
          </div>

          {stockReceived.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                <MdInbox style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Stock Received Yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stock received records for this project.</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px 16px' }}>
              {stockReceived.map((sub, idx) => {
                const isOpen = expandedIds.has(sub.id);
                const subTotal = sub.totalValue
                  ? Number(sub.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : sub.items?.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return (
                  <div key={sub.id} style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <div
                      onClick={() => toggleExpand(sub.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', background: isOpen ? 'var(--primary-pale)' : '#fff', transition: 'background 0.2s' }}
                    >
                      <div style={{ color: 'var(--primary)', fontSize: 22, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isOpen ? 'var(--primary)' : 'var(--bg-main)', color: isOpen ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Submission #{idx + 1}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>👤 {sub.adminName}</span>
                          <span>📅 {sub.date}</span>
                          <span>🕐 {sub.time}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                          {sub.items?.length || 0} items
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>
                          ₹{subTotal}
                        </span>
                        {sub.approvalStatus === 'approved' ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MdCheckCircle size={13} /> Approved
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 700 }}>
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon-sm" onClick={() => printInvoice(sub)} title="Print Invoice" style={{ color: 'var(--primary)' }}>
                          <MdPrint />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border-light)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-main)' }}>
                              {[
                                '#', 'Item Name', 'Category', 'Qty', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Notes',
                                ...(sub.approvalStatus === 'approved' ? ['User Status', 'User Comment'] : []),
                              ].map((h) => (
                                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(sub.items || []).map((it, i) => (
                              <tr key={it.itemId + i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--bg-main)' }}>
                                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                                <td style={{ padding: '9px 14px', fontWeight: 700 }}>{it.itemName}</td>
                                <td style={{ padding: '9px 14px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>{it.category}</span>
                                </td>
                                <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--primary)' }}>{it.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>{it.unit}</span></td>
                                <td style={{ padding: '9px 14px', color: 'var(--text-secondary)' }}>{it.rate ? `₹${Number(it.rate).toFixed(2)}` : '—'}</td>
                                <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--success)' }}>{it.total ? `₹${Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</td>
                                <td style={{ padding: '9px 14px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{it.supplier || '—'}</td>
                                <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.notes || '—'}</td>
                                {sub.approvalStatus === 'approved' && (
                                  <>
                                    <td style={{ padding: '9px 14px' }}>
                                      {it.userApproved
                                        ? <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 12 }}><MdCheckCircle /> OK</span>
                                        : <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 12 }}>✗ Issue</span>}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 12, color: it.userComment ? '#DC2626' : 'var(--text-muted)', fontStyle: it.userComment ? 'normal' : 'italic', maxWidth: 200 }}>
                                      {it.userComment || 'No comment'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'var(--primary-pale)', fontWeight: 700 }}>
                              <td colSpan={5} style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                {sub.items?.length} item{sub.items?.length !== 1 ? 's' : ''}
                              </td>
                              <td style={{ padding: '9px 14px', color: 'var(--success)', fontSize: 13 }}>₹{subTotal}</td>
                              <td colSpan={sub.approvalStatus === 'approved' ? 4 : 2} />
                            </tr>
                          </tfoot>
                        </table>

                        {sub.approvalStatus === 'approved' && (
                          <div style={{ padding: '10px 16px', background: '#ECFDF5', borderTop: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <MdLock style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }} />
                            <span style={{ color: '#059669', fontWeight: 600, fontSize: 12.5 }}>
                              Approved by {sub.approvedBy} · {new Date(sub.approvedAt).toLocaleString('en-IN')}
                            </span>
                            <span style={{ color: '#6EE7B7', fontSize: 12, marginLeft: 4 }}>
                              · {(sub.items || []).filter((it) => it.userApproved).length}/{sub.items?.length} items OK
                              {(sub.items || []).some((it) => it.userComment) && (
                                <span style={{ color: '#DC2626', marginLeft: 6, fontWeight: 600 }}>
                                  · {(sub.items || []).filter((it) => it.userComment).length} issue{(sub.items || []).filter((it) => it.userComment).length !== 1 ? 's' : ''} noted
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {stockReceived.length} submission{stockReceived.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                  {stockReceived.reduce((s, sub) => s + (sub.items?.length || 0), 0)} total items
                </span>
                <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>
                  Grand Total: ₹{stockReceived.reduce((s, sub) => s + Number(sub.totalValue || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ STOCK USED TAB ══ */}
      {tab === 'used' && (
        <div className="fsp-card">
          <div className="filter-toolbar">
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Stock Used Records</span>
            <span className="filter-count" style={{ marginLeft: 4 }}>{stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''}</span>
          </div>

          {stockUsed.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                <MdOutbox style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Stock Used Yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stock usage records for this project.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="fsp-table-wrap">
                <table className="fsp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Purpose / Used For</th>
                      <th>Date</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockUsed.map((rec, idx) => (
                      <tr key={rec.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                        <td><div style={{ fontWeight: 700, fontSize: 13.5 }}>{rec.itemName}</div></td>
                        <td>
                          {rec.category
                            ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>{rec.category}</span>
                            : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--warning)' }}>{rec.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>{rec.unit}</span></td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{rec.purpose || '—'}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{rec.date}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.notes}>{rec.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-muted)' }}>
                {stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''} · {totalUsed} units consumed total
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   PROJECTS  —  list view
   ══════════════════════════════════════════════════════════ */
const Projects = () => {
  const { projects, stockReceived, stockUsed } = useProjects();

  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  const summary = useMemo(() => {
    let active = 0, inactive = 0, maintenance = 0;
    for (const p of projects) {
      if (p.status === 'Active')                 active++;
      else if (p.status === 'Inactive')          inactive++;
      else if (p.status === 'Under Maintenance') maintenance++;
    }
    return { total: projects.length, active, inactive, maintenance };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      const matchSearch = !q
        || p.name.toLowerCase().includes(q)
        || p.location.toLowerCase().includes(q)
        || (p.manager || '').toLowerCase().includes(q)
        || p.status.toLowerCase().includes(q);
      return matchSearch && (statusFilter === 'All' || p.status === statusFilter);
    });
  }, [projects, search, statusFilter]);

  const viewingProject = useMemo(
    () => selectedProject ? projects.find((p) => p.id === selectedProject.id) ?? null : null,
    [selectedProject, projects]
  );

  return (
    <>
      {viewingProject ? (
        <ProjectDetail
          project={viewingProject}
          onBack={() => setSelectedProject(null)}
          stockReceived={stockReceived[viewingProject.id] || []}
          stockUsed={stockUsed[viewingProject.id] || []}
        />
      ) : (
        <div>
          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1>Projects</h1>
              <p>Manage your project locations, assign managers, and track operational status</p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary-fsp" onClick={exportSnapshot} title="Download full database as JSON">
                <MdFileDownload /> Export JSON
              </button>
            </div>
          </div>

          {/* Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Projects',    val: summary.total,       color: 'var(--primary)' },
              { label: 'Active',            val: summary.active,      color: 'var(--success)' },
              { label: 'Inactive',          val: summary.inactive,    color: 'var(--danger)'  },
              { label: 'Under Maintenance', val: summary.maintenance, color: 'var(--warning)' },
            ].map((s) => (
              <div key={s.label} className="fsp-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="fsp-card">
            <div className="filter-toolbar">
              <div className="filter-search">
                <MdSearch className="filter-search-icon" style={{ width: 15, height: 15 }} />
                <input type="text" placeholder="Search by name, location, manager…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {['All', 'Active', 'Inactive', 'Under Maintenance'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <button className="btn-icon-sm" title="Reset filters" onClick={() => { setSearch(''); setStatusFilter('All'); }}>
                <MdRefresh />
              </button>
              <span className="filter-count">{filtered.length} of {projects.length} projects</span>
            </div>

            {projects.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 20px', gap: 16, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 22, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  <MdWarehouse style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No Projects Found</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No projects are available to display.</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--primary-pale)', borderBottom: '1px solid rgba(79,70,229,0.15)', fontSize: 12.5, color: 'var(--primary)', fontWeight: 500 }}>
                  <MdInfo style={{ fontSize: 16 }} />
                  Click any row to open the project detail view — stock received, stock used, and more.
                </div>

                <div className="fsp-table-wrap">
                  <table className="fsp-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Location</th>
                        <th>Address</th>
                        <th>Manager</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>No projects match your search.</td></tr>
                      ) : (
                        filtered.map((proj) => {
                          const sc = STATUS_STYLE[proj.status] || STATUS_STYLE.Active;
                          return (
                            <tr
                              key={proj.id}
                              className="clickable-row"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedProject(proj)}
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                    <MdWarehouse />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{proj.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{proj.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                                  <MdLocationOn style={{ color: 'var(--primary)', flexShrink: 0 }} />{proj.location}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={proj.address}>
                                  {proj.address || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                </div>
                              </td>
                              <td>
                                {proj.manager
                                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}><MdPerson style={{ color: 'var(--text-muted)' }} />{proj.manager}</div>
                                  : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {proj.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><MdPhone style={{ color: 'var(--text-muted)', fontSize: 13 }} />{proj.phone}</div>}
                                  {proj.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><MdEmail style={{ color: 'var(--text-muted)', fontSize: 13 }} />{proj.email}</div>}
                                  {!proj.phone && !proj.email && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                </div>
                              </td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                                  {proj.status}
                                </span>
                              </td>
                              <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{proj.createdAt || '—'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Showing {filtered.length} of {projects.length} projects</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>💡 Click any row to view project stock details</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Projects;