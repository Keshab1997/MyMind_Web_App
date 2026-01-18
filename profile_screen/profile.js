import { supabase } from "../supabase_config.js";

const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// পেজ লোড হলে ইউজার ডাটা আনবে
window.onload = async () => {
    // 1. সেশন চেক করা
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // 2. ইমেইল সেট করা
        userEmailEl.innerText = user.email;

        // 3. ইমেইল থেকে নাম বের করা (Logic: @ এর আগের অংশ নেওয়া)
        // যেমন: user@gmail.com -> user
        const nameFromEmail = user.email.split('@')[0];
        userNameEl.innerText = nameFromEmail;
    } else {
        // ইউজার না থাকলে লগইন পেজে পাঠাবে
        window.location.href = "../index.html";
    }
};

// 4. লগআউট ফাংশন
logoutBtn.onclick = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        // লগআউট সফল হলে লগইন পেজে যাবে
        window.location.href = "../index.html";
    } else {
        alert("Error logging out!");
    }
};
