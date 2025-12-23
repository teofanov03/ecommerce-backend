import mongoose, { Schema, Document, Model, type CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Interfejs za adresu (pod-dokument)
interface IAddress {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    street: string;
    city: string;
    zip: string;
}

// 2. Interfejs za Korisnika (Document)
// Ovde definišemo šta sve jedan User objekat ima
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    shippingAddresses: IAddress[];
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema({
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
        select: false,
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    shippingAddresses: [
        {
            name: { type: String, trim: true },
            street: { type: String, required: true },
            city: { type: String, required: true },
            zip: { type: String, required: true },
        },
    ]
}, { timestamps: true });

// -----------------------------------------------------------
// PRE-SAVE HOOK: Heširanje lozinke
// -----------------------------------------------------------
userSchema.pre<IUser>("save", async function () {
    // 1. Ako password nije menjan, samo završi
    if (!this.isModified("password")) {
        return;
    }

    try {
        // 2. Hashuj password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
    } catch (error: any) {
        // U asinhronim hook-ovima, bacanje greške je isto što i next(error)
        throw error;
    }
});

// -----------------------------------------------------------
// METODA: Upoređivanje lozinke
// -----------------------------------------------------------
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;