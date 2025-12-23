import express from 'express';
// Obavezno .js ekstenzija zbog ESM standarda
import { 
    registerUser, 
    loginUser, 
    updateDetails, 
    updatePassword,
    protect 
} from '../controllers/authController.js';

const router = express.Router();

// Rute
router.post('/register', registerUser);
router.post('/login', loginUser);

// Zaštićene rute (koriste protect middleware)
router.patch('/update-details', protect, updateDetails);
router.patch('/update-password', protect, updatePassword);

export default router;