const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, admin } = require('../middleware/auth');
const Product = require('../models/Product');
const productController = require('../controllers/productController');

// Configure local binary file disk storage settings
const storageDiskConfig = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads/');
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
    callback(new Error('Invalid file format. Please upload image files only!'), false);
  }
};

const uploadMiddleware = multer({ 
  storage: storageDiskConfig,
  fileFilter: imageFilterRules,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB safety limit threshold
});

// =========================================================================
// GET ROUTES - Mapping to Controller with Inline Fail-safes
// =========================================================================
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// =========================================================================
// POST / PUT ROUTES - Upgraded with .any() to handle any frontend field names
// =========================================================================
router.post('/', auth, admin, uploadMiddleware.any(), productController.createProduct);

router.put('/:id', auth, admin, uploadMiddleware.any(), async (req, res) => {
  try {
    const targetProduct = await Product.findById(req.params.id);
    if (!targetProduct) return res.status(404).json({ message: 'Product item not found.' });
    if (targetProduct.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized access.' });

    // Handle uploaded file from any field name flexibly
    let updatedImagesArray = targetProduct.images;
    const activeFile = req.file || (req.files && req.files[0]);
    if (activeFile) {
      // FIXED: Save path relatively as 'uploads/filename.png' instead of hardcoding localhost!
      updatedImagesArray = [`uploads/${activeFile.filename}`];
    }

    let parsedRates = { threeMonth: 0, sixMonth: 0, twelveMonth: 0 };
    if (req.body.tenureRates) {
      try {
        parsedRates = typeof req.body.tenureRates === 'string' ? JSON.parse(req.body.tenureRates) : req.body.tenureRates;
      } catch (e) {
        console.error("Failed parsing tenureRates object state:", e);
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
        availableStock: Number(req.body.availableStock) || Number(req.body.stock) || 1
      },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;