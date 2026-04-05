// geminiDbTools.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const MAX_LIST = 40;

// ------------------- HELPERS -------------------

function safeLimit(n, fallback = 20) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 1) return fallback;
  return Math.min(Math.floor(x), MAX_LIST);
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

// ------------------- TOOL FUNCTIONS -------------------

// Search products by name substring
async function search_products(args) {
  const limit = safeLimit(args.limit, 20);
  const searchText = args.searchText && String(args.searchText).trim();
  const query = searchText
    ? { name: { $regex: searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
    : {};
  const docs = await Product.find(query).sort({ _id: -1 }).limit(limit).lean();
  return {
    products: docs.map(p => ({
      name: p.name,
      price: p.price,
      description: p.description || 'No description',
      stock: p.stock ?? 0
    }))
  };
}

// Get product by exact name or substring
async function get_product_by_name(args) {
  const name = args.name && String(args.name).trim();
  if (!name) return { error: 'Provide a product name.' };
  return await search_products({ searchText: name, limit: 10 });
}

// Count documents in collections
async function count_documents(args) {
  const map = { products: Product, orders: Order, users: User, carts: Cart };
  const Model = map[args.collection];
  if (!Model) return { error: 'Unknown collection' };
  const count = await Model.countDocuments();
  return { collection: args.collection, count };
}

// List all orders, optionally filtered by status
async function list_orders(args) {
  const limit = safeLimit(args.limit, 15);
  const filter = {};
  if (args.status) filter.status = args.status;
  const docs = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return {
    orders: docs.map(o => ({
      name: o.name,
      status: o.status,
      total: o.total ?? 0
    }))
  };
}

// Get cart for a user
async function get_cart_for_user(args) {
  const userId = args.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) return { error: 'Invalid userId' };
  const doc = await Cart.findOne({ userId }).populate('items.productId').lean();
  return doc
    ? {
        cart: doc.items.map(i => ({
          name: i.productId?.name || 'Unknown product',
          qty: i.quantity ?? 0
        }))
      }
    : { cart: [], message: 'No cart for this user' };
}

// Store summary
async function get_store_summary() {
  const totalCustomers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const soldAgg = await Order.aggregate([
    { $unwind: '$products' },
    { $group: { _id: null, totalSold: { $sum: '$products.quantity' } } }
  ]);
  const totalProductsSold = soldAgg.length ? soldAgg[0].totalSold : 0;
  return { totalCustomers, totalProducts, totalProductsSold };
}

// ------------------- HANDLERS -------------------

const handlers = {
  search_products,
  get_product_by_name,
  count_documents,
  list_orders,
  get_cart_for_user,
  get_store_summary
};

// Execute any tool call safely
async function executeToolCall(name, args) {
  const fn = handlers[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  try {
    const raw = args && typeof args === 'object' ? args : {};
    return await fn(raw);
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

module.exports = { executeToolCall };