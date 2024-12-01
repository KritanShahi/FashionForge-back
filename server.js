const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const { verifyToken, verifyAdmin } = require("./middlewares/authMiddleware");

dotenv.config();

const app = express();
app.use(express.json()); // For parsing JSON

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);

// Protected Admin Route Example
app.get("/api/admin", verifyAdmin, (req, res) => {
  res.status(200).json({ message: "Welcome Admin!" });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
