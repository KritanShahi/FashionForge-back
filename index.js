const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./connection");

const authRoute = require("./routes/auth");
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const commentRoutes = require('./routes/comments');
const chatRoute = require('./routes/chat');

dotenv.config();

const app = express();

// connect DB
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoute);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoute);

// test route
app.get("/", (req, res) => {
  res.send("API running...");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});