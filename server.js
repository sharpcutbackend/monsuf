// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup static directories
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.static(PUBLIC_DIR));

// Configure multer for success story image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'story-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Initialize database
db.initialize();

// --- API ROUTES ---

// Get all success stories
app.get('/api/stories', (req, res) => {
    try {
        const stories = db.getStories();
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve success stories." });
    }
});

// Create a new success story (Admin authorization check)
app.post('/api/stories', upload.single('image'), (req, res) => {
    try {
        const { title, category, description, passcode } = req.body;

        // Admin or Staff authorization check
        const auth = req.headers.authorization;
        const isAuthorized = auth && (auth.startsWith('Bearer admin-') || auth.startsWith('Bearer staff-'));
        if (!isAuthorized && passcode !== 'admin123') {
            // Delete uploaded file if unauthorized
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({ error: "Unauthorized. Valid credentials required." });
        }

        if (!title || !category || !description) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: "Title, category, and description are required." });
        }

        let imageUrl = '/images/placeholder.jpg';
        if (req.file) {
            imageUrl = '/uploads/' + req.file.filename;
        }

        const newStory = db.addStory({
            title,
            category,
            description,
            imageUrl
        });

        res.status(201).json({
            success: true,
            story: newStory,
            message: "Success story published successfully!"
        });
    } catch (error) {
        console.error("Error creating story:", error);
        res.status(500).json({ error: "Failed to create success story." });
    }
});

// --- OFFLINE/VOLUNTEER DATA STORAGE ---
const VOLUNTEERS_FILE = path.join(PUBLIC_DIR, '..', 'data', 'volunteers.json');
function getVolunteers() {
    try {
        if (!fs.existsSync(VOLUNTEERS_FILE)) {
            fs.writeFileSync(VOLUNTEERS_FILE, JSON.stringify([], null, 2), 'utf8');
        }
        return JSON.parse(fs.readFileSync(VOLUNTEERS_FILE, 'utf8'));
    } catch (error) {
        return [];
    }
}
function saveVolunteer(volunteer) {
    const list = getVolunteers();
    list.unshift({
        id: 'vol-' + Date.now(),
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        date: new Date().toISOString()
    });
    fs.writeFileSync(VOLUNTEERS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// Authentication Helpers
function verifyAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer admin-')) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized. Admin privileges required." });
    }
}

function verifyStaffOrAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (auth && (auth.startsWith('Bearer staff-') || auth.startsWith('Bearer admin-'))) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized. Access denied." });
    }
}

// --- AUTH REST APIs ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }
    
    // Support default credential checks
    if (username === 'admin' && password === 'admin123') {
        return res.json({
            token: 'admin-token-admin-' + Date.now(),
            user: { username: 'admin', role: 'admin', name: 'Head Administrator' }
        });
    }

    const users = db.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = `${user.role}-token-${user.username}-${Date.now()}`;
    res.json({
        token,
        user: { username: user.username, role: user.role, name: user.name }
    });
});

app.post('/api/auth/register-staff', verifyAdmin, (req, res) => {
    const { username, password, name } = req.body;
    if (!username || !password || !name) {
        return res.status(400).json({ error: "Username, password, and name are required." });
    }
    try {
        const newUser = db.addStaffUser(username, password, name);
        res.status(201).json({ success: true, user: { username: newUser.username, name: newUser.name, role: newUser.role } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/auth/users', verifyAdmin, (req, res) => {
    const users = db.getUsers();
    res.json(users.map(u => ({ username: u.username, name: u.name, role: u.role })));
});

app.get('/api/donations', verifyAdmin, (req, res) => {
    try {
        const donations = db.getDonations();
        res.json(donations);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve ledger." });
    }
});

// --- SETTINGS REST APIs ---
app.get('/api/settings', (req, res) => {
    const settings = db.getSettings();
    res.json(settings);
});

app.post('/api/settings', verifyAdmin, (req, res) => {
    try {
        const settings = db.saveSettings(req.body);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to save settings." });
    }
});

// --- SECURITY & ALERTS REST APIs ---
app.get('/api/security/alerts', verifyAdmin, (req, res) => {
    const alerts = db.getAlerts();
    res.json(alerts);
});

app.post('/api/security/resolve-alert', verifyAdmin, (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Alert ID is required." });
    }
    const alert = db.resolveAlert(id);
    if (!alert) {
        return res.status(404).json({ error: "Alert not found." });
    }
    res.json(alert);
});

// --- VOLUNTEERS REST APIs ---
app.post('/api/volunteers', (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: "Name, email, and phone are required." });
    }
    saveVolunteer({ name, email, phone });
    res.status(200).json({ success: true, message: "Volunteer signup recorded successfully." });
});

app.get('/api/volunteers', verifyStaffOrAdmin, (req, res) => {
    const list = getVolunteers();
    res.json(list);
});

// Perform mock/simulated donation payment with Fraud Check Filters
app.post('/api/donate', (req, res) => {
    try {
        const { name, email, amount, paymentMethod, cardNumber, expiryDate, cvv, bankReference, pledgePhone } = req.body;

        // Backend Validations
        if (!name || !email || !amount || !paymentMethod) {
            return res.status(400).json({ error: "Name, email, amount, and payment method are required." });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Donation amount must be a positive number." });
        }

        let isSuspicious = false;
        let fraudReasons = [];
        let donationStatus = "Settled";

        // 1. Velocity Checking (velocity limit)
        const donations = db.getDonations();
        const nowTime = Date.now();
        const recentDonations = donations.filter(d => d.email === email && (nowTime - new Date(d.date).getTime()) < 5 * 60 * 1000);
        if (recentDonations.length >= 3) {
            isSuspicious = true;
            fraudReasons.push("Velocity violation");
            db.addAlert("Velocity Check", `Email ${email} triggered velocity card-testing limits with multiple submissions.`, { email, count: recentDonations.length + 1 });
        }

        // 2. Anomalous Amount Check (thresholds in NGN)
        if (parsedAmount < 100) {
            isSuspicious = true;
            fraudReasons.push("Anomalous low value");
            db.addAlert("Card Testing", `Suspected micro card testing: low-value donation (₦${parsedAmount}) by ${email}.`, { email, amount: parsedAmount });
        } else if (parsedAmount > 10000000) {
            isSuspicious = true;
            fraudReasons.push("Anomalous high value");
            db.addAlert("Suspicious Amount", `Abnormal transaction size: high-value donation (₦${parsedAmount}) by ${email}.`, { email, amount: parsedAmount });
        }

        // 3. Disposable/Temporary Email Check
        const disposableDomains = ['mailinator.com', 'tempmail.com', 'yopmail.com', 'dispostable.com', 'guerrillamail.com', '10minutemail.com'];
        const emailDomain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
        if (disposableDomains.includes(emailDomain)) {
            isSuspicious = true;
            fraudReasons.push("Disposable email domain");
            db.addAlert("Fake Email Registration", `Suspected fake account registration: temporary email domain (${emailDomain}) from ${email}.`, { email });
        }

        // 4. Duplicate Bank Transfer Reference Check
        if (paymentMethod === 'Bank Transfer') {
            donationStatus = "Pending Verification";
            if (!bankReference || bankReference.trim().length === 0) {
                return res.status(400).json({ error: "Bank transaction reference number is required." });
            }
            const cleanRef = bankReference.trim();
            const duplicateRef = donations.find(d => d.bankReference && d.bankReference.trim().toLowerCase() === cleanRef.toLowerCase());
            if (duplicateRef) {
                isSuspicious = true;
                fraudReasons.push("Duplicate reference ID");
                db.addAlert("Duplicate Reference", `Double-spend / duplicate reference (${cleanRef}) submitted by ${email}.`, { email, bankReference: cleanRef });
            }
        } else if (paymentMethod === 'Cash') {
            donationStatus = "Pledge";
            if (!pledgePhone || pledgePhone.trim().length === 0) {
                return res.status(400).json({ error: "Phone number is required for cash pickup arrangements." });
            }
        } else if (paymentMethod === 'Card') {
            // Online credit card check
            if (!cardNumber || !expiryDate || !cvv) {
                return res.status(400).json({ error: "Payment card details are incomplete." });
            }

            const cleanCardNumber = cardNumber.replace(/\s+/g, '');
            if (!/^\d{16}$/.test(cleanCardNumber)) {
                return res.status(400).json({ error: "Invalid credit card number length. Must be 16 digits." });
            }

            // Luhn Algorithm Card Check
            let sum = 0;
            let shouldDouble = false;
            for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
                let digit = parseInt(cleanCardNumber.charAt(i));
                if (shouldDouble) {
                    digit *= 2;
                    if (digit > 9) digit -= 9;
                }
                sum += digit;
                shouldDouble = !shouldDouble;
            }
            
            const isLuhnValid = (sum % 10 === 0);
            
            // Mock fail condition: ends in '0000'
            if (cleanCardNumber.endsWith('0000')) {
                return res.status(402).json({ error: "Payment declined by issuing bank (Simulated Error). Please use a different card." });
            }

            if (!isLuhnValid) {
                return res.status(400).json({ error: "Invalid card number structure (Luhn validation failed)." });
            }

            // Validate Expiry (MM/YY)
            const expiryParts = expiryDate.split('/');
            if (expiryParts.length !== 2) {
                return res.status(400).json({ error: "Invalid expiry date format. Use MM/YY." });
            }
            const month = parseInt(expiryParts[0], 10);
            const year = parseInt('20' + expiryParts[1], 10);
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            if (month < 1 || month > 12) {
                return res.status(400).json({ error: "Invalid expiry month." });
            }
            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                return res.status(400).json({ error: "Card has expired." });
            }

            // Validate CVV
            if (!/^\d{3,4}$/.test(cvv)) {
                return res.status(400).json({ error: "Invalid CVV. Must be 3 or 4 digits." });
            }
        } else {
            return res.status(400).json({ error: "Unsupported payment method." });
        }

        // Apply flagged status if suspicious
        if (isSuspicious) {
            donationStatus = "Flagged - " + fraudReasons.join(', ');
        }

        const transactionId = paymentMethod === 'Card'
            ? 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase() + '-' + Date.now().toString().substr(-4)
            : null;

        const newDonation = db.addDonation({
            name,
            email,
            amount: parsedAmount,
            paymentMethod,
            transactionId,
            bankReference: paymentMethod === 'Bank Transfer' ? bankReference.trim() : null,
            pledgePhone: paymentMethod === 'Cash' ? pledgePhone.trim() : null,
            status: donationStatus
        });

        res.status(200).json({
            success: true,
            donation: newDonation,
            receipt: {
                transactionId: newDonation.transactionId || 'OFFLINE-' + newDonation.id.substr(-6).toUpperCase(),
                amount: newDonation.amount,
                donorName: newDonation.name,
                donorEmail: newDonation.email,
                date: newDonation.date,
                status: newDonation.status
            },
            message: isSuspicious 
                ? "Donation logged. The transaction is held for manual security clearance."
                : "Thank you! Your donation was processed securely and successfully."
        });
    } catch (error) {
        console.error("Donation processing error:", error);
        res.status(500).json({ error: "Failed to process donation payment." });
    }
});

// Get foundation metrics and stats
app.get('/api/stats', (req, res) => {
    try {
        const donations = db.getDonations();
        const stories = db.getStories();
        
        // Sum only settled or pending verification, skip flagged fraud / pledges
        const validDonations = donations.filter(d => !d.status.startsWith('Flagged'));
        const totalUserDonationAmount = validDonations.reduce((sum, d) => sum + d.amount, 0);
        const baseDonationAmount = 37500000; // ₦37.5M baseline (NGN)
        const totalRaised = baseDonationAmount + totalUserDonationAmount;
        
        const totalDonors = 47 + validDonations.length;
        const totalStories = stories.length;

        res.json({
            totalRaised,
            totalDonors,
            totalStories,
            recentDonations: validDonations.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch metrics." });
    }
});

// Clean URL page routing
app.get('/about', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'about.html'));
});

app.get('/board', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'board.html'));
});

app.get('/stories', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'stories.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'contact.html'));
});

app.get('/donate', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'donate.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// /staff is a clean alias for the admin portal
app.get('/staff', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// Fallback to index.html for landing page routing
app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(500).json({ error: err.message });
    }
    next();
});

// Start Server
app.listen(PORT, () => {
    console.log(`MONSUF website backend server is running on http://localhost:${PORT}`);
});
