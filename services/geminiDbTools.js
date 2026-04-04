const mongoose = require('mongoose');
const { SchemaType } = require('@google/generative-ai');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/order');

const MAX_LIST = 40;

function safeLimit(n, fallback = 20) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 1) return fallback;
  return Math.min(Math.floor(x), MAX_LIST);
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

const functionDeclarations = [
  {
    name: 'search_products',
    description:
      'Search products by name or description text, optional price range. Returns a list of products with prices and ids.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        searchText: {
          type: SchemaType.STRING,
          description: 'Substring to match against product name or description (case-insensitive).',
        },
        minPrice: { type: SchemaType.NUMBER, description: 'Minimum price inclusive.' },
        maxPrice: { type: SchemaType.NUMBER, description: 'Maximum price inclusive.' },
        limit: { type: SchemaType.INTEGER, description: `Max items to return (default 20, max ${MAX_LIST}).` },
      },
    },
  },
  {
    name: 'get_product_by_id',
    description: 'Get one product by its MongoDB _id.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productId: { type: SchemaType.STRING, description: 'Product ObjectId string.' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'list_products',
    description: 'List products with optional pagination (newest first by _id).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        skip: { type: SchemaType.INTEGER, description: 'Number of documents to skip (default 0).' },
        limit: { type: SchemaType.INTEGER, description: `Max items (default 20, max ${MAX_LIST}).` },
      },
    },
  },
  {
    name: 'count_documents',
    description: 'Count documents in a collection.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        collection: {
          type: SchemaType.STRING,
          format: 'enum',
          description: 'One of: products, orders, users, carts.',
          enum: ['products', 'orders', 'users', 'carts'],
        },
      },
      required: ['collection'],
    },
  },
  {
    name: 'list_orders',
    description: 'List recent orders, optionally filtered by status.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          format: 'enum',
          description:
            'Optional. One of: Pending, Processing, Shipped, Delivered, Cancelled.',
          enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        },
        limit: { type: SchemaType.INTEGER, description: `Max orders (default 15, max ${MAX_LIST}).` },
      },
    },
  },
  {
    name: 'get_order_by_id',
    description: 'Get a single order by MongoDB _id, including line items (product ids and quantities).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        orderId: { type: SchemaType.STRING, description: 'Order ObjectId string.' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'get_store_summary',
    description:
      'High-level store metrics: customer count, product count, total units sold across all orders, and a few recent orders (id, customer name on order, status, total).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'find_users',
    description:
      'Find users by username or email substring. Never returns password hashes. Use for support-style questions.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        searchText: {
          type: SchemaType.STRING,
          description: 'Match against username or email (case-insensitive).',
        },
        limit: { type: SchemaType.INTEGER, description: `Max users (default 10, max ${MAX_LIST}).` },
      },
    },
  },
  {
    name: 'get_cart_for_user',
    description: 'Get shopping cart for a user by their MongoDB user id.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.STRING, description: 'User ObjectId string.' },
      },
      required: ['userId'],
    },
  },
];

async function search_products(args) {
  const limit = safeLimit(args.limit, 20);
  const q = {};
  if (args.searchText && String(args.searchText).trim()) {
    const rx = new RegExp(String(args.searchText).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ name: rx }, { description: rx }];
  }
  if (args.minPrice != null || args.maxPrice != null) {
    q.price = {};
    if (args.minPrice != null) q.price.$gte = Number(args.minPrice);
    if (args.maxPrice != null) q.price.$lte = Number(args.maxPrice);
  }
  const docs = await Product.find(q).sort({ _id: -1 }).limit(limit).lean();
  return { products: docs.map((p) => toPlain(p)) };
}

async function get_product_by_id(args) {
  const id = args.productId;
  if (!mongoose.Types.ObjectId.isValid(id)) return { error: 'Invalid productId' };
  const doc = await Product.findById(id).lean();
  return doc ? { product: toPlain(doc) } : { error: 'Product not found' };
}

async function list_products(args) {
  const limit = safeLimit(args.limit, 20);
  const skip = Math.max(0, Math.floor(Number(args.skip) || 0));
  const docs = await Product.find().sort({ _id: -1 }).skip(skip).limit(limit).lean();
  return { products: docs.map((p) => toPlain(p)), skip, limit };
}

async function count_documents(args) {
  const map = {
    products: Product,
    orders: Order,
    users: User,
    carts: Cart,
  };
  const Model = map[args.collection];
  if (!Model) return { error: 'Unknown collection' };
  const count = await Model.countDocuments();
  return { collection: args.collection, count };
}

async function list_orders(args) {
  const limit = safeLimit(args.limit, 15);
  const filter = {};
  if (args.status) filter.status = args.status;
  const docs = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return { orders: docs.map((o) => toPlain(o)) };
}

async function get_order_by_id(args) {
  const id = args.orderId;
  if (!mongoose.Types.ObjectId.isValid(id)) return { error: 'Invalid orderId' };
  const doc = await Order.findById(id).lean();
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
  const recent = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name total status createdAt')
    .lean();
  return {
    totalCustomers,
    totalProducts,
    totalProductsSold,
    recentOrders: recent.map((o) => toPlain(o)),
  };
}

async function find_users(args) {
  const limit = safeLimit(args.limit, 10);
  const text = args.searchText && String(args.searchText).trim();
  const q = text
    ? {
        $or: [
          { username: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          { email: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        ],
      }
    : {};
  const docs = await User.find(q).select('-password').sort({ _id: -1 }).limit(limit).lean();
  return { users: docs.map((u) => toPlain(u)) };
}

async function get_cart_for_user(args) {
  const id = args.userId;
  if (!mongoose.Types.ObjectId.isValid(id)) return { error: 'Invalid userId' };
  const doc = await Cart.findOne({ userId: id }).populate('items.productId').lean();
  return doc ? { cart: toPlain(doc) } : { cart: null, message: 'No cart for this user' };
}

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
  try {
    const raw = args && typeof args === 'object' ? args : {};
    return await fn(raw);
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

module.exports = {
  functionDeclarations,
  executeToolCall,
};
