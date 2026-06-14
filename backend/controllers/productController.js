const Product = require('../models/Product');

// 1. Fetch products dynamically based on filtering rules
exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }

    if (req.query.renterId) {
      query.owner = req.query.renterId;
    }

    const products = await Product.find(query).populate('owner', 'name email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Fetch specific single item metrics
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Create Product stamped with the creator's ID safely
exports.createProduct = async (req, res) => {
  try {
    let parsedRates = { threeMonth: 0, sixMonth: 0, twelveMonth: 0 };
    
    // FIXED: Safely intercept text stringified JSON arrays from FormData streams
    if (req.body.tenureRates) {
      try {
        parsedRates = typeof req.body.tenureRates === 'string' 
          ? JSON.parse(req.body.tenureRates) 
          : req.body.tenureRates;
      } catch (e) {
        return res.status(400).json({ message: "Invalid JSON format inside tenureRates parameters." });
      }
    }

    // Capture file regardless of whether the frontend calls it 'imageFile' or 'image'
    let imageArray = [];
    const uploadedFile = req.file || (req.files && req.files[0]);
    if (uploadedFile) {
      // FIXED: Stored relatively to eliminate hardcoded localhost locks
      imageArray.push(`uploads/${uploadedFile.filename}`);
    }

    const product = new Product({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subCategory: req.body.subCategory,
      securityDeposit: Number(req.body.securityDeposit) || 0,
      tenureRates: {
        threeMonth: Number(parsedRates.threeMonth) || 0,
        sixMonth: Number(parsedRates.sixMonth) || 0,
        twelveMonth: Number(parsedRates.twelveMonth) || 0
      },
      images: imageArray,
      availableStock: Number(req.body.availableStock) || Number(req.body.stock) || 1,
      owner: req.user.id // Stamped with authorized partner user ID context row session
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Product Creation Error Trace:", err);
    res.status(500).json({ message: err.message });
  }
};