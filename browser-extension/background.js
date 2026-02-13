const SUPABASE_URL = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ2MDEsImV4cCI6MjA4NDMyMDYwMX0.-boSPxeSV4Q_6lX7rcXauRrpAw--YA-MGAH_IknXa84';

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-mind",
    title: "Save to My Mind",
    contexts: ["selection", "image", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const storage = await chrome.storage.local.get(['session']);
  
  if (!storage.session) {
    showNotification("Login Required", "Please open the extension popup to login.");
    return;
  }

  let payload = {
    user_id: storage.session.user.id,
    url: info.pageUrl,
    title: tab.title,
    tags: "Extension, Quick Save"
  };

  // Text Selection
  if (info.selectionText) {
    payload.note = info.selectionText;
    payload.title = info.selectionText.substring(0, 30) + "...";
    payload.tags += ", Note";
  } 
  // Image Save
  else if (info.mediaType === "image") {
    payload.url = info.srcUrl;
    payload.image_url = info.srcUrl;
    payload.thumbnail_url = info.srcUrl;
    payload.title = "Saved Image";
    payload.tags += ", Image";
  }
  // Page Save
  else {
    payload.tags += ", Link";
  }

  saveToSupabase(payload, storage.session.access_token);
});

async function saveToSupabase(payload, token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/mind_links`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showNotification("✓ Saved!", `${payload.title || 'Item'} added to your mind`);
      
      // Open app in new tab to show saved item
      chrome.tabs.create({ 
        url: 'https://keshab1997.github.io/MyMind_Web_App/',
        active: false 
      });
    } else {
      showNotification("❌ Save Failed", "Please try again or use the popup");
    }
  } catch (error) {
    showNotification("❌ Network Error", "Check your connection and try again");
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: title,
    message: message,
    priority: 2
  });
}
