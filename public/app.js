// app.js

// Constants
const API_URL = ''; // Local server root

// State Management
let appState = {
    isAdmin: false,
    selectedAmount: 10000,
    stories: [],
    stats: {
        totalRaised: 37500000,
        totalDonors: 47,
        totalStories: 3
    }
};

// DOM Elements
const btnAdminToggle = document.getElementById('btn-admin-toggle');
const adminBadge = document.getElementById('admin-badge');
const adminActionsBar = document.getElementById('admin-actions-bar');
const modalAdminLogin = document.getElementById('modal-admin-login');
const formAdminLogin = document.getElementById('form-admin-login');
const adminPasscodeInput = document.getElementById('admin-passcode-input');
const adminLoginError = document.getElementById('admin-login-error');
const btnCloseAdminModal = document.getElementById('btn-close-admin-modal');

const modalAddStory = document.getElementById('modal-add-story');
const btnAddStoryModal = document.getElementById('btn-add-story-modal');
const btnCloseStoryModal = document.getElementById('btn-close-story-modal');
const formAddStory = document.getElementById('form-add-story');
const storyTitleInput = document.getElementById('story-title');
const storyCategorySelect = document.getElementById('story-category');
const storyDescriptionInput = document.getElementById('story-description');
const storyImageInput = document.getElementById('story-image');
const storyUploadError = document.getElementById('story-upload-error');

const storiesContainer = document.getElementById('stories-container');
const storyFilterTabs = document.getElementById('story-filter-tabs');

const statTotalRaised = document.getElementById('stat-total-raised');
const statTotalDonors = document.getElementById('stat-total-donors');
const statTotalStories = document.getElementById('stat-total-stories');

// Mobile Menu
const btnMobileMenu = document.getElementById('btn-mobile-menu');
const mainNavigation = document.getElementById('main-navigation');

// Donation Flow Elements
const donationSetupForm = document.getElementById('donation-setup-form');
const donationPaymentForm = document.getElementById('donation-payment-form');
const donorNameInput = document.getElementById('donor-name');
const donorEmailInput = document.getElementById('donor-email');
const amountTiers = document.querySelectorAll('.amount-tier');
const customAmountInput = document.getElementById('custom-amount-input');
const donationImpactText = document.getElementById('donation-impact-text');

const btnNextToPayment = document.getElementById('btn-next-to-payment');
const btnBackToDetails = document.getElementById('btn-back-to-details');
const btnSubmitDonation = document.getElementById('btn-submit-donation');
const btnSubmitText = document.getElementById('btn-submit-text');
const btnSubmitSpinner = document.getElementById('btn-submit-spinner');
const paymentErrorAlert = document.getElementById('payment-error-alert');

// Card inputs
const cardNumberInput = document.getElementById('card-number');
const cardExpiryInput = document.getElementById('card-expiry');
const cardCvvInput = document.getElementById('card-cvv');

// Visual Card elements
const creditCardObject = document.getElementById('credit-card-object');
const cardNumDisplay = document.getElementById('card-num-display');
const cardNameDisplay = document.getElementById('card-name-display');
const cardExpiryDisplay = document.getElementById('card-expiry-display');
const cardCvvDisplay = document.getElementById('card-cvv-display');
const cardTypeLogo = document.getElementById('card-type-logo');

// Receipt Modal
const modalReceipt = document.getElementById('modal-receipt');
const receiptAmount = document.getElementById('receipt-amount');
const receiptTxnId = document.getElementById('receipt-txn-id');
const receiptDate = document.getElementById('receipt-date');
const receiptDonorName = document.getElementById('receipt-donor-name');
const receiptDonorEmail = document.getElementById('receipt-donor-email');
const btnCloseReceipt = document.getElementById('btn-close-receipt');

// Impact descriptions by amount (NGN)
const impactDescriptions = {
    5000: "₦5,000 purchases educational leaflets raising early sarcoma awareness in rural clinics.",
    10000: "₦10,000 buys critical support medication for chemotherapy sessions.",
    25000: "₦25,000 covers pre-operative diagnostic scans for one sarcoma patient.",
    50000: "₦50,000 sponsors surgical instruments training for orthopedic oncology residents.",
    custom: "Every naira helps fund limb-salvage surgeries, medical training, and cancer research."
};

// Page load initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchStories();
    initNavigationEvents();
    initAdminEvents();
    initDonationEvents();
    initCardValidationEvents();
    initVolunteerEvents();
});

// Mobile Navigation Toggle
if (btnMobileMenu) {
    btnMobileMenu.addEventListener('click', () => {
        if (mainNavigation) {
            mainNavigation.classList.toggle('active');
            const isExpanded = mainNavigation.classList.contains('active');
            btnMobileMenu.innerHTML = isExpanded ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        }
    });
}

// Smooth scroll close navigation (mobile)
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        if (mainNavigation) {
            mainNavigation.classList.remove('active');
        }
        if (btnMobileMenu) {
            btnMobileMenu.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    });
});

// --- NAVIGATION & ROUTING ---
function initNavigationEvents() {
    // Set active link based on current pathname
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        // Match clean URLs (e.g. /about) with paths
        if (href === path || (path === '/' && href === '/') || (path === '/index.html' && href === '/')) {
            link.classList.add('active');
        }
    });

    // Manage scroll highlighting only if section elements exist
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        if (sections.length === 0) return;
        const scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        
        sections.forEach(sec => {
            if (scrollPos >= sec.offsetTop - 150 && scrollPos < sec.offsetTop + sec.offsetHeight - 150) {
                const id = sec.getAttribute('id');
                document.querySelectorAll('.nav-link').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${id}` || href === `/#${id}`) {
                        link.classList.remove('active');
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// --- DATA FETCHING ---

// Fetch Metrics Dashboard
async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        if (response.ok) {
            const data = await response.json();
            appState.stats = data;
            updateStatsUI();
        }
    } catch (error) {
        console.error("Failed to fetch statistics:", error);
    }
}

function updateStatsUI() {
    if (statTotalRaised) {
        const raised = appState.stats.totalRaised;
        // Display in millions for readability
        if (raised >= 1000000) {
            statTotalRaised.innerText = '₦' + (raised / 1000000).toFixed(1) + 'M';
        } else {
            statTotalRaised.innerText = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(raised);
        }
    }
    if (statTotalDonors) statTotalDonors.innerText = appState.stats.totalDonors;
    if (statTotalStories) statTotalStories.innerText = appState.stats.totalStories;
}

// Fetch and Render Success Stories
async function fetchStories() {
    if (!storiesContainer) return;
    try {
        const response = await fetch(`${API_URL}/api/stories`);
        if (response.ok) {
            const data = await response.json();
            appState.stories = data;
            renderStories('all');
        } else {
            storiesContainer.innerHTML = '<div class="alert alert-error">Error loading stories from server.</div>';
        }
    } catch (error) {
        console.error("Failed to load success stories:", error);
        storiesContainer.innerHTML = '<div class="alert alert-error">Network error. Please try again later.</div>';
    }
}

function renderStories(filterCategory) {
    storiesContainer.innerHTML = '';
    
    const filtered = filterCategory === 'all' 
        ? appState.stories 
        : appState.stories.filter(s => s.category === filterCategory);
        
    if (filtered.length === 0) {
        storiesContainer.innerHTML = '<div class="stories-loading"><i class="fa-solid fa-ribbon text-accent"></i> No success stories published in this category yet.</div>';
        return;
    }
    
    filtered.forEach(story => {
        const card = document.createElement('div');
        card.className = 'story-card';
        
        let categoryClass = 'patients';
        if (story.category === 'Research Projects') categoryClass = 'research';
        if (story.category === 'Medical Training') categoryClass = 'training';
        
        card.innerHTML = `
            <div class="story-img-wrapper">
                <span class="story-category-tag ${categoryClass}">${story.category}</span>
                <img class="story-img" src="${story.imageUrl}" alt="${story.title}" onerror="this.src='/images/placeholder.jpg'">
            </div>
            <div class="story-body">
                <span class="story-date"><i class="fa-regular fa-calendar"></i> ${story.date}</span>
                <h3 class="story-title">${story.title}</h3>
                <p class="story-desc">${story.description}</p>
            </div>
        `;
        storiesContainer.appendChild(card);
    });
}

// Category filter tabs handler
if (storyFilterTabs) {
    storyFilterTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tab')) {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const filter = e.target.getAttribute('data-filter');
            renderStories(filter);
        }
    });
}

// --- ADMIN / AUTHORIZATION FLOW ---
function initAdminEvents() {
    if (btnAdminToggle) {
        btnAdminToggle.addEventListener('click', () => {
            if (appState.isAdmin) {
                appState.isAdmin = false;
                if (adminBadge) adminBadge.classList.add('hide');
                if (adminActionsBar) adminActionsBar.classList.add('hide');
                btnAdminToggle.innerHTML = '<i class="fa-solid fa-lock"></i> Staff Portal';
            } else {
                if (modalAdminLogin) modalAdminLogin.classList.remove('hide');
                if (adminPasscodeInput) adminPasscodeInput.value = '';
                if (adminLoginError) adminLoginError.classList.add('hide');
                if (adminPasscodeInput) adminPasscodeInput.focus();
            }
        });
    }

    if (btnCloseAdminModal) {
        btnCloseAdminModal.addEventListener('click', () => {
            if (modalAdminLogin) modalAdminLogin.classList.add('hide');
        });
    }

    if (formAdminLogin) {
        formAdminLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const passcode = adminPasscodeInput.value;
            
            if (passcode === 'admin123') {
                appState.isAdmin = true;
                if (modalAdminLogin) modalAdminLogin.classList.add('hide');
                if (adminBadge) adminBadge.classList.remove('hide');
                if (adminActionsBar) adminActionsBar.classList.remove('hide');
                btnAdminToggle.innerHTML = '<i class="fa-solid fa-lock-open"></i> Log Out Staff';
            } else {
                if (adminLoginError) adminLoginError.classList.remove('hide');
                if (adminPasscodeInput) adminPasscodeInput.value = '';
            }
        });
    }

    if (btnAddStoryModal) {
        btnAddStoryModal.addEventListener('click', () => {
            if (modalAddStory) modalAddStory.classList.remove('hide');
            if (storyUploadError) storyUploadError.classList.add('hide');
            if (formAddStory) formAddStory.reset();
        });
    }

    if (btnCloseStoryModal) {
        btnCloseStoryModal.addEventListener('click', () => {
            if (modalAddStory) modalAddStory.classList.add('hide');
        });
    }

    if (formAddStory) {
        formAddStory.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (storyUploadError) storyUploadError.classList.add('hide');

            const title = storyTitleInput.value;
            const category = storyCategorySelect.value;
            const description = storyDescriptionInput.value;
            const file = storyImageInput.files[0];

            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('passcode', 'admin123');
            if (file) {
                formData.append('image', file);
            }

            const publishBtn = document.getElementById('btn-publish-story');
            if (publishBtn) {
                publishBtn.disabled = true;
                publishBtn.innerText = 'Publishing...';
            }

            try {
                const response = await fetch(`${API_URL}/api/stories`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    if (modalAddStory) modalAddStory.classList.add('hide');
                    await fetchStories();
                    await fetchStats();
                } else {
                    const data = await response.json();
                    if (storyUploadError) {
                        storyUploadError.innerText = data.error || "Failed to publish story.";
                        storyUploadError.classList.remove('hide');
                    }
                }
            } catch (error) {
                console.error("Story submission error:", error);
                if (storyUploadError) {
                    storyUploadError.innerText = "Network error. Failed to publish success story.";
                    storyUploadError.classList.remove('hide');
                }
            } finally {
                if (publishBtn) {
                    publishBtn.disabled = false;
                    publishBtn.innerText = 'Publish Story';
                }
            }
        });
    }
}

// --- DONATION FLOW & CARD INTERACTIVITY ---
function initDonationEvents() {
    if (!donationSetupForm) return;

    // Fetch active payment settings from backend
    async function fetchPaymentSettings() {
        try {
            const response = await fetch(`${API_URL}/api/settings`);
            if (response.ok) {
                const settings = await response.json();
                
                // Populate Bank Details
                const bankNameEl = document.getElementById('display-bank-name');
                const bankAccEl = document.getElementById('display-account-num');
                const bankNameAccEl = document.getElementById('display-account-name');
                if (bankNameEl && settings.bankTransfer) bankNameEl.innerText = settings.bankTransfer.bankName || '';
                if (bankAccEl && settings.bankTransfer) bankAccEl.innerText = settings.bankTransfer.accountNumber || '';
                if (bankNameAccEl && settings.bankTransfer) bankNameAccEl.innerText = settings.bankTransfer.accountName || '';

                // Populate Cash Instructions
                const cashInstEl = document.getElementById('display-cash-instructions');
                if (cashInstEl && settings.cash) cashInstEl.innerText = settings.cash.instructions || '';

                // Toggle payment method radio visibility
                const onlineLabel = document.getElementById('payment-method-online-label');
                const bankLabel = document.getElementById('payment-method-bank-label');
                const cashLabel = document.getElementById('payment-method-cash-label');

                if (onlineLabel && settings.onlinePayment) {
                    if (settings.onlinePayment.enabled === false) {
                        onlineLabel.style.display = 'none';
                        const cardRadio = document.querySelector('input[name="paymentMethodSelect"][value="Card"]');
                        if (cardRadio && cardRadio.checked) {
                            const nextRadio = document.querySelector('input[name="paymentMethodSelect"][value="Bank Transfer"]');
                            if (nextRadio) nextRadio.checked = true;
                        }
                    } else {
                        onlineLabel.style.display = 'flex';
                    }
                }

                if (bankLabel && settings.bankTransfer) {
                    if (settings.bankTransfer.enabled === false) {
                        bankLabel.style.display = 'none';
                        const bankRadio = document.querySelector('input[name="paymentMethodSelect"][value="Bank Transfer"]');
                        if (bankRadio && bankRadio.checked) {
                            const nextRadio = document.querySelector('input[name="paymentMethodSelect"][value="Card"]');
                            if (nextRadio) nextRadio.checked = true;
                        }
                    } else {
                        bankLabel.style.display = 'flex';
                    }
                }

                if (cashLabel && settings.cash) {
                    if (settings.cash.enabled === false) {
                        cashLabel.style.display = 'none';
                        const cashRadio = document.querySelector('input[name="paymentMethodSelect"][value="Cash"]');
                        if (cashRadio && cashRadio.checked) {
                            const nextRadio = document.querySelector('input[name="paymentMethodSelect"][value="Card"]');
                            if (nextRadio) nextRadio.checked = true;
                        }
                    } else {
                        cashLabel.style.display = 'flex';
                    }
                }

                // Initial toggle setup
                const activeRadio = document.querySelector('input[name="paymentMethodSelect"]:checked');
                if (activeRadio) {
                    togglePaymentSections(activeRadio.value);
                }
            }
        } catch (error) {
            console.error("Failed to fetch payment settings:", error);
        }
    }

    // Toggle visible class ('hide') on sub-sections based on selection
    const methodRadios = document.querySelectorAll('input[name="paymentMethodSelect"]');
    methodRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            togglePaymentSections(e.target.value);
        });
    });

    function togglePaymentSections(method) {
        const secCard = document.getElementById('payment-section-card');
        const secBank = document.getElementById('payment-section-bank');
        const secCash = document.getElementById('payment-section-cash');
        const visualColumn = document.getElementById('donation-visual-column');

        // Hide all
        if (secCard) secCard.classList.add('hide');
        if (secBank) secBank.classList.add('hide');
        if (secCash) secCash.classList.add('hide');

        if (method === 'Card') {
            if (secCard) secCard.classList.remove('hide');
            if (visualColumn) visualColumn.classList.remove('hide');
        } else if (method === 'Bank Transfer') {
            if (secBank) secBank.classList.remove('hide');
            if (visualColumn) visualColumn.classList.add('hide');
        } else if (method === 'Cash') {
            if (secCash) secCash.classList.remove('hide');
            if (visualColumn) visualColumn.classList.add('hide');
        }
    }

    // Load active settings on init
    fetchPaymentSettings();
    showCurrencyNote(appState.selectedAmount);

    // Select Predefined Donation Tiers
    amountTiers.forEach(tier => {
        tier.addEventListener('click', (e) => {
            amountTiers.forEach(t => t.classList.remove('active'));
            customAmountInput.value = '';
            
            e.target.classList.add('active');
            const amt = parseInt(e.target.getAttribute('data-amount'), 10);
            appState.selectedAmount = amt;
            
            // Update UI description and payment texts
            donationImpactText.innerText = impactDescriptions[amt] || impactDescriptions.custom;
            updatePaymentButtonText();
            showCurrencyNote(amt);
        });
    });

    // Handle Custom Amount Input
    customAmountInput.addEventListener('input', (e) => {
        amountTiers.forEach(t => t.classList.remove('active'));
        let amt = parseFloat(e.target.value);
        
        if (isNaN(amt) || amt < 0) {
            amt = 0;
        }
        appState.selectedAmount = amt;
        donationImpactText.innerText = amt > 0 ? impactDescriptions.custom : "Please enter a valid amount.";
        updatePaymentButtonText();
        showCurrencyNote(amt);
    });

    // Move to payment portal form
    btnNextToPayment.addEventListener('click', () => {
        const name = donorNameInput.value.trim();
        const email = donorEmailInput.value.trim();
        
        if (!name) {
            alert("Please enter your name.");
            donorNameInput.focus();
            return;
        }
        if (!email || !email.includes('@')) {
            alert("Please enter a valid email address.");
            donorEmailInput.focus();
            return;
        }
        if (appState.selectedAmount <= 0) {
            alert("Please select or specify a donation amount.");
            customAmountInput.focus();
            return;
        }

        // Mirror values to visual card holder name
        cardNameDisplay.innerText = name.substring(0, 20).toUpperCase();

        // Check active payment method to set initial toggle
        const activeRadio = document.querySelector('input[name="paymentMethodSelect"]:checked');
        if (activeRadio) {
            togglePaymentSections(activeRadio.value);
        }

        // Toggle form frames
        donationSetupForm.classList.add('hide');
        donationPaymentForm.classList.remove('hide');
    });

    // Back to first details stage
    btnBackToDetails.addEventListener('click', () => {
        donationPaymentForm.classList.add('hide');
        donationSetupForm.classList.remove('hide');
    });

    function formatNGN(amount) {
        return '₦' + new Intl.NumberFormat('en-NG').format(amount);
    }

    function updatePaymentButtonText() {
        const amtStr = formatNGN(appState.selectedAmount);
        btnSubmitText.innerText = `Confirm Donation of ${amtStr}`;
    }

    function showCurrencyNote(amountNGN) {
        const noteEl = document.getElementById('currency-note');
        const noteText = document.getElementById('currency-note-text');
        if (!noteEl || !noteText) return;

        // Detect timezone; Nigerian timezones all contain 'Lagos' or 'Africa'
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const locale = navigator.language || '';
        const isNigeria = tz === 'Africa/Lagos' || locale.startsWith('en-NG') || locale.startsWith('yo') || locale.startsWith('ha') || locale.startsWith('ig');

        if (!isNigeria && amountNGN > 0) {
            // Map timezone prefix to (currency code, approximate NGN rate)
            const tzCurrencyMap = [
                ['America/New_York', 'USD', 1600], ['America/Chicago', 'USD', 1600],
                ['America/Denver', 'USD', 1600],   ['America/Los_Angeles', 'USD', 1600],
                ['America/Toronto', 'CAD', 1170],  ['America/Vancouver', 'CAD', 1170],
                ['America/Sao_Paulo', 'BRL', 300],
                ['Europe/London', 'GBP', 2050],    ['Europe/Dublin', 'EUR', 1700],
                ['Europe/Paris', 'EUR', 1700],     ['Europe/Berlin', 'EUR', 1700],
                ['Australia/Sydney', 'AUD', 1050], ['Australia/Melbourne', 'AUD', 1050],
                ['Asia/Dubai', 'AED', 440],        ['Asia/Riyadh', 'SAR', 430],
                ['Asia/Accra', 'GHS', 110],        ['Africa/Nairobi', 'KES', 12],
                ['Africa/Johannesburg', 'ZAR', 88]
            ];

            let currency = 'USD', rate = 1600;
            for (let i = 0; i < tzCurrencyMap.length; i++) {
                if (tz.startsWith(tzCurrencyMap[i][0].split('/')[0]) || tz === tzCurrencyMap[i][0]) {
                    currency = tzCurrencyMap[i][1];
                    rate = tzCurrencyMap[i][2];
                    break;
                }
            }

            const localAmount = (amountNGN / rate).toFixed(2);
            try {
                const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(localAmount);
                noteText.innerText = `Donations are processed in Nigerian Naira (NGN). ${formatNGN(amountNGN)} ≈ ${formatted} at approximate rates. Your bank applies the actual exchange rate.`;
                noteEl.style.display = 'block';
            } catch (e) {
                noteText.innerText = `Donations are processed in Nigerian Naira (NGN). Your bank will convert from your local currency.`;
                noteEl.style.display = 'block';
            }
        } else {
            noteEl.style.display = 'none';
        }
    }

    // Submit Donation Form
    donationPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        paymentErrorAlert.classList.add('hide');
        
        const name = donorNameInput.value.trim();
        const email = donorEmailInput.value.trim();
        const amount = appState.selectedAmount;
        
        const activeRadio = document.querySelector('input[name="paymentMethodSelect"]:checked');
        const paymentMethod = activeRadio ? activeRadio.value : 'Card';

        const payload = {
            name,
            email,
            amount,
            paymentMethod
        };

        // Validate and append payment-method-specific parameters
        if (paymentMethod === 'Card') {
            const cardNumber = cardNumberInput.value.trim();
            const expiryDate = cardExpiryInput.value.trim();
            const cvv = cardCvvInput.value.trim();

            if (!cardNumber || !expiryDate || !cvv) {
                paymentErrorAlert.innerText = "Please complete all payment card details.";
                paymentErrorAlert.classList.remove('hide');
                return;
            }
            payload.cardNumber = cardNumber;
            payload.expiryDate = expiryDate;
            payload.cvv = cvv;
        } else if (paymentMethod === 'Bank Transfer') {
            const bankReference = document.getElementById('bank-reference').value.trim();
            if (!bankReference) {
                paymentErrorAlert.innerText = "Transaction Reference / Narration is required for Bank Transfer.";
                paymentErrorAlert.classList.remove('hide');
                document.getElementById('bank-reference').focus();
                return;
            }
            payload.bankReference = bankReference;
        } else if (paymentMethod === 'Cash') {
            const pledgePhone = document.getElementById('pledge-phone').value.trim();
            if (!pledgePhone) {
                paymentErrorAlert.innerText = "Contact Phone Number is required for Cash Pickup.";
                paymentErrorAlert.classList.remove('hide');
                document.getElementById('pledge-phone').focus();
                return;
            }
            payload.pledgePhone = pledgePhone;
        }

        // Toggle processing spinner UI
        btnSubmitText.classList.add('hide');
        btnSubmitSpinner.classList.remove('hide');
        btnSubmitDonation.disabled = true;

        try {
            const response = await fetch(`${API_URL}/api/donate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Trigger Receipt
                receiptAmount.innerText = formatNGN(data.receipt.amount);
                receiptTxnId.innerText = data.receipt.transactionId;
                receiptDate.innerText = new Date(data.receipt.date).toLocaleDateString() + ' ' + new Date(data.receipt.date).toLocaleTimeString();
                receiptDonorName.innerText = data.receipt.donorName;
                receiptDonorEmail.innerText = data.receipt.donorEmail;

                // Let's populate status badge!
                const statusBadge = modalReceipt.querySelector('.badge-status');
                if (statusBadge) {
                    statusBadge.innerText = data.receipt.status;
                    // Reset styling
                    statusBadge.className = 'value badge-status';
                    statusBadge.style.backgroundColor = '';
                    statusBadge.style.color = '';
                    if (data.receipt.status.startsWith('Flagged')) {
                        statusBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        statusBadge.style.color = '#ef4444';
                    } else if (data.receipt.status === 'Pending Verification') {
                        statusBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                        statusBadge.style.color = '#f59e0b';
                    } else if (data.receipt.status === 'Pledge') {
                        statusBadge.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                        statusBadge.style.color = '#3b82f6';
                    } else {
                        statusBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                        statusBadge.style.color = '#10b981';
                    }
                }

                // Update receipt message
                const receiptMsg = modalReceipt.querySelector('.receipt-message');
                if (receiptMsg) {
                    receiptMsg.innerText = data.message || "A formal tax-deductible receipt has been dispatched to your email address. Your contribution directly funds musculoskeletal oncology care and research.";
                }

                modalReceipt.classList.remove('hide');
                
                // Reset State
                donationPaymentForm.reset();
                donationSetupForm.reset();
                cardNameDisplay.innerText = 'YOUR NAME';
                cardNumDisplay.innerText = '•••• •••• •••• ••••';
                cardExpiryDisplay.innerText = 'MM/YY';
                cardCvvDisplay.innerText = '•••';
                amountTiers.forEach(t => t.classList.remove('active'));
                amountTiers[1].classList.add('active'); // Reset to ₦10,000 tier
                appState.selectedAmount = 10000;
                donationImpactText.innerText = impactDescriptions[10000];
                showCurrencyNote(10000);
                updatePaymentButtonText();

                // Go back to setup screen
                donationPaymentForm.classList.add('hide');
                donationSetupForm.classList.remove('hide');

                // Update counts
                fetchStats();
            } else {
                paymentErrorAlert.innerText = data.error || "Payment processing failed. Check card credentials.";
                paymentErrorAlert.classList.remove('hide');
            }
        } catch (error) {
            console.error("Donation gateway failure:", error);
            paymentErrorAlert.innerText = "Connection lost. Failed to contact payment gateway.";
            paymentErrorAlert.classList.remove('hide');
        } finally {
            btnSubmitSpinner.classList.add('hide');
            btnSubmitText.classList.remove('hide');
            btnSubmitDonation.disabled = false;
        }
    });

    // Close Receipt Modal
    btnCloseReceipt.addEventListener('click', () => {
        modalReceipt.classList.add('hide');
    });
}

// --- CARD VALIDATION & VISUAL MIRRORING ---
function initCardValidationEvents() {
    if (!cardNumberInput) return;
    // Realtime Card Number spacing formatting and type branding logo
    cardNumberInput.addEventListener('input', (e) => {
        // Strip non-digits
        let value = e.target.value.replace(/\D/g, '');
        // Limit to 16
        value = value.substring(0, 16);
        
        // Brand identification
        if (value.startsWith('4')) {
            cardTypeLogo.innerHTML = '<i class="fa-brands fa-cc-visa"></i>';
        } else if (/^5[1-5]/.test(value)) {
            cardTypeLogo.innerHTML = '<i class="fa-brands fa-cc-mastercard"></i>';
        } else if (/^3[47]/.test(value)) {
            cardTypeLogo.innerHTML = '<i class="fa-brands fa-cc-amex"></i>';
        } else {
            cardTypeLogo.innerHTML = '<i class="fa-solid fa-credit-card"></i>';
        }

        // Spacing spaces every 4 digits
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        e.target.value = formatted;

        // Mirror to card object
        let displayVal = formatted;
        const remainder = 16 - value.length;
        for (let i = 0; i < remainder; i++) {
            if ((value.length + i) > 0 && (value.length + i) % 4 === 0) {
                displayVal += ' ';
            }
            displayVal += '•';
        }
        cardNumDisplay.innerText = displayVal;
    });

    // Expiry input formatting (MM/YY)
    cardExpiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 4);
        
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        e.target.value = value;

        // Mirror to card
        let displayVal = value;
        if (value.length === 0) displayVal = 'MM/YY';
        else if (value.length === 1) displayVal = value + 'M/YY';
        else if (value.length === 2) displayVal = value + '/YY';
        else if (value.length === 4) displayVal = value;
        cardExpiryDisplay.innerText = displayVal;
    });

    // CVV input focus flips card, blur flips back
    cardCvvInput.addEventListener('focus', () => {
        creditCardObject.classList.add('flipped');
    });

    cardCvvInput.addEventListener('blur', () => {
        creditCardObject.classList.remove('flipped');
    });

    cardCvvInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 4);
        e.target.value = value;

        let displayVal = '';
        for (let i = 0; i < value.length; i++) displayVal += '•';
        if (displayVal.length === 0) displayVal = '•••';
        cardCvvDisplay.innerText = displayVal;
    });
}

// --- VOLUNTEER REGISTRATION ---
function initVolunteerEvents() {
    const volunteerForm = document.getElementById('volunteer-signup-form');
    const volunteerSuccessMsg = document.getElementById('volunteer-success-msg');
    
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('volunteer-name').value.trim();
            const email = document.getElementById('volunteer-email').value.trim();
            const phone = document.getElementById('volunteer-phone').value.trim();
            
            try {
                const response = await fetch(`${API_URL}/api/volunteers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, phone })
                });
                
                if (response.ok) {
                    volunteerSuccessMsg.classList.remove('hide');
                    volunteerForm.reset();
                    
                    // Hide the success message after 6 seconds
                    setTimeout(() => {
                        volunteerSuccessMsg.classList.add('hide');
                    }, 6000);
                } else {
                    const data = await response.json();
                    alert(data.error || "Failed to submit volunteer registration.");
                }
            } catch (error) {
                console.error("Volunteer registration error:", error);
                alert("Network error. Failed to submit volunteer registration.");
            }
        });
    }
}
