const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const maintenanceRoutes = require('./routes/maintenance');

const app = express();
app.use(express.json());
app.use(cors());

// Bind Sub-Router Instances
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/maintenance', maintenanceRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/rentease";

mongoose.connect(MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`RentEase Base Cluster Active on ${PORT}`)))
  .catch(err => console.error("Database initialization fault:", err));