import { supabase } from "./supabase_config.js";

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const statusMsg = document.getElementById('status-msg');

window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = "./index.html";
    }
};

loginBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        statusMsg.innerText = "Please fill all fields";
        return;
    }

    loginBtn.innerText = "Logging in...";
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        statusMsg.innerText = error.message;
        loginBtn.innerText = "Log In";
    } else {
        window.location.href = "./splash_screen/splash.html";
    }
};

signupBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        statusMsg.innerText = "Please fill all fields";
        return;
    }

    signupBtn.innerText = "Creating...";

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        statusMsg.innerText = error.message;
    } else {
        statusMsg.style.color = "#1976D2";
        statusMsg.innerText = "✓ Account created! Please check your email to verify your account.";
    }
    signupBtn.innerText = "Create Account";
};
