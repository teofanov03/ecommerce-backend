// server.js - Ažuriranje

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); 
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRouter = require('./routes/userRoutes');
const cloudinary = require('cloudinary'); // Uvoz ruta
const cors = require('cors');


dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
connectDB(); 

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Dozvolite samo Frontend-u pristup
    credentials: true, // Dozvolite slanje cookies-a/credentials (biće bitno za Admin Login)
}));
app.use(express.json()); // Middleware za JSON body

// ---------------------------------
// PRIKLJUČIVANJE RUTA
// Koristićemo v1 (version 1) za API, što je dobra praksa
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