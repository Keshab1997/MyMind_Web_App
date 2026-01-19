import { supabase } from "../supabase_config.js";

const IMGBB_API_KEY = "3f28730505fe4abf28c082d23f395a1b";

const profileImg = document.getElementById('profile-img');
const photoUpload = document.getElementById('photo-upload');
const editName = document.getElementById('edit-name');
const editEmail = document.getElementById('edit-email');
const newPassword = document.getElementById('new-password');
const togglePassIcon = document.getElementById('toggle-pass-icon');
const saveBtn = document.getElementById('save-profile-btn');
const statusMsg = document.getElementById('status-msg');

const displayNameTop = document.getElementById('display-name-top');
const displayEmailTop = document.getElementById('display-email-top');

// Load user data
window.onload = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user) {
        editEmail.value = user.email;
        displayEmailTop.innerText = user.email;
        
        const name = user.user_metadata.full_name || user.email.split('@')[0];
        const avatar = user.user_metadata.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        
        editName.value = name;
        displayNameTop.innerText = name;
        profileImg.src = avatar;
    } else {
        window.location.href = "../login.html";
    }
};

// Toggle password visibility
togglePassIcon.onclick = () => {
    const type = newPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    newPassword.setAttribute('type', type);
    togglePassIcon.innerText = type === 'password' ? 'visibility' : 'visibility_off';
};

// Profile photo upload
photoUpload.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showStatus("Uploading photo...", "orange");
    
    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });
        const result = await res.json();

        if (result.success) {
            const newAvatarUrl = result.data.url;
            profileImg.src = newAvatarUrl;
            showStatus("Photo uploaded! Click Save to apply.", "green");
        }
    } catch (err) {
        showStatus("Photo upload failed.", "red");
    }
};

// Save profile
saveBtn.onclick = async () => {
    const name = editName.value.trim();
    const password = newPassword.value.trim();
    const avatarUrl = profileImg.src;

    if (!name) {
        showStatus("Name cannot be empty", "red");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";

    try {
        const updateData = {
            data: { 
                full_name: name,
                avatar_url: avatarUrl
            }
        };

        if (password) {
            if (password.length < 6) throw new Error("Password must be at least 6 characters");
            updateData.password = password;
        }

        const { error } = await supabase.auth.updateUser(updateData);

        if (error) throw error;

        displayNameTop.innerText = name;
        showStatus("Profile updated successfully!", "green");
        newPassword.value = "";
        newPassword.setAttribute('type', 'password');
        togglePassIcon.innerText = 'visibility';
    } catch (err) {
        showStatus(err.message, "red");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span class="material-icons">check_circle</span> Save Changes`;
    }
};

// Logout
document.getElementById('logout-btn').onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "../login.html";
};

function showStatus(msg, color) {
    statusMsg.innerText = msg;
    statusMsg.style.color = color;
}
