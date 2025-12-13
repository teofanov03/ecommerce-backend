// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    updateDetails, 
    updatePassword,
    protect // Uvozimo NOVI protect middleware
} = require('../controllers/authController');

// Rute
router.post('/register', registerUser);
router.post('/login', loginUser);
router.patch('/update-details', protect, updateDetails); // 💡 NOVO
router.patch('/update-password', protect, updatePassword);
module.exports = router;