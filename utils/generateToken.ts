import jwt from 'jsonwebtoken';

// Definišemo funkciju sa tipom parametra
const generateToken = (id: string | any): string => {
    // Koristimo "as string" jer TS brine da bi tajna mogla biti undefined
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: '7d',
    });
};

export default generateToken;