const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController'); // Potrebno za protect

const router = express.Router();

// SVE rute ispod su zaštićene i zahtevaju JWT token
router.use(authController.protect); 

// Rutiranje za adrese
router.route('/addresses')
    .get(userController.getShippingAddresses) // GET /api/v1/user/addresses
    .post(userController.addShippingAddress); // POST /api/v1/user/addresses

router.delete('/addresses/:id', userController.deleteShippingAddress); // DELETE /api/v1/user/addresses/:id

module.exports = router;