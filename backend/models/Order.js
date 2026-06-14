const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    selectedTenure: { type: String, enum: ['threeMonth', 'sixMonth', 'twelveMonth'], required: true },
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    quantity: { type: Number, default: 1 }
  }],
  totalMonthlyRent: { type: Number, required: true },
  totalSecurityDeposit: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  // FIXED: Added dedicated mobile communication variable track property
  mobileNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Dispatched', 'Active', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  tenureEnded: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);