# AI Chat Assistant

The assistant answers questions about stock, projects, purchase orders, suppliers and wastage. It is available in the website (floating chat button) and in the mobile app's Chat tab.

**It is read-only for now.** It cannot change, add or delete anything. Actions with a Confirm button are planned as a later step.

## Setup

Add these to the server's environment (Render → Environment, or `Server/.env` locally):

| Variable | Required | Purpose |
|---|---|---|
| `AIStudio_API_KEY` | Yes | Google AI Studio (Gemini) API key |
| `GEMINI_MODEL` | No | Overrides the default model in `Server/services/aiProvider.js` |

Without a key, chat replies "not set up yet" and the rest of the app works normally. Never commit the key.

## Who can see what

| User | Access |
|---|---|
| Admin | All company data |
| Project user | Only their own project's stock and approvals |
| User with no project | Nothing, until an admin links their account |
| Demo account | Chat is not available |

This is enforced by the server in `Server/services/chatTools.js`, using the role and project stored on the user's database record. It does not rely on the AI following instructions.

## Limits

- 15 questions per minute and 200 per day, per user (reset if the server restarts)
- 1,000 characters per question
- Up to 6 data lookups per question

## Files

| File | Purpose |
|---|---|
| `Server/routes/chat.js` | `/api/chat` endpoints, limits and chat history |
| `Server/services/chatTools.js` | Read-only data lookups and access rules |
| `Server/services/aiProvider.js` | The only Gemini-specific code; replace this to switch provider |
| `Clients/src/components/common/ChatAssistant.jsx` | Website chat panel |
| `mobileapp/src/screens/ChatScreen.js` | Mobile chat screen |

## Troubleshooting

| Message | Likely cause |
|---|---|
| "not set up yet" | `AIStudio_API_KEY` is missing |
| "not set up correctly" | The key is invalid, or the model name isn't available. Check the server log, and set `GEMINI_MODEL` if needed |
| "busy right now" | Gemini quota or rate limit reached |
