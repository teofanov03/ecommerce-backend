// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Molimo unesite ime'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Molimo unesite email'],
        unique: true,
        match: [/.+@.+\..+/, 'Molimo unesite validan email']
    },
    password: {
        type: String,
        required: [true, 'Molimo unesite lozinku'],
        minlength: [6, 'Lozinka mora imati najmanje 6 karaktera'],
        select: false, // Ne vraća lozinku pri dohvaćanju korisnika
    },
    role: {
        type: String,
        default: 'user', // Podrazumevana uloga je 'user'
        enum: ['user', 'admin'] // Moguće uloge
    },
    shippingAddresses: [
    {
        name: { type: String, trim: true }, // Npr. "Home"
        street: { type: String, required: true },
        city: { type: String, required: true },
        zip: { type: String, required: true },
        // Mongoose automatski kreira _id za svaki dokument u nizu
    },]
}, { timestamps: true });

// -----------------------------------------------------------
// 1. PRE-SAVE HOOK: Heširanje lozinke pre snimanja
// -----------------------------------------------------------
userSchema.pre("save", async function () {
    // Ako password nije menjan ili ne postoji — preskoči
    if (!this.isModified("password") || !this.password) {
        return;
    }

    // Osiguraj da je password string
    if (typeof this.password !== "string") {
        throw new Error("Password must be a string");
    }

    // Hashuj password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// -----------------------------------------------------------
// 2. METODA: Upoređivanje lozinke (za Login)
// -----------------------------------------------------------
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Uporedi unesenu lozinku sa heširanom lozinkom u bazi
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);