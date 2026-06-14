const Maintenance = require('../models/Maintenance');
const Product = require('../models/Product');

// 1. Create a support ticket for a defective item
exports.createTicket = async (req, res) => {
  try {
    const { order, product, issueDescription, preferredDate } = req.body;

    const targetProduct = await Product.findById(product);
    if (!targetProduct) {
      return res.status(404).json({ message: 'Target asset item trace missing from inventory.' });
    }

    const ticket = new Maintenance({
      order,
      product,
      user: req.user.id,
      renter: targetProduct.owner, // Routes cleanly to the appliance owner
      issueDescription,
      preferredDate
    });

    await ticket.save();
    console.log(`Maintenance ticket filed successfully for product ID: ${product}`);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 2. Fetch all tickets based on active user context filters
exports.getTickets = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      query.renter = req.user.id; // Renters see requests for their items
    } else {
      query.user = req.user.id;   // Customers see requests they created
    }

    const tickets = await Maintenance.find(query)
      .populate('user', 'name email mobileNumber')
      .populate('product')
      .populate('order', 'deliveryAddress');

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Update the ticket status (e.g., marking it as Resolved)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Maintenance.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Maintenance ticket not found' });
    }
    
    if (req.user.role === 'admin' && ticket.renter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this appliance asset.' });
    }

    ticket.status = status;
    await ticket.save();
    
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};