const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');

const app = express();

// BULLETPROOF CORS ENGINE - Dynamically matches incoming browser requests
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.includes('vercel.app')) {
      return callback(null, true);
    } else {
      return callback(new Error('Connection blocked by RentEase security CORS policy.'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Serve uploads folder statically for asset streaming over live domains
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 
  "mongodb://sameermd761_db_user:viX4PKnGA1gIrE2b@" +
  "ac-mxvttls-shard-00-00.xekje7n.mongodb.net:27017," +
  "ac-mxvttls-shard-00-01.xekje7n.mongodb.net:27017," +
  "ac-mxvttls-shard-00-02.xekje7n.mongodb.net:27017/" +
  "RentEase?ssl=true&replicaSet=atlas-m6j763-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("🏁 Success: Connected cleanly to RentEase Atlas Shards!"))
  .catch(err => console.error("❌ Mongoose Database connection exception trace logged:", err));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server production runtime exception caught." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RentEase Production Backend Server online on port ${PORT}`);
});