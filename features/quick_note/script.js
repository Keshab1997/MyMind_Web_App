import { supabase } from "../../supabase_config.js";

// Context menu block করা
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    e.preventDefault();
}, false);

const IMGBB_API_KEY = "3f28730505fe4abf28c082d23f395a1b"; 

const noteArea = document.getElementById('note-area');
const saveBtn = document.getElementById('save-note-btn');
const btnCase = document.getElementById('btn-format-case');
const btnList = document.getElementById('btn-list');
const btnImage = document.getElementById('btn-image');
const btnSpellcheck = document.getElementById('btn-spellcheck');
const fileInput = document.getElementById('note-file-input');

// --- 1. Aa (Toggle Case) ---
btnCase.onclick = () => {
    const start = noteArea.selectionStart;
    const end = noteArea.selectionEnd;
    const selectedText = noteArea.value.substring(start, end);

    if (selectedText) {
        const newText = selectedText === selectedText.toUpperCase() 
                        ? selectedText.toLowerCase() 
                        : selectedText.toUpperCase();
        noteArea.setRangeText(newText);
    } else {
        noteArea.value = noteArea.value === noteArea.value.toUpperCase() 
                         ? noteArea.value.toLowerCase() 
                         : noteArea.value.toUpperCase();
    }
};

// --- 2. List (Bullet Points) ---
btnList.onclick = () => {
    const start = noteArea.selectionStart;
    const text = noteArea.value;
    const newText = text.substring(0, start) + "\n• " + text.substring(start);
    noteArea.value = newText;
    noteArea.focus();
    noteArea.setSelectionRange(start + 3, start + 3);
};

// --- 3. Image (Upload to ImgBB & Insert Link) ---
btnImage.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const originalText = noteArea.value;
        noteArea.value += "\n[Uploading image...]";
        
        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                noteArea.value = originalText + `\n${result.data.url}\n`;
            }
        } catch (err) {
            alert("Image upload failed!");
            noteArea.value = originalText;
        }
    }
};

// --- 4. Spellcheck & Auto-Fix (Only for Selected Text) ---
btnSpellcheck.onclick = async () => {
    const start = noteArea.selectionStart;
    const end = noteArea.selectionEnd;
    const selectedText = noteArea.value.substring(start, end);

    if (!selectedText) {
        alert("Please select the text you want to check!");
        return;
    }

    btnSpellcheck.style.color = "orange";
    
    try {
        const response = await fetch("https://api.languagetool.org/v2/check", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `text=${encodeURIComponent(selectedText)}&language=en-US`
        });

        const result = await response.json();
        const matches = result.matches;

        if (matches.length === 0) {
            alert("No errors found in the selected text!");
            btnSpellcheck.style.color = "#666";
            return;
        }

        let fixedSnippet = selectedText;
        for (let i = matches.length - 1; i >= 0; i--) {
            const match = matches[i];
            if (match.replacements && match.replacements.length > 0) {
                const suggestion = match.replacements[0].value;
                fixedSnippet = fixedSnippet.substring(0, match.offset) + 
                               suggestion + 
                               fixedSnippet.substring(match.offset + match.length);
            }
        }

        noteArea.setRangeText(fixedSnippet);
        alert(`Fixed ${matches.length} errors in the selected section!`);
        
    } catch (err) {
        console.error("Spellcheck failed:", err);
        alert("Spellcheck service is currently unavailable.");
    } finally {
        btnSpellcheck.style.color = "#666";
    }
};

// --- 5. Save Note ---
saveBtn.onclick = async () => {
    const text = noteArea.value.trim();
    if(!text) {
        alert("Note is empty!");
        return;
    }

    saveBtn.innerText = "hourglass_empty";
    const title = text.split(/\s+/).slice(0, 3).join(' ') + "...";
    
    const { error } = await supabase.from('mind_links').insert({
        title: title,
        note: text,
        url: "",
        tags: "Note, Quick Idea",
        image_url: null,
        created_at: new Date()
    });

    if(!error) {
        window.location.href = "../success_splash/index.html";
    } else {
        alert("Error saving note: " + error.message);
        saveBtn.innerText = "check";
    }
};
