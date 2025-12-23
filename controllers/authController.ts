import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { type IUser } from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Helper za filtriranje objekata
const filterObj = (obj: any, ...allowedFields: string[]) => {
    const newObj: any = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// Funkcija za slanje responsa sa tokenom
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
    const token = generateToken(user._id.toString());

    res.status(statusCode).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
        },
    });
};

// --------------------------------------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------------------------------------

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string }; 
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({ success: false, error: 'User no longer exists.' });
        }

        req.user = currentUser;
        next();
    } catch (err: any) {
        return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
};

// --------------------------------------------------------------------------------
// KONTROLERI
// --------------------------------------------------------------------------------

export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'user',
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
};

export const updateDetails = async (req: Request, res: Response) => {
    try {
        const filteredBody = filterObj(req.body, 'name', 'email'); 

        const updatedUser = await User.findByIdAndUpdate(req.user?._id, filteredBody, {
            new: true,
            runValidators: true 
        }).select('-password');

        if (!updatedUser) {
             return res.status(404).json({ success: false, error: 'User not found' });
        }

        sendTokenResponse(updatedUser, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error update' });
    }
};

export const updatePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, error: 'All fields are required.' });
        }
        
        const user = await User.findById(req.user?._id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const isPasswordCorrect = await user.matchPassword(currentPassword);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, error: 'Current password is wrong.' });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'New passwords do not match.' });
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) return next(); 

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string }; 
        const currentUser = await User.findById(decoded.id);
        if (currentUser) req.user = currentUser;
        next();
    } catch (err) {
        next(); 
    }
};