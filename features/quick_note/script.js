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
const btnMic = document.getElementById('btn-mic');
const fileInput = document.getElementById('note-file-input');

// Voice Status Indicator
const statusIndicator = document.createElement('div');
statusIndicator.style.cssText = "position:fixed; top:10px; left:50%; transform:translateX(-50%); background:#EF4444; color:white; padding:8px 16px; border-radius:20px; font-size:12px; display:none; z-index:100; box-shadow:0 4px 12px rgba(0,0,0,0.2);";
statusIndicator.innerText = "🎤 Listening...";
document.body.appendChild(statusIndicator);

// --- Voice Typing (Speech to Text) ---
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        statusIndicator.style.display = 'block';
        btnMic.style.color = '#EF4444';
    };

    recognition.onend = () => {
        statusIndicator.style.display = 'none';
        btnMic.style.color = '#666';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        insertAtCursor(noteArea, transcript + " ");
    };

    recognition.onerror = () => {
        statusIndicator.style.display = 'none';
        btnMic.style.color = '#666';
    };
} else {
    btnMic.style.display = 'none';
}

btnMic.onclick = () => {
    if (recognition) {
        try { recognition.start(); } catch(e) { recognition.stop(); }
    } else {
        alert("Voice typing not supported in this browser.");
    }
};

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
    const cursor = noteArea.selectionStart;
    const text = noteArea.value;
    const before = text.substring(0, cursor);
    const after = text.substring(cursor);
    
    const prefix = (before.endsWith('\n') || before === '') ? "• " : "\n• ";
    
    noteArea.value = before + prefix + after;
    noteArea.focus();
    noteArea.selectionStart = noteArea.selectionEnd = cursor + prefix.length;
};

// --- 3. Image (Upload to ImgBB & Insert Link) ---
btnImage.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const placeholder = "\n[Uploading image...]\n";
        insertAtCursor(noteArea, placeholder);
        
        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                noteArea.value = noteArea.value.replace(placeholder, `\n${result.data.url}\n`);
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            alert("Image upload failed!");
            noteArea.value = noteArea.value.replace(placeholder, "");
        }
    }
};

// --- 4. Save Note ---
saveBtn.onclick = async () => {
    const text = noteArea.value.trim();
    if(!text) {
        alert("Note is empty!");
        return;
    }

    saveBtn.innerText = "hourglass_empty";
    
    // Generate title from first line
    const title = text.split('\n')[0].substring(0, 40) + (text.length > 40 ? "..." : "");
    
    const { error } = await supabase.from('mind_links').insert({
        title: title,
        note: text,
        url: "",
        tags: "Note, Quick Idea",
        created_at: new Date()
    });

    if(!error) {
        window.location.href = "../success_splash/index.html";
    } else {
        alert("Error saving note: " + error.message);
        saveBtn.innerText = "check";
    }
};

// Helper: Insert text at cursor position
function insertAtCursor(input, textToInsert) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    input.value = before + textToInsert + after;
    input.selectionStart = input.selectionEnd = start + textToInsert.length;
    input.focus();
}
