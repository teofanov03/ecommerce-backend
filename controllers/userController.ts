import { type Request, type Response } from 'express';
import User from '../models/User.js';

// ----------------------------------------------------
// DOHVAT SVIH ADRESA
// ----------------------------------------------------
export const getShippingAddresses = async (req: Request, res: Response) => {
    try {
        // req.user._id je siguran jer imamo 'protect' middleware
        const user = await User.findById(req.user?._id).select('shippingAddresses');
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            results: user.shippingAddresses.length,
            data: user.shippingAddresses
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error while fetching addresses' });
    }
};

// ----------------------------------------------------
// DODAVANJE NOVE ADRESE
// ----------------------------------------------------
export const addShippingAddress = async (req: Request, res: Response) => {
    try {
        const { street, city, zip } = req.body;
        
        if (!street || !city || !zip) {
            return res.status(400).json({ 
                success: false, 
                error: 'Street, city, and zip code are required fields' 
            });
        }
        
        // Koristimo $push da bismo izbegli pre-save hook (password hashing)
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { $push: { shippingAddresses: req.body } },
            { 
                new: true, 
                runValidators: true, 
                select: 'shippingAddresses' 
            }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const newAddress = user.shippingAddresses[user.shippingAddresses.length - 1];

        res.status(201).json({
            success: true,
            data: newAddress
        });
    } catch (error: any) {
        let errorMessage = 'Invalid address data';
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message).join(', ');
            errorMessage = `Validation error: ${errors}`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(400).json({ success: false, error: errorMessage });
    }
};

// ----------------------------------------------------
// BRISANJE ADRESE
// ----------------------------------------------------
export const deleteShippingAddress = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?._id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const addressId = req.params.id;
        
        // TypeScript-u kažemo (as any) za .id() jer Mongoose Types za nizove 
        // ponekad ne prepoznaju subdocument metode bez dublje definicije
        const address = (user.shippingAddresses as any).id(addressId);
        
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }
        
        address.deleteOne(); 
        await user.save();

        res.status(204).json({
            success: true,
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error while deleting address' });
    }
};