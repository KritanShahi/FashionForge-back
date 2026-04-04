const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoute = require('./routes/auth');
const cors = require('cors');

// Initialize environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (FIX payload size)
app.use(cors());

app.use(express.json({
  limit: "100mb"
}));

app.use(express.urlencoded({
  limit: "100mb",
  extended: true
}));

// MongoDB connection (FIX deprecated warnings)
mongoose.connect(
  process.env.MONGO_URL || 'mongodb+srv://shahikritan11_db_user:Fashion_Forge@cluster0.nx8olnu.mongodb.net/'
)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("Database connection error:", err));

// Routes
app.use('/api/auth', authRoute);

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to FashionForge API');
});

// Start server (ONLY ONE)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});