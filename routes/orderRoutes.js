// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { 
    newOrder, 
    getOrders, 
    updateOrderStatus, 
    getSingleOrder, 
    deleteOrder,
    getMyOrders // 💡 Dodajte uvoz ove funkcije iz kontrolera
} = require('../controllers/orderController');
const { protect, optionalProtect } = require('../controllers/authController'); // Uvoz za zaštitu

// Ruta za kreiranje nove narudžbine (dozvoljava i goste i prijavljene korisnike)
router.route('/')
    .post(optionalProtect, newOrder); // 💡 OPTIONALPROTECT postavlja req.user ako je korisnik prijavljen

// ----------------------------------------------------
// RUTIRANJE ZA KUPCE (Dashboard)
// ----------------------------------------------------
// Zaštita za sve rute ispod
router.use(protect); 

// Ruta koju Frontend traži: Dohvat narudžbina za prijavljenog korisnika
router.get('/my-orders', getMyOrders); // 💡 NOVA RUTA ZA USER DASHBOARD

// ----------------------------------------------------
// RUTIRANJE ZA ADMINA (Management)
// ----------------------------------------------------
// Opciono: Zaštita da samo Admin može da pristupi ovim rutama
// router.use(protect, restrictTo('admin')); 
router.route('/')
    .get(getOrders);// Dohvaćanje SVIH narudžbina (Samo za Admina)

router.route('/:id')
    .get(getSingleOrder) 
    .put(updateOrderStatus)
    .delete(deleteOrder); 
    
module.exports = router;