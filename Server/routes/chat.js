/**
 * POST /api/chat
 * AI chat endpoint — natural language inventory assistant powered by Claude.
 *
 * Request body:
 *   { message: string, history: [{role:'user'|'assistant', content:string}] }
 *
 * Response:
 *   { reply: string }
 *
 * The endpoint uses Claude's tool_use feature so the AI can:
 *   - check_stock           → query InventoryItem collection
 *   - update_stock          → add or deduct qty from an item
 *   - create_project        → create a new Project document
 *   - assign_stock_to_project → deduct stock and link it to a project
 *   - delete_inventory_item → permanently remove an item
 *   - get_daily_summary     → overview of stock health
 */

const router = require('express').Router();
const auth   = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

const Item    = require('../models/InventoryItem');
const Project = require('../models/Project');

// Lazy-initialise the client so we don't crash at startup if the key is missing.
let _client = null;
function getClient() {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ── Tool definitions (what Claude is allowed to call) ─────────────────────────

const TOOLS = [
  {
    name: 'check_stock',
    description:
      'Check current stock levels. Can search by item name or category, or return everything. ' +
      'Use for questions like "how much rice do we have?" or "show me low-stock items".',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Item name or category to search (case-insensitive). Omit to get all items.',
        },
        low_stock_only: {
          type: 'boolean',
          description: 'If true, only return items where currentStock ≤ minStock.',
        },
      },
    },
  },
  {
    name: 'update_stock',
    description:
      'Add or deduct stock for an inventory item. ' +
      'Use for "add 50 kg of rice", "receive 100 units of cooking oil", or "deduct 10 kg of flour".',
    input_schema: {
      type: 'object',
      properties: {
        item_name: { type: 'string', description: 'Name of the inventory item.' },
        quantity: {
          type: 'number',
          description: 'Amount to add (positive) or deduct (negative). E.g. 50 to add, -10 to remove.',
        },
        notes: { type: 'string', description: 'Reason for the change, e.g. "Monthly delivery".' },
      },
      required: ['item_name', 'quantity'],
    },
  },
  {
    name: 'create_project',
    description:
      'Create a new project in the system. ' +
      'Use for "create project Vessel-Alpha" or "start new project for Mumbai port".',
    input_schema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Project name.' },
        description: { type: 'string', description: 'Optional description of the project.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'assign_stock_to_project',
    description:
      'Deduct stock from inventory and assign it to a project. ' +
      'Use for "assign 20 kg of rice to project Vessel-Alpha".',
    input_schema: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Name (or partial name) of the project.' },
        item_name:    { type: 'string', description: 'Name (or partial name) of the inventory item.' },
        quantity:     { type: 'number', description: 'Quantity to assign.' },
      },
      required: ['project_name', 'item_name', 'quantity'],
    },
  },
  {
    name: 'delete_inventory_item',
    description:
      'Permanently delete an inventory item. ' +
      'ONLY use when the user explicitly asks to delete or remove an item from the system.',
    input_schema: {
      type: 'object',
      properties: {
        item_name: { type: 'string', description: 'Name of the item to delete.' },
      },
      required: ['item_name'],
    },
  },
  {
    name: 'get_daily_summary',
    description:
      'Return a daily inventory health summary: total items, low-stock count, out-of-stock count, ' +
      'estimated total stock value, and a list of items needing attention. ' +
      'Use for "morning summary", "daily report", or "what needs reordering?".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

// ── Tool executor — runs against the live MongoDB database ────────────────────

async function executeTool(toolName, input, userId) {
  switch (toolName) {

    case 'check_stock': {
      let query = {};
      if (input.search) {
        const re = new RegExp(input.search, 'i');
        query = { $or: [{ name: re }, { category: re }] };
      }
      let items = await Item.find(query).lean();
      if (input.low_stock_only) {
        items = items.filter(i => i.currentStock <= i.minStock);
      }
      if (!items.length) return { found: 0, message: 'No matching items found.' };
      return {
        found: items.length,
        items: items.map(i => ({
          id:           i.id,
          name:         i.name,
          category:     i.category,
          currentStock: i.currentStock,
          minStock:     i.minStock,
          unit:         i.unit,
          status:       i.currentStock === 0 ? 'OUT_OF_STOCK' : i.currentStock <= i.minStock ? 'LOW' : 'OK',
        })),
      };
    }

    case 'update_stock': {
      const re   = new RegExp(input.item_name, 'i');
      const item = await Item.findOne({ name: re });
      if (!item) return { success: false, error: `Item "${input.item_name}" not found.` };

      const before = item.currentStock;
      const qty    = Number(input.quantity);
      item.currentStock = Math.max(0, item.currentStock + qty);
      item.stockRecords = item.stockRecords || [];
      item.stockRecords.push({
        id:        `SR-CHAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        qty:       Math.abs(qty),
        rate:      0,
        direction: qty >= 0 ? 'in' : 'out',
        notes:     input.notes || 'Updated via AI Chat',
        loggedBy:  userId,
        timestamp: new Date().toISOString(),
        date:      new Date().toLocaleDateString('en-IN'),
        time:      new Date().toLocaleTimeString('en-IN'),
      });
      await item.save();
      return {
        success: true,
        item:   item.name,
        unit:   item.unit,
        before,
        change: qty,
        after:  item.currentStock,
      };
    }

    case 'create_project': {
      const exists = await Project.findOne({ name: new RegExp(`^${input.name}$`, 'i') });
      if (exists) return { success: false, error: `Project "${input.name}" already exists.` };

      const project = await Project.create({
        id:          `PROJ-CHAT-${Date.now()}`,
        name:        input.name,
        description: input.description || '',
        status:      'Active',
        createdAt:   new Date().toISOString(),
        createdBy:   userId,
        stockItems:  [],
        users:       [],
      });
      return {
        success: true,
        project: { id: project.id, name: project.name, status: project.status },
      };
    }

    case 'assign_stock_to_project': {
      const project = await Project.findOne({ name: new RegExp(input.project_name, 'i') });
      if (!project) return { success: false, error: `Project "${input.project_name}" not found.` };

      const item = await Item.findOne({ name: new RegExp(input.item_name, 'i') });
      if (!item) return { success: false, error: `Item "${input.item_name}" not found.` };

      const qty = Number(input.quantity);
      if (item.currentStock < qty) {
        return {
          success: false,
          error:   `Insufficient stock. Available: ${item.currentStock} ${item.unit}, requested: ${qty} ${item.unit}.`,
        };
      }

      item.currentStock = Math.max(0, item.currentStock - qty);
      item.stockRecords = item.stockRecords || [];
      item.stockRecords.push({
        id:          `SR-OUT-CHAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        qty,
        rate:        0,
        direction:   'out',
        projectId:   project.id,
        projectName: project.name,
        loggedBy:    userId,
        timestamp:   new Date().toISOString(),
        date:        new Date().toLocaleDateString('en-IN'),
        time:        new Date().toLocaleTimeString('en-IN'),
      });
      await item.save();
      return {
        success:        true,
        item:           item.name,
        unit:           item.unit,
        assigned:       qty,
        project:        project.name,
        remainingStock: item.currentStock,
      };
    }

    case 'delete_inventory_item': {
      const re   = new RegExp(input.item_name, 'i');
      const item = await Item.findOne({ name: re });
      if (!item) return { success: false, error: `Item "${input.item_name}" not found.` };
      await Item.deleteOne({ _id: item._id });
      return { success: true, deleted: item.name };
    }

    case 'get_daily_summary': {
      const items     = await Item.find({}).lean();
      const lowStock  = items.filter(i => i.currentStock <= i.minStock && i.currentStock > 0);
      const outStock  = items.filter(i => i.currentStock === 0);
      const totalVal  = items.reduce((s, i) => s + (i.currentStock * (i.unitCost || 0)), 0);
      const health    = items.length
        ? Math.round(((items.length - lowStock.length - outStock.length) / items.length) * 100)
        : 100;
      return {
        date:            new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        totalItems:      items.length,
        healthyItems:    items.length - lowStock.length - outStock.length,
        lowStockCount:   lowStock.length,
        outOfStockCount: outStock.length,
        healthPercent:   health,
        estimatedValue:  Math.round(totalVal),
        needsAttention:  [...outStock, ...lowStock].slice(0, 10).map(i => ({
          name: i.name, current: i.currentStock, min: i.minStock, unit: i.unit,
          status: i.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW',
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ── POST /api/chat ─────────────────────────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. Add ANTHROPIC_API_KEY to .env.' });
    }

    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const systemPrompt =
      `You are the SDJ Marine AI Stock Assistant — a helpful, concise assistant for SDJ Marine Pvt. Ltd. ` +
      `inventory and project management.\n\n` +
      `Today: ${today}\n` +
      `User: ${req.user.username || req.user.id} (Role: ${req.user.role || 'Staff'})\n\n` +
      `Guidelines:\n` +
      `- Always confirm destructive actions (delete) before executing them.\n` +
      `- Format stock numbers with units (e.g. "50 kg", "12 cans").\n` +
      `- Be brief and direct. Use plain text, not markdown headers.\n` +
      `- When listing items, keep it readable (name: qty unit status).\n` +
      `- If a request is unclear, ask one clarifying question.`;

    // Build messages array
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ];

    const client = getClient();

    // First call to Claude
    let response = await client.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 1024,
      system:     systemPrompt,
      tools:      TOOLS,
      messages,
    });

    // Agentic loop — keep running tool calls until Claude gives a final text reply
    while (response.stop_reason === 'tool_use') {
      const assistantContent = response.content;
      const toolResults      = [];

      for (const block of assistantContent) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input, req.user.id);
          toolResults.push({
            type:        'tool_result',
            tool_use_id: block.id,
            content:     JSON.stringify(result),
          });
        }
      }

      // Feed results back to Claude
      response = await client.messages.create({
        model:      'claude-haiku-4-5',
        max_tokens: 1024,
        system:     systemPrompt,
        tools:      TOOLS,
        messages: [
          ...messages,
          { role: 'assistant', content: assistantContent },
          { role: 'user',      content: toolResults      },
        ],
      });
    }

    const textBlock = response.content.find(b => b.type === 'text');
    const reply     = textBlock ? textBlock.text.trim() : 'Done.';

    res.json({ reply });
  } catch (err) {
    console.error('[/api/chat] error:', err.message);
    // Surface Anthropic API errors clearly
    if (err.status === 401) return res.status(503).json({ error: 'Invalid Anthropic API key.' });
    if (err.status === 429) return res.status(503).json({ error: 'AI service rate-limited. Try again shortly.' });
    res.status(500).json({ error: err.message || 'AI service error.' });
  }
});

module.exports = router;
