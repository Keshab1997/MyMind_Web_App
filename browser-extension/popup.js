const SUPABASE_URL = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ2MDEsImV4cCI6MjA4NDMyMDYwMX0.-boSPxeSV4Q_6lX7rcXauRrpAw--YA-MGAH_IknXa84';
const IMGBB_API_KEY = "3f28730505fe4abf28c082d23f395a1b";

let capturedImageUrl = "";

document.addEventListener('DOMContentLoaded', async () => {
    const loginView = document.getElementById('login-view');
    const saveView = document.getElementById('save-view');
    const statusDiv = document.getElementById('status');

    // Check session
    chrome.storage.local.get(['session'], (result) => {
        if (result.session) {
            showSaveView(result.session);
        } else {
            showLoginView();
        }
    });

    // Login
    document.getElementById('do-login-btn').onclick = async () => {
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-pass').value.trim();

        if (!email || !pass) return showStatus("Please fill all fields", "#E53935");

        showStatus("Logging in...", "orange");
        
        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ email, password: pass })
            });
            
            const data = await res.json();

            if (res.ok && data.access_token) {
                // Check if email is verified
                if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
                    showStatus("Please verify your email first!", "#E53935");
                    return;
                }

                chrome.storage.local.set({ session: data }, () => {
                    showSaveView(data);
                    showStatus("\u2713 Logged in!", "#2e7d32");
                });
            } else {
                const errorMsg = data.error_description || data.msg || data.error || "Invalid credentials";
                showStatus(`Login failed: ${errorMsg}`, "#E53935");
            }
        } catch (e) { 
            console.error(e);
            showStatus("Network error. Check connection.", "#E53935"); 
        }
    };

    // Screenshot
    document.getElementById('screenshot-btn').onclick = () => {
        const btn = document.getElementById('screenshot-btn');
        btn.innerText = "⏳";
        btn.disabled = true;

        chrome.tabs.captureVisibleTab(null, {format: 'png'}, async (dataUrl) => {
            showStatus("Uploading screenshot...", "orange");

            const res = await fetch(dataUrl);
            const blob = await res.blob();

            const formData = new FormData();
            formData.append("image", blob);

            try {
                const uploadReq = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: "POST",
                    body: formData
                });
                const result = await uploadReq.json();

                if (result.success) {
                    capturedImageUrl = result.data.url;
                    showStatus("Screenshot attached! \u2713", "#2e7d32");
                    btn.innerText = "✅";
                    btn.style.background = "#C8E6C9";
                } else {
                    throw new Error("Upload failed");
                }
            } catch (e) {
                console.error(e);
                showStatus("Screenshot upload failed", "red");
                btn.innerText = "📷";
                btn.disabled = false;
            }
        });
    };

    // Save
    document.getElementById('save-btn').onclick = async () => {
        const url = document.getElementById('url').value.trim();
        const title = document.getElementById('title').value.trim();
        const note = document.getElementById('note').value.trim();

        if (!url) return showStatus("URL is required", "#E53935");

        chrome.storage.local.get(['session'], async (result) => {
            const session = result.session;
            if (!session) return showLoginView();

            const saveBtn = document.getElementById('save-btn');
            saveBtn.disabled = true;
            saveBtn.innerText = "Saving...";
            showStatus("Analyzing and saving...", "orange");

            try {
                let imageUrl = "";
                let description = "";
                
                try {
                    const meta = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`).then(r => r.json());
                    if (meta.status === 'success') {
                        imageUrl = meta.data.image?.url || "";
                        description = meta.data.description || "";
                    }
                } catch (e) {}

                let autoTags = "Extension";
                
                if (document.getElementById('is-fav').checked) {
                    autoTags += ", Important, Favorite";
                }
                
                if (capturedImageUrl) {
                    autoTags += ", Screenshot";
                }
                
                if (url.includes("youtube.com") || url.includes("youtu.be")) {
                    autoTags += ", Video, YouTube";
                } else if (url.includes("instagram.com")) {
                    autoTags += ", Social, Instagram";
                } else if (url.includes("github.com")) {
                    autoTags += ", Code, Dev";
                } else if (url.includes("medium.com") || url.includes("blog")) {
                    autoTags += ", Article, Blog";
                }

                const res = await fetch(`${SUPABASE_URL}/rest/v1/mind_links`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        url, 
                        title: title || "Untitled", 
                        note,
                        image_url: capturedImageUrl || imageUrl,
                        thumbnail_url: capturedImageUrl || imageUrl,
                        description,
                        user_id: session.user.id,
                        tags: autoTags
                    })
                });

                if (res.ok) {
                    showStatus("\u2713 Saved successfully!", "#2e7d32");
                    loadRecents(session);
                    setTimeout(() => window.close(), 1500);
                } else {
                    if (res.status === 401) {
                        chrome.storage.local.remove(['session'], () => {
                            showStatus("Session expired. Please login again.", "#E53935");
                            setTimeout(() => showLoginView(), 2000);
                        });
                        return;
                    }
                    const err = await res.json();
                    showStatus(`Save failed: ${err.message || 'Unknown error'}`, "#E53935");
                    saveBtn.disabled = false;
                    saveBtn.innerText = "Save to My Mind";
                }
            } catch (e) { 
                showStatus("Failed to save", "#E53935");
                saveBtn.disabled = false;
                saveBtn.innerText = "Save to My Mind";
            }
        });
    };

    // Open App
    document.getElementById('open-app-btn').onclick = () => {
        chrome.tabs.create({ url: "https://keshab1997.github.io/MyMind_Web_App/" });
    };

    // Logout
    document.getElementById('do-logout-btn').onclick = () => {
        chrome.storage.local.remove(['session'], () => {
            showLoginView();
            showStatus("Logged out", "orange");
        });
    };

    function showLoginView() {
        loginView.classList.remove('hidden');
        saveView.classList.add('hidden');
    }

    function showSaveView(session) {
        loginView.classList.add('hidden');
        saveView.classList.remove('hidden');
        
        const user = session.user;
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || user.email.split('@')[0];
        const avatarUrl = meta.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        
        document.getElementById('p-name').innerText = fullName;
        document.getElementById('p-email').innerText = user.email;
        document.getElementById('p-avatar').src = avatarUrl;
        
        loadRecents(session);
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                document.getElementById('url').value = tabs[0].url || "";
                document.getElementById('title').value = tabs[0].title || "";
                
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: () => window.getSelection().toString()
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        document.getElementById('note').value = results[0].result;
                    }
                });
            }
        });
    }

    function showStatus(msg, color) {
        statusDiv.innerText = msg;
        statusDiv.style.color = color;
    }
    
    async function loadRecents(session) {
        const recentSection = document.getElementById('recent-section');
        const recentList = document.getElementById('recent-list');
        
        recentSection.classList.remove('hidden');

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/mind_links?select=title,url,thumbnail_url&limit=3&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            const data = await res.json();
            
            if (data.length > 0) {
                recentList.innerHTML = data.map(item => {
                    const img = item.thumbnail_url || "https://cdn-icons-png.flaticon.com/512/3062/3062634.png";
                    return `
                        <a href="${item.url}" target="_blank" style="display: flex; gap: 8px; align-items: center; text-decoration: none; background: #f9f9f9; padding: 5px; border-radius: 6px;">
                            <img src="${img}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover;">
                            <span style="font-size: 11px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
                                ${item.title}
                            </span>
                        </a>
                    `;
                }).join('');
            } else {
                recentList.innerHTML = '<div style="font-size:11px; color:#999; text-align:center;">No saves yet</div>';
            }
        } catch (e) {
            console.error(e);
            recentList.innerHTML = '<div style="font-size:11px; color:red; text-align:center;">Failed to load</div>';
        }
    }
});
