// geminiChat.js
const { executeToolCall } = require('./geminiDbTools');

const MAX_TOOL_ROUNDS = 5;

const SYSTEM_INSTRUCTION = `You are FashionForge Assistant, a helpful chatbot for an e-commerce fashion API.
You answer questions about products, orders, carts, and store summaries using local tools.
Do not invent facts. Summarize clearly.`;

// Local AI-like chat
async function runGeminiChat(userMessage, history = []) {

  history.push({ role: 'user', text: userMessage });

  let reply = '';
  let action = null; // navigation support

  const lower = userMessage.toLowerCase();

  try {

    // ---------------- NAVIGATION ----------------

    if (
      lower.includes('go to cart') ||
      lower.includes('open cart')
    ) {

      reply = 'Opening cart...';
      action = 'navigate_cart';

    }

    else if (
      lower.includes('go to products') ||
      lower.includes('open products')
    ) {

      reply = 'Opening products page...';
      action = 'navigate_products';

    }

    // ---------------- PRODUCT COUNT ----------------

    else if (
      lower.includes('how many products') ||
      lower.includes('total products')
    ) {

      const res = await executeToolCall(
        'count_documents',
        { collection: 'products' }
      );

      reply = `There are ${res.count} products in the store.`;

    }

    // ---------------- CART COUNT ----------------

    else if (
      lower.includes('how many carts')
    ) {

      const res = await executeToolCall(
        'count_documents',
        { collection: 'carts' }
      );

      reply = `There are ${res.count} carts in the system.`;

    }

    // ---------------- SHOW ALL PRODUCTS ----------------

    else if (
      lower === 'products' ||
      lower.includes('list products') ||
      lower.includes('show products')
    ) {

      const res = await executeToolCall(
        'search_products',
        { searchText: '', limit: 20 }
      );

      if (res.products && res.products.length) {

        reply = res.products
          .map(p =>
            `🛍 ${p.name}
Price: $${p.price}
Stock: ${p.stock ?? 0}
${p.description || 'No description'}`
          )
          .join('\n\n');

      } else {

        reply = 'No products found.';

      }

    }

    // ---------------- ORDERS ----------------

    else if (
      lower.includes('orders')
    ) {

      const res = await executeToolCall(
        'list_orders',
        {}
      );

      if (res.orders && res.orders.length) {

        reply =
          'Orders:\n' +
          res.orders
            .map(o =>
              `${o.name} (${o.status}) - $${o.total}`
            )
            .join('\n');

      } else {

        reply = 'No orders found.';

      }

    }

    // ---------------- CART VIEW ----------------

    else if (
      lower.includes('cart')
    ) {

      reply =
        'To open your cart, type "go to cart".';

    }

    // ---------------- AUTO PRODUCT SEARCH (MAIN FIX) ----------------

    else {

      // Try product search automatically
      const res = await executeToolCall(
        'search_products',
        {
          searchText: userMessage,
          limit: 5
        }
      );

      if (
        res.products &&
        res.products.length > 0
      ) {

        reply = res.products
          .map(p =>
            `🛍 ${p.name}
Price: $${p.price}
Stock: ${p.stock ?? 0}
${p.description || 'No description'}`
          )
          .join('\n\n');

      }

      else {

        reply =
          "I couldn't find that. Try asking:\n" +
          "- products\n" +
          "- how many products\n" +
          "- orders\n" +
          "- go to cart";

      }

    }

  }

  catch (e) {

    console.error('Gemini Chat error:', e);

    reply =
      'Sorry, something went wrong locally.';

  }

  history.push({
    role: 'assistant',
    text: reply
  });

  return {
    reply,
    history,
    action // important for frontend
  };

}

module.exports = {
  runGeminiChat
};