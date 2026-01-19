import { supabase } from "./supabase_config.js";

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const togglePassword = document.getElementById('toggle-password');

// Popup Elements
const popup = document.getElementById('error-popup');
const popupMsg = document.getElementById('popup-msg');
const popupTitle = document.getElementById('popup-title');
const popupIcon = document.getElementById('popup-icon');
const closePopup = document.getElementById('close-popup');

window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = "./index.html";
    }
};

// Toggle password visibility
togglePassword.onclick = () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.innerText = type === 'password' ? 'visibility' : 'visibility_off';
};

// Popup function
function showPopup(title, message, type = 'error') {
    popupTitle.innerText = title;
    popupMsg.innerHTML = message;
    popupIcon.innerText = type === 'success' ? 'check_circle' : 'error_outline';
    popupIcon.style.color = type === 'success' ? '#4CAF50' : '#E53935';
    popup.style.display = 'flex';
}

closePopup.onclick = () => popup.style.display = 'none';

loginBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showPopup("Missing Info", "Please enter both email and password.");
        return;
    }

    loginBtn.innerText = "Logging in...";
    loginBtn.disabled = true;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginBtn.innerText = "Log In";
        loginBtn.disabled = false;

        if (error.message.includes("Invalid login credentials")) {
            showPopup("Login Failed", "<b>Incorrect password</b> or email. If you don't have an account, please click <b>Create Account</b>.");
        } else if (error.message.includes("Email not confirmed")) {
            showPopup("Verify Email", "Your email is not verified yet. Please check your inbox and <b>Spam folder</b> for the verification link.");
        } else {
            showPopup("Error", error.message);
        }
    } else {
        window.location.href = "./splash_screen/splash.html";
    }
};

signupBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showPopup("Missing Info", "Please enter an email and password to create an account.");
        return;
    }

    signupBtn.innerText = "Creating...";
    signupBtn.disabled = true;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        showPopup("Sign Up Error", error.message);
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
    } else {
        showPopup("Success!", "Account created! A verification link has been sent to your email. <br><br><b>Note:</b> If you don't see it, please check your <b>Spam folder</b>.", "success");
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
    }
};
