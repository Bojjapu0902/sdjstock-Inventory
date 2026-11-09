// The only file that knows which AI provider is in use. To switch provider,
// reimplement these exports; routes/chat.js and chatTools.js don't change.
const { GoogleGenerativeAI } = require('@google/generative-ai');

const DEFAULT_MODEL = 'gemini-3.8-flash';
const REQUEST_TIMEOUT_MS = 30000;

class AiError extends Error {
  constructor(status, userMessage) { super(userMessage); this.status = status; }
}

const isConfigured = () => Boolean(process.env.AIStudio_API_KEY);

const userMessage      = (text) => ({ role: 'user',  parts: [{ text }] });
const assistantMessage = (text) => ({ role: 'model', parts: [{ text }] });

/** Formats executed tool results as the next message in the conversation. */
const toolResultsMessage = (results) => ({
  role: 'user',
  parts: results.map(({ name, result }) => ({ functionResponse: { name, response: { result } } })),
});

function toAiError(err) {
  console.error('[ai] request failed:', err.status || err.name, err.message);
  const notConfigured = new AiError(503, 'The AI assistant is not set up correctly yet. Please contact an admin.');
  if (err.status === 401 || err.status === 403) return notConfigured;
  if (err.status === 400 && /api.?key/i.test(err.message || '')) return notConfigured;
  if (err.status === 404) return notConfigured; // model name not available
  if (err.status === 429) return new AiError(503, 'The AI assistant is busy right now. Please try again in a minute.');
  if (err.name === 'AbortError' || /abort|timeout/i.test(err.message || '')) {
    return new AiError(504, 'The AI assistant took too long to answer. Please try again.');
  }
  return new AiError(502, 'The AI assistant could not answer right now. Please try again.');
}

/**
 * Runs one model turn.
 * Returns { message, text, toolCalls: [{ name, args }] }, where message is
 * appended to the conversation unchanged so the provider sees its own output.
 */
async function generate({ system, contents, tools }) {
  if (!isConfigured()) {
    throw new AiError(503, 'The AI assistant is not set up yet. Please contact an admin.');
  }

  const client = new GoogleGenerativeAI(process.env.AIStudio_API_KEY);
  const model = client.getGenerativeModel(
    {
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      systemInstruction: system,
      ...(tools.length ? { tools: [{ functionDeclarations: tools }] } : {}),
    },
    { timeout: REQUEST_TIMEOUT_MS }
  );

  let result;
  try {
    result = await model.generateContent({ contents });
  } catch (err) {
    throw toAiError(err);
  }

  const parts = result.response.candidates?.[0]?.content?.parts || [];
  return {
    message: { role: 'model', parts },
    text: parts.filter((p) => p.text).map((p) => p.text).join('\n').trim(),
    toolCalls: parts
      .filter((p) => p.functionCall)
      .map((p) => ({ name: p.functionCall.name, args: p.functionCall.args || {} })),
  };
}

module.exports = { AiError, isConfigured, generate, userMessage, assistantMessage, toolResultsMessage };
