// server.js - ISPRAVLJENO AŽURIRANJE

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); 
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRouter = require('./routes/userRoutes');
const cloudinary = require('cloudinary'); // Uvoz ruta
const cors = require('cors');

// 🛑 ISPRAVKA 1: Lista dozvoljenih domena mora imati navodnike na svakom elementu
const allowedOrigins = [
    'http://localhost:5173', // Lokalni domen (SADA POD NAVODNICIMA)
    'https://ecommerce-frontend-jnlf.vercel.app', // 🛑 PRODUKCIONI DOMEN
];

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
connectDB(); 

const app = express();
app.use(express.json()); // Middleware za JSON body

// 🛑 ISPRAVKA 2: Korišćenje ispravne CORS konfiguracije sa listom dozvoljenih domena
app.use(cors({
    origin: (origin, callback) => {
        // Omogućite zahteve bez 'origin' (npr. mobilne aplikacije, curl)
        // I proverite da li je domen na listi dozvoljenih
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Dozvolite slanje cookies-a/credentials (biće bitno za Login)
}));

// ---------------------------------
// PRIKLJUČIVANJE RUTA
// Koristićemo v1 (version 1) za API
app.use('/api/v1/products', productRoutes); 
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/auth', authRoutes);

// ---------------------------------

// Osnovna ruta za testiranje
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));