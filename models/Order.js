const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // 1. INFORMACIJE O DOSTAVI (Shipping Info) - OVO OSTAJE ISTO
    shippingInfo: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true },
    },

    // 2. STAVKE NARUDŽBINE (Order Items) - OVO OSTAJE ISTO
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }, // Cena po jedinici u trenutku naručivanja
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', 
                required: true,
            },
            // Opciono: image: { type: String }
        }
    ],

    // 3. FINANSIJSKI PODACI I STATUS
    totalPrice: {
        type: Number,
        required: true,
    },
    
    // 💡 KLJUČNA IZMENA: Polje za povezivanje sa prijavljenim korisnikom (User ID)
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Postavljamo required: false, jer narudžbinu može napraviti i gost (guest)
        required: false, 
    },
    
    orderStatus: {
        type: String,
        required: true,
        default: 'Processing',
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled']
    },
    
    deliveredAt: {
        type: Date,
    },

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);