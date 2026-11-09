// Read-only data tools for the AI assistant. Nothing here writes to the database.
//
// Access is enforced here, not in the AI's instructions. `scope` comes from the
// user's database records: { isAdmin, projectIds }. Admins can use every tool;
// everyone else only gets project tools, locked to their own active projects.
const InventoryItem = require('../models/InventoryItem');
const Project       = require('../models/Project');
const StockReceived = require('../models/StockReceived');
const StockUsed     = require('../models/StockUsed');
const StockReturned = require('../models/StockReturned');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier      = require('../models/Supplier');
const WastageLog    = require('../models/WastageLog');

const MAX_ROWS = 50;

class ToolError extends Error {}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const contains    = (s) => new RegExp(escapeRegex(String(s).trim()), 'i');
const round       = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Today's date in India, since the server itself may run in UTC. */
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

function isoDate(value) {
  if (!value) return null;
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function parseRange({ from, to }) {
  const range = { from: from ? isoDate(from) : null, to: to ? isoDate(to) : null };
  if ((from && !range.from) || (to && !range.to)) throw new ToolError('Dates must be in YYYY-MM-DD format.');
  return range;
}

function inRange(value, { from, to }) {
  const date = isoDate(value);
  if (!date) return !from && !to;
  return (!from || date >= from) && (!to || date <= to);
}

const limited = (rows) => ({
  total: rows.length,
  rows: rows.slice(0, MAX_ROWS),
  ...(rows.length > MAX_ROWS ? { note: `Showing the first ${MAX_ROWS} of ${rows.length}.` } : {}),
});

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const activeItems = () => InventoryItem.find({ active: { $ne: false } }).select('-stockRecords').lean();

/* ── Project lookup and access ─────────────────────────────── */

async function resolveProject(requested, scope) {
  if (!scope.isAdmin) {
    const own = await Project.find({ id: { $in: scope.projectIds } }).select('id name status location').lean();
    if (!own.length) throw new ToolError('Your account is not linked to a project.');
    if (!requested) {
      if (own.length === 1) return own[0];
      throw new ToolError(`Please say which project: ${own.map((p) => p.name).join(', ')}.`);
    }
    const want = String(requested).trim().toLowerCase();
    const matches = own.filter((p) => {
      const name = p.name.toLowerCase();
      return want === p.id.toLowerCase() || name.includes(want) || want.includes(name);
    });
    if (!matches.length) throw new ToolError('Access denied: you can only view your own projects.');
    if (matches.length > 1) {
      throw new ToolError(`More than one of your projects matches "${requested}": ${matches.map((p) => p.name).join(', ')}. Ask which one.`);
    }
    return matches[0];
  }

  if (!requested) throw new ToolError('Please say which project.');
  const want = String(requested).trim();
  const exact = await Project.findOne({
    $or: [{ id: want }, { name: new RegExp(`^${escapeRegex(want)}$`, 'i') }],
  }).select('id name status location').lean();
  if (exact) return exact;

  const matches = await Project.find({ name: contains(want) }).select('id name status location').limit(10).lean();
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new ToolError(`More than one project matches "${want}": ${matches.map((p) => p.name).join(', ')}. Ask which one.`);
  }
  throw new ToolError(`No project found matching "${want}".`);
}

/** Older usage records are flat; newer ones hold an items array. */
function usageLines(record) {
  if (Array.isArray(record.items) && record.items.length) {
    return record.items.map((it) => ({ ...it, date: record.date }));
  }
  return [record];
}

/* ── Tool implementations ──────────────────────────────────── */

async function getLowStock() {
  const items = await activeItems();
  const rows = items
    .filter((i) => i.currentStock <= i.minStock)
    .sort((a, b) => (a.currentStock / (a.minStock || 1)) - (b.currentStock / (b.minStock || 1)))
    .map((i) => {
      const reorder = Math.max((i.maxStock || i.minStock) - i.currentStock, 0);
      return {
        item: i.name, category: i.category, unit: i.unit,
        current: i.currentStock, minimum: i.minStock, maximum: i.maxStock,
        suggested_reorder: reorder,
        estimated_reorder_cost: round(reorder * i.unitCost),
        supplier: i.supplier,
      };
    });
  return { ...limited(rows), order: 'most urgent first' };
}

async function searchInventory({ search }) {
  if (!search) throw new ToolError('Please say what to search for.');
  const pattern = contains(search);
  const items = await InventoryItem.find({
    active: { $ne: false },
    $or: [{ name: pattern }, { category: pattern }, { id: String(search).trim() }],
  }).select('-stockRecords').lean();
  return limited(items.map((i) => ({
    id: i.id, item: i.name, category: i.category, unit: i.unit,
    current: i.currentStock, minimum: i.minStock, maximum: i.maxStock,
    unit_cost: i.unitCost, supplier: i.supplier, location: i.location, expiry_date: i.expiryDate,
    is_low: i.currentStock <= i.minStock,
  })));
}

async function getExpiringItems({ days }) {
  const window = Math.min(Math.max(Number(days) || 30, 1), 365);
  const now = today();
  const items = await activeItems();
  const rows = items
    .map((i) => ({ item: i, expiry: isoDate(i.expiryDate) }))
    .filter(({ expiry }) => expiry && daysBetween(now, expiry) <= window)
    .sort((a, b) => a.expiry.localeCompare(b.expiry))
    .map(({ item, expiry }) => ({
      item: item.name, current: item.currentStock, unit: item.unit,
      expiry_date: expiry, days_left: daysBetween(now, expiry), already_expired: expiry < now,
    }));
  return { today: now, within_days: window, ...limited(rows) };
}

async function getStockValue() {
  const items = await activeItems();
  const byCategory = {};
  items.forEach((i) => {
    const value = i.currentStock * (i.unitCost || 0);
    byCategory[i.category] = byCategory[i.category] || { category: i.category, items: 0, value: 0 };
    byCategory[i.category].items += 1;
    byCategory[i.category].value += value;
  });
  const categories = Object.values(byCategory)
    .map((c) => ({ ...c, value: round(c.value) }))
    .sort((a, b) => b.value - a.value);
  return {
    currency: 'INR',
    total_items: items.length,
    total_value: round(categories.reduce((sum, c) => sum + c.value, 0)),
    by_category: categories,
  };
}

async function listProjects() {
  const projects = await Project.find({}).select('id name location status manager').lean();
  return limited(projects.map(({ _id, ...p }) => p));
}

async function getProjectStock({ project, from, to, item }, scope) {
  const target = await resolveProject(project, scope);
  const range = parseRange({ from, to });
  const hasRange = Boolean(range.from || range.to);
  const itemFilter = item ? String(item).trim().toLowerCase() : null;

  const [received, used, returned] = await Promise.all([
    StockReceived.find({ projectId: target.id }).lean(),
    StockUsed.find({ projectId: target.id }).lean(),
    StockReturned.find({ projectId: target.id }).lean(),
  ]);

  const rows = {};
  const row = (line) => {
    const key = line.itemId || line.itemName;
    rows[key] = rows[key] || {
      item: line.itemName || '', category: line.category || '', unit: line.unit || '',
      received_approved: 0, awaiting_approval: 0, used: 0, returned: 0,
      period_sent: 0, period_sent_value: 0, period_used: 0, period_returned: 0,
    };
    return rows[key];
  };

  received.forEach((submission) => {
    const approved = submission.approvalStatus === 'approved';
    const lines = Array.isArray(submission.items) ? submission.items : [];
    lines.forEach((line) => {
      const qty = Number(line.quantity) || 0;
      const r = row(line);
      if (approved) r.received_approved += qty; else r.awaiting_approval += qty;
      if (inRange(submission.date, range)) {
        r.period_sent += qty;
        r.period_sent_value += Number(line.total) || qty * (Number(line.rate) || 0);
      }
    });
  });
  used.flatMap(usageLines).forEach((line) => {
    const qty = Number(line.quantity) || 0;
    const r = row(line);
    r.used += qty;
    if (inRange(line.date, range)) r.period_used += qty;
  });
  returned.forEach((line) => {
    const qty = Number(line.quantity) || 0;
    const r = row(line);
    r.returned += qty;
    if (inRange(line.date, range)) r.period_returned += qty;
  });

  const items = Object.values(rows)
    .filter((r) => !itemFilter || r.item.toLowerCase().includes(itemFilter))
    .map(({ period_sent, period_sent_value, period_used, period_returned, ...r }) => ({
      ...r,
      // Same rule as the Stock Inhouse tab: approved received minus used minus returned.
      balance: round(r.received_approved - r.used - r.returned),
      ...(hasRange ? {
        in_period: {
          sent: round(period_sent), sent_value: round(period_sent_value),
          used: round(period_used), returned: round(period_returned),
        },
      } : {}),
    }))
    .sort((a, b) => a.item.localeCompare(b.item));

  return {
    project: { id: target.id, name: target.name, status: target.status },
    ...(hasRange ? {
      period: range,
      period_sent_value: round(items.reduce((sum, r) => sum + r.in_period.sent_value, 0)),
    } : {}),
    balance_rule: 'balance = approved received - used - returned; stock awaiting approval is not counted',
    ...limited(items),
  };
}

async function getPendingApprovals({ project }, scope) {
  const target = scope.isAdmin && !project ? null : await resolveProject(project, scope);
  const docs = await StockReceived.find({
    approvalStatus: { $ne: 'approved' },
    ...(target ? { projectId: target.id } : {}),
  }).lean();

  const projects = target
    ? [target]
    : await Project.find({ id: { $in: docs.map((d) => d.projectId) } }).select('id name').lean();
  const names = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const rows = docs
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((d) => ({
      project: names[d.projectId] || d.projectId,
      submission: d.submissionId, sent_on: d.date, sent_by: d.adminName,
      total_value: round(d.totalValue),
      items: (Array.isArray(d.items) ? d.items : []).map((it) => ({
        item: it.itemName, quantity: Number(it.quantity) || 0, unit: it.unit,
      })),
    }));
  return limited(rows);
}

async function getPurchaseOrders({ filter }) {
  const now = today();
  const closed = ['Delivered', 'Cancelled'];
  const orders = await PurchaseOrder.find({}).lean();
  const rows = orders
    .filter((o) => o.status !== 'Cancelled' || !filter || filter === 'all')
    .map((o) => {
      const delivery = isoDate(o.deliveryDate);
      return {
        id: o.id, supplier: o.supplier, order_date: o.date, delivery_date: o.deliveryDate,
        status: o.status, payment_status: o.paymentStatus, total_value: round(o.totalValue),
        is_unpaid: o.paymentStatus !== 'Paid',
        is_overdue: Boolean(delivery && delivery < now && !closed.includes(o.status)),
      };
    })
    .filter((o) => {
      if (filter === 'unpaid') return o.is_unpaid;
      if (filter === 'overdue') return o.is_overdue;
      if (filter === 'unpaid_or_overdue') return o.is_unpaid || o.is_overdue;
      return true;
    })
    .sort((a, b) => String(a.delivery_date).localeCompare(String(b.delivery_date)));
  return {
    today: now,
    unpaid_value: round(rows.filter((o) => o.is_unpaid).reduce((sum, o) => sum + o.total_value, 0)),
    ...limited(rows),
  };
}

async function getWastageSummary({ from, to }) {
  const range = parseRange({ from, to });
  const logs = (await WastageLog.find({}).lean()).filter((w) => inRange(w.date, range));

  const sumBy = (field) => {
    const totals = {};
    logs.forEach((w) => {
      totals[w[field]] = totals[w[field]] || { [field]: w[field], entries: 0, cost: 0 };
      totals[w[field]].entries += 1;
      totals[w[field]].cost += Number(w.costImpact) || 0;
    });
    return Object.values(totals).map((t) => ({ ...t, cost: round(t.cost) })).sort((a, b) => b.cost - a.cost);
  };

  return {
    period: range,
    entries: logs.length,
    total_cost: round(logs.reduce((sum, w) => sum + (Number(w.costImpact) || 0), 0)),
    by_reason: sumBy('reason'),
    top_items: sumBy('item').slice(0, 10),
  };
}

async function getSuppliers({ search }) {
  const query = search
    ? { $or: [{ name: contains(search) }, { category: contains(search) }, { city: contains(search) }] }
    : {};
  const suppliers = await Supplier.find(query)
    .select('name category contact phone email city status rating paymentTerms -_id').lean();
  return limited(suppliers);
}

async function getItemHistory({ item, from, to }) {
  if (!item) throw new ToolError('Please say which item.');
  const range = parseRange({ from, to });
  const matches = await InventoryItem.find({ name: contains(item) }).limit(10).lean();
  if (!matches.length) throw new ToolError(`No item found matching "${item}".`);

  const exact = matches.filter((m) => m.name.toLowerCase() === String(item).trim().toLowerCase());
  const pick = exact.length === 1 ? exact : matches;
  if (pick.length > 1) {
    throw new ToolError(`More than one item matches "${item}": ${matches.map((m) => m.name).join(', ')}. Ask which one.`);
  }

  const rows = (pick[0].stockRecords || [])
    .filter((r) => inRange(r.date, range))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map((r) => ({
      date: r.date, direction: r.direction === 'out' ? 'sent to project' : 'stock received',
      quantity: r.qty, rate: r.rate, supplier: r.supplier, project: r.projectName,
      logged_by: r.loggedBy, notes: r.notes,
    }));
  return { item: pick[0].name, unit: pick[0].unit, current: pick[0].currentStock, ...limited(rows) };
}

/* ── Tool registry ─────────────────────────────────────────── */

const dateParam = (label) => ({ type: 'STRING', description: `${label} date, YYYY-MM-DD (optional)` });
const noParams  = { type: 'OBJECT', properties: {} };

const TOOLS = [
  {
    name: 'get_low_stock', run: getLowStock,
    description: 'Items at or below minimum stock, most urgent first, with a suggested reorder quantity and supplier.',
    parameters: noParams,
  },
  {
    name: 'search_inventory', run: searchInventory,
    description: 'Find inventory items by name or category: current stock, cost, supplier, location, expiry. May return several matches.',
    parameters: {
      type: 'OBJECT',
      properties: { search: { type: 'STRING', description: 'Item name, category or ID' } },
      required: ['search'],
    },
  },
  {
    name: 'get_expiring_items', run: getExpiringItems,
    description: 'Items that have expired or will expire within a number of days.',
    parameters: { type: 'OBJECT', properties: { days: { type: 'NUMBER', description: 'Days ahead, default 30' } } },
  },
  {
    name: 'get_stock_value', run: getStockValue,
    description: 'Total inventory value in INR, with a breakdown by category, highest first.',
    parameters: noParams,
  },
  {
    name: 'list_projects', run: listProjects,
    description: 'All projects with location, status and manager.',
    parameters: noParams,
  },
  {
    name: 'get_project_stock', run: getProjectStock, projectTool: true,
    description: 'Stock for one project, per item: approved received, awaiting approval, used, returned and current balance. With dates, also what was sent, used and returned in that period and the value sent.',
    parameters: {
      type: 'OBJECT',
      properties: {
        project: { type: 'STRING', description: 'Project name or ID. Leave empty for the user\'s own project.' },
        from: dateParam('Start'),
        to: dateParam('End'),
        item: { type: 'STRING', description: 'Only this item (optional)' },
      },
    },
  },
  {
    name: 'get_pending_approvals', run: getPendingApprovals, projectTool: true,
    description: 'Stock sent to projects that the project has not approved yet.',
    parameters: {
      type: 'OBJECT',
      properties: { project: { type: 'STRING', description: 'Project name or ID (optional)' } },
    },
  },
  {
    name: 'get_purchase_orders', run: getPurchaseOrders,
    description: 'Purchase orders with supplier, status, payment and delivery date. Orders do not list individual items.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filter: { type: 'STRING', enum: ['all', 'unpaid', 'overdue', 'unpaid_or_overdue'], description: 'Which orders to return' },
      },
    },
  },
  {
    name: 'get_wastage_summary', run: getWastageSummary,
    description: 'Wastage cost for a period, broken down by reason and by item.',
    parameters: { type: 'OBJECT', properties: { from: dateParam('Start'), to: dateParam('End') } },
  },
  {
    name: 'get_suppliers', run: getSuppliers,
    description: 'Supplier directory: contact details, rating and payment terms.',
    parameters: {
      type: 'OBJECT',
      properties: { search: { type: 'STRING', description: 'Name, category or city (optional)' } },
    },
  },
  {
    name: 'get_item_history', run: getItemHistory,
    description: 'Stock movements for one item: when it was received or sent to a project, and by whom.',
    parameters: {
      type: 'OBJECT',
      properties: { item: { type: 'STRING', description: 'Item name' }, from: dateParam('Start'), to: dateParam('End') },
      required: ['item'],
    },
  },
];

const canUse = (tool, scope) => scope.isAdmin || (scope.projectIds.length > 0 && tool.projectTool === true);

/** Tool definitions this user may use. Anything else is not even offered to the AI. */
function toolsFor(scope) {
  return TOOLS.filter((t) => canUse(t, scope))
    .map(({ name, description, parameters }) => ({ name, description, parameters }));
}

/** Runs a tool and always returns a result. Failures go back to the AI as { error }. */
async function executeTool(name, args, scope) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { error: 'Unknown tool.' };
  if (!canUse(tool, scope)) return { error: 'Access denied: this information is only available to admins.' };
  try {
    return await tool.run(args || {}, scope);
  } catch (err) {
    if (err instanceof ToolError) return { error: err.message };
    console.error(`[chat] tool ${name} failed:`, err.message);
    return { error: 'Could not read this data right now.' };
  }
}

module.exports = { toolsFor, executeTool, today };
