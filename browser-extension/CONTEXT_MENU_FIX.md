# Extension Context Menu - Troubleshooting Guide

## সমস্যা:
Right click করে "Save to My Mind" select করলে:
- কোনো feedback দেখা যাচ্ছে না
- Save হচ্ছে কিনা বোঝা যাচ্ছে না

## ✅ সমাধান করা হয়েছে:

### 1. Better Notifications
- ✅ Success: সবুজ checkmark সহ
- ❌ Error: লাল cross সহ
- Clear message দেখাবে

### 2. Auto-open App
- Save হলে নতুন tab এ app খুলবে (background এ)
- Saved item দেখতে পারবেন

### 3. Priority Notification
- `priority: 2` যোগ করা হয়েছে
- Notification miss হবে না

## 🧪 Test করার নিয়ম:

### Step 1: Extension Reload
1. `chrome://extensions` এ যান
2. "My Mind - Smart Saver" খুঁজুন
3. Reload icon ক্লিক করুন

### Step 2: Login Check
1. Extension icon ক্লিক করুন
2. Login করা আছে কিনা দেখুন
3. না থাকলে login করুন

### Step 3: Test Context Menu
1. যেকোনো webpage এ যান
2. Right click করুন
3. "Save to My Mind" select করুন
4. Notification দেখুন:
   - ✅ "Saved!" = Success
   - ❌ "Save Failed" = Error

### Step 4: Verify Save
1. Notification এ ✅ দেখলে
2. নতুন tab খুলবে (background এ)
3. সেখানে saved item দেখুন

## 🔍 যদি এখনো কাজ না করে:

### Check 1: Notifications Permission
```
chrome://settings/content/notifications
```
- Chrome notifications enable আছে কিনা check করুন

### Check 2: Extension Permissions
```
chrome://extensions
```
- "My Mind - Smart Saver" এ click করুন
- Permissions দেখুন:
  - ✅ Display notifications
  - ✅ Read and change data on cmrgloxlyovihqhdxdls.supabase.co

### Check 3: Console Errors
1. Extension popup খুলুন
2. Right click → Inspect
3. Console tab এ errors আছে কিনা দেখুন

### Check 4: Background Service Worker
1. `chrome://extensions` → "My Mind - Smart Saver"
2. "Inspect views: service worker" ক্লিক করুন
3. Console এ errors দেখুন

## 🐛 Common Issues:

### Issue 1: "Login Required" Notification
**কারণ:** Session expire হয়ে গেছে  
**সমাধান:** Extension popup খুলে আবার login করুন

### Issue 2: No Notification at All
**কারণ:** Chrome notifications blocked  
**সমাধান:** 
```
Settings → Privacy and security → Site Settings → Notifications
→ Allow notifications
```

### Issue 3: "Network Error"
**কারণ:** Internet connection নেই বা Supabase down  
**সমাধান:** Internet check করুন এবং retry করুন

### Issue 4: Save হচ্ছে কিন্তু দেখা যাচ্ছে না
**কারণ:** Cache issue  
**সমাধান:** Web app এ গিয়ে refresh করুন (Ctrl+Shift+R)

## 📱 Alternative Methods:

যদি context menu কাজ না করে:

### Method 1: Extension Popup
1. Extension icon ক্লিক করুন
2. URL auto-fill হবে
3. Save button ক্লিক করুন

### Method 2: Keyboard Shortcut
1. `Ctrl+Shift+S` (Windows) বা `Cmd+Shift+S` (Mac)
2. Popup খুলবে
3. Save করুন

### Method 3: Web App
1. সরাসরি web app খুলুন
2. + button ক্লিক করুন
3. URL paste করুন

## ✨ New Features:

### Auto-open App
Save করার পর automatically app খুলবে (background tab এ)। এতে:
- Saved item সাথে সাথে দেখতে পারবেন
- Confirmation পাবেন যে save হয়েছে

### Better Error Messages
- "Login Required" - Session expire
- "Save Failed" - Server error
- "Network Error" - Connection issue

## 🎯 Expected Behavior:

**Success Flow:**
1. Right click → "Save to My Mind"
2. ✅ Notification: "Saved! [Title] added to your mind"
3. New tab opens (background) with your app
4. Item visible in feed

**Error Flow:**
1. Right click → "Save to My Mind"
2. ❌ Notification: "Save Failed" or "Login Required"
3. Follow instructions in notification

---

এখন extension reload করুন এবং test করুন! 🚀
