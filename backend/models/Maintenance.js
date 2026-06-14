const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // FIXED: Tracks which partner/renter account owns the item needing repair
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  issueDescription: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);