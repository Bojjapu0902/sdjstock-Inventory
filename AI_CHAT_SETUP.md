# AI Chat Assistant — Setup Guide

This guide walks you through enabling the AI chat feature step by step.

---

## What Was Built

| File | What it does |
|---|---|
| `Server/routes/chat.js` | New API endpoint `/api/chat` — receives a message, calls Claude AI, executes DB actions, returns a reply |
| `Server/package.json` | Added `@anthropic-ai/sdk` dependency |
| `Server/server.js` | Registered the `/api/chat` route |
| `mobileapp/src/screens/ChatScreen.js` | WhatsApp-style chat UI for the mobile app |
| `mobileapp/src/navigation/AppNavigator.js` | Added "AI Chat" tab to the bottom nav |
| `mobileapp/src/config/api.js` | Now points to the deployed Render backend |

---

## Step 1 — Get an Anthropic API Key

> **Why?** The AI chat uses Claude (by Anthropic) to understand natural language and decide which action to perform. You need an API key to call it.

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Click **API Keys → Create Key**
4. Copy the key — it starts with `sk-ant-...`

---

## Step 2 — Add the Key to Your Server's .env File

Open `Server/.env` (create it if it doesn't exist) and add:

```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

**Important:** Never share this key or commit it to GitHub. It stays in `.env` only.

---

## Step 3 — Install the New Dependency Locally

Open a terminal, go into your Server folder, and run:

```bash
cd C:\xampp\htdocs\Websites\sdjstock-Inventory_new\Server
npm install
```

This installs `@anthropic-ai/sdk`.

---

## Step 4 — Redeploy to Render

Your backend is already deployed at `https://sdjstock-inventory-api.onrender.com`.
You need to push the changes and add the environment variable there too.

**Option A — via Render Dashboard (easiest):**
1. Go to **https://dashboard.render.com**
2. Click your service (sdjstock-inventory-api)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-YOUR_KEY_HERE`
5. Click **Save Changes** — Render will automatically redeploy

**Option B — push via Git:**
1. Commit the changed files (`Server/routes/chat.js`, `Server/server.js`, `Server/package.json`)
2. Push to GitHub — Render will auto-deploy

---

## Step 5 — Run the Mobile App

```bash
cd C:\xampp\htdocs\Websites\sdjstock-Inventory_new\mobileapp
npm install       # if you haven't already
npx expo start    # scan QR code with Expo Go app on your phone
```

You'll see a new **AI Chat** tab (💬) in the bottom navigation.

---

## What the AI Can Do

Once set up, users can chat naturally:

| What you say | What happens |
|---|---|
| "How much rice do we have?" | Checks database and tells you current stock |
| "Show me low stock items" | Lists all items below minimum stock level |
| "Add 50 kg of cooking oil" | Updates stock in MongoDB immediately |
| "Create project Vessel-Alpha" | Creates a new project in the database |
| "Assign 20 kg rice to project Vessel-Alpha" | Deducts from inventory, links to project |
| "Delete Basmati Rice" | Removes the item (AI asks to confirm first) |
| "Daily summary" | Full stock health report |

All changes made via chat are **immediately visible in the web app** — same database.

---

## Testing the Endpoint Directly

Once deployed, you can test the chat API with:

```bash
curl -X POST https://sdjstock-inventory-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Show me a daily stock summary"}'
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "AI service not configured" error | Add `ANTHROPIC_API_KEY` to Render environment variables |
| "Invalid Anthropic API key" | Double-check the key in Render dashboard |
| Chat tab not appearing | Run `npm install` in mobileapp, then restart Expo |
| Messages fail on physical device | Ensure `mobileapp/src/config/api.js` uses the Render URL (not localhost) |
