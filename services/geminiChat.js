// geminiChat.js

const { executeToolCall } = require('./geminiDbTools');

async function runGeminiChat(userMessage, history = []) {
  history.push({ role: 'user', text: userMessage });

  let reply = '';
  let action = null;
  let productId = null;

  const lower = userMessage.toLowerCase();

  try {

    // ================= GREETING =================
    if (['hi', 'hello', 'hlo', 'hey'].includes(lower)) {
      reply = `Hi! I'm your Fashion Assistant.

I can help you with:

- Show all products
- Search product by name
- Find cheapest or most expensive product
- Show in-stock or out-of-stock products
- Count products
- Open cart
- Show orders

Try typing: products, cheapest product, in stock products, or go to cart.`;
    }

    // ================= NAVIGATION =================
    else if (lower.includes('go to cart')) {
      reply = 'Opening cart...';
      action = 'navigate_cart';
    } else if (lower.includes('go to products')) {
      reply = 'Opening products...';
      action = 'navigate_products';
    } else if (lower.includes('go to orders')) {
      reply = 'Opening orders...';
      action = 'navigate_orders';
    }

    // ================= NAVIGATE PRODUCT =================
    else if (lower.startsWith('go to ')) {
      const name = lower.replace('go to', '').trim();
      const res = await executeToolCall('search_products', { searchText: name, limit: 1 });

      if (res.products?.length) {
        const p = res.products[0];
        reply = `Opening product: ${p.name}`;
        action = 'navigate_product';
        productId = p._id;
      } else {
        reply = `No product found matching "${name}".`;
      }
    }

    // ================= COUNT PRODUCTS =================
    else if (lower.includes('how many products') || lower.includes('total products')) {
      const res = await executeToolCall('count_documents', { collection: 'products' });
      reply = `There are ${res.count} products in the store.`;
    }

    // ================= SHOW PRODUCTS =================
    else if (lower === 'products' || lower.includes('show products')) {
      const res = await executeToolCall('search_products', { searchText: '', limit: 20 });
      if (res.products?.length) {
        reply = res.products
          .map(p => `${p.name} - $${p.price} - Stock: ${p.stock ?? 0}`)
          .join('\n');
      } else {
        reply = 'No products found.';
      }
    }

    // ================= CHEAPEST PRODUCT =================
    else if (lower.includes('cheap') || lower.includes('lowest')) {
      const res = await executeToolCall('search_products', { searchText: '', limit: 50 });
      if (res.products?.length) {
        const cheapest = res.products.reduce((min, p) => (p.price < min.price ? p : min));
        reply = `Cheapest product: ${cheapest.name} - $${cheapest.price}`;
      }
    }

    // ================= MOST EXPENSIVE =================
    else if (lower.includes('expensive') || lower.includes('highest')) {
      const res = await executeToolCall('search_products', { searchText: '', limit: 50 });
      if (res.products?.length) {
        const expensive = res.products.reduce((max, p) => (p.price > max.price ? p : max));
        reply = `Most expensive product: ${expensive.name} - $${expensive.price}`;
      }
    }

    // ================= IN STOCK =================
    else if (lower.includes('in stock')) {
      const res = await executeToolCall('search_products', { searchText: '', limit: 50 });
      const available = res.products.filter(p => (p.stock ?? 0) > 0);
      reply = available.length
        ? available.map(p => `${p.name} - Stock: ${p.stock}`).join('\n')
        : 'No products currently in stock.';
    }

    // ================= OUT OF STOCK =================
    else if (lower.includes('out of stock')) {
      const res = await executeToolCall('search_products', { searchText: '', limit: 50 });
      const unavailable = res.products.filter(p => (p.stock ?? 0) === 0);
      reply = unavailable.length
        ? unavailable.map(p => `${p.name} - Out of stock`).join('\n')
        : 'All products are in stock.';
    }

    // ================= ORDERS =================
    else if (lower.includes('orders')) {
      const res = await executeToolCall('list_orders', {});
      reply = res.orders?.length
        ? res.orders.map(o => `${o.name} (${o.status})`).join('\n')
        : 'No orders found.';
    }

    // ================= DEFAULT PRODUCT SEARCH =================
    else {
      const res = await executeToolCall('search_products', { searchText: userMessage, limit: 5 });
      if (res.products?.length) {
        reply = res.products
          .map(p => `${p.name} - $${p.price} - Stock: ${p.stock ?? 0}${p.description ? ' - ' + p.description : ''}`)
          .join('\n\n');
      } else {
        reply = `I didn't understand. Try typing: products, cheapest product, most expensive product, in stock products, or go to cart.`;
      }
    }

  } catch (err) {
    console.error(err);
    reply = 'Something went wrong.';
  }

  history.push({ role: 'assistant', text: reply });

  return { reply, history, action, productId };
}

module.exports = { runGeminiChat };