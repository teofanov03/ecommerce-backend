import express from 'express';
// Uvozimo kontrolere sa .js ekstenzijom
import * as userController from '../controllers/userController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// SVE rute ispod su zaštićene i zahtevaju JWT token
router.use(protect); 

// Rutiranje za adrese
router.route('/addresses')
    .get(userController.getShippingAddresses) // GET /api/v1/user/addresses
    .post(userController.addShippingAddress); // POST /api/v1/user/addresses

// Brisanje specifične adrese
router.delete('/addresses/:id', userController.deleteShippingAddress); // DELETE /api/v1/user/addresses/:id

export default router;