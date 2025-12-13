// controllers/productController.js
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
// @desc    Dohvati sve proizvode
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        
        // ====================================================
        // 💡 1. DEFINISANJE PAGINACIJE (NOVO)
        // ====================================================
        // Određujemo trenutnu stranicu (podrazumevano 1)
        const page = parseInt(req.query.page) || 1; 
        
        // Određujemo limit proizvoda po stranici (npr. 12, podrazumevano 10)
        const limit = parseInt(req.query.limit) || 10;
        
        // Izračunavamo koliko dokumenata treba preskočiti
        const skip = (page - 1) * limit; 

        // ----------------------------------------------------
        // LOGIKA ZA FILTRIRANJE (Isto kao Vaša)
        // ----------------------------------------------------
        
        let filter = {}; 
        
        // A. Filter po Kategoriji
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category; 
        }

        // B. Filter po Ceni (Price Range)
        let priceFilter = {};
        if (req.query['price[gte]']) {
            priceFilter.$gte = req.query['price[gte]'];
        }
        if (req.query['price[lte]']) {
            priceFilter.$lte = req.query['price[lte]'];
        }
        if (Object.keys(priceFilter).length > 0) {
            filter.price = priceFilter;
        }

        // C. Sortiranje (Isto kao Vaše)
        let sortCriteria = { createdAt: -1 }; 
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price_asc':
                    sortCriteria = { price: 1 };
                    break;
                case 'price_desc':
                    sortCriteria = { price: -1 };
                    break;
                case 'latest':
                default:
                    sortCriteria = { createdAt: -1 };
                    break;
            }
        }
        
        // ====================================================
        // 💡 2. IZVRŠENJE KVERIJA I UKUPAN BROJ (KLJUČNO)
        // ====================================================

        // Dohvatamo UKUPAN broj proizvoda koji zadovoljavaju filtere (pre paginacije)
        const totalCount = await Product.countDocuments(filter);
        
        // Dohvatamo proizvode, primenjujući filtere, sortiranje, SKIP i LIMIT
        const products = await Product.find(filter)
                                        .sort(sortCriteria)
                                        .skip(skip) // Preskače proizvode za prethodne stranice
                                        .limit(limit); // Ograničava broj proizvoda po stranici
                                        
        // Izračunavamo ukupan broj stranica
        const totalPages = Math.ceil(totalCount / limit);

        // ====================================================
        // 💡 3. SLANJE ODGOVORA (SA PODACIMA O PAGINACIJI)
        // ====================================================
        res.status(200).json({
            success: true,
            count: products.length,
            totalCount: totalCount, // Ukupan broj svih filtriranih proizvoda
            totalPages: totalPages, // Ukupan broj stranica
            currentPage: page,      // Trenutna stranica
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
exports.getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Proizvod nije pronađen' });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        // Ako je ID u pogrešnom formatu (npr. ne 24 hex karaktera)
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: 'Neispravan ID format' });
        }
        res.status(500).json({ success: false, error: 'Server error while fetching product' });
    }
};
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Proizvod nije pronađen' });
        }

        // Koristimo .deleteOne() jer je to preporučeni način za novije Mongoose verzije
        await product.deleteOne(); 

        res.status(200).json({
            success: true,
            message: 'Proizvod uspešno obrisan'
        });

    } catch (error) {
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: 'Neispravan ID format' });
        }
        res.status(500).json({ success: false, error: 'Greška servera pri brisanju' });
    }
};
exports.createProduct = async (req, res, next) => {
    try {
        let productData = req.body;
        
        // 1. PROVERA I UPLOAD SLIKE
        if (productData.image) {
            // Pretpostavljamo da productData.image sadrži Base64 string
            const result = await cloudinary.uploader.upload(productData.image, {
                folder: 'novashop_products', // Folder na Cloudinary-u
                resource_type: 'auto' // Automatski detektuj tip resursa
            });

            // 2. ČUVANJE SAMO JAVNOG URL-a i ID-a u bazi
            productData.image = result.secure_url;
            productData.cloudinary_id = result.public_id; // Opciono, za kasnije brisanje
        }

        // 3. KREIRANJE PROIZVODA
        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            data: product,
            message: "Product created and image uploaded successfully."
        });

    } catch (error) {
        console.error("Product creation failed:", error);
        // Vraćanje generičke greške
        res.status(500).json({ 
            success: false, 
            error: 'Server error: Failed to create product or upload image.' 
        });
    }
};

// ------------------------------------------------------------------
// NOVO: Ažuriraj postojeci proizvod
// @desc    Ažuriraj proizvod
// @route   PUT /api/v1/products/:id
// @access  Private/Admin (privremeno bez autorizacije)
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Proizvod nije pronađen za ažuriranje' });
        }

        // Koristi findByIdAndUpdate, ali ga podesi da vrati ažurirani dokument
        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Vrati novi dokument nakon ažuriranja
            runValidators: true, // Pokreni validatore šeme
        });

        res.status(200).json({
            success: true,
            data: product,
            message: "Proizvod uspešno ažuriran"
        });

    } catch (error) {
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: 'Neispravan ID format' });
        }
        res.status(500).json({ success: false, error: 'Greška servera pri ažuriranju proizvoda' });
    }
};