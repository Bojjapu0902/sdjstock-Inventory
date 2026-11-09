// =====================================================
//  Demo Sandbox — a private, browser-only copy of the API
//
//  The demo user ("demo") never talks to the real server or MongoDB.
//  api.js hands every request from a demo session to handleDemoRequest(),
//  which mirrors the Express routes in /Server/routes against a small
//  database kept in this browser's localStorage. Nothing here can touch
//  production data, and nothing written here is visible to other users.
// =====================================================

export const DEMO_USERNAME = 'demo';
export const DEMO_PASSWORD = 'demo123';
export const DEMO_TOKEN    = 'demo-sandbox-token';

const DB_KEY = 'sdj_demo_sandbox_v1';

export const DEMO_USER = {
  id:        'USR-DEMO',
  username:  DEMO_USERNAME,
  role:      'User',
  name:      'Demo User',
  projectId: null,
  email:     '',
  phone:     '',
  avatar:    '',
  isActive:  true,
  isDemo:    true,
};

/* ── Seed data: exactly 10 inventory records ───────────────── */

const SEED_ITEMS = [
  { id: 'DEMO-001', name: 'Basmati Rice',     category: 'Grains & Pulses',   unit: 'kg',     qty: 120, rate: 85,  min: 30, max: 200, supplier: 'Lalitha Stores' },
  { id: 'DEMO-002', name: 'Toor Dal',         category: 'Grains & Pulses',   unit: 'kg',     qty: 60,  rate: 140, min: 20, max: 120, supplier: 'Maha Grains Co.' },
  { id: 'DEMO-003', name: 'Wheat Flour',      category: 'Flours & Cereals',  unit: 'kg',     qty: 90,  rate: 42,  min: 25, max: 150, supplier: 'Maha Grains Co.' },
  { id: 'DEMO-004', name: 'Turmeric Powder',  category: 'Spices & Masalas',  unit: 'kg',     qty: 15,  rate: 180, min: 5,  max: 40,  supplier: 'SpiceHub India' },
  { id: 'DEMO-005', name: 'Red Chilli Powder',category: 'Spices & Masalas',  unit: 'kg',     qty: 12,  rate: 260, min: 5,  max: 40,  supplier: 'SpiceHub India' },
  { id: 'DEMO-006', name: 'Sunflower Oil',    category: 'Oils & Fats',       unit: 'L',      qty: 48,  rate: 130, min: 15, max: 100, supplier: 'Krishna Traders' },
  { id: 'DEMO-007', name: 'Iodised Salt',     category: 'Condiments',        unit: 'kg',     qty: 40,  rate: 20,  min: 10, max: 80,  supplier: 'Krishna Traders' },
  { id: 'DEMO-008', name: 'Cashew Nuts',      category: 'Dry Fruits & Nuts', unit: 'kg',     qty: 8,   rate: 780, min: 5,  max: 25,  supplier: 'National Foods Ltd.' },
  { id: 'DEMO-009', name: 'Tea Powder',       category: 'Beverages',         unit: 'kg',     qty: 20,  rate: 320, min: 8,  max: 50,  supplier: 'National Foods Ltd.' },
  { id: 'DEMO-010', name: 'Instant Noodles',  category: 'Packaged Foods',    unit: 'pack',   qty: 150, rate: 14,  min: 40, max: 300, supplier: 'National Foods Ltd.' },
];

function today()   { return new Date().toISOString().split('T')[0]; }
function nowTime() { return new Date().toTimeString().slice(0, 5); }

function buildSeed() {
  const date = today();
  const time = nowTime();
  const inventory = SEED_ITEMS.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    unit: s.unit,
    currentStock: s.qty,
    minStock: s.min,
    maxStock: s.max,
    unitCost: s.rate,
    location: '',
    expiryDate: '',
    supplier: s.supplier,
    active: true,
    stockRecords: [{
      id: `SR-SEED-${s.id}`,
      qty: s.qty, rate: s.rate, supplier: s.supplier,
      timestamp: `${date}T${time}:00`, date, time,
      loggedBy: DEMO_USER.name, notes: 'Opening stock',
      type: true, direction: 'in',
    }],
  }));
  return {
    inventory,
    projects: [],
    stockReceived: [],   // flat submissions: { submissionId, projectId, ...fields }
    stockUsed: [],
    stockReturned: [],
    stockHistory: [],
    suppliers: [],
    purchaseOrders: [],
    wastage: [],
    user: { ...DEMO_USER },
  };
}

/* ── Persistence ───────────────────────────────────────────── */

let memoryDb = null; // fallback if localStorage is unavailable

function load() {
  if (memoryDb) return memoryDb;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) { memoryDb = JSON.parse(raw); return memoryDb; }
  } catch { /* fall through to reseed */ }
  memoryDb = buildSeed();
  save();
  return memoryDb;
}

function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(memoryDb)); } catch { /* quota / private mode: stay in memory */ }
}

/** Discard everything the demo user changed and restore the 10 starter records. */
export function resetDemoData() {
  memoryDb = buildSeed();
  save();
}

/* ── Helpers ───────────────────────────────────────────────── */

const clone = (v) => JSON.parse(JSON.stringify(v));
const uid   = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

class DemoError extends Error {}
const fail = (msg) => { throw new DemoError(msg); };

function recomputeStock(records) {
  return (records || []).reduce((total, r) => {
    const qty = Number(r.qty) || 0;
    return r.direction === 'out' ? total - qty : total + qty;
  }, 0);
}

function stripMongo({ _id, __v, ...rest }) { return rest; }

function groupBy(list, key) {
  const map = {};
  list.forEach((d) => { (map[d[key]] = map[d[key]] || []).push(d); });
  return map;
}

/* ── Generic CRUD collections (suppliers, purchase orders, wastage) ── */

function crud(db, coll, method, rest, body) {
  const list = db[coll];
  if (method === 'GET' && rest.length === 0) return list;
  if (method === 'POST' && rest.length === 0) {
    const doc = { ...body, id: body.id || uid(coll.toUpperCase().slice(0, 3)) };
    list.push(doc);
    return doc;
  }
  const idx = list.findIndex((d) => d.id === rest[0]);
  if (method === 'PUT') {
    if (idx === -1) fail('Record not found');
    list[idx] = { ...list[idx], ...stripMongo(body) };
    return list[idx];
  }
  if (method === 'DELETE') {
    if (idx !== -1) list.splice(idx, 1);
    return { success: true };
  }
  return fail('Unsupported demo request');
}

/* ── Inventory ─────────────────────────────────────────────── */

function inventoryRoute(db, method, rest, body) {
  const items = db.inventory;
  const find  = (id) => items.find((i) => i.id === id);

  if (method === 'GET' && rest.length === 0) return items;
  if (method === 'POST' && rest.length === 0) {
    if (!body.name || !body.category || !body.unit) fail('Name, category and unit are required');
    const doc = {
      currentStock: 0, minStock: 0, maxStock: 0, unitCost: 0,
      location: '', expiryDate: '', supplier: '', active: true,
      ...body,
      id: body.id || `ITEM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      stockRecords: body.stockRecords || [],
    };
    if (items.some((i) => i.id === doc.id)) fail('An item with this ID already exists');
    items.push(doc);
    return doc;
  }

  if (method === 'PATCH' && rest[0] === 'reset-all-stock') {
    items.forEach((i) => { i.currentStock = 0; });
    return { updated: items.length };
  }

  if (method === 'POST' && rest[0] === 'bulk-deduct') {
    const result = {};
    (body.items || []).forEach(({ itemId, qty, projectId = '', projectName = '', submissionId = '', loggedBy = '', date = '', time = '', timestamp = '' }) => {
      const item = find(itemId);
      if (!item) return;
      item.currentStock = Math.max(0, item.currentStock - Number(qty));
      item.stockRecords = item.stockRecords || [];
      item.stockRecords.push({
        id: uid('SR-OUT'), qty: Number(qty), rate: 0, direction: 'out',
        projectId, projectName, submissionId, loggedBy, date, time, timestamp,
      });
      result[itemId] = item.currentStock;
    });
    return result;
  }

  if (method === 'POST' && rest[0] === 'bulk-restore') {
    const result = {};
    (body.items || []).forEach(({ itemId, qty }) => {
      const item = find(itemId);
      if (!item) return;
      item.currentStock += Number(qty);
      result[itemId] = item.currentStock;
    });
    return result;
  }

  const item = find(rest[0]);
  if (!item) fail('Item not found');

  if (rest.length === 1) {
    if (method === 'GET') return item;
    if (method === 'PUT') {
      const update = stripMongo(body);
      if (update.currentStock !== undefined) update.currentStock = Math.max(0, Number(update.currentStock) || 0);
      Object.assign(item, update);
      return item;
    }
    if (method === 'DELETE') {
      items.splice(items.indexOf(item), 1);
      return { success: true };
    }
  }

  if (rest[1] === 'stock-records') {
    item.stockRecords = item.stockRecords || [];
    const recordId = rest[2];

    if (method === 'POST' && !recordId) {
      const { qty, rate, supplier = '', timestamp = '', date = '', time = '', loggedBy = '', notes = '' } = body;
      item.stockRecords.push({ id: uid('SR'), qty: +qty, rate: +rate, supplier, timestamp, date, time, loggedBy, notes, direction: 'in' });
      item.currentStock = recomputeStock(item.stockRecords);
      return item;
    }

    const rec = item.stockRecords.find((r) => r.id === recordId);
    if (!rec) fail('Stock record not found');

    if (method === 'PUT') {
      const { qty, rate, supplier = '', timestamp = '', date = '', time = '', notes = '' } = body;
      Object.assign(rec, { qty: +qty, rate: +rate, supplier, timestamp, date, time, notes });
      item.currentStock = recomputeStock(item.stockRecords);
      return item;
    }
    if (method === 'PATCH' && rest[3] === 'type') {
      rec.type = !!body.type;
      return item;
    }
    if (method === 'DELETE') {
      item.stockRecords = item.stockRecords.filter((r) => r.id !== recordId);
      item.currentStock = recomputeStock(item.stockRecords);
      return item;
    }
  }

  return fail('Unsupported demo request');
}

/* ── Projects ──────────────────────────────────────────────── */

function projectsRoute(db, method, rest, body) {
  const list = db.projects;
  if (method === 'GET' && rest.length === 0) {
    return list.map((p) => ({ ...p, stockReceived: submissionsFor(db, p.id) }));
  }
  if (method === 'POST' && rest.length === 0) {
    const { stockReceived, ...fields } = body;
    const doc = {
      location: '', address: '', status: 'Active', manager: '', phone: '', email: '',
      description: '', capacity: '', createdAt: today(),
      ...fields,
      id: fields.id || `PRJ-${Date.now()}`,
      stockReceived: [],
    };
    list.push(doc);
    return doc;
  }
  const idx = list.findIndex((p) => p.id === rest[0]);
  if (method === 'PUT') {
    if (idx === -1) fail('Project not found');
    const { stockReceived, ...update } = stripMongo(body);
    list[idx] = { ...list[idx], ...update };
    return list[idx];
  }
  if (method === 'DELETE') {
    if (idx !== -1) list.splice(idx, 1);
    return { success: true };
  }
  return fail('Unsupported demo request');
}

function submissionsFor(db, projectId) {
  return db.stockReceived
    .filter((s) => s.projectId === projectId)
    .map(({ submissionId, projectId: _p, ...rest }) => ({ id: submissionId, ...rest }));
}

/* ── Stock received (submissions assigned to projects) ─────── */

function stockReceivedRoute(db, method, rest, body) {
  const all = db.stockReceived;

  if (method === 'GET' && rest.length === 0) {
    const map = {};
    all.forEach(({ submissionId, projectId, ...r }) => {
      (map[projectId] = map[projectId] || []).push({ id: submissionId, ...r });
    });
    return map;
  }

  const [projectId, submissionId, action] = rest;

  if (method === 'GET' && rest.length === 1) return submissionsFor(db, projectId);

  if (method === 'POST' && rest.length === 1) {
    const { id, ...fields } = body;
    const doc = { submissionId: id, projectId, ...fields };
    all.push(doc);
    const { submissionId: sid, projectId: _p, ...out } = doc;
    return { id: sid, ...out };
  }

  const idx = all.findIndex((s) => s.projectId === projectId && s.submissionId === submissionId);

  if (method === 'PUT') {
    if (idx === -1) fail('Submission not found');
    const { id, _id, __v, ...fields } = body;
    all[idx] = { ...all[idx], ...fields, submissionId: id || submissionId };
    const { submissionId: sid, projectId: _p, ...out } = all[idx];
    return { id: sid, ...out };
  }

  if (method === 'DELETE') {
    const submission = all[idx];
    if (submission) {
      (submission.items || []).forEach((subItem) => {
        const item = db.inventory.find((i) => i.id === subItem.itemId);
        if (!item) return;
        item.stockRecords = (item.stockRecords || []).filter((r) => {
          if (r.direction !== 'out') return true;
          if (r.submissionId && r.submissionId === submissionId) return false;
          if (!r.submissionId && r.projectId === projectId &&
              r.date === submission.date && Number(r.qty) === Number(subItem.quantity)) return false;
          return true;
        });
        item.currentStock = recomputeStock(item.stockRecords);
      });
      all.splice(idx, 1);
    }
    return { success: true };
  }

  if (method === 'POST' && action === 'approve') {
    if (idx === -1) fail('Submission not found');
    const { approvalItems = [], approvedBy } = body;
    const doc = all[idx];
    doc.approvalStatus = 'approved';
    doc.approvedAt     = new Date().toISOString();
    doc.approvedBy     = approvedBy;
    doc.items = (doc.items || []).map((it, i) => ({
      ...it,
      userApproved: approvalItems[i]?.approved ?? false,
      userComment:  approvalItems[i]?.comment  ?? '',
    }));
    const { submissionId: sid, projectId: _p, ...out } = doc;
    return { id: sid, ...out };
  }

  return fail('Unsupported demo request');
}

/* ── Stock used / returned (per-project records) ───────────── */

function projectRecordsRoute(db, coll, idPrefix, method, rest, body) {
  const all = db[coll];

  if (method === 'GET' && rest.length === 0) return groupBy(all, 'projectId');

  const [projectId, recordId] = rest;

  if (method === 'GET' && rest.length === 1) return all.filter((r) => r.projectId === projectId);

  if (method === 'POST' && rest.length === 1) {
    const doc = { id: `${idPrefix}-${Date.now()}`, projectId, ...body };
    all.push(doc);
    return doc;
  }

  const idx = all.findIndex((r) => r.projectId === projectId && r.id === recordId);

  if (method === 'PUT') {
    if (idx === -1) fail('Record not found');
    all[idx] = { ...all[idx], ...stripMongo(body) };
    return all[idx];
  }
  if (method === 'DELETE') {
    if (idx !== -1) all.splice(idx, 1);
    return { success: true };
  }
  return fail('Unsupported demo request');
}

/* ── Stock history ─────────────────────────────────────────── */

function stockHistoryRoute(db, method, rest, body) {
  const all = db.stockHistory;

  if (method === 'GET' && rest.length === 0) return groupBy(all, 'itemId');

  const [itemId, recordId] = rest;

  if (method === 'GET' && rest.length === 1) {
    return all.filter((r) => r.itemId === itemId)
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  }
  if (method === 'POST' && rest.length === 1) {
    const doc = { id: uid('SH'), itemId, ...body };
    all.push(doc);
    return doc;
  }
  const idx = all.findIndex((r) => r.itemId === itemId && r.id === recordId);
  if (method === 'PUT') {
    if (idx === -1) fail('Record not found');
    all[idx] = { ...all[idx], ...stripMongo(body) };
    return all[idx];
  }
  if (method === 'DELETE') {
    if (idx !== -1) all.splice(idx, 1);
    return { success: true };
  }
  return fail('Unsupported demo request');
}

/* ── Users (only the demo user itself exists in the sandbox) ── */

function usersRoute(db, method, rest, body) {
  if (method === 'GET' && rest.length === 0) return [db.user];
  if (method === 'PUT' && rest[0] === db.user.id) {
    const { password, role, isDemo, id, ...safe } = stripMongo(body); // role/id are not editable
    db.user = { ...db.user, ...safe };
    return db.user;
  }
  return fail('The demo account has User permissions and cannot manage other users.');
}

/* ── Entry point ───────────────────────────────────────────── */

export function handleDemoRequest(method, path, body = {}) {
  try {
    const db = load();
    const [resource, ...rest] = path.split('?')[0].split('/').filter(Boolean);

    let result;
    switch (resource) {
      case 'inventory':        result = inventoryRoute(db, method, rest, body); break;
      case 'projects':         result = projectsRoute(db, method, rest, body); break;
      case 'stock-received':   result = stockReceivedRoute(db, method, rest, body); break;
      case 'stock-used':       result = projectRecordsRoute(db, 'stockUsed', 'SU', method, rest, body); break;
      case 'stock-returned':   result = projectRecordsRoute(db, 'stockReturned', 'SRT', method, rest, body); break;
      case 'stock-history':    result = stockHistoryRoute(db, method, rest, body); break;
      case 'suppliers':        result = crud(db, 'suppliers', method, rest, body); break;
      case 'purchase-orders':  result = crud(db, 'purchaseOrders', method, rest, body); break;
      case 'wastage':          result = crud(db, 'wastage', method, rest, body); break;
      case 'users':            result = usersRoute(db, method, rest, body); break;
      case 'chat':             fail('The AI assistant is not available in demo mode.'); break;
      case 'auth':             fail('Account changes are disabled for the demo account.'); break;
      default:                 fail('Not available in demo mode.');
    }

    if (method !== 'GET') save();
    return Promise.resolve(clone(result));
  } catch (err) {
    return Promise.reject(err);
  }
}
