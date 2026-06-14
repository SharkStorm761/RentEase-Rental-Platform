const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

router.post('/', auth, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/admin/all', auth, admin, orderController.getAllOrdersAdmin);

// FIXED ADMINISTRATIVE LEASE ACTION ROUTE FOR STATUS DROPDOWN MANIPULATIONS
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // 1. Locate the existing customer contract record
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Target lease shipment contract not found' });
    }

    // 2. Automated Inventory Stock Adjuster Logic Matrix based on lifecycle stage transitions
    const isNewStateDeducted = (status === 'Dispatched' || status === 'Active');
    const isOldStateDeducted = (existingOrder.status === 'Dispatched' || existingOrder.status === 'Active');

    // If item is moving out to delivery, deduct stock numbers
    if (isNewStateDeducted && !isOldStateDeducted) {
      for (let item of existingOrder.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { availableStock: -item.quantity } });
      }
    } 
    // If contract is returned or cancelled, release stock allocations back to the catalog
    else if (!isNewStateDeducted && isOldStateDeducted) {
      for (let item of existingOrder.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { availableStock: item.quantity } });
      }
    }

    // 3. Commit the fresh administrative state down to Atlas cluster tables
    existingOrder.status = status;
    await existingOrder.save();

    // Return fully populated records back to refresh frontend states cleanly
    const fullyPopulatedOrder = await Order.findById(existingOrder._id)
      .populate('user', 'name email mobileNumber')
      .populate('items.product');

    console.log(`Administrative Update: Order #${existingOrder._id} modified to stage: ${status}`);
    res.json(fullyPopulatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Pro-rata early termination calculation contract router handler link
router.post('/:id/terminate-item', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Active lease contract not found' });
    
    const item = order.items.find(i => i._id.toString() === itemId || i.product.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Item reference not found in this order' });

    const dateCreated = new Date(order.createdAt);
    const dateToday = new Date();
    const timeDifference = Math.abs(dateToday - dateCreated);
    const daysUsed = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) || 1;

    let finalCalculatedRent = 0;
    let statementNotes = "";

    if (daysUsed <= 30) {
      finalCalculatedRent = item.monthlyRent;
      statementNotes = `Lease terminated early within the initial 30 days. Charged a flat base 1-month constraint minimum rent fee scheme layout code calculation.`;
    } else {
      const dailyRentRate = item.monthlyRent / 30;
      finalCalculatedRent = Math.round(daysUsed * dailyRentRate);
      statementNotes = `Pro-rata lease calculation processed cleanly for exactly ${daysUsed} days of asset utilization.`;
    }

    order.status = 'Completed';
    await order.save();

    await Product.findByIdAndUpdate(item.product, { $inc: { availableStock: item.quantity } });

    res.json({ success: true, daysUsed, finalCalculatedRent, statementNotes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;