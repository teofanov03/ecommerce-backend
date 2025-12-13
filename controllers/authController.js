const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // Pretpostavljamo da ova funkcija vraća samo JWT
const jwt = require('jsonwebtoken'); // Potrebno za dekodiranje i protect middleware

// --------------------------------------------------------------------------------
// HELPER FUNKCIJE
// --------------------------------------------------------------------------------

// Helper za filtriranje objekata (sprečava korisnike da šalju npr. role: 'admin')
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// Funkcija za slanje responsa sa tokenom i korisničkim podacima
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);
    
    // Opciono: Ako koristite cookies, podesite ih ovde
    // res.cookie('jwt', token, { ... });

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

// @desc   Provera i zaštita rute (Middleware)
// @access  Private
exports.protect = async (req, res, next) => {
    let token;
    
    // 1) Dohvat tokena
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }

    try {
        // 2) Verifikacija tokena
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // 3) Provera da li korisnik postoji
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({ success: false, error: 'The user belonging to this token no longer exists.' });
        }

        // 4) Grantovanje pristupa
        req.user = currentUser;
        next();
    } catch (err) {
        console.error("JWT VERIFICATION FAILED:", err.name, err.message);
        return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
};


// --------------------------------------------------------------------------------
// KONTROLERI
// --------------------------------------------------------------------------------

// @desc    Registracija novog korisnika (Kupac)
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, error: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'user', // 🛑 KLJUČNO: Fiksiramo ulogu na 'user'
        });

        if (user) {
            sendTokenResponse(user, 201, res);
        } else {
            res.status(400).json({ success: false, error: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
};


// @desc    Prijava korisnika (Login)
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Provera emaila i lozinke
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // 2. Slanje responsa sa tokenom
        sendTokenResponse(user, 200, res);

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
};

// @desc    Ažuriranje korisničkih detalja (Name, Email)
// @route   PATCH /api/v1/auth/update-details
// @access  Private
exports.updateDetails = async (req, res) => {
    try {
        // Sprečite korisnika da šalje polja koja ne bi trebalo da menja (npr. 'role')
        const filteredBody = filterObj(req.body, 'name', 'email'); 

        const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
            new: true, // Vraća novi dokument
            runValidators: true // Pokreće validatore
        }).select('-password'); // Ne vraćajte lozinku

        if (!updatedUser) {
             return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Vratite ažurirane podatke (možda se email promenio)
        sendTokenResponse(updatedUser, 200, res);

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error during details update' });
    }
};

// @desc    Ažuriranje lozinke
// @route   PATCH /api/v1/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        console.log('🔐 Password update request received');
        console.log('👤 User ID:', req.user._id);
        
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'Current password, new password, and confirmation are required.' 
            });
        }
        
        // 1. Dohvatite korisnika i SELECTUJTE lozinku
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log('✅ User found, checking current password...');
        
        // 2. Proverite da li je stara lozinka tačna (koristeći matchPassword iz User modela)
        const isPasswordCorrect = await user.matchPassword(currentPassword);
        console.log('🔍 Password match result:', isPasswordCorrect);
        
        if (!isPasswordCorrect) {
            return res.status(401).json({ 
                success: false, 
                error: 'Your current password is wrong.' 
            });
        }
        
        // 3. Proverite da li se nova lozinka i potvrda podudaraju
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'New passwords do not match.' 
            });
        }

        // 4. Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: 'New password must be at least 6 characters long.' 
            });
        }

        console.log('✅ Password validation passed, updating password...');

        // 5. Ažurirajte i sačuvajte novu lozinku (Model hook će hasho-vati pre save)
        user.password = newPassword;
        await user.save();

        console.log('✅ Password updated successfully');

        // 6. Pošaljite novi token
        sendTokenResponse(user, 200, res);

    } catch (error) {
        console.error('❌ Password update error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        const errorMessage = error.message || 'Server error during password update';
        res.status(500).json({ 
            success: false, 
            error: errorMessage 
        });
    }
};
exports.optionalProtect = async (req, res, next) => {
    let token;
    
    // 1) Dohvat tokena
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // 🛑 KLJUČNA RAZLIKA: Ako token NE POSTOJI, samo idemo dalje!
    if (!token) {
        return next(); 
    }

    try {
        // 2) Verifikacija tokena
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // 3) Provera da li korisnik postoji
        const currentUser = await User.findById(decoded.id);

        if (currentUser) {
            // Ako korisnik postoji, postavimo ga na req.user
            req.user = currentUser;
        }
        // 4) Uvek nastavljamo, čak i ako verifikacija nije uspela ili token nije poslat.
        next();
        
    } catch (err) {
        // 🛑 Ako token postoji, ali je NEVAŽEĆI/ISTEKAO: 
        // Logujemo grešku, ali I DALJE nastavljamo dalje
        console.warn("Optional Auth Warning: Invalid or Expired Token provided.", err.message);
        next(); 
    }
};