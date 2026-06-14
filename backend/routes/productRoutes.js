const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // FIXED: Handle ephemeral server file structures safely
const { auth, admin } = require('../middleware/auth');
const productController = require('../controllers/productController');

// BULLETPROOF DIRECTORY CREATOR MATRIX
const uploadDirectoryPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDirectoryPath)) {
  fs.mkdirSync(uploadDirectoryPath, { recursive: true });
}

// Configure disk destination parameters 
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB safety limit
});

// =========================================================================
// REGISTER ALL PRODUCT ROUTE GATEWAYS
// =========================================================================
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Upgraded with .any() to capture 'imageFile' or 'image' keys automatically
router.post('/', auth, admin, uploadMiddleware.any(), productController.createProduct);
router.put('/:id', auth, admin, uploadMiddleware.any(), productController.updateProduct);

module.exports = router;