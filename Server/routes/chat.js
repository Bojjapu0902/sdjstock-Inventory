const express        = require('express');
const router         = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/auth');
const InventoryItem  = require('../models/InventoryItem');
const Project        = require('../models/Project');
const ChatHistory    = require('../models/ChatHistory');

const genAI = new GoogleGenerativeAI(process.env.AIStudio_API_KEY);

// Max messages to keep in DB per user
const MAX_HISTORY = 40;

// ── Tool executor ──────────────────────────────────────────────────────────────
async function executeTool(name, args) {
  try {
    if (name === 'check_stock') {
      let query = { active: true };
      if (args.search) {
        query.$or = [
          { name:     { $regex: args.search, $options: 'i' } },
          { category: { $regex: args.search, $options: 'i' } },
        ];
      }
      let items = await InventoryItem.find(query).limit(20);
      if (args.low_stock_only) {
        items = items.filter(i => i.currentStock <= i.minStock);
      }
      if (!items.length) return 'No items found.';
      return items.map(i =>
        `${i.name} (${i.category}): ${i.currentStock} ${i.unit} [min: ${i.minStock}]`
      ).join('\n');
    }

    if (name === 'update_stock') {
      let item = null;
      if (args.item_id)   item = await InventoryItem.findOne({ id: args.item_id });
      if (!item && args.item_name)
        item = await InventoryItem.findOne({ name: { $regex: args.item_name, $options: 'i' } });
      if (!item) return `Item not found: ${args.item_name || args.item_id}`;
      const newQty = args.is_delta ? item.currentStock + args.quantity : args.quantity;
      item.currentStock = Math.max(0, newQty);
      await item.save();
      return `Updated ${item.name}: now ${item.currentStock} ${item.unit}`;
    }

    if (name === 'create_project') {
      const id = 'PRJ-' + Date.now();
      await Project.create({
        id, projectName: args.name,
        vessel: args.vessel || '', location: args.location || '',
        status: 'Active', createdAt: new Date().toISOString().split('T')[0],
      });
      return `Project "${args.name}" created successfully.`;
    }

    if (name === 'assign_stock_to_project') {
      const item = await InventoryItem.findOne({ name: { $regex: args.item_name, $options: 'i' } });
      if (!item) return `Item not found: ${args.item_name}`;
      const project = await Project.findOne({ projectName: { $regex: args.project_name, $options: 'i' } });
      if (!project) return `Project not found: ${args.project_name}`;
      if (item.currentStock < args.quantity) return `Insufficient stock. Available: ${item.currentStock} ${item.unit}`;
      item.currentStock -= args.quantity;
      await item.save();
      return `Assigned ${args.quantity} ${item.unit} of ${item.name} to ${project.projectName}. Remaining: ${item.currentStock}`;
    }

    if (name === 'delete_inventory_item') {
      const item = args.item_id
        ? await InventoryItem.findOne({ id: args.item_id })
        : await InventoryItem.findOne({ name: { $regex: args.item_name, $options: 'i' } });
      if (!item) return 'Item not found.';
      item.active = false;
      await item.save();
      return `Item "${item.name}" deleted successfully.`;
    }

    if (name === 'get_daily_summary') {
      const items    = await InventoryItem.find({ active: true });
      const lowStock = items.filter(i => i.currentStock <= i.minStock);
      const totalVal = items.reduce((s, i) => s + (i.currentStock * (i.unitCost || 0)), 0);
      const projects = await Project.find({ status: { $in: ['Active', 'active', 'Ongoing', 'ongoing'] } });
      return `📊 Daily Summary:\n• Total items: ${items.length}\n• Low stock alerts: ${lowStock.length}\n• Active projects: ${projects.length}\n• Estimated stock value: ₹${totalVal.toLocaleString('en-IN')}`;
    }

    return 'Unknown tool.';
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

// ── Tool definitions for Gemini ────────────────────────────────────────────────
const tools = [{
  functionDeclarations: [
    {
      name: 'check_stock',
      description: 'Check current stock levels. Can search by name or category.',
      parameters: {
        type: 'OBJECT',
        properties: {
          search:         { type: 'STRING',  description: 'Item name or category to search (optional)' },
          low_stock_only: { type: 'BOOLEAN', description: 'Return only low stock items' },
        },
      },
    },
    {
      name: 'update_stock',
      description: 'Update stock quantity for an inventory item.',
      parameters: {
        type: 'OBJECT',
        properties: {
          item_id:   { type: 'STRING',  description: 'Item ID' },
          item_name: { type: 'STRING',  description: 'Item name' },
          quantity:  { type: 'NUMBER',  description: 'New quantity or delta' },
          is_delta:  { type: 'BOOLEAN', description: 'If true, add/subtract instead of set' },
          notes:     { type: 'STRING',  description: 'Optional notes' },
        },
        required: ['quantity'],
      },
    },
    {
      name: 'create_project',
      description: 'Create a new project/vessel.',
      parameters: {
        type: 'OBJECT',
        properties: {
          name:     { type: 'STRING', description: 'Project name' },
          vessel:   { type: 'STRING', description: 'Vessel name (optional)' },
          location: { type: 'STRING', description: 'Location (optional)' },
        },
        required: ['name'],
      },
    },
    {
      name: 'assign_stock_to_project',
      description: 'Assign/deduct stock quantity to a project.',
      parameters: {
        type: 'OBJECT',
        properties: {
          item_name:    { type: 'STRING', description: 'Inventory item name' },
          project_name: { type: 'STRING', description: 'Project name' },
          quantity:     { type: 'NUMBER', description: 'Quantity to assign' },
        },
        required: ['item_name', 'project_name', 'quantity'],
      },
    },
    {
      name: 'delete_inventory_item',
      description: 'Delete an inventory item.',
      parameters: {
        type: 'OBJECT',
        properties: {
          item_name: { type: 'STRING', description: 'Item name' },
          item_id:   { type: 'STRING', description: 'Item ID' },
        },
      },
    },
    {
      name: 'get_daily_summary',
      description: 'Get a summary of today\'s inventory status.',
      parameters: { type: 'OBJECT', properties: {} },
    },
  ],
}];

// ── GET /api/chat/history ──────────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId  = req.user.id || req.user._id || req.user.userId;
    const history = await ChatHistory.findOne({ userId });
    res.json({ messages: history ? history.messages : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/chat/history ───────────────────────────────────────────────────
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    await ChatHistory.deleteOne({ userId });
    res.json({ message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chat ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const userId   = req.user.id || req.user._id || req.user.userId;
    const username = req.user.username || req.user.name || 'User';

    // Load persistent history from DB
    let historyDoc = await ChatHistory.findOne({ userId });
    if (!historyDoc) {
      historyDoc = await ChatHistory.create({ userId, username, messages: [] });
    }

    // Build Gemini chat history (role must be 'user' or 'model')
    const pastMessages = historyDoc.messages.slice(-MAX_HISTORY).map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Setup Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: `You are an AI stock assistant for SDJ Marine Pvt. Ltd. You help manage marine inventory and projects. Use the available tools to check stock, update quantities, create projects, and get summaries. Be concise and helpful. The user is ${username}.`,
      tools,
    });

    // Start chat with history
    const chat = model.startChat({ history: pastMessages });

    // ── Agentic loop ──────────────────────────────────────────────────────────
    let finalReply = '';
    let currentMessage = message;

    while (true) {
      const result   = await chat.sendMessage(currentMessage);
      const response = result.response;
      const candidate = response.candidates?.[0];
      const parts     = candidate?.content?.parts || [];

      // Check for function calls
      const fnCalls = parts.filter(p => p.functionCall);

      if (fnCalls.length > 0) {
        // Execute all tool calls
        const fnResponses = [];
        for (const part of fnCalls) {
          const { name, args } = part.functionCall;
          const toolResult = await executeTool(name, args || {});
          fnResponses.push({
            functionResponse: {
              name,
              response: { result: toolResult },
            },
          });
        }
        // Send tool results back to Gemini
        currentMessage = fnResponses;
        continue;
      }

      // No function calls — get text reply
      finalReply = parts
        .filter(p => p.text)
        .map(p => p.text)
        .join('\n')
        .trim() || 'Done.';
      break;
    }

    // Save to DB
    const now = new Date();
    historyDoc.messages.push({ role: 'user',      content: message,    timestamp: now });
    historyDoc.messages.push({ role: 'assistant', content: finalReply, timestamp: now });
    if (historyDoc.messages.length > MAX_HISTORY) {
      historyDoc.messages = historyDoc.messages.slice(-MAX_HISTORY);
    }
    historyDoc.updatedAt = now;
    await historyDoc.save();

    res.json({ reply: finalReply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
