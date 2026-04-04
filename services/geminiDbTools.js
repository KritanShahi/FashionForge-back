// geminiDbTools.js
// Local database tools for FashionForge chat assistant

const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const MAX_LIST = 40;

function safeLimit(n, fallback = 20) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 1) return fallback;
  return Math.min(Math.floor(x), MAX_LIST);
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

// Tool definitions
const functionDeclarations = [
  { name: 'search_products', description: 'Search products by name/description', parameters: {} },
  { name: 'get_product_by_id', description: 'Get product by id', parameters: {} },
  { name: 'list_products', description: 'List products', parameters: {} },
  { name: 'count_documents', description: 'Count documents in a collection', parameters: {} },
  { name: 'list_orders', description: 'List orders', parameters: {} },
  { name: 'get_order_by_id', description: 'Get order by id', parameters: {} },
  { name: 'get_store_summary', description: 'Get store metrics', parameters: {} },
  { name: 'find_users', description: 'Find users by username/email', parameters: {} },
  { name: 'get_cart_for_user', description: 'Get cart for a user', parameters: {} },
];

// Database handlers
async function search_products({ searchText, minPrice, maxPrice, limit }) {
  const q = {};
  if (searchText) q.$or = [
    { name: new RegExp(searchText, 'i') },
    { description: new RegExp(searchText, 'i') },
  ];
  if (minPrice != null || maxPrice != null) {
    q.price = {};
    if (minPrice != null) q.price.$gte = Number(minPrice);
    if (maxPrice != null) q.price.$lte = Number(maxPrice);
  }
  const docs = await Product.find(q).sort({ _id: -1 }).limit(safeLimit(limit)).lean();
  return { products: docs.map(toPlain) };
}

async function get_product_by_id({ productId }) {
  if (!mongoose.Types.ObjectId.isValid(productId)) return { error: 'Invalid productId' };
  const doc = await Product.findById(productId).lean();
  return doc ? { product: toPlain(doc) } : { error: 'Product not found' };
}

async function list_products({ skip = 0, limit }) {
  const docs = await Product.find().sort({ _id: -1 }).skip(skip).limit(safeLimit(limit)).lean();
  return { products: docs.map(toPlain), skip, limit: safeLimit(limit) };
}

async function count_documents({ collection }) {
  const map = { products: Product, orders: Order, users: User, carts: Cart };
  const Model = map[collection];
  if (!Model) return { error: 'Unknown collection' };
  const count = await Model.countDocuments();
  return { collection, count };
}

async function list_orders({ status, limit }) {
  const filter = status ? { status } : {};
  const docs = await Order.find(filter).sort({ createdAt: -1 }).limit(safeLimit(limit, 15)).lean();
  return { orders: docs.map(toPlain) };
}

async function get_order_by_id({ orderId }) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) return { error: 'Invalid orderId' };
  const doc = await Order.findById(orderId).lean();
  return doc ? { order: toPlain(doc) } : { error: 'Order not found' };
}

async function get_store_summary() {
  const totalCustomers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const soldAgg = await Order.aggregate([
    { $unwind: '$products' },
    { $group: { _id: null, totalSold: { $sum: '$products.quantity' } } },
  ]);
  const totalProductsSold = soldAgg.length ? soldAgg[0].totalSold : 0;
  const recent = await Order.find().sort({ createdAt: -1 }).limit(5).select('name total status').lean();
  return { totalCustomers, totalProducts, totalProductsSold, recentOrders: recent.map(toPlain) };
}

async function find_users({ searchText, limit }) {
  const q = searchText
    ? { $or: [{ username: new RegExp(searchText, 'i') }, { email: new RegExp(searchText, 'i') }] }
    : {};
  const docs = await User.find(q).select('-password').sort({ _id: -1 }).limit(safeLimit(limit, 10)).lean();
  return { users: docs.map(toPlain) };
}

async function get_cart_for_user({ userId }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return { error: 'Invalid userId' };
  const doc = await Cart.findOne({ userId }).populate('items.productId').lean();
  return doc ? { cart: toPlain(doc) } : { cart: null, message: 'No cart for this user' };
}

// Dispatcher
const handlers = {
  search_products,
  get_product_by_id,
  list_products,
  count_documents,
  list_orders,
  get_order_by_id,
  get_store_summary,
  find_users,
  get_cart_for_user,
};

async function executeToolCall(name, args) {
  const fn = handlers[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  return await fn(args || {});
}

module.exports = { functionDeclarations, executeToolCall };