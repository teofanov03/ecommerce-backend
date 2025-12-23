import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; 
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRouter from './routes/userRoutes.js';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

dotenv.config();

// Povezivanje sa bazom
connectDB(); 

// Cloudinary konfiguracija
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const app = express();

// CORS konfiguracija
const allowedOrigins = [
    'http://localhost:5173',
    'https://ecommerce-frontend-jnlf.vercel.app',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());

// RUTIRANJE
app.use('/api/v1/products', productRoutes); 
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('API is running with TypeScript...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});