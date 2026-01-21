const SUPABASE_URL = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ2MDEsImV4cCI6MjA4NDMyMDYwMX0.-boSPxeSV4Q_6lX7rcXauRrpAw--YA-MGAH_IknXa84';

// ইন্সটল হওয়ার পর মেনু তৈরি করা
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-page",
    title: "Save Page to My Mind",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "save-image",
    title: "Save Image to My Mind",
    contexts: ["image"]
  });
});

// মেনুতে ক্লিক করলে যা হবে
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  
  // সেশন চেক করা
  const storage = await chrome.storage.local.get(['session']);
  const session = storage.session;

  if (!session) {
    showNotification("Please login first!", "Open the extension popup to login.");
    return;
  }

  let url = info.pageUrl;
  let title = tab.title;
  let imageUrl = "";
  let tags = "Extension, Quick Save";

  // যদি ছবির ওপর রাইট ক্লিক করা হয়
  if (info.menuItemId === "save-image") {
    url = info.srcUrl;
    imageUrl = info.srcUrl;
    title = "Saved Image";
    tags += ", Image";
  }

  // Supabase এ পাঠানো
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/mind_links`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            url: url,
            title: title,
            image_url: imageUrl,
            thumbnail_url: imageUrl,
            user_id: session.user.id,
            tags: tags
        })
    });

    if (res.ok) {
      showNotification("Saved Successfully!", title);
    } else {
      showNotification("Failed to Save", "Please try again.");
    }
  } catch (error) {
    showNotification("Error", error.message);
  }
});

// নোটিফিকেশন দেখানোর ফাংশন
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: title,
    message: message
  });
}
