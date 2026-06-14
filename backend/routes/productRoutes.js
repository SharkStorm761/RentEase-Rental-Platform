const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, admin } = require('../middleware/auth');
const Product = require('../models/Product');

// Configure clean local binary file storage parameters
const storageDiskConfig = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads/'); // Make sure this folder exists inside your backend directory!
  },
  filename: function (req, file, callback) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    callback(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilterRules = (req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file configuration. Please upload image files only!'), false);
  }
};

const uploadMiddleware = multer({ 
  storage: storageDiskConfig,
  fileFilter: imageFilterRules,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB safety threshold limit
});

// GET endpoints mapped directly to inline controller logic
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.renterId) query.owner = req.query.renterId;
    const products = await Product.find(query).populate('owner', 'name email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================================================================
// FIXED CREATION ENDPOINT: Replaces productController.createProduct to stop NaN/Internal exceptions
// =========================================================================
router.post('/', auth, admin, uploadMiddleware.single('imageFile'), async (req, res) => {
  try {
    let imageUrlString = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"; // Fallback URL placeholder

    if (req.file) {
      imageUrlString = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    // Force strict conversion to numbers and default gracefully to 0 to prevent validation error flags
    const threeMonthRent = Number(req.body.threeMonth) || 0;
    const sixMonthRent = Number(req.body.sixMonth) || 0;
    const twelveMonthRent = Number(req.body.twelveMonth) || 0;
    const depositAmount = Number(req.body.securityDeposit) || 0;
    const stockCount = Number(req.body.availableStock) || 1;

    // Pack values into the exact structure demanded by your Mongoose Product model schema
    const productPayload = new Product({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subCategory: req.body.subCategory,
      securityDeposit: depositAmount,
      tenureRates: {
        threeMonth: threeMonthRent,
        sixMonth: sixMonthRent,
        twelveMonth: twelveMonthRent
      },
      images: [imageUrlString],
      availableStock: stockCount,
      isAvailable: stockCount > 0,
      owner: req.user.id
    });

    const savedAsset = await productPayload.save();
    console.log(`✨ Product Successfully Created over FormData: ${savedAsset.title}`);
    res.status(201).json(savedAsset);
  } catch (err) {
    console.error("Internal product saving trace exception:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// FIXED EDIT ENDPOINT: Handles stringified fields during editing modal operations
router.put('/:id', auth, admin, uploadMiddleware.single('imageFile'), async (req, res) => {
  try {
    const targetProduct = await Product.findById(req.params.id);
    if (!targetProduct) return res.status(404).json({ message: 'Item trace missing' });
    if (targetProduct.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized access.' });

    let updatedImagesArray = targetProduct.images;
    if (req.file) {
      updatedImagesArray = [`http://localhost:5000/uploads/${req.file.filename}`];
    }

    let parsedRates = { threeMonth: 0, sixMonth: 0, twelveMonth: 0 };
    if (req.body.tenureRates) {
      try {
        parsedRates = JSON.parse(req.body.tenureRates);
      } catch (e) {
        console.error("Failed parsing stringified object state:", e);
      }
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
          threeMonth: Number(parsedRates.threeMonth) || 0,
          sixMonth: Number(parsedRates.sixMonth) || 0,
          twelveMonth: Number(parsedRates.twelveMonth) || 0
        },
        images: updatedImagesArray,
        availableStock: Number(req.body.availableStock) || 1,
        isAvailable: (Number(req.body.availableStock) || 1) > 0
      },
      { returnDocument: 'after', runValidators: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;