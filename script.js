import { supabase } from "./supabase_config.js";
import { withSmartSpace, detectSmartSpaceKey } from "./lib/smart_spaces.js";

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "./login.html";
    }
}
checkSession();

const _i = "M2YyODczMDUwNWZlNGFiZjI4YzA4MmQyM2YzOTVhMWI=";
const IMGBB_API_KEY = atob(_i);

const feedContainer = document.getElementById('feed-container');
const modal = document.getElementById('add-modal');
const saveBtn = document.getElementById('save-btn');

const fileInput = document.getElementById('file-input');
const uploadTrigger = document.getElementById('upload-trigger-btn');
const previewContainer = document.getElementById('image-preview-container');
const previewGrid = document.getElementById('preview-grid');
const clearImgsBtn = document.getElementById('clear-imgs-btn');
const urlInput = document.getElementById('input-url');
const searchInput = document.getElementById('search-input');

let selectedFiles = [];
let allLinksData = [];
let realtimeChannel = null;
let selectedIds = [];
let isSelectMode = false;
let offset = 0;
const LIMIT = 30;
let isFetching = false;
let hasMore = true;

// সুন্দর লোডার দেখানোর ফাংশন
function showLoader(message) {
    if (!feedContainer) return;
    feedContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">${message}</p>
        </div>
    `;
}

// পেজ লোড হলে ডাটা আনবে
window.onload = async () => {
    // Context menu block করা
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        e.preventDefault();
    }, false);

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'shared') {
        await handleSharedContent();
    }

    fetchLinks();
    setupRealtimeSubscription();
    setupSelectionMode();
    setupInfiniteScroll();
    loadSpacesForDropdown();
    setupSmartSpaceDetection();
    setupInlineSpaceCreation();
};

// Infinite Scroll Setup
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isFetching || !hasMore) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const threshold = document.body.offsetHeight - 800;
        
        if (scrollPosition >= threshold) {
            fetchLinks(true);
        }
    });
}

// Smart Space Name Mapping (for badge display)
const SMART_SPACE_NAMES = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    twitter: 'Twitter / X',
    linkedin: 'LinkedIn',
    gallery: 'Gallery',
    notes: 'Notes',
    links: 'Links',
};

// URL paste korlei auto-detect kore badge show korbe
function setupSmartSpaceDetection() {
    const urlInput = document.getElementById('input-url');
    const smartBadge = document.getElementById('smart-space-badge');
    const smartText = document.getElementById('smart-space-text');
    const dropdown = document.getElementById('space-select-dropdown');
    
    if (!urlInput || !smartBadge || !smartText) return;
    
    urlInput.addEventListener('input', () => {
        const url = urlInput.value.trim();
        
        if (!url) {
            smartBadge.style.display = 'none';
            if (dropdown) dropdown.value = '';
            return;
        }
        
        // Validate URL minimal
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('.')) {
            smartBadge.style.display = 'none';
            return;
        }
        
        const spaceKey = detectSmartSpaceKey(url);
        const spaceName = SMART_SPACE_NAMES[spaceKey] || 'Links';
        
        smartText.textContent = `Will auto-save to "${spaceName}"`;
        smartBadge.style.display = 'flex';
        
        // Auto-select hobe na — user chaile manually dropdown theke select korte parbe
        // dropdown stays at "Auto Sort"
    });
    
    // Image select korle gallery detect
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                smartText.textContent = 'Will auto-save to "Gallery"';
                smartBadge.style.display = 'flex';
            }
        });
    }
}

// Load spaces for dropdown
async function loadSpacesForDropdown() {
    const dropdown = document.getElementById('space-select-dropdown');
    if (!dropdown) return;
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;
    
    const { data: spaces, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', user.id);
        
    if (error || !spaces) return;
    
    // Build a map of spaces
    const spaceMap = new Map();
    spaces.forEach(s => spaceMap.set(s.id, s));
    
    // Helper to get full path
    function getFullPath(space) {
        let path = space.name;
        let current = space;
        while (current.parent_id && spaceMap.has(current.parent_id)) {
            current = spaceMap.get(current.parent_id);
            path = current.name + ' / ' + path;
        }
        return path;
    }
    
    // Sort alphabetically by full path
    const sortedSpaces = spaces.map(s => ({
        ...s,
        fullPath: getFullPath(s)
    })).sort((a, b) => a.fullPath.localeCompare(b.fullPath));
    
    // Populate dropdown
    dropdown.innerHTML = '<option value="">Auto Sort (Smart Space)</option>';
    sortedSpaces.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.fullPath;
        dropdown.appendChild(option);
    });
}

// Inline Space Creation
function setupInlineSpaceCreation() {
    const newSpaceBtn = document.getElementById('new-space-inline-btn');
    const inlineForm = document.getElementById('inline-create-space');
    const inlineName = document.getElementById('inline-space-name');
    const confirmBtn = document.getElementById('inline-create-confirm');
    const cancelBtn = document.getElementById('inline-create-cancel');
    
    if (!newSpaceBtn || !inlineForm) return;
    
    newSpaceBtn.onclick = () => {
        inlineForm.style.display = 'flex';
        inlineName.focus();
    };
    
    cancelBtn.onclick = () => {
        inlineForm.style.display = 'none';
        inlineName.value = '';
    };
    
    confirmBtn.onclick = async () => {
        const name = inlineName.value.trim();
        if (!name) {
            alert('Please enter a space name');
            return;
        }
        
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Creating...';
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Not logged in');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Create';
            return;
        }
        
        const { data: created, error } = await supabase
            .from('spaces')
            .insert({
                name: name,
                parent_id: null,
                user_id: user.id
            })
            .select('id')
            .single();
        
        if (error) {
            alert('Error: ' + error.message);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Create';
            return;
        }
        
        // Refresh dropdown and auto-select the new space
        await loadSpacesForDropdown();
        
        const dropdown = document.getElementById('space-select-dropdown');
        if (dropdown && created) {
            dropdown.value = created.id;
        }
        
        // Hide inline form
        inlineForm.style.display = 'none';
        inlineName.value = '';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Create';
        
        // Update smart badge
        const smartBadge = document.getElementById('smart-space-badge');
        const smartText = document.getElementById('smart-space-text');
        if (smartBadge && smartText) {
            smartText.textContent = `Saving to "${name}" (manual select)`;
            smartBadge.style.display = 'flex';
        }
    };
    
    // Enter key submit
    inlineName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmBtn.click();
        }
    });
}

// Selection Mode Setup
function setupSelectionMode() {
    const multiSelectBtn = document.getElementById('multi-select-btn');
    const multiDeleteBar = document.getElementById('multi-delete-bar');
    const cancelSelection = document.getElementById('cancel-selection');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const selectedCountEl = document.getElementById('selected-count');

    multiSelectBtn.onclick = () => {
        if (isSelectMode) {
            exitSelectionMode();
        } else {
            startSelectionMode();
        }
    };

    cancelSelection.onclick = exitSelectionMode;

    deleteSelectedBtn.onclick = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} items?`)) return;

        deleteSelectedBtn.disabled = true;
        deleteSelectedBtn.innerHTML = '<span class="material-icons">refresh</span> Deleting...';

        const { error } = await supabase.from('mind_links').delete().in('id', selectedIds);

        if (!error) {
            exitSelectionMode();
            fetchLinks();
        } else {
            alert("Error deleting items: " + error.message);
        }
        
        deleteSelectedBtn.disabled = false;
        deleteSelectedBtn.innerHTML = '<span class="material-icons">delete</span> Delete';
    };

    function startSelectionMode(firstId, firstCard) {
        isSelectMode = true;
        multiDeleteBar.style.display = 'flex';
        if (firstId && firstCard) toggleSelection(firstId, firstCard);
    }

    function exitSelectionMode() {
        isSelectMode = false;
        selectedIds = [];
        multiDeleteBar.style.display = 'none';
        document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    }

    function toggleSelection(id, cardElement) {
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter(i => i !== id);
            cardElement.classList.remove('selected');
        } else {
            selectedIds.push(id);
            cardElement.classList.add('selected');
        }
        selectedCountEl.innerText = `${selectedIds.length} selected`;
        if (selectedIds.length === 0) exitSelectionMode();
    }

    window.startSelectionMode = startSelectionMode;
    window.toggleSelection = toggleSelection;
}

// Real-time Updates
function setupRealtimeSubscription() {
    if (realtimeChannel) return;
    
    realtimeChannel = supabase
        .channel('mind_links_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'mind_links' },
            (payload) => {
                // Debounce bursty realtime events to avoid spamming fetchLinks().
                // If a fetch is already in-flight, queue a single refresh.
                scheduleRealtimeRefresh(payload);
            }
        )
        .subscribe();
}

let realtimeRefreshTimer = null;
let realtimeRefreshQueued = false;
let realtimeRefreshInProgress = false;

function scheduleRealtimeRefresh(_payload) {
    // If we're currently fetching, queue exactly one refresh.
    if (isFetching || realtimeRefreshInProgress) {
        realtimeRefreshQueued = true;
        if (!realtimeRefreshTimer) {
            realtimeRefreshTimer = setTimeout(runRealtimeRefresh, 500);
        }
        return;
    }

    // Debounce: reset timer on each event, then refresh once.
    if (realtimeRefreshTimer) clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = setTimeout(runRealtimeRefresh, 500);
}

async function runRealtimeRefresh() {
    if (realtimeRefreshTimer) {
        clearTimeout(realtimeRefreshTimer);
        realtimeRefreshTimer = null;
    }

    if (isFetching) {
        realtimeRefreshQueued = true;
        realtimeRefreshTimer = setTimeout(runRealtimeRefresh, 500);
        return;
    }

    realtimeRefreshInProgress = true;
    try {
        await fetchLinks(false);
    } finally {
        realtimeRefreshInProgress = false;

        if (realtimeRefreshQueued) {
            realtimeRefreshQueued = false;
            realtimeRefreshTimer = setTimeout(runRealtimeRefresh, 500);
        }
    }
}

async function handleSharedContent() {
    try {
        showLoader("Processing shared content");
        
        const cache = await caches.open('share-data');
        const dataRes = await cache.match('shared-data');
        
        if (dataRes) {
            const data = await dataRes.json();
            const fileRes = await cache.match('shared-file');
            
            await cache.delete('shared-data');
            if (fileRes) await cache.delete('shared-file');

            if (fileRes) {
                const blob = await fileRes.blob();
                const file = new File([blob], "shared_image.jpg", { type: blob.type });
                await uploadImageAndSave(file, data.title || "Shared from Gallery");
            } else {
                let rawLink = data.url || data.text;
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const foundLinks = rawLink.match(urlRegex);
                const finalUrl = foundLinks ? foundLinks[0] : null;

                if (finalUrl) {
                    await saveLinkAutomatic(finalUrl, data.title);
                } else {
                    fetchLinks();
                }
            }
        } else {
            fetchLinks();
        }
    } catch (e) {
        console.error('Share handling error:', e);
        fetchLinks();
    }
    
    window.history.replaceState({}, document.title, window.location.pathname);
}

async function uploadImageAndSave(file, title) {
    showLoader("Uploading shared image");
    try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            const { error } = await supabase.from('mind_links').insert(
                await withSmartSpace(supabase, {
                    url: result.data.url,
                    title: title || "Shared Image",
                    image_url: result.data.url,
                    thumbnail_url: result.data.thumb.url,
                    tags: "Shared, Gallery, Image"
                }, { type: 'gallery' })
            );
            if (!error) {
                window.location.href = "./features/success_splash/index.html";
            }
        }
    } catch (e) {
        alert("Upload failed");
        fetchLinks();
    }
}

async function saveLinkAutomatic(url, title) {
    showLoader("Saving link to your mind");
    let finalImage = getYouTubeThumbnail(url);
    let finalTitle = title;
    let finalDesc = "";
    
    if (!finalImage) {
        try {
            const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
            const meta = await res.json();
            if (meta.status === 'success') {
                if (meta.data.image) {
                    const microlinkImage = meta.data.image.url;
                    if (!shouldSkipRemoteImage(microlinkImage)) {
                        finalImage = microlinkImage;
                    }
                }
                if (!finalTitle && meta.data.title) finalTitle = meta.data.title;
                if (meta.data.description) finalDesc = meta.data.description;
            }
        } catch (e) {}
    }
    
    const { error } = await supabase.from('mind_links').insert(
        await withSmartSpace(supabase, {
            url: url,
            title: finalTitle || "Shared Link",
            image_url: finalImage,
            description: finalDesc,
            tags: "Shared, Link"
        }, { url })
    );
    
    if (!error) {
        window.location.href = "./features/success_splash/index.html";
    } else {
        alert("Save failed");
        fetchLinks();
    }
}

function showNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
        });
    }
}

// Image Selection
uploadTrigger.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        selectedFiles = [...selectedFiles, ...newFiles];
        renderPreviews();
        urlInput.disabled = true;
        urlInput.placeholder = `${selectedFiles.length} images selected`;
    }
};

function renderPreviews() {
    previewGrid.innerHTML = "";
    if (selectedFiles.length > 0) {
        previewContainer.style.display = 'block';
        selectedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-thumb';
                previewGrid.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    } else {
        previewContainer.style.display = 'none';
        urlInput.disabled = false;
        urlInput.placeholder = "Paste Link (YouTube, Insta...)";
    }
}

clearImgsBtn.onclick = () => {
    selectedFiles = [];
    fileInput.value = "";
    renderPreviews();
};

// 1. ডাটা লোড করা
async function fetchLinks(isLoadMore = false) {
    if (isFetching) return;
    isFetching = true;

    if (!isLoadMore) {
        offset = 0;
        hasMore = true;
        showLoader("Loading your mind");
    }

    const { data, error } = await supabase
        .from('mind_links')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + LIMIT - 1);

    if (error) {
        feedContainer.innerHTML = "<p>Error loading data.</p>";
        isFetching = false;
        return;
    }

    if (data.length < LIMIT) hasMore = false;

    if (isLoadMore) {
        allLinksData = [...allLinksData, ...data];
        requestIdleCallback(() => renderFeed(data, true));
    } else {
        allLinksData = data;
        requestIdleCallback(() => renderFeed(data, false));
    }

    offset += data.length;
    isFetching = false;
}

// 2. সার্চ ফাংশন
searchInput.addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();

    const filteredData = allLinksData.filter(item => {
        const title = item.title ? item.title.toLowerCase() : "";
        const note = item.note ? item.note.toLowerCase() : "";
        const tags = item.tags ? item.tags.toLowerCase() : "";
        const desc = item.description ? item.description.toLowerCase() : "";
        const dateTokens = getDateSearchTokens(getCreatedAtValue(item));

        return title.includes(searchText) || 
               note.includes(searchText) || 
               tags.includes(searchText) || 
               desc.includes(searchText) ||
               dateTokens.includes(searchText);
    });

    renderFeed(filteredData);
});

// Security: XSS Protection
function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getCreatedAtValue(item) {
    if (!item) return null;
    return (
        item.created_at ??
        item.createdAt ??
        item.created ??
        item.inserted_at ??
        item.insertedAt ??
        null
    );
}

function formatCardDate(createdAt) {
    if (!createdAt) return "";
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    // Example: "28 May 2026"
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDateSearchTokens(createdAt) {
    if (!createdAt) return "";
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const human = formatCardDate(createdAt); // "28 May 2026"
    const locale = d.toLocaleDateString(); // device locale e.g. "5/28/2026"
    return `${iso} ${human} ${locale}`.toLowerCase();
}

function shouldSkipRemoteImage(url) {
    if (!url) return true;
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        // Instagram/Facebook CDNs often return 403 for hotlinking.
        if (host.includes('cdninstagram.com') || host.includes('fbcdn.net') || host.includes('instagram.com')) {
            return true;
        }
        const path = u.pathname.toLowerCase();
        // HEIC/HEIF isn't widely supported in browsers and frequently fails.
        if (path.endsWith('.heic') || path.endsWith('.heif')) return true;
        return false;
    } catch {
        return true;
    }
}

// 3. কার্ড রেন্ডার ফাংশন
function renderFeed(dataList, isAppend = false) {
    if (!isAppend) feedContainer.innerHTML = ""; 

    if (dataList.length === 0 && !isAppend) {
        feedContainer.innerHTML = `<div class="empty-state"><span class="material-icons">inbox</span><p>No results found</p></div>`;
        return;
    }

    dataList.forEach(item => {
        const card = document.createElement('div');
        
        const isNote = !item.url || item.url.trim() === "";
        const createdAtText = formatCardDate(getCreatedAtValue(item));

        if (isNote) {
            const colorIndex = (feedContainer.children.length % 4) + 1;
            card.className = `card note-card note-bg-${colorIndex}`;
            
            const noteBody = document.createElement('div');
            noteBody.className = 'note-body';
            noteBody.innerHTML = `<span class="material-icons note-badge">description</span>`;
            
            const noteText = document.createElement('div');
            noteText.className = 'note-preview-text';
            noteText.textContent = item.note || item.title;
            noteBody.appendChild(noteText);
            
            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            cardContent.style.background = 'rgba(0,0,0,0.03)';
            
            const cardTitle = document.createElement('div');
            cardTitle.className = 'card-title';
            cardTitle.textContent = item.title;
            cardContent.appendChild(cardTitle);

            if (createdAtText) {
                const dateEl = document.createElement('div');
                dateEl.className = 'card-date';
                dateEl.textContent = createdAtText;
                cardContent.appendChild(dateEl);
            }
            
            card.appendChild(noteBody);
            card.appendChild(cardContent);
        } else {
            card.className = 'card';
            let imageUrl = item.thumbnail_url || item.image_url; 
            
            if (!imageUrl) {
                imageUrl = getYouTubeThumbnail(item.url);
            }
            // Removed shouldSkipRemoteImage — let img.onerror handle broken images gracefully

            // Pre-compute favicon fallback (used both when no image and when image fails to load)
            let favicon = "";
            try {
                const domain = new URL(item.url).hostname;
                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch (e) {
                favicon = "https://cdn-icons-png.flaticon.com/512/3062/3062634.png";
            }

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';

            if (imageUrl) {
                const img = document.createElement('img');
                img.src = imageUrl;
                img.className = 'thumb-img';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.referrerPolicy = 'no-referrer';
                // On error: replace the broken image with a favicon fallback placeholder
                img.onerror = () => {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'card-placeholder';
                    placeholder.style.backgroundColor = getRandomColor();
                    const faviconImg = document.createElement('img');
                    faviconImg.src = favicon;
                    faviconImg.className = 'favicon-img';
                    faviconImg.referrerPolicy = 'no-referrer';
                    placeholder.appendChild(faviconImg);
                    cardHeader.innerHTML = '';
                    cardHeader.appendChild(placeholder);
                };
                cardHeader.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                placeholder.style.backgroundColor = getRandomColor();
                
                const faviconImg = document.createElement('img');
                faviconImg.src = favicon;
                faviconImg.className = 'favicon-img';
                faviconImg.referrerPolicy = 'no-referrer';
                placeholder.appendChild(faviconImg);
                cardHeader.appendChild(placeholder);
            }

            const cardContent = document.createElement('div');
            cardContent.className = 'card-content';
            
            const cardTitle = document.createElement('div');
            cardTitle.className = 'card-title';
            cardTitle.textContent = item.title;
            
            const cardLink = document.createElement('div');
            cardLink.className = 'card-link';
            cardLink.textContent = item.url;
            
            // Copy button for the link
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-link-btn';
            copyBtn.innerHTML = '<span class="material-icons">content_copy</span>';
            copyBtn.title = 'Copy link';
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                copyLinkToClipboard(item.url, copyBtn);
            };
            
            cardContent.appendChild(cardTitle);
            cardContent.appendChild(cardLink);
            cardContent.appendChild(copyBtn);

            if (createdAtText) {
                const dateEl = document.createElement('div');
                dateEl.className = 'card-date';
                dateEl.textContent = createdAtText;
                cardContent.appendChild(dateEl);
            }
            
            card.appendChild(cardHeader);
            card.appendChild(cardContent);
        }
        
        // Touch events for mobile PWA
        let pressTimer;
        let isLongPress = false;

        const startPress = () => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate(50);
                if (!isSelectMode) window.startSelectionMode(item.id, card);
            }, 600);
        };

        const cancelPress = () => clearTimeout(pressTimer);

        card.addEventListener('touchstart', startPress, {passive: true});
        card.addEventListener('touchend', cancelPress);
        card.addEventListener('touchmove', cancelPress);
        card.addEventListener('mousedown', startPress);
        card.addEventListener('mouseup', cancelPress);
        card.addEventListener('mouseleave', cancelPress);
        
        card.onclick = () => {
            if (isLongPress) {
                isLongPress = false;
                return;
            }
            
            if (isSelectMode) {
                window.toggleSelection(item.id, card);
            } else {
                window.location.href = `./detail_screen/detail.html?id=${item.id}`;
            }
        };
        feedContainer.appendChild(card);
    });
}

// --- Helper: ইউটিউব থাম্বনেইল বের করা ---
function getYouTubeThumbnail(url) {
    try {
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
        const ytMatch = url.match(youtubeRegex);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
    } catch(e) {}
    return null;
}

// মোডাল লজিক
document.getElementById('open-modal-btn').onclick = () => {
    modal.style.display = 'flex';
    // Reset smart badge when opening modal
    const smartBadge = document.getElementById('smart-space-badge');
    const inlineForm = document.getElementById('inline-create-space');
    if (smartBadge) smartBadge.style.display = 'none';
    if (inlineForm) inlineForm.style.display = 'none';
    const dropdown = document.getElementById('space-select-dropdown');
    if (dropdown) dropdown.value = '';
};
document.getElementById('cancel-btn').onclick = closeModal;

// Dropdown change handler — update smart badge
document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('space-select-dropdown');
    if (!dropdown) return;
    
    dropdown.addEventListener('change', () => {
        const smartBadge = document.getElementById('smart-space-badge');
        const smartText = document.getElementById('smart-space-text');
        if (!smartBadge || !smartText) return;
        
        if (dropdown.value === '') {
            // Auto mode — re-detect from URL
            const url = document.getElementById('input-url').value.trim();
            if (url && (url.startsWith('http') || url.includes('.'))) {
                const spaceKey = detectSmartSpaceKey(url);
                const spaceName = SMART_SPACE_NAMES[spaceKey] || 'Links';
                smartText.textContent = `Will auto-save to "${spaceName}"`;
                smartBadge.style.display = 'flex';
            } else {
                smartBadge.style.display = 'none';
            }
        } else {
            const selectedText = dropdown.options[dropdown.selectedIndex].textContent;
            smartText.textContent = `Saving to "${selectedText}"`;
            smartBadge.style.display = 'flex';
        }
    });
});

function closeModal() {
    modal.style.display = 'none';
    urlInput.value = "";
    document.getElementById('input-title').value = "";
    document.getElementById('input-note').value = "";
    document.getElementById('space-select-dropdown').value = "";
    selectedFiles = [];
    fileInput.value = "";
    renderPreviews();
    urlInput.disabled = false;
    urlInput.placeholder = "Paste Link (YouTube, Insta...)";
    
    // Reset smart badge and inline create form
    const smartBadge = document.getElementById('smart-space-badge');
    const inlineForm = document.getElementById('inline-create-space');
    const inlineName = document.getElementById('inline-space-name');
    if (smartBadge) smartBadge.style.display = 'none';
    if (inlineForm) inlineForm.style.display = 'none';
    if (inlineName) inlineName.value = '';
}

// --- 3. ডাটা সেভ করা (Multi-Upload সহ) ---
function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

saveBtn.onclick = async () => {
    const url = urlInput.value.trim();
    let title = document.getElementById('input-title').value;
    const note = document.getElementById('input-note').value;

    if (!url && selectedFiles.length === 0) {
        alert("Please enter a URL or select Images!");
        return;
    }

    if (url && !isValidHttpUrl(url)) {
        alert("Invalid URL! Please enter a valid link (starting with http:// or https://)");
        return;
    }

    saveBtn.disabled = true;

    try {
        if (selectedFiles.length > 0) {
            let successCount = 0;
            
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                saveBtn.innerText = `Uploading ${i + 1}/${selectedFiles.length}...`;

                const formData = new FormData();
                formData.append("image", file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: "POST",
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    const dropdown = document.getElementById('space-select-dropdown');
                    const selectedSpaceId = dropdown ? dropdown.value : "";
                    
                    let itemData = { 
                        url: result.data.url, 
                        title: title || `My Photo ${i + 1}`, 
                        note: note,
                        image_url: result.data.url,
                        thumbnail_url: result.data.thumb.url,
                        tags: "Image, Upload, Gallery"
                    };
                    
                    if (selectedSpaceId) {
                        itemData.space_id = selectedSpaceId;
                    } else {
                        itemData = await withSmartSpace(supabase, itemData, { type: 'gallery' });
                    }

                    const { error } = await supabase
                        .from('mind_links')
                        .insert(itemData);
                    
                    if (!error) successCount++;
                }
            }
            
            if (successCount > 0) {
                fetchLinks();
                closeModal();
            } else {
                alert("Failed to upload images.");
            }

        } else {
            saveBtn.innerText = "Analyzing...";
            let finalImage = null;
            let finalThumb = null;
            let finalDesc = "";
            let finalTags = generateTags(url);
            
            const ytThumb = getYouTubeThumbnail(url);
            if (ytThumb) { finalImage = ytThumb; finalThumb = ytThumb; }

            try {
                const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
                const res = await fetch(apiUrl);
                const meta = await res.json();
                
                if (meta.status === 'success') {
                    if (!finalImage && meta.data.image) {
                        finalImage = meta.data.image.url;
                        finalThumb = meta.data.image.url;
                    }
                    if (meta.data.description) finalDesc = meta.data.description;
                    if (!title && meta.data.title) title = meta.data.title;
                }
            } catch (e) {}

            saveBtn.innerText = "Saving...";
            
            const dropdown = document.getElementById('space-select-dropdown');
            const selectedSpaceId = dropdown ? dropdown.value : "";
            
            let itemData = { 
                url: url, 
                title: title || "Untitled", 
                note: note,
                image_url: finalImage,
                thumbnail_url: finalThumb,
                description: finalDesc,
                tags: finalTags
            };
            
            if (selectedSpaceId) {
                itemData.space_id = selectedSpaceId;
            } else {
                itemData = await withSmartSpace(supabase, itemData, { url });
            }

            const { error } = await supabase
                .from('mind_links')
                .insert(itemData);

            if (error) throw error;

            fetchLinks();
            closeModal();
        }

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        saveBtn.innerText = "Save";
        saveBtn.disabled = false;
    }
};

// --- Helper: Copy link to clipboard with visual feedback ---
async function copyLinkToClipboard(url, element) {
    try {
        await navigator.clipboard.writeText(url);
        
        // Visual feedback - show tooltip with URL
        if (element) {
            element.classList.add('copied');
            element.setAttribute('data-copied-text', 'Copied!');
            setTimeout(() => {
                element.classList.remove('copied');
            }, 2000);
        }
        
        // Show notification if available
        showNotification('Copied!', 'Link copied to clipboard');
    } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback: select and copy manually
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (element) {
            element.classList.add('copied');
            element.setAttribute('data-copied-text', 'Copied!');
            setTimeout(() => {
                element.classList.remove('copied');
            }, 2000);
        }
    }
}

function getRandomColor() {
    const colors = ['#F8BBD0', '#E1BEE7', '#FFCCBC', '#C5CAE9', '#B2DFDB'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// --- Helper: অটো ট্যাগ জেনারেট করা ---
function generateTags(url) {
    let tags = [];
    try {
        const domain = new URL(url).hostname;
        if (domain.includes("instagram")) tags.push("Instagram", "Social");
        else if (domain.includes("facebook")) tags.push("Facebook", "Social");
        else if (domain.includes("youtube") || domain.includes("youtu.be")) tags.push("YouTube", "Video");
        else if (domain.includes("tiktok")) tags.push("TikTok", "Video");
        else if (domain.includes("linkedin")) tags.push("LinkedIn");
        else if (domain.includes("twitter") || domain.includes("x.com")) tags.push("Twitter", "Social");
        else tags.push("Website");
    } catch (e) {
        tags.push("Link");
    }
    return tags.join(", ");
}
