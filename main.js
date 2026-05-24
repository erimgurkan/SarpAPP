/* ═══════════════════════════════════════════════════════════
   POSTCRAFT — App Logic (Auth & Grid)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initGridModal();
});

// API Base URL
const API_URL = 'https://postmax-io.onrender.com/api';

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
            const payload = { email, password };
            if (!isLoginMode) {
                // Backend requires a name for registration
                payload.name = email.split('@')[0];
            }

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Bir hata oluştu');
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
let cachedHistory = [];
let selectedHistoryItem = null;
let currentType = '';

function parseGeneratedContent(htmlContent) {
    const div = document.createElement('div');
    div.innerHTML = htmlContent || '';
    
    // Find the image source
    const imgEl = div.querySelector('img');
    const imageUrl = imgEl ? imgEl.src : '';
    
    // Remove the center wrapper of the image to get clean caption HTML/Text
    const centerDivs = div.querySelectorAll('div[style*="text-align: center"], div[style*="text-align:center"]');
    centerDivs.forEach(el => el.remove());
    
    const captionHtml = div.innerHTML.trim();
    const captionText = div.innerText.trim();
    
    return { imageUrl, captionHtml, captionText };
}

function renderCard(contentItem) {
    const { imageUrl } = parseGeneratedContent(contentItem.generated_content);
    
    // Determine aspect ratio class
    let aspectClass = 'aspect-1-1';
    if (contentItem.generated_content.includes('aspect-ratio: 9 / 16') || contentItem.user_input.toLowerCase().includes('dikey') || contentItem.user_input.toLowerCase().includes('9:16')) {
        aspectClass = 'aspect-9-16';
    } else if (contentItem.generated_content.includes('aspect-ratio: 16 / 9') || contentItem.user_input.toLowerCase().includes('yatay') || contentItem.user_input.toLowerCase().includes('16:9')) {
        aspectClass = 'aspect-16-9';
    }
    
    const featuredClass = contentItem.id % 6 === 0 ? 'card-featured' : '';
    const isFav = contentItem.is_favorite ? 'is-fav' : '';
    const favIcon = contentItem.is_favorite ? '★' : '☆';
    
    return `
        <div class="image-card ${aspectClass} ${featuredClass}" data-id="${contentItem.id}">
            <div class="image-card-img-wrapper">
                <img src="${imageUrl || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop'}" alt="Preview" loading="lazy">
            </div>
            <div class="image-card-footer">
                <p class="image-card-prompt">${contentItem.user_input}</p>
                <div class="image-card-meta-row">
                    <div class="image-card-tags">
                        <span class="image-card-tag">${contentItem.content_type.toUpperCase()}</span>
                    </div>
                    <div class="image-card-actions">
                        <button class="image-card-action-btn btn-card-fav ${isFav}" data-id="${contentItem.id}">${favIcon}</button>
                        <button class="image-card-action-btn btn-card-del" data-id="${contentItem.id}">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function openDetailDrawer(item) {
    const drawer = document.getElementById('modalDetailDrawer');
    const { imageUrl, captionText } = parseGeneratedContent(item.generated_content);
    
    selectedHistoryItem = item;
    
    document.getElementById('drawerImg').src = imageUrl || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop';
    
    // Format aspect ratio text
    let ratioText = 'Kare (1:1)';
    if (item.generated_content.includes('aspect-ratio: 9 / 16')) ratioText = 'Dikey (9:16)';
    if (item.generated_content.includes('aspect-ratio: 16 / 9')) ratioText = 'Yatay (16:9)';
    document.getElementById('drawerMetaFormat').innerText = ratioText;
    
    document.getElementById('drawerMetaModel').innerText = item.model_used || 'Z-Image-Turbo';
    
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor';
    document.getElementById('drawerMetaDate').innerText = dateStr;
    
    document.getElementById('drawerCaption').innerText = captionText;
    
    // Favorite Button Status
    const favBtn = document.getElementById('btnFavToggle');
    if (item.is_favorite) {
        favBtn.classList.add('active');
        favBtn.innerHTML = '<span>★</span> Favorilerde';
    } else {
        favBtn.classList.remove('active');
        favBtn.innerHTML = '<span>☆</span> Favorile';
    }
    
    document.getElementById('btnDownloadImg').href = imageUrl;
    
    drawer.classList.add('active');
}

function closeDetailDrawer() {
    const drawer = document.getElementById('modalDetailDrawer');
    if (drawer) {
        drawer.classList.remove('active');
    }
    selectedHistoryItem = null;
}

async function loadHistory() {
    if (!currentToken) return;

    try {
        const res = await fetch(`${API_URL}/content/history?limit=30`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        const data = await res.json();
        
        if (res.ok && data.contents) {
            cachedHistory = data.contents;
            renderGrids();
        }
    } catch (err) {
        console.error("Geçmiş yükleme hatası:", err);
    }
}

function renderGrids() {
    const imageGrid = document.getElementById('modalImageGrid');
    const fullGalleryGrid = document.getElementById('fullGalleryGrid');
    
    if (!imageGrid || !fullGalleryGrid) return;
    
    if (cachedHistory.length === 0) {
        imageGrid.innerHTML = `
            <div class="grid-placeholder" id="gridPlaceholder">
                <div class="placeholder-icon">✨</div>
                <h3>Henüz görsel üretilmedi</h3>
                <p>Aşağıdaki prompt alanından markanız için ilk paylaşımınızı oluşturun.</p>
            </div>
        `;
        fullGalleryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <span style="font-size: 2rem; display: block; margin-bottom: 12px;">📁</span>
                <p>Galeri boş. Henüz hiç görsel üretmediniz.</p>
            </div>
        `;
        return;
    }
    
    // Render Create Tab Grid
    let createGridHtml = '';
    cachedHistory.forEach(item => {
        createGridHtml += renderCard(item);
    });
    imageGrid.innerHTML = createGridHtml;
    
    // Render Gallery Tab Grid
    let galleryGridHtml = '';
    const activeFilter = document.querySelector('.gallery-filter-btn.active')?.dataset.filter || 'all';
    cachedHistory.forEach(item => {
        if (activeFilter === 'all' || item.content_type === activeFilter) {
            galleryGridHtml += renderCard(item);
        }
    });
    fullGalleryGrid.innerHTML = galleryGridHtml || `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <p>Seçilen filtreye uygun içerik bulunamadı.</p>
        </div>
    `;
    
    attachCardListeners();
}

function attachCardListeners() {
    const cards = document.querySelectorAll('.image-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.image-card-action-btn')) return;
            const itemId = parseInt(card.dataset.id);
            const item = cachedHistory.find(x => x.id === itemId);
            if (item) {
                openDetailDrawer(item);
            }
        });
    });
    
    const favBtns = document.querySelectorAll('.btn-card-fav');
    favBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const itemId = parseInt(btn.dataset.id);
            await toggleFavorite(itemId, btn);
        });
    });

    const delBtns = document.querySelectorAll('.btn-card-del');
    delBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const itemId = parseInt(btn.dataset.id);
            if (confirm("Bu tasarımı kalıcı olarak silmek istediğinize emin misiniz?")) {
                await deleteItem(itemId);
            }
        });
    });
}

async function toggleFavorite(itemId, btnElement) {
    try {
        const res = await fetch(`${API_URL}/content/${itemId}/favorite`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        const data = await res.json();
        if (res.ok) {
            const item = cachedHistory.find(x => x.id === itemId);
            if (item) item.is_favorite = data.is_favorite;
            
            if (btnElement) {
                if (data.is_favorite) {
                    btnElement.classList.add('is-fav');
                    btnElement.innerText = '★';
                } else {
                    btnElement.classList.remove('is-fav');
                    btnElement.innerText = '☆';
                }
            }
            
            if (selectedHistoryItem && selectedHistoryItem.id === itemId) {
                selectedHistoryItem.is_favorite = data.is_favorite;
                const drawerFavBtn = document.getElementById('btnFavToggle');
                if (data.is_favorite) {
                    drawerFavBtn.classList.add('active');
                    drawerFavBtn.innerHTML = '<span>★</span> Favorilerde';
                } else {
                    drawerFavBtn.classList.remove('active');
                    drawerFavBtn.innerHTML = '<span>☆</span> Favorile';
                }
            }
        }
    } catch (err) {
        console.error("Favori toggling hatası:", err);
    }
}

async function deleteItem(itemId) {
    try {
        const res = await fetch(`${API_URL}/content/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        if (res.ok) {
            cachedHistory = cachedHistory.filter(x => x.id !== itemId);
            renderGrids();
            if (selectedHistoryItem && selectedHistoryItem.id === itemId) {
                closeDetailDrawer();
            }
        }
    } catch (err) {
        console.error("İçerik silme hatası:", err);
    }
}

function initGridModal() {
    const cells = document.querySelectorAll('.grid-cell');
    const modal = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    const generateBtn = document.getElementById('btnGenerate');
    const tabs = document.querySelectorAll('.modal-nav-tab');
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    
    // Tab panes
    const panes = {
        create: document.getElementById('tabPaneCreate'),
        gallery: document.getElementById('tabPaneGallery'),
        edit: document.getElementById('tabPaneEdit')
    };

    // Open modal on cell click
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            currentType = cell.dataset.type;
            
            // Activate the Create tab on open
            tabs.forEach(t => t.classList.remove('active'));
            const createTab = document.querySelector('.modal-nav-tab[data-tab="create"]');
            if (createTab) createTab.classList.add('active');
            
            Object.keys(panes).forEach(key => {
                if (key === 'create') {
                    panes[key].style.display = 'flex';
                } else {
                    panes[key].style.display = 'none';
                }
            });

            // Reset inputs & close drawer
            document.getElementById('formPrompt').value = '';
            closeDetailDrawer();
            
            modal.classList.add('active');
            
            // Load history dynamically
            loadHistory();
        });
    });

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            closeDetailDrawer();
        });
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            closeDetailDrawer();
        }
    });

    // Tab switching listener
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTab = tab.dataset.tab;
            Object.keys(panes).forEach(key => {
                if (key === targetTab) {
                    panes[key].style.display = 'flex';
                } else {
                    panes[key].style.display = 'none';
                }
            });
            
            closeDetailDrawer();
            
            if (targetTab === 'gallery') {
                loadHistory();
            }
        });
    });

    // Gallery Filter switching
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGrids();
        });
    });

    // Detail Drawer Controls
    const drawerClose = document.getElementById('drawerClose');
    if (drawerClose) {
        drawerClose.addEventListener('click', closeDetailDrawer);
    }

    const btnCopyCaption = document.getElementById('btnCopyCaption');
    if (btnCopyCaption) {
        btnCopyCaption.addEventListener('click', () => {
            const captionText = document.getElementById('drawerCaption').innerText;
            navigator.clipboard.writeText(captionText).then(() => {
                btnCopyCaption.innerHTML = '<span>✅</span> Kopyalandı!';
                setTimeout(() => {
                    btnCopyCaption.innerHTML = '<span>📋</span> Metni Kopyala';
                }, 2000);
            }).catch(err => {
                alert('Metin kopyalanamadı: ' + err);
            });
        });
    }

    const btnFavToggle = document.getElementById('btnFavToggle');
    if (btnFavToggle) {
        btnFavToggle.addEventListener('click', async () => {
            if (selectedHistoryItem) {
                await toggleFavorite(selectedHistoryItem.id, null);
                // Re-fetch list to sync changes
                await loadHistory();
            }
        });
    }

    const btnBackToCreate = document.getElementById('btnBackToCreate');
    if (btnBackToCreate) {
        btnBackToCreate.addEventListener('click', () => {
            const createTab = document.querySelector('.modal-nav-tab[data-tab="create"]');
            if (createTab) createTab.click();
        });
    }

    // Generate Button click handler
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const sector = document.getElementById('formSector').value || 'Genel';
            const prompt = document.getElementById('formPrompt').value;
            const ratio = document.getElementById('formRatio').value;
            const model = document.getElementById('formModel').value;
            const resolution = document.getElementById('formResolution').value;
            const hdQuality = document.getElementById('toggleHD').checked;
            const enhancedPrompt = document.getElementById('toggleEnhanced').checked;
            
            if (!prompt) {
                alert("Lütfen ne paylaşmak istediğinizi kısaca yazın.");
                return;
            }

            generateBtn.innerText = "ÜRETİLİYOR...";
            generateBtn.disabled = true;
            
            // Remove grid placeholder
            const gridPlaceholder = document.getElementById('gridPlaceholder');
            if (gridPlaceholder) gridPlaceholder.remove();
            
            // Prepend a loading card
            const imageGrid = document.getElementById('modalImageGrid');
            const loadingCardId = 'loading-card-' + Date.now();
            const loadingCardHtml = `
                <div class="grid-card-loading" id="${loadingCardId}">
                    <div class="loading-spinner"></div>
                    <b>Yapay Zeka Hazırlıyor...</b>
                    <span>Görsel çiziliyor ve metin kurgulanıyor.</span>
                </div>
            `;
            if (imageGrid) {
                imageGrid.insertAdjacentHTML('afterbegin', loadingCardHtml);
                imageGrid.scrollTop = 0;
            }

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
                        aspectRatio: ratio,
                        model: model,
                        resolution: resolution,
                        hd: hdQuality,
                        enhanced: enhancedPrompt,
                        temporaryOverrides: {
                            industry: sector
                        }
                    })
                });

                const data = await res.json();

                // Remove loading card
                const loadingCard = document.getElementById(loadingCardId);
                if (loadingCard) loadingCard.remove();

                if (!res.ok) {
                    throw new Error(data.error || data.message || 'Üretim hatası');
                }

                // Success
                cachedHistory.unshift(data.content);
                renderGrids();
                
                // Open detail drawer for new item
                openDetailDrawer(data.content);

            } catch (err) {
                const loadingCard = document.getElementById(loadingCardId);
                if (loadingCard) loadingCard.remove();

                const errorHtml = `
                    <div style="grid-column: 1/-1; color: #D4450C; padding: 24px; border: 2px solid #D4450C; border-radius: 6px; background-color: #FDF5F2; font-family: 'Inter', sans-serif; text-align: center;">
                        <b style="display: block; margin-bottom: 8px;">Üretim Sırasında Hata Oluştu</b>
                        <span>${err.message}</span>
                    </div>
                `;
                if (imageGrid) {
                    imageGrid.insertAdjacentHTML('afterbegin', errorHtml);
                }
            } finally {
                generateBtn.innerText = "OLUŞTUR";
                generateBtn.disabled = false;
                document.getElementById('formPrompt').value = '';
            }
        });
    }
}
