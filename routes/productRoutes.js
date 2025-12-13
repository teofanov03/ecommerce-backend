// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { getProducts, getSingleProduct, deleteProduct,updateProduct,createProduct } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/:id', getSingleProduct);
router.delete('/:id', deleteProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
module.exports = router;