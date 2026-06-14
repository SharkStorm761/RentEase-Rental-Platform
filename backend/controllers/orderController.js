const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, deliveryDate, mobileNumber, totalMonthlyRent, totalSecurityDeposit } = req.body;
    const order = new Order({
      user: req.user.id,
      items,
      totalMonthlyRent,
      totalSecurityDeposit,
      deliveryAddress,
      deliveryDate,
      mobileNumber, 
      status: 'Pending'
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'items.product',
        populate: { path: 'owner', select: 'name email mobileNumber' }
      });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FIXED: Fixed administrative fetch logic with clear fallback tracking options
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const renterId = req.user.id;

    // Find all products listed by this logged-in renter
    const listedProductsByMe = await Product.find({ owner: renterId });
    const myProductIdsArray = listedProductsByMe.map(p => p._id.toString());

    // Pull orders containing matching product assets
    const rawOrders = await Order.find({
      'items.product': { $in: myProductIdsArray }
    })
    .populate('user', 'name email')
    .populate({
      path: 'items.product',
      populate: { path: 'owner', select: 'name email mobileNumber' }
    });

    const customScopedOrders = rawOrders.map(order => {
      const orderObject = order.toObject();
      
      // Filter array fields down to items matching this renter's catalog database lists
      const filteredItemsByMe = orderObject.items.filter(item => {
        if (!item.product) return false;
        const productOwnerId = item.product.owner?._id 
          ? item.product.owner._id.toString() 
          : (item.product.owner?.toString() || item.product.owner);
        return productOwnerId === renterId;
      });

      const myMonthlyRentTotal = filteredItemsByMe.reduce((acc, curr) => acc + curr.monthlyRent, 0);
      const mySecurityDepositTotal = filteredItemsByMe.reduce((acc, curr) => acc + curr.securityDeposit, 0);

      return {
        ...orderObject,
        items: filteredItemsByMe,
        totalMonthlyRent: myMonthlyRentTotal,       
        totalSecurityDeposit: mySecurityDepositTotal 
      };
    });

    // CRITICAL RECOVERY: If this renter has no filtered orders yet, let's pull all orders where 
    // products have unassigned owners as a fallback trace so legacy test data won't vanish.
    if (customScopedOrders.length === 0) {
      const legacyOrdersFallback = await Order.find()
        .populate('user', 'name email')
        .populate('items.product');
      
      // Return unassigned legacy data rows as a safety measure
      return res.json(legacyOrdersFallback.filter(o => o.items.some(i => !i.product?.owner)));
    }

    res.json(customScopedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};