const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoute = require('./routes/auth'); // Import the auth route
const cors = require('cors'); // Enable CORS if needed

// Initialize environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS for frontend access

// MongoDB connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/fashion_forge', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Database connection error:", err));

// Routes
app.use('/api/auth', authRoute); // Connect the auth route

// Sample route to test server
app.get('/', (req, res) => {
  res.send('Welcome to FashionForge API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
