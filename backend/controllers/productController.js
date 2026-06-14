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

// 3. Create Product with Explicit tenureRates Mapping Structure
exports.createProduct = async (req, res) => {
  try {
    // Intercept either flat body fields or stringified JSON structures
    let threeMonthRate = Number(req.body.threeMonth) || 0;
    let sixMonthRate = Number(req.body.sixMonth) || 0;
    let twelveMonthRate = Number(req.body.twelveMonth) || 0;

    if (req.body.tenureRates) {
      try {
        const parsed = typeof req.body.tenureRates === 'string' 
          ? JSON.parse(req.body.tenureRates) 
          : req.body.tenureRates;
        if (parsed) {
          threeMonthRate = Number(parsed.threeMonth) || threeMonthRate;
          sixMonthRate = Number(parsed.sixMonth) || sixMonthRate;
          twelveMonthRate = Number(parsed.twelveMonth) || twelveMonthRate;
        }
      } catch (e) {
        console.error("Context parsing warning:", e);
      }
    }

    // Safely parse uploaded binary media fields
    let imageArray = [];
    const uploadedFile = req.file || (req.files && req.files[0]);
    if (uploadedFile) {
      imageArray.push(`uploads/${uploadedFile.filename}`);
    }

    // Build schema definition layout matching product models explicitly
    const product = new Product({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subCategory: req.body.subCategory,
      securityDeposit: Number(req.body.securityDeposit) || 0,
      tenureRates: {
        threeMonth: threeMonthRate,
        sixMonth: sixMonthRate,
        twelveMonth: twelveMonthRate
      },
      images: imageArray,
      availableStock: Number(req.body.availableStock) || Number(req.body.stock) || 1,
      owner: req.user.id
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Critical Product Creation Failure:", err);
    res.status(500).json({ message: err.message });
  }
};

// 4. Update Product Details Safely
exports.updateProduct = async (req, res) => {
  try {
    const targetProduct = await Product.findById(req.params.id);
    if (!targetProduct) return res.status(404).json({ message: 'Product item not found.' });

    let threeMonthRate = Number(req.body.threeMonth) || targetProduct.tenureRates?.threeMonth || 0;
    let sixMonthRate = Number(req.body.sixMonth) || targetProduct.tenureRates?.sixMonth || 0;
    let twelveMonthRate = Number(req.body.twelveMonth) || targetProduct.tenureRates?.twelveMonth || 0;

    if (req.body.tenureRates) {
      try {
        const parsed = typeof req.body.tenureRates === 'string' ? JSON.parse(req.body.tenureRates) : req.body.tenureRates;
        if (parsed) {
          threeMonthRate = Number(parsed.threeMonth) || threeMonthRate;
          sixMonthRate = Number(parsed.sixMonth) || sixMonthRate;
          twelveMonthRate = Number(parsed.twelveMonth) || twelveMonthRate;
        }
      } catch (e) {
        console.error("Context parsing warning:", e);
      }
    }

    let updatedImagesArray = targetProduct.images;
    const activeFile = req.file || (req.files && req.files[0]);
    if (activeFile) {
      updatedImagesArray = [`uploads/${activeFile.filename}`];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        subCategory: req.body.subCategory,
        securityDeposit: Number(req.body.securityDeposit) || 0,
        tenureRates: {
          threeMonth: threeMonthRate,
          sixMonth: sixMonthRate,
          twelveMonth: twelveMonthRate
        },
        images: updatedImagesArray,
        availableStock: Number(req.body.availableStock) || Number(req.body.stock) || 1
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};