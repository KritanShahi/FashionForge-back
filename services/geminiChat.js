// services/geminiChat.js

require("dotenv").config();
const axios = require("axios");
const { executeToolCall } = require("./geminiDbTools");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";

// ================= GEMINI INTENT CALL =================

async function detectIntent(userMessage, history = []) {
  try {
    const contents = [
      ...history.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200
        },
        systemInstruction: {
          parts: [{
            text: `
You are an AI assistant connected to a MongoDB database.

Your job is to convert user queries into JSON.

STRICT RULES:
- ALWAYS return JSON
- NO extra text
- NO explanation

FORMAT:
{
  "intent": "tool_name",
  "args": {}
}

AVAILABLE TOOLS:
- search_products → { searchText, limit }
- get_product_by_name → { name }
- count_documents → { collection }
- list_orders → { status, limit }
- get_cart_for_user → { userId }
- get_store_summary → {}

IF NOT RELATED TO DB:
{
  "intent": "general_reply",
  "args": { "message": "your reply" }
}

EXAMPLES:

User: show products
→ { "intent": "search_products", "args": { "searchText": "", "limit": 5 } }

User: buckwheat flour cha?
→ { "intent": "search_products", "args": { "searchText": "buckwheat" } }

User: how many products
→ { "intent": "count_documents", "args": { "collection": "products" } }

User: hi
→ { "intent": "general_reply", "args": { "message": "Hello! How can I help you?" } }
`
          }]
        }
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text;

  } catch (err) {
    console.error("Intent detection error:", err.response?.data || err.message);
    return null;
  }
}

// ================= NORMAL GEMINI CHAT =================

async function callGeminiChat(userMessage, history = []) {
  try {
    const contents = [
      ...history.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  } catch (err) {
    console.error("Gemini chat error:", err.response?.data || err.message);
    return "Sorry, something went wrong.";
  }
}

// ================= MAIN CHAT =================

async function runGeminiChat(userMessage, history = []) {

  history.push({ role: "user", text: userMessage });

  let reply = "";

  try {
    // 🔥 STEP 1: Detect intent
    const intentRaw = await detectIntent(userMessage, history);

    let parsed;

    try {
      parsed = JSON.parse(intentRaw);
    } catch {
      parsed = null;
    }

    // 🔥 STEP 2: If valid DB intent → execute tool
    if (parsed && parsed.intent && parsed.intent !== "general_reply") {

      const result = await executeToolCall(parsed.intent, parsed.args);

      // 🔥 STEP 3: Format response nicely
      if (parsed.intent === "search_products") {
        if (result.products?.length) {
          reply = result.products
            .map(p => `${p.name} - Rs.${p.price} - Stock: ${p.stock}`)
            .join("\n");
        } else {
          reply = "No products found.";
        }
      }

      else if (parsed.intent === "count_documents") {
        reply = `Total ${result.collection}: ${result.count}`;
      }

      else if (parsed.intent === "list_orders") {
        if (result.orders?.length) {
          reply = result.orders
            .map(o => `${o.name} - ${o.status} - Rs.${o.total}`)
            .join("\n");
        } else {
          reply = "No orders found.";
        }
      }

      else if (parsed.intent === "get_store_summary") {
        reply = `
Customers: ${result.totalCustomers}
Products: ${result.totalProducts}
Sold: ${result.totalProductsSold}
`;
      }

      else {
        reply = JSON.stringify(result, null, 2);
      }

    }

    // 🔥 STEP 4: Normal chat fallback
    else {
      reply =
        parsed?.args?.message ||
        await callGeminiChat(userMessage, history);
    }

  } catch (err) {
    console.error(err);
    reply = "Something went wrong.";
  }

  history.push({ role: "assistant", text: reply });

  return { reply, history };
}

module.exports = { runGeminiChat };



