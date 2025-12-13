// utils/generateToken.js
const jwt = require('jsonwebtoken');

// Ova funkcija generiše JWT
const generateToken = (id) => {
    // Koristimo .env varijablu za tajni ključ
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Trajanje tokena
    });
};

module.exports = generateToken;