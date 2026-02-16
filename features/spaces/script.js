import { supabase } from "../../supabase_config.js";

let currentParentId = null;
let folderPath = [];

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) window.location.href = "../../login.html";
}
checkSession();

const spacesContainer = document.getElementById('spaces-container');
const modal = document.getElementById('add-space-modal');
const addSpaceBtn = document.getElementById('add-space-btn');
const saveSpaceBtn = document.getElementById('save-space-btn');
const cancelSpaceBtn = document.getElementById('cancel-space-btn');
const spaceNameInput = document.getElementById('space-name-input');
const backBtn = document.getElementById('back-btn');
const breadcrumb = document.getElementById('breadcrumb');

window.onload = () => {
    loadSpaces();
    setupEventListeners();
};

function setupEventListeners() {
    addSpaceBtn.onclick = () => {
        modal.style.display = 'flex';
        spaceNameInput.focus();
    };

    cancelSpaceBtn.onclick = () => {
        modal.style.display = 'none';
        spaceNameInput.value = '';
    };

    saveSpaceBtn.onclick = createSpace;

    backBtn.onclick = () => {
        if (folderPath.length > 0) {
            folderPath.pop();
            currentParentId = folderPath.length > 0 ? folderPath[folderPath.length - 1].id : null;
            loadSpaces();
        } else {
            window.location.href = '../../index.html';
        }
    };
}

async function createSpace() {
    const name = spaceNameInput.value.trim();
    if (!name) {
        alert('Please enter a space name');
        return;
    }

    saveSpaceBtn.disabled = true;
    saveSpaceBtn.textContent = 'Creating...';

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('spaces').insert({
        name: name,
        parent_id: currentParentId,
        user_id: user.id
    });

    if (error) {
        alert('Error creating space: ' + error.message);
    } else {
        modal.style.display = 'none';
        spaceNameInput.value = '';
        loadSpaces();
    }

    saveSpaceBtn.disabled = false;
    saveSpaceBtn.textContent = 'Create';
}

async function loadSpaces() {
    spacesContainer.innerHTML = '<div class="loading">Loading spaces...</div>';
    updateBreadcrumb();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: folders, error: foldersError } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', user.id)
        .is('parent_id', currentParentId)
        .order('created_at', { ascending: false });

    const { data: items, error: itemsError } = await supabase
        .from('mind_links')
        .select('*')
        .eq('space_id', currentParentId || 'null')
        .order('created_at', { ascending: false });

    if (foldersError || itemsError) {
        spacesContainer.innerHTML = '<p>Error loading spaces</p>';
        return;
    }

    spacesContainer.innerHTML = '';

    if (folders.length === 0 && (!items || items.length === 0)) {
        spacesContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">folder_open</span>
                <p>No spaces yet. Create one!</p>
            </div>
        `;
        return;
    }

    folders.forEach(folder => {
        const folderCard = document.createElement('div');
        folderCard.className = 'folder-card';
        folderCard.innerHTML = `
            <span class="material-icons folder-icon">folder</span>
            <div class="folder-info">
                <div class="folder-name">${escapeHTML(folder.name)}</div>
            </div>
            <button class="folder-menu-btn" data-id="${folder.id}">
                <span class="material-icons">more_vert</span>
            </button>
        `;

        folderCard.onclick = (e) => {
            if (e.target.closest('.folder-menu-btn')) {
                showFolderMenu(folder.id, folder.name);
            } else {
                openFolder(folder);
            }
        };

        spacesContainer.appendChild(folderCard);
    });

    if (items && items.length > 0) {
        items.forEach(item => {
            const card = createItemCard(item);
            spacesContainer.appendChild(card);
        });
    }
}

function openFolder(folder) {
    folderPath.push({ id: folder.id, name: folder.name });
    currentParentId = folder.id;
    loadSpaces();
}

function updateBreadcrumb() {
    if (folderPath.length === 0) {
        breadcrumb.innerHTML = '<div class="breadcrumb-item">All Spaces</div>';
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'block';
        let html = '<div class="breadcrumb-item" onclick="goToRoot()">All Spaces</div>';
        folderPath.forEach((folder, index) => {
            html += `<span class="material-icons breadcrumb-arrow">chevron_right</span>`;
            html += `<div class="breadcrumb-item" onclick="goToFolder(${index})">${escapeHTML(folder.name)}</div>`;
        });
        breadcrumb.innerHTML = html;
    }
}

window.goToRoot = () => {
    folderPath = [];
    currentParentId = null;
    loadSpaces();
};

window.goToFolder = (index) => {
    folderPath = folderPath.slice(0, index + 1);
    currentParentId = folderPath[index].id;
    loadSpaces();
};

function showFolderMenu(folderId, folderName) {
    const action = confirm(`Delete "${folderName}"?\n\nThis will also delete all items inside.`);
    if (action) deleteFolder(folderId);
}

async function deleteFolder(folderId) {
    const { error } = await supabase.from('spaces').delete().eq('id', folderId);
    if (!error) {
        loadSpaces();
    } else {
        alert('Error deleting folder: ' + error.message);
    }
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const isNote = !item.url || item.url.trim() === "";
    
    if (isNote) {
        card.innerHTML = `
            <div class="item-icon note-icon">
                <span class="material-icons">description</span>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHTML(item.title)}</div>
                <div class="item-note">${escapeHTML(item.note || '')}</div>
            </div>
        `;
    } else {
        const imageUrl = item.thumbnail_url || item.image_url;
        card.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" class="item-thumb" loading="lazy">` : 
            `<div class="item-icon"><span class="material-icons">link</span></div>`}
            <div class="item-info">
                <div class="item-title">${escapeHTML(item.title)}</div>
                <div class="item-url">${escapeHTML(item.url)}</div>
            </div>
        `;
    }

    card.onclick = () => window.location.href = `../../detail_screen/detail.html?id=${item.id}`;
    return card;
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
