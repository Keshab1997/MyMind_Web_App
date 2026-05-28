import { supabase } from "../../supabase_config.js";
import { ensureSmartSpaces, backfillSmartSpaces, resolveSmartSpaceId } from "../../lib/smart_spaces.js";

const SMART_FOLDER_NAMES = {
    'YouTube': 'youtube',
    'Instagram': 'instagram',
    'Facebook': 'facebook',
    'Gallery': 'gallery',
    'Notes': 'notes',
    'Links': 'links',
};

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

window.onload = async () => {
    await ensureSmartSpaces(supabase);
    loadSpaces();
    setupEventListeners();
};

async function refreshSpacesWithBackfill() {
    await backfillSmartSpaces(supabase);
    await loadSpaces();
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        spacesContainer.innerHTML = '<p>Please log in again.</p>';
        return;
    }

    let foldersQuery = supabase
        .from('spaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Root: parent_id IS NULL. Inside folder: parent_id = current folder id.
    if (currentParentId) {
        foldersQuery = foldersQuery.eq('parent_id', currentParentId);
    } else {
        foldersQuery = foldersQuery.is('parent_id', null);
    }

    const { data: folders, error: foldersError } = await foldersQuery;

    let items = [];
    let itemsError = null;

    let itemsQuery = supabase
        .from('mind_links')
        .select('*')
        .order('created_at', { ascending: false });

    if (currentParentId) {
        itemsQuery = itemsQuery.eq('space_id', currentParentId);
        const result = await itemsQuery;
        items = result.data;
        itemsError = result.error;
    }
    // At root level, only show folders (items live inside platform folders)

    if (foldersError) {
        console.error('Spaces folders error:', foldersError);
        spacesContainer.innerHTML = `<p>Error loading spaces: ${escapeHTML(foldersError.message)}</p>`;
        return;
    }

    if (itemsError) {
        console.error('Spaces items error:', itemsError);
        // Still show folders if items fail (e.g. missing space_id column)
    }

    spacesContainer.innerHTML = '';

    const folderList = folders || [];

    if (folderList.length === 0 && (!items || items.length === 0)) {
        const emptyMsg = currentParentId
            ? 'No items in this space yet. Save a link to auto-sort here!'
            : 'No spaces yet. Create one, or save a YouTube/Instagram link.';
        spacesContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">folder_open</span>
                <p>${emptyMsg}</p>
            </div>
        `;
        return;
    }

    folderList.forEach(folder => {
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

async function openFolder(folder) {
    let folderId = folder.id;
    const smartKey = SMART_FOLDER_NAMES[folder.name];
    if (smartKey) {
        const canonicalId = await resolveSmartSpaceId(supabase, { type: smartKey });
        if (canonicalId) folderId = canonicalId;
    }
    folderPath.push({ id: folderId, name: folder.name });
    currentParentId = folderId;
    refreshSpacesWithBackfill();
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
