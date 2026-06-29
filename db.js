// db.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const DONATIONS_FILE = path.join(DATA_DIR, 'donations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// Helper to ensure data files exist
function initialize() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Initialize stories.json with seed data if it doesn't exist
    if (!fs.existsSync(STORIES_FILE)) {
        const seedStories = [
            {
                id: "seed-1",
                title: "Sarah's Journey to Recovery",
                category: "Patients Supported",
                description: "Sarah, a young mother of two, was diagnosed with osteosarcoma. Thanks to the prompt support of MONSUF and LAMON, she underwent limb-salvage surgery and chemotherapy. Today, she is cancer-free and walking again.",
                imageUrl: "/images/story_sarah.jpg",
                date: "2026-03-15"
            },
            {
                id: "seed-2",
                title: "Funding Sarcoma Research 2026",
                category: "Research Projects",
                description: "MONSUF funded a research grant at the Lagos Musculoskeletal Oncology Network to study early diagnostic markers for soft tissue sarcomas. The study aims to improve early detection and diagnosis.",
                imageUrl: "/images/story_research.jpg",
                date: "2026-05-10"
            },
            {
                id: "seed-3",
                title: "Sponsoring Orthopedic Residency Training",
                category: "Medical Training",
                description: "We successfully sponsored the LAMON training seminar for 50 orthopedic surgeons and oncology residents, teaching modern limb-salvage surgery techniques for musculoskeletal tumors.",
                imageUrl: "/images/story_seminar.jpg",
                date: "2026-06-01"
            },
            {
                id: "seed-4",
                title: "2026 School Cancer Awareness Program",
                category: "Patients Supported",
                description: "MONSUF partnered with schools across Lagos State to deliver the 2026 School Cancer Awareness Program — educating students, teachers, and parents on early signs of musculoskeletal tumours, encouraging early referral and prompt medical consultation for better outcomes.",
                imageUrl: "/images/story_awareness.jpg",
                date: "2026-04-22"
            }
        ];
        fs.writeFileSync(STORIES_FILE, JSON.stringify(seedStories, null, 2), 'utf8');
    }

    // Initialize donations.json if it doesn't exist
    if (!fs.existsSync(DONATIONS_FILE)) {
        fs.writeFileSync(DONATIONS_FILE, JSON.stringify([], null, 2), 'utf8');
    }

    // Initialize users.json if it doesn't exist
    if (!fs.existsSync(USERS_FILE)) {
        const seedUsers = [
            {
                username: "admin",
                password: "admin123",
                role: "admin",
                name: "Head Administrator"
            }
        ];
        fs.writeFileSync(USERS_FILE, JSON.stringify(seedUsers, null, 2), 'utf8');
    }

    // Initialize settings.json if it doesn't exist
    if (!fs.existsSync(SETTINGS_FILE)) {
        const seedSettings = {
            bankTransfer: {
                enabled: true,
                bankName: "Guaranty Trust Bank (GTBank)",
                accountNumber: "0123456789",
                accountName: "MONSUF - Musculoskeletal Oncology Support Foundation"
            },
            cash: {
                enabled: true,
                instructions: "Cash donations can be dropped off directly at our Magodo head office or picked up by an official coordinator. Please contact +234-802-493-8222 to schedule."
            },
            onlinePayment: {
                enabled: true,
                activeGateway: "stripe",
                publicKey: "pk_test_mock51PjH43JS"
            }
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(seedSettings, null, 2), 'utf8');
    }

    // Initialize alerts.json if it doesn't exist
    if (!fs.existsSync(ALERTS_FILE)) {
        fs.writeFileSync(ALERTS_FILE, JSON.stringify([], null, 2), 'utf8');
    }

    // Initialize events.json if it doesn't exist
    if (!fs.existsSync(EVENTS_FILE)) {
        const seedEvents = [
            {
                id: "seed-event-1",
                name: "Sarcoma Awareness Seminar 2026",
                date: "2026-07-15",
                type: "upcoming",
                description: "Join our clinical team and LAMON specialists at LUTH for an informative seminar on early sarcoma identification, diagnostic pathways, and patient support networks.",
                imageUrl: "/images/story_seminar.jpg",
                status: "active"
            },
            {
                id: "seed-event-2",
                name: "LAMON Orthopedic Training Day 2025",
                date: "2025-11-20",
                type: "past",
                description: "A successful intensive training day for orthopedic oncologists and residents, demonstrating advanced limb-salvage surgery techniques for bone tumors.",
                imageUrl: "/images/story_research.jpg",
                status: "active"
            }
        ];
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(seedEvents, null, 2), 'utf8');
    }
}

// Read success stories
function getStories() {
    initialize();
    try {
        const data = fs.readFileSync(STORIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading stories database:", error);
        return [];
    }
}

// Add a success story
function addStory(story) {
    initialize();
    try {
        const stories = getStories();
        const newStory = {
            id: Date.now().toString(),
            title: story.title,
            category: story.category,
            description: story.description,
            imageUrl: story.imageUrl || '/images/placeholder.jpg',
            date: new Date().toISOString().split('T')[0]
        };
        stories.unshift(newStory); // Add to beginning
        fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), 'utf8');
        return newStory;
    } catch (error) {
        console.error("Error writing story to database:", error);
        throw error;
    }
}

// Read donations
function getDonations() {
    initialize();
    try {
        const data = fs.readFileSync(DONATIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading donations database:", error);
        return [];
    }
}

// Add a donation
function addDonation(donation) {
    initialize();
    try {
        const donations = getDonations();
        const newDonation = {
            id: 'don-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            name: donation.name || "Anonymous Donor",
            email: donation.email || "anonymous@monsuf.org",
            amount: parseFloat(donation.amount),
            currency: donation.currency || "USD",
            paymentMethod: donation.paymentMethod || "Card",
            transactionId: donation.transactionId || null,
            bankReference: donation.bankReference || null,
            pledgePhone: donation.pledgePhone || null,
            status: donation.status || "Settled", // Settled, Pending Verification, Pledge
            date: new Date().toISOString()
        };
        donations.unshift(newDonation);
        fs.writeFileSync(DONATIONS_FILE, JSON.stringify(donations, null, 2), 'utf8');
        return newDonation;
    } catch (error) {
        console.error("Error writing donation to database:", error);
        throw error;
    }
}

// User accounts management
function getUsers() {
    initialize();
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading users database:", error);
        return [];
    }
}

function addStaffUser(username, password, name) {
    initialize();
    try {
        const users = getUsers();
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            throw new Error("Username already exists");
        }
        const newUser = {
            username,
            password,
            role: "staff",
            name
        };
        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
        return newUser;
    } catch (error) {
        console.error("Error creating staff user:", error);
        throw error;
    }
}

// Settings management
function getSettings() {
    initialize();
    try {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading settings database:", error);
        return {};
    }
}

function saveSettings(settings) {
    initialize();
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
        return settings;
    } catch (error) {
        console.error("Error saving settings database:", error);
        throw error;
    }
}

// Security Alerts and Logs
function getAlerts() {
    initialize();
    try {
        const data = fs.readFileSync(ALERTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading alerts database:", error);
        return [];
    }
}

function addAlert(type, message, metadata) {
    initialize();
    try {
        const alerts = getAlerts();
        const newAlert = {
            id: 'alt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type,
            message,
            metadata,
            status: "open", // open, resolved
            date: new Date().toISOString()
        };
        alerts.unshift(newAlert);
        fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf8');
        return newAlert;
    } catch (error) {
        console.error("Error writing security alert:", error);
        throw error;
    }
}

function resolveAlert(id) {
    initialize();
    try {
        const alerts = getAlerts();
        const alert = alerts.find(a => a.id === id);
        if (alert) {
            alert.status = "resolved";
            fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf8');
        }
        return alert;
    } catch (error) {
        console.error("Error resolving security alert:", error);
        throw error;
    }
}

// Read events
function getEvents() {
    initialize();
    try {
        const data = fs.readFileSync(EVENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading events database:", error);
        return [];
    }
}

// Add an event
function addEvent(event) {
    initialize();
    try {
        const events = getEvents();
        const newEvent = {
            id: 'event-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            name: event.name,
            date: event.date,
            type: event.type || "upcoming",
            description: event.description || "",
            imageUrl: event.imageUrl || '/images/placeholder.jpg',
            status: event.status || "active"
        };
        events.unshift(newEvent);
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
        return newEvent;
    } catch (error) {
        console.error("Error writing event to database:", error);
        throw error;
    }
}

// Update an event
function updateEvent(id, updatedFields) {
    initialize();
    try {
        const events = getEvents();
        const index = events.findIndex(e => e.id === id);
        if (index !== -1) {
            events[index] = { ...events[index], ...updatedFields };
            fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
            return events[index];
        }
        return null;
    } catch (error) {
        console.error("Error updating event in database:", error);
        throw error;
    }
}

// Delete an event
function deleteEvent(id) {
    initialize();
    try {
        const events = getEvents();
        const index = events.findIndex(e => e.id === id);
        if (index !== -1) {
            const deletedEvent = events[index];
            events.splice(index, 1);
            fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
            return deletedEvent;
        }
        return null;
    } catch (error) {
        console.error("Error deleting event from database:", error);
        throw error;
    }
}

module.exports = {
    getStories,
    addStory,
    getDonations,
    addDonation,
    getUsers,
    addStaffUser,
    getSettings,
    saveSettings,
    getAlerts,
    addAlert,
    resolveAlert,
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    initialize
};
