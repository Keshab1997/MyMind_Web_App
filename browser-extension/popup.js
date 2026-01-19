const SUPABASE_URL = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1OTU5NzcsImV4cCI6MjA1MjE3MTk3N30.sb_publishable_esoQsmiwVi1dADt88PEX_g_SL7e38Zz';

document.addEventListener('DOMContentLoaded', async () => {
    const loginView = document.getElementById('login-view');
    const saveView = document.getElementById('save-view');
    const statusDiv = document.getElementById('status');
    const loggedInAs = document.getElementById('logged-in-as');

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
        const pass = document.getElementById('login-pass').value;

        if (!email || !pass) return showStatus("Fill all fields", "#E53935");

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

            if (data.access_token) {
                chrome.storage.local.set({ session: data }, () => {
                    showSaveView(data);
                    showStatus("✓ Logged in!", "#2e7d32");
                });
            } else {
                showStatus(data.error_description || "Login failed", "#E53935");
            }
        } catch (e) { 
            showStatus("Connection error", "#E53935"); 
        }
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
                        image_url: imageUrl,
                        thumbnail_url: imageUrl,
                        description,
                        user_id: session.user.id,
                        tags: "Extension, Desktop"
                    })
                });

                if (res.ok) {
                    showStatus("✓ Saved successfully!", "#2e7d32");
                    setTimeout(() => window.close(), 1500);
                } else {
                    showStatus("Error saving. Try logging in again.", "#E53935");
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
        loggedInAs.innerText = `✓ ${session.user.email}`;
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                document.getElementById('url').value = tabs[0].url;
                document.getElementById('title').value = tabs[0].title;
            }
        });
    }

    function showStatus(msg, color) {
        statusDiv.innerText = msg;
        statusDiv.style.color = color;
    }
});
