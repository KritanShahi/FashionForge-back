const { GoogleGenerativeAI } = require('@google/generative-ai');
const { functionDeclarations, executeToolCall } = require('./geminiDbTools');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const MAX_TOOL_ROUNDS = 8;

const SYSTEM_INSTRUCTION = `You are FashionForge Assistant, a helpful chatbot for an e-commerce fashion API backed by MongoDB.
You can answer questions about products, orders, carts, and users by calling the provided tools.
Rules:
- Use tools whenever the user asks for data that lives in the database (counts, lists, prices, order status, etc.).
- Summarize tool results clearly for non-technical users. Use plain language.
- Never invent database facts; if tools return empty or errors, say so.
- User documents from tools never include password fields; do not claim you can see passwords.
- Order documents include a customer "name" field captured at checkout.
- Product comments are embedded in product documents.`;

function buildTools() {
  return [{ functionDeclarations }];
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const h of history) {
    if (!h || typeof h.role !== 'string' || typeof h.text !== 'string') continue;
    const role = h.role === 'assistant' ? 'model' : 'user';
    if (role !== 'model' && role !== 'user') continue;
    const text = h.text.trim();
    if (!text) continue;
    out.push({ role, parts: [{ text }] });
  }
  return out.slice(-20);
}

async function runGeminiChat(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY in environment');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: buildTools(),
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const chat = model.startChat({
    history: normalizeHistory(history),
  });

  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = response.functionCalls();
    if (!calls || calls.length === 0) {
      const text = response.text();
      return { reply: text, model: MODEL_NAME };
    }

    const parts = [];
    for (const call of calls) {
      const payload = await executeToolCall(call.name, call.args);
      parts.push({
        functionResponse: {
          name: call.name,
          response: payload,
        },
      });
    }

    result = await chat.sendMessage(parts);
    response = result.response;
  }

  return {
    reply:
      'I had to stop after too many database lookups. Please ask a simpler question or narrow what you need.',
    model: MODEL_NAME,
  };
}

module.exports = { runGeminiChat, MODEL_NAME };
