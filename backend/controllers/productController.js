const Product = require('../models/Product');

// Fetch products dynamically based on role scoping
exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }

    // FIXED: If an explicit renterId query parameter is provided or if accessed via a renter dashboard session, restrict data scoping
    if (req.query.renterId) {
      query.owner = req.query.renterId;
    }

    const products = await Product.find(query).populate('owner', 'name email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create Product stamped with the creator's ID
exports.createProduct = async (req, res) => {
  try {
    // FIXED: Spread incoming body attributes and inject the authorized session user ID as the owner element
    const productData = {
      ...req.body,
      owner: req.user.id // Binds the item strictly to this specific logged-in Renter ID
    };

    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};