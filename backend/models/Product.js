const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['Furniture', 'Appliances'] },
  subCategory: { type: String, required: true },
  securityDeposit: { type: Number, required: true },
  tenureRates: {
    threeMonth: { type: Number, required: true },
    sixMonth: { type: Number, required: true },
    twelveMonth: { type: Number, required: true }
  },
  images: [{ type: String }],
  availableStock: { type: Number, required: true, default: 1 },
  isAvailable: { type: Boolean, default: true },
  
  // FIXED: Links this specific asset item to the Renter account who owns it
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);