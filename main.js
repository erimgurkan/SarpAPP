/* ═══════════════════════════════════════════════════════════
   POSTCRAFT — App Logic (Auth & Grid)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initGridModal();
});

// API Base URL
const API_URL = 'http://localhost:3001/api';

// State
let currentToken = localStorage.getItem('postcraft_token') || null;
let isLoginMode = true;

/* ── Auth Logic ───────────────────────────────────────────── */
function initAuth() {
    const landingView = document.getElementById('landingView');
    const authView = document.getElementById('authView');
    const dashboardView = document.getElementById('dashboardView');
    const btnLandingLogin = document.getElementById('btnLandingLogin');
    const btnAuthToggle = document.getElementById('btnAuthToggle');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const authTitle = document.getElementById('authTitle');
    const btnLogout = document.getElementById('btnLogout');
    const authError = document.getElementById('authError');

    const navHome = document.getElementById('navHome');
    const navPricing = document.getElementById('navPricing');
    const landingBody = document.getElementById('landingBody');
    const pricingBody = document.getElementById('pricingBody');

    // Navigation Routing
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove animation class to reset it
        landingBody.classList.remove('fade-in');
        
        landingBody.style.display = 'flex';
        pricingBody.style.display = 'none';
        navHome.classList.add('active');
        navPricing.classList.remove('active');
        
        // Trigger reflow and add animation class
        void landingBody.offsetWidth;
        landingBody.classList.add('fade-in');
    });

    navPricing.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove animation class to reset it
        pricingBody.classList.remove('fade-in');
        
        landingBody.style.display = 'none';
        pricingBody.style.display = 'flex';
        navPricing.classList.add('active');
        navHome.classList.remove('active');
        
        // Trigger reflow and add animation class
        void pricingBody.offsetWidth;
        pricingBody.classList.add('fade-in');
    });

    // Check token on load
    if (currentToken) {
        showDashboard();
    } else {
        showLanding();
    }

    // Open Auth Modal from Landing Page
    btnLandingLogin.addEventListener('click', () => {
        authView.style.display = 'flex';
    });

    // Close Auth Modal if clicked outside the box
    authView.addEventListener('click', (e) => {
        if (e.target === authView) {
            authView.style.display = 'none';
        }
    });

    // Toggle Login/Register Mode
    btnAuthToggle.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.innerText = isLoginMode ? "GİRİŞ YAP" : "KAYIT OL";
        btnAuthSubmit.innerText = isLoginMode ? "GİRİŞ YAP" : "KAYIT OL";
        btnAuthToggle.innerText = isLoginMode ? "Hesabın yok mu? KAYIT OL" : "Zaten hesabın var mı? GİRİŞ YAP";
        authError.style.display = 'none';
    });

    // Handle Submit
    btnAuthSubmit.addEventListener('click', async () => {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;

        if (!email || !password) {
            showError("Lütfen e-posta ve şifrenizi girin.");
            return;
        }

        btnAuthSubmit.disabled = true;
        btnAuthSubmit.innerText = "BEKLEYİN...";

        const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
        
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Bir hata oluştu');
            }

            // Success
            currentToken = data.token;
            localStorage.setItem('postcraft_token', currentToken);
            showDashboard();
            
            // If registered, create a default profile automatically
            if (!isLoginMode) {
                await createDefaultProfile();
            }

        } catch (err) {
            showError(err.message);
        } finally {
            btnAuthSubmit.disabled = false;
            btnAuthSubmit.innerText = isLoginMode ? "GİRİŞ YAP" : "KAYIT OL";
        }
    });

    // Logout
    btnLogout.addEventListener('click', () => {
        currentToken = null;
        localStorage.removeItem('postcraft_token');
        showLanding();
    });

    function showError(msg) {
        authError.innerText = msg;
        authError.style.display = 'block';
    }

    function showLanding() {
        landingView.style.display = 'flex';
        dashboardView.style.display = 'none';
        authView.style.display = 'none';
    }

    function showDashboard() {
        landingView.style.display = 'none';
        authView.style.display = 'none';
        dashboardView.style.display = 'flex';
    }
}

// Ensure user has at least one profile to generate content
async function createDefaultProfile() {
    try {
        await fetch(`${API_URL}/profiles`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                name: 'Varsayılan İşletme',
                industry: 'Genel',
                target_audience: 'Genel Müşteri',
                tone: 'Samimi ve Profesyonel'
            })
        });
    } catch (err) {
        console.error("Default profile creation failed", err);
    }
}

/* ── Grid & Generator Logic ───────────────────────────────── */
function initGridModal() {
    const cells = document.querySelectorAll('.grid-cell');
    const modal = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const generateBtn = document.getElementById('btnGenerate');
    const outputBox = document.getElementById('outputBox');
    
    let currentType = '';

    // Open modal on cell click
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            currentType = cell.dataset.type;
            const titleText = cell.querySelector('.cell-badge').innerText;
            modalTitle.innerText = titleText + " OLUSTUR";
            
            // Reset form
            document.getElementById('formPrompt').value = '';
            outputBox.style.display = 'none';
            outputBox.innerText = '';
            
            modal.classList.add('active');
        });
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Generate Button to Backend
    generateBtn.addEventListener('click', async () => {
        const sector = document.getElementById('formSector').value || 'Genel';
        const prompt = document.getElementById('formPrompt').value;
        
        if (!prompt) {
            alert("Lütfen ne paylaşmak istediğinizi kısaca yazın.");
            return;
        }

        generateBtn.innerText = "YAPAY ZEKA ÜRETİYOR...";
        generateBtn.style.opacity = "0.5";
        generateBtn.disabled = true;
        outputBox.style.display = 'none';

        try {
            const res = await fetch(`${API_URL}/content/generate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    contentType: currentType,
                    userInput: prompt,
                    // Pass sector temporarily until profile management UI is built
                    temporaryOverrides: {
                        industry: sector
                    }
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Üretim hatası');
            }

            outputBox.innerText = data.result;
            outputBox.style.display = 'block';

        } catch (err) {
            outputBox.innerText = `HATA: ${err.message}`;
            outputBox.style.display = 'block';
        } finally {
            generateBtn.innerText = "OLUSTUR";
            generateBtn.style.opacity = "1";
            generateBtn.disabled = false;
        }
    });
}
