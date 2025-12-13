// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Ažuriraj zalihe proizvoda nakon narudžbine
async function updateStock(productId, quantity) {
    // 1. Pronađi proizvod po ID-u
    const product = await Product.findById(productId);

    if (product) {
        // 2. Smanji zalihe. Ne dozvoli da zalihe idu ispod 0 (opciono)
        product.stock = Math.max(0, product.stock - quantity); 
        
        // 3. Sačuvaj promene u bazi
        await product.save({ validateBeforeSave: false }); // Preskačemo validaciju da ne bismo imali problema sa pre-save hookovima
    }
}
// @desc    Kreiraj novu narudžbinu
// @route   POST /api/v1/orders
// @access  Public
exports.newOrder = async (req, res) => {
    try {
        const { orderItems } = req.body; // Izdvajamo orderItems iz tela zahteva
        const orderData = { ...req.body };
        if (req.user && req.user._id) { 
            orderData.user = req.user._id; // Povezivanje narudžbine
        }
        // 1. Kreiranje narudžbine
        const order = await Order.create(orderData);
        
        // 2. 💡 NOVO: AŽURIRANJE ZALIHA ZA SVAKU STAVKU
        for (const item of orderItems) {
            // item.product je ID proizvoda (referenca) ako je orderItems niz referenci
            // Ako koristite _id polje iz Frontend cart-a, onda koristite item._id
            const productId = item.product || item._id; 
            
            if (productId) {
                await updateStock(productId, item.quantity);
            }
        }
        // -----------------------------------------------------------------

        res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error("Order creation failed:", error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: Could not process order.'
        });
    }
};

// @desc      Get all orders (Admin/List)
// @route     GET /api/v1/orders
// @access    Admin/Private (Requires Auth if not public)
exports.getOrders = async (req, res) => {
    try {
        // You might consider adding .populate('orderItems.product', 'name image') 
        // if you need product details in the list view (AdminList).
        const orders = await Order.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error while fetching orders' }); // PROMENA: Prevedeno
    }
};

// @desc      Get single order details
// @route     GET /api/v1/orders/:id
// @access    Admin/Private
exports.getSingleOrder = async (req, res, next) => {
    try {
        // Koristimo populate da prikažemo sliku (image) i kategoriju proizvoda 
        // Polja 'name' i 'price' su već sačuvana u orderItems, pa ih ne moramo dohvatati
        const order = await Order.findById(req.params.id)
            .populate({
                path: 'orderItems.product', 
                select: 'image category', // Dodajemo samo polja koja nismo sačuvali u Order modelu
            }); 
            
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.' 
            });
        }

        res.status(200).json({
            success: true,
            data: order,
        });

    } catch (error) {
        // Vraćamo detaljnu grešku serveru ako je 500
        console.error("Error in getSingleOrder:", error); 
        res.status(500).json({
            success: false,
            message: 'Error fetching order details.', 
            error: error.message
        });
    }
};

// @desc      Update order status (Admin)
// @route     PUT /api/v1/orders/:id
// @access    Admin/Private
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.' // PROMENA: Prevedeno
            });
        }

        // Check if the status is valid
        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        const newStatus = req.body.orderStatus;

        if (!validStatuses.includes(newStatus)) {
             return res.status(400).json({
                success: false,
                message: 'Invalid order status provided.' // PROMENA: Prevedeno
            });
        }

        // Update orderStatus
        order.orderStatus = newStatus;

        // If status changes to "Delivered", record the date
        if (newStatus === 'Delivered' && !order.deliveredAt) {
            order.deliveredAt = Date.now();
        }

        // Using findByIdAndUpdate is cleaner for simple status updates, 
        // but order.save is fine if you need pre/post save hooks.
        await order.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: order,
            message: `Order status updated to: ${newStatus}` // PROMENA: Prevedeno
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status.', // PROMENA: Prevedeno
            error: error.message
        });
    }
};
exports.deleteOrder = async (req, res, next) => {
    try {
        // 💡 ISPRAVKA: Koristimo findByIdAndDelete() za efikasnost
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            // Ako findByIdAndDelete vrati null, narudžbina nije pronađena
            return res.status(404).json({
                success: false,
                message: 'Order not found.'
            });
        }
        
        // Narudžbina je već obrisana u prethodnom koraku

        res.status(200).json({
            success: true,
            message: 'Order successfully deleted.'
        });

    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting order.',
            error: error.message
        });
    }
};
exports.getMyOrders = async (req, res) => {
    try {
        
        // 🛑 KLJUČNO: Filtriramo narudžbine po user polju.
        // Ovo radi samo AKO ste dodali 'user' polje u Order Model (kao što smo dogovorili)
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            // Opciono: Popunite da biste dobili dodatne detalje
            .populate({
                path: 'orderItems.product',
                select: 'name image category'
            }); 
            
        res.status(200).json({
            success: true,
            results: orders.length,
            data: orders
        });
    } catch (error) {
        // Logujemo grešku na serveru da bismo znali pravi uzrok 500
        console.error("ERROR IN getMyOrders:", error); 
        res.status(500).json({ 
            success: false, 
            error: 'Server error while fetching my orders.',
            details: error.message
        });
    }
};