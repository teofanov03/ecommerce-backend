import express from 'express';
// Obavezno dodajemo .js ekstenziju iako je fajl na disku .ts
import { 
    getProducts, 
    getSingleProduct, 
    deleteProduct, 
    updateProduct, 
    createProduct 
} from '../controllers/productController.js';

const router = express.Router();

// Možeš koristiti router.route('/') da bi kod bio pregledniji
router.route('/')
    .get(getProducts)
    .post(createProduct);

router.route('/:id')
    .get(getSingleProduct)
    .put(updateProduct)
    .delete(deleteProduct);

export default router;