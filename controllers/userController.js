const User = require('../models/User'); // Uverite se da je putanja ispravna
// const catchAsync = require('../utils/catchAsync'); // Ako koristite catchAsync

// ----------------------------------------------------
// DOHVAT SVIH ADRESA
// @route   GET /api/v1/user/addresses
// @access  Private
exports.getShippingAddresses = async (req, res) => {
    try {
        // Dohvatamo samo niz adresa iz korisničkog dokumenta
        const user = await User.findById(req.user._id).select('shippingAddresses');
        
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
// @route   POST /api/v1/user/addresses
// @access  Private
exports.addShippingAddress = async (req, res) => {
    try {
        console.log('📦 Received address data:', req.body);
        console.log('👤 User ID:', req.user._id);
        
        // Validate required fields before processing
        const { street, city, zip } = req.body;
        if (!street || !city || !zip) {
            return res.status(400).json({ 
                success: false, 
                error: 'Street, city, and zip code are required fields' 
            });
        }
        
        // Use findByIdAndUpdate with $push to avoid pre-save hook issues
        // This directly adds to the array without triggering password hashing
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { shippingAddresses: req.body } },
            { 
                new: true, // Return updated document
                runValidators: true, // Run validators on the new address
                select: 'shippingAddresses' // Only select the addresses field
            }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        console.log('✅ Address saved successfully');
        
        // Vraćamo poslednju (novododatu) adresu
        const newAddress = user.shippingAddresses[user.shippingAddresses.length - 1];

        res.status(201).json({
            success: true,
            data: newAddress
        });
    } catch (error) {
        console.error('❌ Error adding shipping address:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        if (error.errors) {
            console.error('❌ Validation errors:', error.errors);
        }
        
        // Return more detailed error message
        let errorMessage = 'Invalid address data';
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            const errors = Object.values(error.errors).map(err => err.message).join(', ');
            errorMessage = `Validation error: ${errors}`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(400).json({ 
            success: false, 
            error: errorMessage 
        });
    }
};

// ----------------------------------------------------
// BRISANJE ADRESE
// @route   DELETE /api/v1/user/addresses/:id
// @access  Private
exports.deleteShippingAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 🛑 Mongoose metod: pull (uklanjanje) iz niza po _id
        // user.shippingAddresses.id(req.params.id) pronalazi subdocument (ugnježđeni dokument)
        const addressId = req.params.id;
        const address = user.shippingAddresses.id(addressId);
        
        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }
        
        // Uklanjanje adrese
        address.deleteOne(); // Koristite .remove() za starije verzije Mongoose-a
        await user.save();

        res.status(204).json({
            success: true,
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error while deleting address' });
    }
};