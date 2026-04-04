// geminiChat.js
// Local version of Gemini chat — no API, no limits, fake AI responses

const { executeToolCall } = require('./geminiDbTools');

const MAX_TOOL_ROUNDS = 5;

const SYSTEM_INSTRUCTION = `You are FashionForge Assistant, a helpful chatbot for an e-commerce fashion API.
You can answer questions about products, orders, carts, and users using the provided local tools.
Summarize results clearly. Never invent facts.`;

// Local "AI-like" simulator
async function runGeminiChat(userMessage, history = []) {
  // Keep a simple chat history
  history.push({ role: 'user', text: userMessage });

  let reply = '';

  const lower = userMessage.toLowerCase();

  try {
    // Detect keywords and call local tools
    if (lower.includes('list products')) {
      const res = await executeToolCall('list_products', {});
      reply = res.products
        ? `Here are some products: ${res.products.map(p => p.name).join(', ')}`
        : 'No products found.';
    } else if (lower.includes('product')) {
      const idMatch = userMessage.match(/\d+/);
      if (idMatch) {
        const res = await executeToolCall('get_product_by_id', { productId: idMatch[0] });
        reply = res.product
          ? `Product: ${res.product.name}, $${res.product.price}`
          : res.error || 'Product not found.';
      } else {
        reply = 'Please provide a product ID in your message.';
      }
    } else if (lower.includes('orders')) {
      const res = await executeToolCall('list_orders', {});
      reply = res.orders
        ? `Recent orders: ${res.orders.map(o => `${o.name} (${o.status})`).join(', ')}`
        : 'No orders found.';
    } else if (lower.includes('cart')) {
      const userIdMatch = userMessage.match(/u\d+/);
      if (userIdMatch) {
        const res = await executeToolCall('get_cart_for_user', { userId: userIdMatch[0] });
        reply = res.cart
          ? `Cart has ${res.cart.items.length} items.`
          : res.message || 'No cart found for this user.';
      } else {
        reply = 'Please provide a user ID like u1 or u2.';
      }
    } else if (lower.includes('summary')) {
      const res = await executeToolCall('get_store_summary', {});
      reply = `Store summary: ${res.totalProducts} products, ${res.totalCustomers} customers, ${res.totalProductsSold} total sales.`;
    } else {
      // Default greeting
      reply = "Hi! I'm your fashion assistant. You can ask me about products, orders, carts, or store summary.";
    }
  } catch (e) {
    reply = "Sorry, something went wrong locally.";
  }

  history.push({ role: 'assistant', text: reply });

  return { reply, history };
}

module.exports = { runGeminiChat };