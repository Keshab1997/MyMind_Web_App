const SUPABASE_URL = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1OTU5NzcsImV4cCI6MjA1MjE3MTk3N30.Ql-Ql0Ql0Ql0Ql0Ql0Ql0Ql0Ql0Ql0Ql0Ql0Ql0';

document.addEventListener('DOMContentLoaded', async () => {
    const urlInput = document.getElementById('url');
    const titleInput = document.getElementById('title');
    const noteInput = document.getElementById('note');
    const saveBtn = document.getElementById('save-btn');
    const statusDiv = document.getElementById('status');

    // Get current tab URL and title
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab) {
            urlInput.value = currentTab.url;
            titleInput.value = currentTab.title;
        }
    });

    saveBtn.onclick = async () => {
        const url = urlInput.value.trim();
        const title = titleInput.value.trim();
        const note = noteInput.value.trim();

        if (!url) {
            showStatus("URL is required!", "error");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerText = "Saving...";
        showStatus("Analyzing and saving...", "");

        try {
            let imageUrl = "";
            let description = "";
            
            // Fetch metadata
            try {
                const metaRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
                const metaData = await metaRes.json();
                if (metaData.status === 'success') {
                    imageUrl = metaData.data.image?.url || "";
                    description = metaData.data.description || "";
                }
            } catch (e) { 
                console.log("Meta fetch failed"); 
            }

            // Save to Supabase
            const response = await fetch(`${SUPABASE_URL}/rest/v1/mind_links`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    url: url,
                    title: title || "Untitled",
                    note: note,
                    image_url: imageUrl,
                    thumbnail_url: imageUrl,
                    description: description,
                    tags: "Extension, Desktop",
                    created_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                showStatus("✓ Saved successfully!", "success");
                setTimeout(() => window.close(), 1500);
            } else {
                throw new Error("Failed to save");
            }

        } catch (error) {
            showStatus("Error: " + error.message, "error");
            saveBtn.disabled = false;
            saveBtn.innerText = "Save to My Mind";
        }
    };

    function showStatus(msg, type) {
        statusDiv.innerText = msg;
        statusDiv.className = type;
    }
});
