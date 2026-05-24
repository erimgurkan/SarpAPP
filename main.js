/* ═══════════════════════════════════════════════════════════
   POSTCRAFT — App Logic (Auth & Grid)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initGridModal();
    initProfileWizard();
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
        loadProfiles();
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
        favBtn.innerHTML = 'Favorilerde';
    } else {
        favBtn.classList.remove('active');
        favBtn.innerHTML = 'Favorile';
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
        
        // Refresh model RPD status indicators
        await updateModelStatus();
    } catch (err) {
        console.error("Geçmiş yükleme hatası:", err);
    }
}

function renderGrids() {
    const fullGalleryGrid = document.getElementById('fullGalleryGrid');
    if (!fullGalleryGrid) return;
    
    if (cachedHistory.length === 0) {
        fullGalleryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); font-family: 'Inter', sans-serif;">
                <span style="font-size: 2rem; display: block; margin-bottom: 12px;">📁</span>
                <p style="margin: 0; font-size: 0.9rem; font-weight: 500;">Galeri boş. Henüz hiç görsel üretmediniz.</p>
            </div>
        `;
    } else {
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
    }
    
    // Render Studio Mini History Strip
    const historyStrip = document.getElementById('studioHistoryStrip');
    if (historyStrip) {
        if (cachedHistory.length === 0) {
            historyStrip.innerHTML = `<span style="font-size: 0.75rem; font-family: 'Inter', sans-serif; color: var(--text-secondary); padding: 10px;">Henüz geçmiş tasarım yok.</span>`;
            loadIntoStudio(null);
        } else {
            let stripHtml = '';
            cachedHistory.forEach(item => {
                const { imageUrl } = parseGeneratedContent(item.generated_content);
                const isItemActive = currentStudioItem && currentStudioItem.id === item.id ? 'active' : '';
                stripHtml += `
                    <div class="mini-thumbnail ${isItemActive}" data-id="${item.id}">
                        <img src="${imageUrl || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=80&auto=format&fit=crop'}" alt="Thumbnail" />
                        <span class="mini-thumbnail-tag">${item.content_type.toUpperCase()}</span>
                    </div>
                `;
            });
            historyStrip.innerHTML = stripHtml;
            
            // Bind click to thumbnails
            historyStrip.querySelectorAll('.mini-thumbnail').forEach(thumb => {
                thumb.addEventListener('click', () => {
                    const itemId = parseInt(thumb.dataset.id);
                    const item = cachedHistory.find(x => x.id === itemId);
                    if (item) {
                        loadIntoStudio(item);
                    }
                });
            });
            
            // Auto-load latest if not set
            if (!currentStudioItem && cachedHistory.length > 0) {
                loadIntoStudio(cachedHistory[0]);
            } else if (currentStudioItem) {
                const stillExists = cachedHistory.find(x => x.id === currentStudioItem.id);
                if (stillExists) {
                    loadIntoStudio(stillExists);
                } else {
                    loadIntoStudio(cachedHistory[0]);
                }
            }
        }
    }
    
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
                if (drawerFavBtn) {
                    if (data.is_favorite) {
                        drawerFavBtn.classList.add('active');
                        drawerFavBtn.innerHTML = 'Favorilerde';
                    } else {
                        drawerFavBtn.classList.remove('active');
                        drawerFavBtn.innerHTML = 'Favorile';
                    }
                }
            }

            // Sync with studio preview favorite button
            if (currentStudioItem && currentStudioItem.id === itemId) {
                currentStudioItem.is_favorite = data.is_favorite;
                const studioFavBtn = document.getElementById('btnStudioFavToggle');
                if (studioFavBtn) {
                    if (data.is_favorite) {
                        studioFavBtn.classList.add('active');
                        studioFavBtn.innerHTML = 'Favorilerde';
                    } else {
                        studioFavBtn.classList.remove('active');
                        studioFavBtn.innerHTML = 'Favorile';
                    }
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
            if (currentStudioItem && currentStudioItem.id === itemId) {
                loadIntoStudio(null);
            }
        }
    } catch (err) {
        console.error("İçerik silme hatası:", err);
    }
}

function initGridModal() {
    const cells = document.querySelectorAll('.grid-cell');
    const modal = document.getElementById('modalOverlay');
    const backBtn = document.getElementById('modalBackBtn');
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
    if (backBtn) {
        backBtn.addEventListener('click', () => {
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
                btnCopyCaption.innerHTML = 'Kopyalandı!';
                setTimeout(() => {
                    btnCopyCaption.innerHTML = 'Metni Kopyala';
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

    // Studio details card controls
    const btnStudioCopy = document.getElementById('btnStudioCopyCaption');
    if (btnStudioCopy) {
        btnStudioCopy.addEventListener('click', () => {
            const captionText = document.getElementById('studioCaptionText').value;
            if (captionText) {
                navigator.clipboard.writeText(captionText).then(() => {
                    btnStudioCopy.innerHTML = 'Kopyalandı!';
                    setTimeout(() => {
                        btnStudioCopy.innerHTML = 'Metni Kopyala';
                    }, 2000);
                }).catch(err => {
                    alert('Metin kopyalanamadı: ' + err);
                });
            }
        });
    }

    const btnStudioFav = document.getElementById('btnStudioFavToggle');
    if (btnStudioFav) {
        btnStudioFav.addEventListener('click', async () => {
            if (currentStudioItem) {
                await toggleFavorite(currentStudioItem.id, null);
                await loadHistory();
            }
        });
    }

    // Generate Button click handler
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const sector = document.getElementById('formSector').value || 'Genel';
            const prompt = document.getElementById('formPrompt').value;
            const ratio = document.getElementById('formRatio').value;
            const model = null;
            const resolution = document.getElementById('formResolution').value;
            const hdQuality = document.getElementById('toggleHD').checked;
            const enhancedPrompt = document.getElementById('toggleEnhanced').checked;
            
            if (!prompt) {
                alert("Lütfen ne paylaşmak istediğinizi kısaca yazın.");
                return;
            }

            generateBtn.innerText = "ÜRETİLİYOR...";
            generateBtn.disabled = true;
            
            // Show loading overlay inside studio preview
            const studioLoadingOverlay = document.getElementById('studioLoadingOverlay');
            const studioPlaceholder = document.getElementById('studioPlaceholder');
            const studioPreviewImg = document.getElementById('studioPreviewImg');
            
            if (studioLoadingOverlay) studioLoadingOverlay.style.display = 'flex';
            if (studioPlaceholder) studioPlaceholder.style.display = 'none';
            if (studioPreviewImg) studioPreviewImg.style.display = 'none';

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
                        profileId: parseInt(document.getElementById('formProfileSelect').value) || null,
                        ...(model && { model }),
                        resolution: resolution,
                        hd: hdQuality,
                        enhanced: enhancedPrompt,
                        temporaryOverrides: {
                            industry: sector
                        }
                    })
                });

                const data = await res.json();

                // Hide loading overlay
                if (studioLoadingOverlay) studioLoadingOverlay.style.display = 'none';

                if (!res.ok) {
                    throw new Error(data.error || data.message || 'Üretim hatası');
                }

                // Success
                cachedHistory.unshift(data.content);
                renderGrids();
                
                // Load newly generated content directly into Studio Preview Frame
                loadIntoStudio(data.content);
                
                // Refresh model status immediately
                await updateModelStatus();

            } catch (err) {
                if (studioLoadingOverlay) studioLoadingOverlay.style.display = 'none';
                
                // If it failed, restore current item or placeholder
                if (currentStudioItem) {
                    loadIntoStudio(currentStudioItem);
                } else {
                    if (studioPlaceholder) studioPlaceholder.style.display = 'flex';
                }
                
                alert("Üretim Sırasında Hata Oluştu:\n" + err.message);
            } finally {
                generateBtn.innerText = "OLUŞTUR";
                generateBtn.disabled = false;
                document.getElementById('formPrompt').value = '';
            }
        });
    }
}

async function updateModelStatus() {
    if (!currentToken) return;
    try {
        const res = await fetch(`${API_URL}/content/model-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        const data = await res.json();
        if (res.ok && data.status) {
            const status = data.status;
            
            const models = [
                { id: 'generate', name: 'imagen-4.0-generate-001' },
                { id: 'ultra', name: 'imagen-4.0-ultra-generate-001' },
                { id: 'fast', name: 'imagen-4.0-fast-generate-001' }
            ];
            
            let foundActive = false;
            
            models.forEach(m => {
                const count = status[m.name] || 0;
                const progressPct = Math.min((count / 25) * 100, 100);
                
                const rpdEl = document.getElementById(`rpd-${m.id}`);
                const progressEl = document.getElementById(`progress-${m.id}`);
                const dotEl = document.getElementById(`dot-${m.id}`);
                
                if (rpdEl) rpdEl.innerText = `${count}/25 RPD`;
                if (progressEl) progressEl.style.width = `${progressPct}%`;
                
                if (dotEl) {
                    dotEl.className = 'model-status-dot';
                    if (count >= 25) {
                        dotEl.classList.add('exhausted');
                    } else if (!foundActive) {
                        dotEl.classList.add('active');
                        foundActive = true;
                    } else {
                        dotEl.classList.add('waiting');
                    }
                }
            });
        }
    } catch (err) {
        console.error("Model durum güncelleme hatası:", err);
    }
}

let currentStudioItem = null;

function loadIntoStudio(item) {
    currentStudioItem = item;
    
    const placeholder = document.getElementById('studioPlaceholder');
    const img = document.getElementById('studioPreviewImg');
    const caption = document.getElementById('studioCaptionText');
    const format = document.getElementById('studioMetaFormat');
    const model = document.getElementById('studioMetaModel');
    const downloadBtn = document.getElementById('btnStudioDownloadImg');
    const favBtn = document.getElementById('btnStudioFavToggle');
    
    if (!item) {
        if (placeholder) placeholder.style.display = 'flex';
        if (img) img.style.display = 'none';
        if (caption) caption.value = '';
        if (format) format.innerText = 'FORMAT: Kare (1:1)';
        if (model) model.innerText = 'MODEL: -';
        return;
    }
    
    const { imageUrl, captionText } = parseGeneratedContent(item.generated_content);
    
    if (placeholder) placeholder.style.display = 'none';
    if (img) {
        img.src = imageUrl || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop';
        img.style.display = 'block';
    }
    if (caption) caption.value = captionText;
    
    // Aspect Ratio text
    let ratioText = 'Kare (1:1)';
    if (item.generated_content.includes('aspect-ratio: 9 / 16')) ratioText = 'Reels / Story (9:16)';
    if (item.generated_content.includes('aspect-ratio: 16 / 9')) ratioText = 'Yatay / Banner (16:9)';
    if (format) format.innerText = `FORMAT: ${ratioText}`;
    
    if (model) model.innerText = `MODEL: ${item.model_used || 'Imagen 4.0'}`;
    
    if (downloadBtn) downloadBtn.href = imageUrl;
    
    // Update Fav toggle status
    if (favBtn) {
        if (item.is_favorite) {
            favBtn.classList.add('active');
            favBtn.innerHTML = 'Favorilerde';
        } else {
            favBtn.classList.remove('active');
            favBtn.innerHTML = 'Favorile';
        }
    }
    
    // Highlight active thumbnail in strip
    document.querySelectorAll('.mini-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (parseInt(thumb.dataset.id) === item.id) {
            thumb.classList.add('active');
        }
    });
}

/* ── Profiles Dropdown & Wizard Logic (Etap 2) ─────────────── */
let activeProfiles = [];

async function loadProfiles() {
    if (!currentToken) return;

    try {
        const res = await fetch(`${API_URL}/profiles`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        const data = await res.json();
        
        if (res.ok) {
            activeProfiles = data.profiles || [];
            
            // Populate dashboard select
            const dashboardSelect = document.getElementById('dashboardProfileSelect');
            const formSelect = document.getElementById('formProfileSelect');
            
            if (dashboardSelect) {
                dashboardSelect.innerHTML = activeProfiles.map(p => 
                    `<option value="${p.id}" ${p.is_default ? 'selected' : ''}>${p.brand_name || p.name}</option>`
                ).join('');
                
                // Add a listener to change profile
                dashboardSelect.onchange = (e) => {
                    const selectedId = parseInt(e.target.value);
                    if (formSelect) formSelect.value = selectedId;
                    // Trigger custom updates if needed
                    const activeP = activeProfiles.find(p => p.id === selectedId);
                    if (activeP) {
                        const sectorInput = document.getElementById('formSector');
                        if (sectorInput) sectorInput.value = activeP.sector;
                    }
                };
            }
            
            if (formSelect) {
                formSelect.innerHTML = activeProfiles.map(p => 
                    `<option value="${p.id}" ${p.is_default ? 'selected' : ''}>${p.brand_name || p.name}</option>`
                ).join('');
                
                formSelect.onchange = (e) => {
                    const selectedId = parseInt(e.target.value);
                    if (dashboardSelect) dashboardSelect.value = selectedId;
                    const activeP = activeProfiles.find(p => p.id === selectedId);
                    if (activeP) {
                        const sectorInput = document.getElementById('formSector');
                        if (sectorInput) sectorInput.value = activeP.sector;
                    }
                };
                
                // Trigger change to set initial sector
                if (formSelect.value) {
                    formSelect.dispatchEvent(new Event('change'));
                }
            }
        }
    } catch (err) {
        console.error("Profiles loading failed:", err);
    }
}

function initProfileWizard() {
    const dashboardView = document.getElementById('dashboardView');
    const profileNewView = document.getElementById('profileNewView');
    const btnNewProfile = document.getElementById('btnNewProfile');
    const btnProfileNewBack = document.getElementById('btnProfileNewBack');
    
    if (!btnNewProfile) return;
    
    // Toggle new profile view
    btnNewProfile.addEventListener('click', () => {
        dashboardView.style.display = 'none';
        profileNewView.style.display = 'block';
        resetWizard();
    });
    
    btnProfileNewBack.addEventListener('click', () => {
        profileNewView.style.display = 'none';
        dashboardView.style.display = 'flex';
    });
    
    // Steps navigation state
    let currentStep = 0;
    let selectedTier = ''; // 'hizli', 'detayli', 'cok_detayli'
    let logoUrl = '';
    let screenshotUrl = '';
    let aiAnalysis = null;
    
    // File inputs & preview containers
    const inputLogoFile = document.getElementById('inputLogoFile');
    const logoUploadBox = document.getElementById('logoUploadBox');
    const logoPreviewContainer = document.getElementById('logoPreviewContainer');
    const logoPreviewImg = document.getElementById('logoPreviewImg');
    const btnRemoveLogo = document.getElementById('btnRemoveLogo');
    
    const inputScreenshotFile = document.getElementById('inputScreenshotFile');
    const screenshotUploadBox = document.getElementById('screenshotUploadBox');
    const screenshotPreviewContainer = document.getElementById('screenshotPreviewContainer');
    const screenshotPreviewImg = document.getElementById('screenshotPreviewImg');
    const btnRemoveScreenshot = document.getElementById('btnRemoveScreenshot');
    
    // Custom radio pills handlers
    setupPills('langPillGroup');
    setupPills('tonePillGroup');
    setupPills('pricePillGroup');
    setupPills('typoPillGroup');
    setupPills('addressPillGroup');
    setupPills('emojiPillGroup');
    setupPills('punctPillGroup');
    setupCheckboxes('genderCheckboxGroup');
    
    // Step 0 select tier card
    document.querySelectorAll('.tier-card').forEach(card => {
        const btn = card.querySelector('.btn-tier-select');
        btn.addEventListener('click', () => {
            selectedTier = card.dataset.tier;
            goToStep(1);
        });
    });
    
    // Logo Upload Logic
    logoUploadBox.addEventListener('click', () => inputLogoFile.click());
    inputLogoFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        logoUploadBox.style.display = 'none';
        logoPreviewContainer.style.display = 'flex';
        logoPreviewImg.src = URL.createObjectURL(file);
        
        // Upload file as base64 to local server
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileData = event.target.result;
                logoUploadBox.querySelector('.upload-text').innerText = "Logo Yükleniyor...";
                const res = await fetch(`${API_URL}/profiles/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ fileData, fileName: file.name })
                });
                const data = await res.json();
                if (res.ok) {
                    logoUrl = data.url;
                    logoUploadBox.querySelector('.upload-text').innerText = "Logo Yüklemek İçin Tıklayın";
                    checkStep1Validation();
                } else {
                    alert('Logo yüklenemedi: ' + data.error);
                    btnRemoveLogo.click();
                }
            } catch (err) {
                console.error(err);
                alert('Logo yüklenirken hata oluştu.');
                btnRemoveLogo.click();
            }
        };
        reader.readAsDataURL(file);
    });
    
    btnRemoveLogo.addEventListener('click', () => {
        inputLogoFile.value = '';
        logoUrl = '';
        logoPreviewImg.src = '';
        logoPreviewContainer.style.display = 'none';
        logoUploadBox.style.display = 'flex';
        checkStep1Validation();
    });
    
    // Screenshot Upload Logic
    screenshotUploadBox.addEventListener('click', () => inputScreenshotFile.click());
    inputScreenshotFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        screenshotUploadBox.style.display = 'none';
        screenshotPreviewContainer.style.display = 'flex';
        screenshotPreviewImg.src = URL.createObjectURL(file);
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileData = event.target.result;
                screenshotUploadBox.querySelector('.upload-text').innerText = "Görsel Yükleniyor...";
                const res = await fetch(`${API_URL}/profiles/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ fileData, fileName: file.name })
                });
                const data = await res.json();
                if (res.ok) {
                    screenshotUrl = data.url;
                    screenshotUploadBox.querySelector('.upload-text').innerText = "Ekran Görüntüsü Yükleyin";
                } else {
                    alert('Görsel yüklenemedi: ' + data.error);
                    btnRemoveScreenshot.click();
                }
            } catch (err) {
                console.error(err);
                alert('Görsel yüklenirken hata oluştu.');
                btnRemoveScreenshot.click();
            }
        };
        reader.readAsDataURL(file);
    });
    
    btnRemoveScreenshot.addEventListener('click', () => {
        inputScreenshotFile.value = '';
        screenshotUrl = '';
        screenshotPreviewImg.src = '';
        screenshotPreviewContainer.style.display = 'none';
        screenshotUploadBox.style.display = 'flex';
    });
    
    // AI analysis trigger button
    const btnAnalyzeBrand = document.getElementById('btnAnalyzeBrand');
    const analysisStatus = document.getElementById('analysisStatus');
    const aiAnalysisResult = document.getElementById('aiAnalysisResult');
    const editableOverrides = document.getElementById('editableOverrides');
    
    btnAnalyzeBrand.addEventListener('click', async () => {
        if (!logoUrl) return;
        
        btnAnalyzeBrand.disabled = true;
        btnAnalyzeBrand.innerText = "⏳ Görseller Yapay Zeka İle Analiz Ediliyor...";
        analysisStatus.innerText = "Yapay zeka marka kimliğinizi çözümlüyor, lütfen bekleyin...";
        analysisStatus.style.display = 'block';
        aiAnalysisResult.style.display = 'none';
        editableOverrides.style.display = 'none';
        
        try {
            const res = await fetch(`${API_URL}/profiles/analyze-brand`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ logoUrl, screenshotUrl })
            });
            const data = await res.json();
            
            if (res.ok) {
                aiAnalysis = data;
                
                // Display results
                renderAnalysisResult(data);
                
                // Setup editable fields
                document.getElementById('primaryColorText').value = data.primary_color || '#000000';
                document.getElementById('primaryColorVal').value = data.primary_color || '#000000';
                document.getElementById('primaryColorPreview').style.backgroundColor = data.primary_color || '#000000';
                
                document.getElementById('secondaryColorText').value = data.secondary_color || '#FFFFFF';
                document.getElementById('secondaryColorVal').value = data.secondary_color || '#FFFFFF';
                document.getElementById('secondaryColorPreview').style.backgroundColor = data.secondary_color || '#FFFFFF';
                
                document.getElementById('accentColorText').value = data.accent_color || '#CCCCCC';
                document.getElementById('accentColorVal').value = data.accent_color || '#CCCCCC';
                document.getElementById('accentColorPreview').style.backgroundColor = data.accent_color || '#CCCCCC';
                
                // Preselect tone
                if (data.tone) {
                    const toneBtn = document.querySelector(`#tonePillGroup button[data-val="${data.tone.toLowerCase()}"]`);
                    if (toneBtn) toneBtn.click();
                }
                
                analysisStatus.innerText = "✅ Analiz başarıyla tamamlandı!";
                aiAnalysisResult.style.display = 'block';
                editableOverrides.style.display = 'block';
                checkStep1Validation();
            } else {
                analysisStatus.innerText = "❌ Analiz başarısız: " + data.error;
            }
        } catch (err) {
            console.error(err);
            analysisStatus.innerText = "❌ Sunucu bağlantı hatası oluştu.";
        } finally {
            btnAnalyzeBrand.disabled = false;
            btnAnalyzeBrand.innerText = "🔍 Görselleri Yapay Zeka İle Analiz Et";
        }
    });
    
    // Color pickers sync logic
    setupColorPicker('primaryColorVal', 'primaryColorText', 'primaryColorPreview');
    setupColorPicker('secondaryColorVal', 'secondaryColorText', 'secondaryColorPreview');
    setupColorPicker('accentColorVal', 'accentColorText', 'accentColorPreview');
    
    // Range Sliders
    const ageMinSlider = document.getElementById('ageMinSlider');
    const ageMaxSlider = document.getElementById('ageMaxSlider');
    const ageMinVal = document.getElementById('ageMinVal');
    const ageMaxVal = document.getElementById('ageMaxVal');
    const ageRangeLabel = document.getElementById('ageRangeLabel');
    
    function updateAgeLabel() {
        let min = parseInt(ageMinSlider.value);
        let max = parseInt(ageMaxSlider.value);
        if (min >= max) {
            min = max - 1;
            ageMinSlider.value = min;
        }
        ageMinVal.innerText = min;
        ageMaxVal.innerText = max;
        ageRangeLabel.innerText = `${min} - ${max}`;
    }
    ageMinSlider.addEventListener('input', updateAgeLabel);
    ageMaxSlider.addEventListener('input', updateAgeLabel);
    
    // Step validation checks
    const newProfileName = document.getElementById('newProfileName');
    const newBrandName = document.getElementById('newBrandName');
    const newProfileSector = document.getElementById('newProfileSector');
    
    function checkStep1Validation() {
        const isNameOk = newProfileName.value.trim().length > 0;
        const isBrandOk = newBrandName.value.trim().length > 0;
        const isSectorOk = newProfileSector.value.length > 0;
        const isLogoOk = logoUrl.length > 0;
        const isAnalysisOk = aiAnalysis !== null;
        
        const btnNext = document.getElementById('btnStep1Next');
        if (isNameOk && isBrandOk && isSectorOk && isLogoOk && isAnalysisOk) {
            btnNext.disabled = false;
            btnNext.innerText = selectedTier === 'hizli' ? 'Profili Kaydet' : 'İleri →';
        } else {
            btnNext.disabled = true;
            btnNext.innerText = selectedTier === 'hizli' ? 'Profili Kaydet' : 'İleri →';
        }
    }
    
    newProfileName.addEventListener('input', checkStep1Validation);
    newBrandName.addEventListener('input', checkStep1Validation);
    newProfileSector.addEventListener('change', checkStep1Validation);
    
    // Steps navigation clicks
    document.getElementById('btnStep1Back').addEventListener('click', () => goToStep(0));
    document.getElementById('btnStep1Next').addEventListener('click', () => {
        if (selectedTier === 'hizli') {
            saveProfile();
        } else {
            goToStep(2);
        }
    });
    
    document.getElementById('btnStep2Back').addEventListener('click', () => goToStep(1));
    document.getElementById('btnStep2Next').addEventListener('click', () => {
        if (selectedTier === 'detayli') {
            saveProfile();
        } else {
            goToStep(3);
        }
    });
    
    document.getElementById('btnStep3Back').addEventListener('click', () => goToStep(2));
    document.getElementById('btnStep3Next').addEventListener('click', () => saveProfile());
    
    // Helper to switch active step views
    function goToStep(step) {
        currentStep = step;
        
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
        
        // Show active step
        document.getElementById(`wizardStep${step}`).style.display = 'block';
        
        // Steps indicator
        const stepsIndicator = document.getElementById('profileStepsIndicator');
        if (step === 0) {
            stepsIndicator.style.display = 'none';
        } else {
            stepsIndicator.style.display = 'flex';
            const totalSteps = selectedTier === 'hizli' ? 1 : selectedTier === 'detayli' ? 2 : 3;
            stepsIndicator.innerHTML = Array.from({ length: totalSteps }, (_, i) => {
                let statusClass = 'pending';
                if (step === i + 1) statusClass = 'active';
                if (step > i + 1) statusClass = 'completed';
                return `<div class="step-dot ${statusClass}">${i + 1}</div>`;
            }).join('<div class="step-connector"></div>');
        }
        
        // Screenshot field conditional
        const screenshotGroup = document.getElementById('screenshotGroup');
        if (screenshotGroup) {
            screenshotGroup.style.display = selectedTier === 'hizli' ? 'none' : 'block';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function resetWizard() {
        newProfileName.value = '';
        newBrandName.value = '';
        newProfileSector.value = '';
        btnRemoveLogo.click();
        btnRemoveScreenshot.click();
        
        analysisStatus.style.display = 'none';
        analysisStatus.innerText = '';
        aiAnalysisResult.style.display = 'none';
        editableOverrides.style.display = 'none';
        aiAnalysis = null;
        
        // Set defaults for pills
        resetPills('langPillGroup', 'Türkçe');
        resetPills('tonePillGroup', 'samimi');
        resetPills('pricePillGroup', 'Orta Segment');
        resetPills('typoPillGroup', 'Dengeli');
        resetPills('addressPillGroup', 'Sen');
        resetPills('emojiPillGroup', 'Orta');
        resetPills('punctPillGroup', 'Standart');
        resetPills('genderCheckboxGroup', 'Hepsi');
        
        document.getElementById('newProfileCompetitors').value = '';
        document.getElementById('newProfileInterests').value = '';
        document.getElementById('newProfileNeverWords').value = '';
        document.getElementById('newProfileAlwaysWords').value = '';
        
        ageMinSlider.value = 18;
        ageMaxSlider.value = 45;
        updateAgeLabel();
        
        goToStep(0);
    }
    
    function renderAnalysisResult(data) {
        const body = document.querySelector('#aiAnalysisResult .analysis-card-body');
        const themes = data.content_themes ? data.content_themes.map(t => `<span class="analysis-tag">${t}</span>`).join('') : '-';
        body.innerHTML = `
            <div class="result-item"><strong>Marka Açıklaması:</strong> ${data.brand_description || '-'}</div>
            <div class="result-item"><strong>Görsel Stil:</strong> ${data.visual_style || '-'}</div>
            <div class="result-item"><strong>Genel Estetik:</strong> ${data.overall_aesthetic || '-'}</div>
            <div class="result-item"><strong>Tipografi Duygusu:</strong> <span class="analysis-tag">${data.typography_feeling || '-'}</span></div>
            <div class="result-item"><strong>Fiyat Segmenti Önerisi:</strong> <span class="analysis-tag">${data.suggested_price_segment || '-'}</span></div>
            <div class="result-item"><strong>Temalar:</strong> <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px;">${themes}</div></div>
        `;
    }
    
    async function saveProfile() {
        const saveBtn = document.getElementById(`btnStep${currentStep}Next`);
        saveBtn.disabled = true;
        saveBtn.innerText = "⏳ Kaydediliyor...";
        
        const activeToneBtn = document.querySelector('#tonePillGroup button.active');
        const activeLangBtn = document.querySelector('#langPillGroup button.active');
        
        const payload = {
            name: newProfileName.value.trim(),
            brand_name: newBrandName.value.trim(),
            sector: newProfileSector.value,
            tone: activeToneBtn ? activeToneBtn.dataset.val : 'samimi',
            primary_color: document.getElementById('primaryColorText').value,
            secondary_color: document.getElementById('secondaryColorText').value,
            accent_color: document.getElementById('accentColorText').value,
            logo_url: logoUrl,
            screenshot_url: screenshotUrl || null,
            brand_analysis: aiAnalysis,
            profile_tier: selectedTier,
            content_language: activeLangBtn ? activeLangBtn.dataset.val : 'Türkçe',
        };
        
        if (selectedTier !== 'hizli') {
            const activePriceBtn = document.querySelector('#pricePillGroup button.active');
            const activeTypoBtn = document.querySelector('#typoPillGroup button.active');
            const activeAddressBtn = document.querySelector('#addressPillGroup button.active');
            const activeEmojiBtn = document.querySelector('#emojiPillGroup button.active');
            
            payload.price_segment = activePriceBtn ? activePriceBtn.dataset.val : 'Orta Segment';
            payload.typography_preference = activeTypoBtn ? activeTypoBtn.dataset.val : 'Dengeli';
            
            payload.competitor_accounts = document.getElementById('newProfileCompetitors').value
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
                
            payload.brand_language = {
                address_style: activeAddressBtn ? activeAddressBtn.dataset.val : 'Sen',
                emoji_usage: activeEmojiBtn ? activeEmojiBtn.dataset.val : 'Orta',
            };
        }
        
        if (selectedTier === 'cok_detayli') {
            const activePunctBtn = document.querySelector('#punctPillGroup button.active');
            const activeGenders = Array.from(document.querySelectorAll('#genderCheckboxGroup button.active')).map(b => b.dataset.val);
            
            payload.brand_language.punctuation_style = activePunctBtn ? activePunctBtn.dataset.val : 'Standart';
            payload.brand_language.never_words = document.getElementById('newProfileNeverWords').value
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            payload.brand_language.always_words = document.getElementById('newProfileAlwaysWords').value
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
                
            payload.target_audience = {
                age_min: parseInt(ageMinSlider.value),
                age_max: parseInt(ageMaxSlider.value),
                gender: activeGenders,
                interests: document.getElementById('newProfileInterests').value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
            };
        }
        
        try {
            const res = await fetch(`${API_URL}/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                // Refresh list & close
                await loadProfiles();
                // Find and select newly created profile
                const selectEl = document.getElementById('dashboardProfileSelect');
                if (selectEl && data.profile) {
                    selectEl.value = data.profile.id;
                    selectEl.dispatchEvent(new Event('change'));
                }
                btnProfileNewBack.click();
            } else {
                alert('Profil kaydedilemedi: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Kaydetme sırasında bir sunucu hatası oluştu.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = currentStep === 3 ? "Profili Kaydet" : "İleri →";
        }
    }
}

// Helper: Custom Radio Pills
function setupPills(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
}

function resetPills(containerId, defaultVal) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('button').forEach(b => {
        if (b.dataset.val === defaultVal) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
}

// Helper: Checkbox Pills (multi-select)
function setupCheckboxes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const val = btn.dataset.val;
        if (val === 'Hepsi') {
            container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        } else {
            const hepsiBtn = container.querySelector('button[data-val="Hepsi"]');
            if (hepsiBtn) hepsiBtn.classList.remove('active');
            
            btn.classList.toggle('active');
            
            // If nothing is selected, default back to Hepsi
            const activeCount = container.querySelectorAll('button.active').length;
            if (activeCount === 0 && hepsiBtn) {
                hepsiBtn.classList.add('active');
            }
        }
    });
}

// Helper: Sync color inputs
function setupColorPicker(valId, textId, previewId) {
    const valEl = document.getElementById(valId);
    const textEl = document.getElementById(textId);
    const previewEl = document.getElementById(previewId);
    
    if (!valEl || !textEl || !previewEl) return;
    
    valEl.addEventListener('input', (e) => {
        textEl.value = e.target.value.toUpperCase();
        previewEl.style.backgroundColor = e.target.value;
    });
    
    textEl.addEventListener('input', (e) => {
        const val = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            valEl.value = val;
            previewEl.style.backgroundColor = val;
        }
    });
}
