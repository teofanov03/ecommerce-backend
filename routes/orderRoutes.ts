import express from 'express';
// Obavezno .js ekstenzije za interne importe
import { 
    newOrder, 
    getOrders, 
    updateOrderStatus, 
    getSingleOrder, 
    deleteOrder,
    getMyOrders,
    trackOrder 
} from '../controllers/orderController.js';

import { protect, optionalProtect } from '../controllers/authController.js';

const router = express.Router();

// Ruta za kreiranje nove narudžbine (Gosti + Prijavljeni)
router.route('/')
    .post(optionalProtect, newOrder);

// Javna ruta za praćenje narudžbine po ID-u
router.get('/track/:orderId', trackOrder);

// ----------------------------------------------------
// RUTIRANJE ZA KUPCE (Zaštićene rute)
// ----------------------------------------------------
// Od ove tačke naniže, sve rute zahtevaju login
router.use(protect); 

router.get('/my-orders', getMyOrders);

// ----------------------------------------------------
// RUTIRANJE ZA ADMINA
// ----------------------------------------------------
router.route('/')
    .get(getOrders); // Admin lista svih narudžbina

router.route('/:id')
    .get(getSingleOrder) 
    .put(updateOrderStatus)
    .delete(deleteOrder); 

export default router;