import { supabase } from "./supabase_config.js";

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const statusMsg = document.getElementById('status-msg');

// 1. পেজ লোড হলে চেক করবে ইউজার অলরেডি লগইন কিনা
window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // লগইন করা থাকলে সরাসরি হোম পেজে পাঠাবে
        window.location.href = "home_screen/home.html";
    }
};

// 2. লগইন ফাংশন
loginBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        statusMsg.innerText = "Please fill all fields";
        return;
    }

    loginBtn.innerText = "Logging in...";
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        statusMsg.innerText = error.message;
        loginBtn.innerText = "Log In";
    } else {
        // সফল হলে স্প্ল্যাশ স্ক্রিনে পাঠাবে, সেখান থেকে হোমে যাবে
        window.location.href = "splash_screen/splash.html";
    }
};

// 3. সাইন আপ (নতুন একাউন্ট) ফাংশন
signupBtn.onclick = async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        statusMsg.innerText = "Please fill all fields";
        return;
    }

    signupBtn.innerText = "Creating...";

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        statusMsg.innerText = error.message;
    } else {
        statusMsg.style.color = "green";
        statusMsg.innerText = "Account created! You can now Log In.";
    }
    signupBtn.innerText = "Create Account";
};
