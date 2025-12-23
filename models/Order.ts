import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Interfejs za stavke narudžbine
interface IOrderItem {
    name: string;
    quantity: number;
    price: number;
    product: mongoose.Types.ObjectId;
}

// 2. Interfejs za informacije o dostavi
interface IShippingInfo {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
}

// 3. Glavni interfejs za Order Document
export interface IOrder extends Document {
    shippingInfo: IShippingInfo;
    orderItems: IOrderItem[];
    totalPrice: number;
    user?: mongoose.Types.ObjectId; // Opciono jer može biti gost
    orderStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const orderSchema: Schema<IOrder> = new Schema({
    shippingInfo: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true },
    },

    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
        }
    ],

    totalPrice: {
        type: Number,
        required: true,
    },
    
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
export default Order;