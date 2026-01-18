import { supabase } from "../supabase_config.js";

const params = new URLSearchParams(window.location.search);
const docId = params.get('id');

let currentData = {};

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
        document.getElementById('header-title').innerText = data.title || "Untitled";
        
        const heroContainer = document.getElementById('hero-container');
        const visitBtn = document.getElementById('visit-btn');

        // 🔥 Check if this is a note (no URL)
        const isNote = !data.url || data.url.trim() === "";
        
        if (isNote) {
            visitBtn.style.display = "none";
            heroContainer.classList.add('bg-note');
            heroContainer.innerHTML = `
                <div class="detail-note-paper">
                    <div class="detail-note-text">${data.note || data.title}</div>
                </div>
            `;
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
            
            const titleOverlay = `
                <div class="gradient-overlay"></div>
                <div class="card-text">
                    <h2>${data.title}</h2>
                    <p style="font-size: 12px; opacity: 0.9; margin-top: 5px; color: #ddd;">${hostname}</p>
                </div>
            `;

            if (youtubeId) {
                heroContainer.innerHTML = `
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeId}?controls=0" frameborder="0" allowfullscreen style="border-radius: 24px;"></iframe>
                `;
            } else if (data.image_url) {
                heroContainer.innerHTML = `
                    <img src="${data.image_url}" class="hero-img">
                    <div class="play-overlay" onclick="window.open('${data.url}', '_blank')">
                        <span class="material-icons" style="font-size: 30px; color: white;">play_arrow</span>
                    </div>
                    ${titleOverlay}
                `;
            } else {
                heroContainer.innerHTML = `
                    <div style="width:100%; height:100%; background:#333; display:flex; justify-content:center; align-items:center;">
                        <span class="material-icons" style="font-size:50px; color:white;">link</span>
                    </div>
                    ${titleOverlay}
                `;
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

// Render Tags
function renderTags(tagsString) {
    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    
    const addBtn = document.createElement('span');
    addBtn.className = 'tag add-tag';
    addBtn.innerText = '+ Add tag';
    addBtn.onclick = addNewTag;
    tagsContainer.appendChild(addBtn);

    if (tagsString) {
        const tagsArray = tagsString.split(', ');
        tagsArray.forEach(tag => {
            if(tag.trim() === "") return;
            
            const span = document.createElement('span');
            let tagClass = 'normal';
            if(tag.toLowerCase().includes('video') || tag.toLowerCase().includes('youtube')) tagClass = 'video';
            if(tag.toLowerCase().includes('social') || tag.toLowerCase().includes('instagram')) tagClass = 'social';

            span.className = `tag ${tagClass}`;
            span.innerText = tag;
            tagsContainer.insertBefore(span, addBtn);
        });
    }
}

// Add New Tag
async function addNewTag() {
    const newTag = prompt("Enter new tag:");
    if (newTag) {
        let updatedTags = currentData.tags ? `${currentData.tags}, ${newTag}` : newTag;
        
        const { error } = await supabase
            .from('mind_links')
            .update({ tags: updatedTags })
            .eq('id', docId);

        if (!error) {
            currentData.tags = updatedTags;
            renderTags(updatedTags);
        } else {
            alert("Failed to add tag");
        }
    }
}

// Auto Save Note
const noteInput = document.getElementById('detail-note');
noteInput.addEventListener('blur', async () => {
    const newNote = noteInput.value;
    
    if (newNote !== currentData.note) {
        const { error } = await supabase
            .from('mind_links')
            .update({ note: newNote })
            .eq('id', docId);

        if (!error) {
            currentData.note = newNote;
            console.log("Note saved!");
        }
    }
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
