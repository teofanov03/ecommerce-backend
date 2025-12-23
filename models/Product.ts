import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Definišemo Interface za TypeScript
export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    category: 'Electronics' | 'Clothing' | 'Home & Living' | 'Accessories' | 'Footwear' | 'Sports' | 'Books' | 'Beauty' | 'Toys';
    image: string;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

// 2. Kreiramo Šemu (Schema)
const productSchema: Schema<IProduct> = new Schema({
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
        enum: ['Electronics', 'Clothing', "Home & Living", 'Accessories', "Footwear", "Sports", "Books", "Beauty", "Toys"]
    },
    image: { 
        type: String, 
        default: '/images/sample.jpg' 
    },
    stock: { 
        type: Number, 
        required: [true, 'Please enter stock quantity'],
        default: 0
    },
}, { timestamps: true });

// 3. Eksportujemo Model
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
export default Product;