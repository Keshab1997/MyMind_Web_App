import { supabase } from "../supabase_config.js";

// Context menu block করা
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    e.preventDefault();
}, false);

const params = new URLSearchParams(window.location.search);
const docId = params.get('id');

let currentData = {};
let saveTimeout = null;

if(!docId) {
    window.location.href = "../home_screen/home.html";
} else {
    loadDetail();
}

async function loadDetail() {
    const { data, error } = await supabase
        .from('mind_links')
        .select('*')
        .eq('id', docId)
        .single();

    if (error || !data) {
        alert("Link not found!");
    } else {
        currentData = data;
        const headerTitle = document.getElementById('header-title');
        headerTitle.innerText = data.title || "Untitled";
        
        // Make title editable
        headerTitle.contentEditable = true;
        headerTitle.onblur = () => updateTitle(headerTitle.innerText);
        headerTitle.onkeydown = (e) => { 
            if(e.key === 'Enter') { 
                e.preventDefault(); 
                headerTitle.blur(); 
            }
        };
        
        const heroContainer = document.getElementById('hero-container');
        const visitBtn = document.getElementById('visit-btn');

        // 🔥 Check if this is a note (no URL)
        const isNote = !data.url || data.url.trim() === "";
        const isPDF = data.tags && data.tags.includes('PDF');
        
        if (isNote) {
            visitBtn.style.display = "none";
            heroContainer.classList.add('bg-note');
            const notePaper = document.createElement('div');
            notePaper.className = 'detail-note-paper';
            const noteText = document.createElement('div');
            noteText.className = 'detail-note-text';
            noteText.textContent = data.note || data.title;
            notePaper.appendChild(noteText);
            heroContainer.appendChild(notePaper);
        } else if (isPDF) {
            // PDF hero section
            visitBtn.style.display = "flex";
            visitBtn.innerHTML = `<span class="material-icons">picture_as_pdf</span> Read PDF`;
            visitBtn.onclick = () => window.open(data.url, '_blank');

            heroContainer.style.background = "#FFEBEE";
            heroContainer.innerHTML = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:15px;">
                    <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" style="width: 80px; height: 80px;">
                    <h3 style="color: #D32F2F; margin:0;">PDF Document</h3>
                </div>
                <div class="play-overlay" id="pdf-open-btn">
                    <span class="material-icons" style="font-size: 30px; color: white;">open_in_new</span>
                </div>
            `;

            setTimeout(() => {
                document.getElementById('pdf-open-btn').onclick = () => window.open(data.url, '_blank');
            }, 100);
        } else {
            visitBtn.style.display = "flex";
            visitBtn.onclick = () => window.open(data.url, '_blank');

            // 2. Hero Card Logic
            const youtubeId = getYouTubeId(data.url);
        
            let hostname = "Link";
            try {
                hostname = new URL(data.url).hostname;
            } catch(e) {
                console.warn('Invalid URL:', data.url);
            }
            
            const gradientOverlay = document.createElement('div');
            gradientOverlay.className = 'gradient-overlay';
            
            const cardText = document.createElement('div');
            cardText.className = 'card-text';
            
            const titleH2 = document.createElement('h2');
            titleH2.textContent = data.title;
            
            const hostP = document.createElement('p');
            hostP.style.cssText = 'font-size: 12px; opacity: 0.9; margin-top: 5px; color: #ddd;';
            hostP.textContent = hostname;
            
            cardText.appendChild(titleH2);
            cardText.appendChild(hostP);

            if (youtubeId) {
                const iframe = document.createElement('iframe');
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.src = `https://www.youtube.com/embed/${youtubeId}?controls=0`;
                iframe.frameBorder = '0';
                iframe.allowFullscreen = true;
                iframe.style.borderRadius = '24px';
                heroContainer.appendChild(iframe);
            } else if (data.image_url) {
                const img = document.createElement('img');
                img.src = data.image_url;
                img.className = 'hero-img';
                
                const playOverlay = document.createElement('div');
                playOverlay.className = 'play-overlay';
                playOverlay.innerHTML = '<span class="material-icons" style="font-size: 40px; color: white;">play_arrow</span>';
                playOverlay.onclick = (e) => {
                    e.stopPropagation();
                    window.open(data.url, '_blank');
                };
                
                heroContainer.appendChild(img);
                heroContainer.appendChild(playOverlay);
                heroContainer.appendChild(gradientOverlay);
                heroContainer.appendChild(cardText);
            } else {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'width:100%; height:100%; background:#333; display:flex; justify-content:center; align-items:center;';
                placeholder.innerHTML = '<span class="material-icons" style="font-size:50px; color:white;">link</span>';
                
                heroContainer.appendChild(placeholder);
                heroContainer.appendChild(gradientOverlay);
                heroContainer.appendChild(cardText);
            }
        }

        // 3. Tags Display
        renderTags(data.tags);

        // 4. Description Box
        const descSection = document.getElementById('desc-section');
        const fullDesc = document.getElementById('full-description');

        if (data.description && data.description.trim() !== "") {
            descSection.style.display = 'block';
            fullDesc.innerText = data.description;
        } else if (data.title.length > 50) {
            descSection.style.display = 'block';
            fullDesc.innerText = data.title;
        }

        // 5. Notes
        if (data.note) {
            document.getElementById('detail-note').value = data.note;
        }
    }
}

// Render Tags with Remove Button
function renderTags(tagsString) {
    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    
    const addBtn = document.createElement('span');
    addBtn.className = 'tag add-tag';
    addBtn.innerHTML = '<span class="material-icons" style="font-size:14px">add</span> Add';
    addBtn.onclick = addNewTag;
    tagsContainer.appendChild(addBtn);

    if (tagsString) {
        const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(t => t);
        tagsArray.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag normal';
            
            const text = document.createElement('span');
            text.textContent = tag;
            span.appendChild(text);
            
            // Remove button
            const removeIcon = document.createElement('span');
            removeIcon.className = 'material-icons remove-tag-icon';
            removeIcon.textContent = 'close';
            removeIcon.onclick = (e) => {
                e.stopPropagation();
                removeTag(tag);
            };
            
            span.appendChild(removeIcon);
            tagsContainer.insertBefore(span, addBtn);
        });
    }
}

// Add New Tag
async function addNewTag() {
    const newTag = prompt("Enter new tag:");
    if (!newTag) return;
    
    const currentTags = currentData.tags ? currentData.tags.split(',').map(t => t.trim()) : [];
    if (currentTags.includes(newTag)) return; // Prevent duplicates
    
    currentTags.push(newTag);
    const updatedTags = currentTags.join(', ');
    
    await updateDatabase({ tags: updatedTags });
    currentData.tags = updatedTags;
    renderTags(updatedTags);
}

// Remove Tag
async function removeTag(tagToRemove) {
    if (!confirm(`Remove tag "${tagToRemove}"?`)) return;
    
    const currentTags = currentData.tags.split(',').map(t => t.trim());
    const newTags = currentTags.filter(t => t !== tagToRemove);
    const updatedTags = newTags.join(', ');
    
    await updateDatabase({ tags: updatedTags });
    currentData.tags = updatedTags;
    renderTags(updatedTags);
}

// Update Title
async function updateTitle(newTitle) {
    if (newTitle === currentData.title) return;
    await updateDatabase({ title: newTitle });
    currentData.title = newTitle;
}

// Generic Database Update
async function updateDatabase(updates) {
    const { error } = await supabase
        .from('mind_links')
        .update(updates)
        .eq('id', docId);
    
    if (error) {
        console.error("Update failed:", error);
        alert("Failed to save changes.");
    }
}

// Auto Save Note with Debounce
const noteInput = document.getElementById('detail-note');
noteInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
        const newNote = noteInput.value;
        if (newNote !== currentData.note) {
            await updateDatabase({ note: newNote });
            currentData.note = newNote;
            console.log("Note auto-saved");
        }
    }, 1000);
});

// Share Functionality
document.getElementById('share-btn').onclick = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: currentData.title,
                text: 'Check out this link from My Mind:',
                url: currentData.url
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        navigator.clipboard.writeText(currentData.url);
        alert("Link copied to clipboard!");
    }
};

function getYouTubeId(url) {
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    } catch(e) {
        return null;
    }
}

document.getElementById('delete-btn').onclick = async () => {
    if(confirm("Delete this link?")) {
        await supabase.from('mind_links').delete().eq('id', docId);
        window.location.href = "../home_screen/home.html";
    }
};
