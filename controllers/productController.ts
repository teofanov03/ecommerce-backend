import { type Request, type Response, type NextFunction } from 'express';
import Product from '../models/Product';
import { v2 as cloudinary } from 'cloudinary';

// Definisanje interfejsa za Query parametre (da TS zna za page, limit, category...)
interface ProductQuery {
    page?: string;
    limit?: string;
    category?: string;
    sort?: string;
    [key: string]: any; // Za price filters poput price[gte]
}

// @desc    Dohvati sve proizvode sa paginacijom i filterima
export const getProducts = async (req: Request<{}, {}, {}, ProductQuery>, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1; 
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit; 

        let filter: any = {}; 
        
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category; 
        }

        let priceFilter: any = {};
        if (req.query['price[gte]']) priceFilter.$gte = req.query['price[gte]'];
        if (req.query['price[lte]']) priceFilter.$lte = req.query['price[lte]'];
        
        if (Object.keys(priceFilter).length > 0) {
            filter.price = priceFilter;
        }

        let sortCriteria: any = { createdAt: -1 }; 
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price_asc': sortCriteria = { price: 1 }; break;
                case 'price_desc': sortCriteria = { price: -1 }; break;
                default: sortCriteria = { createdAt: -1 }; break;
            }
        }
        
        const totalCount = await Product.countDocuments(filter);
        const products = await Product.find(filter)
                                    .sort(sortCriteria)
                                    .skip(skip)
                                    .limit(limit);
                                        
        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            success: true,
            count: products.length,
            totalCount,
            totalPages,
            currentPage: page,
            data: products,
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            error: 'Server error: Could not fetch products.'
        });
    }
};

// @desc    Dohvati jedan proizvod
export const getSingleProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Proizvod nije pronađen' });
        }
        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: 'Neispravan ID format' });
        }
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Kreiraj proizvod sa Cloudinary uploadom
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let productData = req.body;
        
        if (productData.image) {
            const result = await cloudinary.uploader.upload(productData.image, {
                folder: 'novashop_products',
                resource_type: 'auto'
            });
            productData.image = result.secure_url;
            productData.cloudinary_id = result.public_id;
        }

        const product = await Product.create(productData);
        res.status(201).json({
            success: true,
            data: product,
            message: "Product created successfully."
        });
    } catch (error) {
        console.error("Product creation failed:", error);
        res.status(500).json({ success: false, error: 'Failed to create product.' });
    }
};

// @desc    Obriši proizvod
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Proizvod nije pronađen' });
        }
        await product.deleteOne(); 
        res.status(200).json({ success: true, message: 'Proizvod uspešno obrisan' });
    } catch (error: any) {
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: 'Neispravan ID format' });
        }
        res.status(500).json({ success: false, error: 'Greška servera' });
    }
};

// @desc    Ažuriraj proizvod
export const updateProduct = async (req: Request, res: Response) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Proizvod nije pronađen' });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: product,
            message: "Proizvod uspešno ažuriran"
        });
    } catch (error: any) {
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: 'Neispravan ID format' });
        }
        res.status(500).json({ success: false, error: 'Greška servera' });
    }
};