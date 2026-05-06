const express = require("express");
const dotenv = require('dotenv');
const cors = require("cors");
const bodyParser = require('body-parser');
const authRoute = require("./routes/auth");

const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart'); 
const orderRoutes = require('./routes/order');
const commentRoutes = require('./routes/comments');
const chatRoute=require('./routes/chat');
require('./connection');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Use the home routes under the /home path

app.use("/api", authRoute);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoute);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

