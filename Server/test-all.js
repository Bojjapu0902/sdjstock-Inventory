require('dotenv').config();
const http = require('http');

function req(method, path, body, token) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };
    const r2 = http.request(opts, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        try { res({ s: r.statusCode, b: JSON.parse(d || '{}') }); }
        catch { res({ s: r.statusCode, b: d }); }
      });
    });
    r2.on('error', rej);
    if (data) r2.write(data);
    r2.end();
  });
}

let passed = 0, failed = 0;
function check(label, r, expectStatus) {
  if (r.s === expectStatus) {
    console.log('  PASS  ' + label);
    passed++;
  } else {
    console.log('  FAIL  ' + label + '  -> HTTP ' + r.s + ' | ' + JSON.stringify(r.b).slice(0, 120));
    failed++;
  }
  return r.b;
}

async function run() {
  // === AUTH ===
  console.log('\n[AUTH]');
  const login = await req('POST', '/api/auth/login', { username: 'sdj', password: 'sdj123@' });
  const token = login.b.token;
  check('POST /auth/login', login, 200);
  check('GET  /auth/me', await req('GET', '/api/auth/me', null, token), 200);
  check('401 without token', await req('GET', '/api/users', null, null), 401);

  // === USERS ===
  console.log('\n[USERS]');
  check('GET  /users', await req('GET', '/api/users', null, token), 200);
  const newUser = await req('POST', '/api/users', {
    username: 'testuser99', password: 'Test@123', role: 'User',
    name: 'Test User', email: 't@t.com', phone: '123', projectId: 'PRJ-001'
  }, token);
  const userId = check('POST /users', newUser, 201) && newUser.b.id;
  if (userId) {
    check('PUT  /users/:id (with _id/__v in body)', await req('PUT', '/api/users/' + userId, { name: 'Test Updated', _id: 'fake', __v: 0 }, token), 200);
    check('DEL  /users/:id', await req('DELETE', '/api/users/' + userId, null, token), 200);
  }

  // === SUPPLIERS ===
  console.log('\n[SUPPLIERS]');
  check('GET  /suppliers', await req('GET', '/api/suppliers', null, token), 200);
  const supR = await req('POST', '/api/suppliers', {
    id: 'SUP-TST', name: 'Test Sup', category: 'Test', contact: 'A',
    email: 'a@a.com', phone: '1', city: 'X', country: 'India',
    rating: 4, totalOrders: 0, totalSpend: 0, status: 'Active',
    since: '2026-01-01', paymentTerms: 'Net 30'
  }, token);
  check('POST /suppliers', supR, 201);
  check('PUT  /suppliers/:id (with _id/__v)', await req('PUT', '/api/suppliers/SUP-TST', { name: 'Updated', _id: 'fake', __v: 0 }, token), 200);
  check('DEL  /suppliers/:id', await req('DELETE', '/api/suppliers/SUP-TST', null, token), 200);

  // === PURCHASE ORDERS ===
  console.log('\n[PURCHASE ORDERS]');
  check('GET  /purchase-orders', await req('GET', '/api/purchase-orders', null, token), 200);
  const poR = await req('POST', '/api/purchase-orders', {
    id: 'PO-TST-001', supplier: 'Test', date: '2026-06-05',
    deliveryDate: '2026-06-10', items: 1, totalValue: 100,
    status: 'Draft', paymentStatus: 'Unpaid', notes: ''
  }, token);
  check('POST /purchase-orders', poR, 201);
  check('PUT  /purchase-orders/:id (with _id/__v)', await req('PUT', '/api/purchase-orders/PO-TST-001', { status: 'Approved', _id: 'fake', __v: 0 }, token), 200);
  check('DEL  /purchase-orders/:id', await req('DELETE', '/api/purchase-orders/PO-TST-001', null, token), 200);

  // === WASTAGE ===
  console.log('\n[WASTAGE]');
  check('GET  /wastage', await req('GET', '/api/wastage', null, token), 200);
  const wstR = await req('POST', '/api/wastage', {
    id: 'WST-TST', date: '2026-06-05', item: 'Rice',
    category: 'Grains & Pulses', qty: 1, unit: 'kg',
    reason: 'Spoilage', costImpact: 50, loggedBy: 'sdj', notes: ''
  }, token);
  check('POST /wastage', wstR, 201);
  check('PUT  /wastage/:id (with _id/__v)', await req('PUT', '/api/wastage/WST-TST', { reason: 'Expired', _id: 'fake', __v: 0 }, token), 200);
  check('DEL  /wastage/:id', await req('DELETE', '/api/wastage/WST-TST', null, token), 200);

  // === INVENTORY ===
  console.log('\n[INVENTORY]');
  check('GET  /inventory', await req('GET', '/api/inventory', null, token), 200);
  check('GET  /inventory/INV-001', await req('GET', '/api/inventory/INV-001', null, token), 200);
  check('PUT  /inventory/INV-001 (with _id/__v)', await req('PUT', '/api/inventory/INV-001', { currentStock: 150, _id: 'fake', __v: 0 }, token), 200);
  check('POST /inventory/bulk-deduct', await req('POST', '/api/inventory/bulk-deduct', { items: [{ itemId: 'INV-001', quantity: 5 }] }, token), 200);
  check('POST /inventory/bulk-restore', await req('POST', '/api/inventory/bulk-restore', { items: [{ itemId: 'INV-001', quantity: 5 }] }, token), 200);

  // === PROJECTS ===
  console.log('\n[PROJECTS]');
  check('GET  /projects', await req('GET', '/api/projects', null, token), 200);
  const prjR = await req('POST', '/api/projects', {
    id: 'PRJ-TST', name: 'Test Project', location: 'Test', address: 'Test',
    status: 'Active', manager: 'Test', phone: '1', email: 'p@p.com',
    description: 'Test', username: 'tproj', password: 'p123',
    capacity: '10', createdAt: '2026-06-05'
  }, token);
  check('POST /projects', prjR, 201);
  check('PUT  /projects/:id (with _id/__v)', await req('PUT', '/api/projects/PRJ-TST', { name: 'Updated Project', _id: 'fake', __v: 0 }, token), 200);
  check('DEL  /projects/:id', await req('DELETE', '/api/projects/PRJ-TST', null, token), 200);

  // === STOCK RECEIVED ===
  console.log('\n[STOCK RECEIVED]');
  check('GET  /stock-received', await req('GET', '/api/stock-received', null, token), 200);
  check('GET  /stock-received/PRJ-001', await req('GET', '/api/stock-received/PRJ-001', null, token), 200);
  const srR = await req('POST', '/api/stock-received/PRJ-001', {
    id: 'SR-TST-001', adminName: 'sdj', date: '05 Jun 2026',
    time: '10:00 AM', submittedAt: '2026-06-05T10:00:00Z',
    items: [], totalItems: 0, totalValue: '0', approvalStatus: 'pending'
  }, token);
  check('POST /stock-received/:projectId', srR, 201);
  check('PUT  /stock-received/:pid/:sid (with _id/__v)', await req('PUT', '/api/stock-received/PRJ-001/SR-TST-001', {
    id: 'SR-TST-001', adminName: 'sdj updated', _id: 'fake', __v: 0
  }, token), 200);
  check('POST /stock-received/:pid/:sid/approve', await req('POST', '/api/stock-received/PRJ-001/SR-TST-001/approve', {
    approvalItems: [], approvedBy: 'sdj'
  }, token), 200);
  check('DEL  /stock-received/:pid/:sid', await req('DELETE', '/api/stock-received/PRJ-001/SR-TST-001', null, token), 200);

  // === STOCK USED ===
  console.log('\n[STOCK USED]');
  check('GET  /stock-used', await req('GET', '/api/stock-used', null, token), 200);
  check('GET  /stock-used/PRJ-001', await req('GET', '/api/stock-used/PRJ-001', null, token), 200);
  const suR = await req('POST', '/api/stock-used/PRJ-001', {
    itemId: 'INV-001', itemName: 'Rice', category: 'Grains',
    quantity: 5, unit: 'kg', usedBy: 'sdj', date: '2026-06-05', notes: ''
  }, token);
  check('POST /stock-used/:projectId', suR, 201);
  const suId = suR.b && suR.b.id;
  if (suId) {
    check('DEL  /stock-used/:pid/:recordId', await req('DELETE', '/api/stock-used/PRJ-001/' + suId, null, token), 200);
  }

  // === STOCK HISTORY ===
  console.log('\n[STOCK HISTORY]');
  check('GET  /stock-history', await req('GET', '/api/stock-history', null, token), 200);
  check('GET  /stock-history/INV-001', await req('GET', '/api/stock-history/INV-001', null, token), 200);
  const shR = await req('POST', '/api/stock-history/INV-001', {
    qty: 10, rate: 48, unit: 'kg', desc: 'Test entry', type: 'IN',
    itemName: 'Rice', category: 'Grains & Pulses', supplier: 'Test',
    usageType: '', loggedBy: 'sdj', timestamp: '2026-06-05T10:00:00Z'
  }, token);
  check('POST /stock-history/:itemId', shR, 201);
  const shId = shR.b && shR.b.id;
  if (shId) {
    check('PUT  /stock-history/:itemId/:recordId (with _id/__v)', await req('PUT', '/api/stock-history/INV-001/' + shId, { qty: 20, _id: 'fake', __v: 0 }, token), 200);
    check('DEL  /stock-history/:itemId/:recordId', await req('DELETE', '/api/stock-history/INV-001/' + shId, null, token), 200);
  }

  console.log('\n============================');
  console.log('  PASSED: ' + passed + '  |  FAILED: ' + failed);
  console.log('============================\n');
}
run().catch(console.error);