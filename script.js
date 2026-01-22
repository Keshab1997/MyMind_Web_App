import { supabase } from "./supabase_config.js";

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
};

// Real-time Updates
function setupRealtimeSubscription() {
    if (realtimeChannel) return;
    
    realtimeChannel = supabase
        .channel('mind_links_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'mind_links' },
            (payload) => {
                console.log('Realtime:', payload);
                fetchLinks();
            }
        )
        .subscribe();
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
            const { error } = await supabase.from('mind_links').insert({
                url: result.data.url,
                title: title || "Shared Image",
                image_url: result.data.url,
                thumbnail_url: result.data.thumb.url,
                tags: "Shared, Gallery, Image"
            });
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
                if (meta.data.image) finalImage = meta.data.image.url;
                if (!finalTitle && meta.data.title) finalTitle = meta.data.title;
                if (meta.data.description) finalDesc = meta.data.description;
            }
        } catch (e) {}
    }
    
    const { error } = await supabase.from('mind_links').insert({
        url: url,
        title: finalTitle || "Shared Link",
        image_url: finalImage,
        description: finalDesc,
        tags: "Shared, Link"
    });
    
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
async function fetchLinks() {
    showLoader("Loading your mind");

    const { data, error } = await supabase
        .from('mind_links')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching:", error);
        feedContainer.innerHTML = "<p>Error loading data.</p>";
        return;
    }

    allLinksData = data;
    renderFeed(allLinksData);
}

// 2. সার্চ ফাংশন
searchInput.addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();

    const filteredData = allLinksData.filter(item => {
        const title = item.title ? item.title.toLowerCase() : "";
        const note = item.note ? item.note.toLowerCase() : "";
        const tags = item.tags ? item.tags.toLowerCase() : "";
        const desc = item.description ? item.description.toLowerCase() : "";

        return title.includes(searchText) || 
               note.includes(searchText) || 
               tags.includes(searchText) || 
               desc.includes(searchText);
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

// 3. কার্ড রেন্ডার ফাংশন
function renderFeed(dataList) {
    feedContainer.innerHTML = ""; 

    if (dataList.length === 0) {
        feedContainer.innerHTML = `<div class="empty-state"><span class="material-icons">inbox</span><p>No results found</p></div>`;
        return;
    }

    dataList.forEach(item => {
        const card = document.createElement('div');
        
        const isNote = !item.url || item.url.trim() === "";

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
            
            card.appendChild(noteBody);
            card.appendChild(cardContent);
        } else {
            card.className = 'card';
            let imageUrl = item.thumbnail_url || item.image_url; 
            
            if (!imageUrl) {
                imageUrl = getYouTubeThumbnail(item.url);
            }

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';

            if (imageUrl) {
                const img = document.createElement('img');
                img.src = imageUrl;
                img.className = 'thumb-img';
                img.loading = 'lazy';
                img.onerror = () => img.style.display = 'none';
                cardHeader.appendChild(img);
            } else {
                let favicon = "";
                try {
                    const domain = new URL(item.url).hostname;
                    favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                } catch (e) {
                    favicon = "https://cdn-icons-png.flaticon.com/512/3062/3062634.png";
                }
                
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                placeholder.style.backgroundColor = getRandomColor();
                
                const faviconImg = document.createElement('img');
                faviconImg.src = favicon;
                faviconImg.className = 'favicon-img';
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
            
            cardContent.appendChild(cardTitle);
            cardContent.appendChild(cardLink);
            
            card.appendChild(cardHeader);
            card.appendChild(cardContent);
        }
        
        card.onclick = () => window.location.href = `./detail_screen/detail.html?id=${item.id}`;
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
    } catch(e) {
        console.warn('Error parsing YouTube URL:', e);
    }
    return null;
}

// মোডাল লজিক
document.getElementById('open-modal-btn').onclick = () => modal.style.display = 'flex';
document.getElementById('cancel-btn').onclick = closeModal;

function closeModal() {
    modal.style.display = 'none';
    urlInput.value = "";
    document.getElementById('input-title').value = "";
    document.getElementById('input-note').value = "";
    selectedFiles = [];
    fileInput.value = "";
    renderPreviews();
    urlInput.disabled = false;
    urlInput.placeholder = "Paste Link (YouTube, Insta...)";
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
                    const { error } = await supabase
                        .from('mind_links')
                        .insert({ 
                            url: result.data.url, 
                            title: title || `My Photo ${i + 1}`, 
                            note: note,
                            image_url: result.data.url,
                            thumbnail_url: result.data.thumb.url,
                            tags: "Image, Upload, Gallery"
                        });
                    
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
            } catch (e) { console.log("Meta fetch error"); }

            saveBtn.innerText = "Saving...";
            
            const { error } = await supabase
                .from('mind_links')
                .insert({ 
                    url: url, 
                    title: title || "Untitled", 
                    note: note,
                    image_url: finalImage,
                    thumbnail_url: finalThumb,
                    description: finalDesc,
                    tags: finalTags
                });

            if (error) throw error;

            fetchLinks();
            closeModal();
        }

    } catch (error) {
        alert("Error: " + error.message);
        console.error(error);
    } finally {
        saveBtn.innerText = "Save";
        saveBtn.disabled = false;
    }
};

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
