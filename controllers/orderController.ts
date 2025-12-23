import { type Request, type Response, type NextFunction } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Ažuriraj zalihe proizvoda nakon narudžbine
async function updateStock(productId: string, quantity: number): Promise<void> {
    const product = await Product.findById(productId);
    if (product) {
        product.stock = Math.max(0, product.stock - quantity); 
        await product.save({ validateBeforeSave: false });
    }
}

// @desc    Kreiraj novu narudžbinu
// @route   POST /api/v1/orders
export const newOrder = async (req: Request, res: Response) => {
    try {
        const { orderItems } = req.body;
        const orderData = { ...req.body };

        // Ako je korisnik ulogovan, dodajemo njegov ID
        if (req.user) { 
            orderData.user = req.user._id;
        }

        const order = await Order.create(orderData);
        
        // Ažuriranje zaliha
        for (const item of orderItems) {
            const productId = item.product || item._id; 
            if (productId) {
                await updateStock(productId, item.quantity);
            }
        }

        res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Dohvati sve narudžbine (Admin)
export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Dohvati detalje jedne narudžbine
export const getSingleOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate({
                path: 'orderItems.product', 
                select: 'image category',
            }); 
            
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Ažuriraj status narudžbine (Admin)
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const newStatus = req.body.orderStatus;
        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

        if (!validStatuses.includes(newStatus)) {
             return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        order.orderStatus = newStatus;
        if (newStatus === 'Delivered' && !order.deliveredAt) {
            order.deliveredAt = new Date();
        }

        await order.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Obriši narudžbinu
export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        res.status(200).json({ success: true, message: 'Order deleted.' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Dohvati moje narudžbine
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        // 1. Provera: Ako req.user ne postoji, odmah prekini (mada bi protect middleware to trebalo da reši)
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // 2. Koristi casting "as any" ili preciznu definiciju da izbegneš strogu proveru query-ja
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'orderItems.product',
                select: 'name image category'
            }); 
            
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Praćenje narudžbine po ID-u (Public)
export const trackOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate({
                path: 'orderItems.product',
                select: 'name price image category'
            });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                orderStatus: order.orderStatus,
                createdAt: order.createdAt,
                deliveredAt: order.deliveredAt,
                orderItems: order.orderItems,
                totalPrice: order.totalPrice,
                shippingInfo: order.shippingInfo,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};