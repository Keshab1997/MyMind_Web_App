// ================================================
// FILE: browser-extension/content.js
// ================================================

// Extract page metadata and selection
function getPageMetadata() {
    const getMeta = (prop) => {
        const meta = document.querySelector(`meta[property="${prop}"]`) || 
                     document.querySelector(`meta[name="${prop}"]`);
        return meta ? meta.content : "";
    };

    return {
        title: document.title,
        url: window.location.href,
        description: getMeta("og:description") || getMeta("description") || "",
        image: getMeta("og:image") || getMeta("twitter:image") || "",
        selection: window.getSelection().toString().trim()
    };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageDetails") {
        sendResponse(getPageMetadata());
    }
});
