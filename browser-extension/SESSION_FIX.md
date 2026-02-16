# Extension Session Management - Fixed! ✅

## সমস্যা:
Browser বন্ধ করে আবার খুললে extension থেকে logout হয়ে যাচ্ছিল।

## কারণ:
Supabase এর access token মাত্র 1 ঘণ্টার জন্য valid থাকে। Browser বন্ধ করে 1 ঘণ্টা পর খুললে token expire হয়ে যায়।

## ✅ সমাধান:

### Auto Token Refresh যোগ করা হয়েছে

Extension খোলার সময় এখন:
1. Session check করবে
2. Token expire হওয়ার 5 মিনিট আগে থাকলে automatic refresh করবে
3. Refresh token দিয়ে নতুন access token নিয়ে আসবে
4. User কে আবার login করতে হবে না

### Code যা যোগ করা হয়েছে:

```javascript
// Check and refresh session if needed
chrome.storage.local.get(['session'], async (result) => {
    if (result.session) {
        const session = result.session;
        const expiresAt = session.expires_at;
        const currentTime = Math.floor(Date.now() / 1000);

        // If token expires in less than 5 minutes, refresh it
        if (expiresAt && (expiresAt - currentTime < 300)) {
            await refreshSession(session.refresh_token);
        } else {
            showSaveView(session);
        }
    } else {
        showLoginView();
    }
});

// Refresh session function
async function refreshSession(refreshToken) {
    if (!refreshToken) {
        showLoginView();
        return;
    }

    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        const data = await res.json();
        if (res.ok && data.access_token) {
            chrome.storage.local.set({ session: data }, () => {
                showSaveView(data);
            });
        } else {
            showLoginView();
        }
    } catch (e) {
        showLoginView();
    }
}
```

## 🎯 কীভাবে কাজ করে:

1. **Extension খোলা হলে:**
   - Session check করে
   - Token এর expiry time দেখে

2. **Token valid থাকলে:**
   - সরাসরি save view দেখায়
   - কোনো refresh দরকার নেই

3. **Token expire হওয়ার কাছাকাছি থাকলে:**
   - Automatic refresh করে
   - নতুন token নিয়ে আসে
   - User কিছু বুঝতে পারে না

4. **Refresh token invalid থাকলে:**
   - Login screen দেখায়
   - User কে আবার login করতে হবে

## 🧪 Test করার নিয়ম:

### Test 1: Normal Usage
1. Extension এ login করুন
2. Browser বন্ধ করুন
3. 10 মিনিট পর আবার খুলুন
4. Extension icon ক্লিক করুন
5. ✅ Logged in থাকবে

### Test 2: Long Time
1. Extension এ login করুন
2. Browser বন্ধ করুন
3. 2-3 ঘণ্টা পর আবার খুলুন
4. Extension icon ক্লিক করুন
5. ✅ Auto-refresh হবে, logged in থাকবে

### Test 3: Very Long Time
1. Extension এ login করুন
2. Browser বন্ধ করুন
3. 1 সপ্তাহ পর আবার খুলুন
4. Extension icon ক্লিক করুন
5. ⚠️ Login screen দেখাবে (refresh token expire)

## 📊 Token Lifecycle:

```
Login
  ↓
Access Token (1 hour) + Refresh Token (7 days)
  ↓
After 55 minutes → Auto Refresh
  ↓
New Access Token (1 hour) + Same Refresh Token
  ↓
Repeat...
  ↓
After 7 days → Refresh Token Expires → Need Login
```

## 🔒 Security:

- ✅ Tokens stored in `chrome.storage.local` (secure)
- ✅ Auto-refresh prevents unnecessary logins
- ✅ Refresh token has 7 days expiry (Supabase default)
- ✅ No passwords stored

## 💡 Best Practices:

### For Users:
- Login একবার করলে 7 দিন পর্যন্ত কাজ করবে
- Browser বন্ধ করলেও session থাকবে
- শুধু 7 দিন পর আবার login করতে হবে

### For Developers:
- Refresh token always store করুন
- Token expiry check করুন
- Auto-refresh implement করুন
- Error handling করুন

## 🐛 Troubleshooting:

### Issue: Still logging out
**Check:**
1. Supabase dashboard → Authentication → Settings
2. "Refresh Token Rotation" enabled আছে কিনা
3. "Refresh Token Reuse Interval" = 10 seconds

### Issue: "Invalid refresh token"
**Reason:** Refresh token expire হয়ে গেছে (7 days)
**Solution:** আবার login করুন

### Issue: Network error
**Reason:** Internet connection নেই
**Solution:** Internet check করুন

## ✨ Benefits:

- ✅ Better UX - কম login করতে হয়
- ✅ Seamless - User কিছু বুঝতে পারে না
- ✅ Secure - Token rotation হয়
- ✅ Reliable - Auto-recovery

---

এখন extension reload করুন এবং test করুন! Browser বন্ধ করে খুললেও logout হবে না! 🎉
