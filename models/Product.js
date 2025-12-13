// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Please enter product name'],
        trim: true,
        maxlength: [120, 'Product name cannot exceed 120 characters']
    },
    description: { 
        type: String, 
        required: [true, 'Please enter product description'] 
    },
    price: { 
        type: Number, 
        required: [true, 'Please enter product price'] 
    },
    category: { 
        type: String, 
        required: [true, 'Please select a category'],
        // Enum za lakše filtriranje na Frontendu
        enum: ['Electronics', 'Clothing', "Home & Living", 'Accessories',"Footwear","Sports","Books","Beauty","Toys"]
    },
    image: { 
        type: String, // Za sada ćemo koristiti jednostavan URL string
        default: '/images/sample.jpg' 
    },
    stock: { 
        type: Number, 
        required: [true, 'Please enter stock quantity'],
        default: 0
    },
}, { timestamps: true }); // Automatski dodaje createdAt i updatedAt

module.exports = mongoose.model('Product', productSchema);