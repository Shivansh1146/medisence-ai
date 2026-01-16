# 🔐 Google Sign-In Troubleshooting Guide

## Problem: Google Sign-In Not Working

### Added Debug Logging

The code now includes comprehensive console logging to help diagnose the issue:

```javascript
🔐 Google Sign-In initiated
✅ Firebase auth available: true
✅ GoogleAuthProvider available: true
🔄 Opening Google Sign-In popup...
✅ Sign-In successful!
👤 User: user@example.com
```

---

## Common Issues & Solutions

### 1. **Unauthorized Domain Error**

**Error Code:** `auth/unauthorized-domain`

**Solution:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **first-hackathon-project-76ce6**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your domain (e.g., `localhost`, `127.0.0.1`, or your deployment domain)

**Current authorized domains should include:**

- `localhost`
- `first-hackathon-project-76ce6.firebaseapp.com`
- `first-hackathon-project-76ce6.web.app`
- Any custom domain you're using

---

### 2. **Popup Blocked by Browser**

**Error Code:** `auth/popup-blocked`

**Solution:**

- Check browser address bar for popup blocked icon
- Click and allow popups for this site
- Try signing in again

---

### 3. **Network Request Failed**

**Error Code:** `auth/network-request-failed`

**Solution:**

- Check internet connection
- Try refreshing the page
- Check if Firebase services are accessible in your region

---

### 4. **Popup Closed by User**

**Error Code:** `auth/popup-closed-by-user`

**This is normal** - user cancelled the sign-in. No error message is shown.

---

## How to Test

### 1. Open Browser Console

- Press `F12` or `Ctrl+Shift+I` (Windows)
- Go to **Console** tab

### 2. Click "Continue with Google"

### 3. Watch Console Output

You should see:

```
🔐 Google Sign-In initiated
✅ Firebase auth available: true
✅ GoogleAuthProvider available: true
🔄 Opening Google Sign-In popup...
```

### 4. Complete Google Sign-In in Popup

### 5. Check for Success or Error

**Success:**

```
✅ Sign-In successful!
👤 User: your-email@gmail.com
🔐 Auth state changed: Logged in as your-email@gmail.com
✅ User authenticated: {...}
📴 Closing auth modal after successful login
```

**Error:**

```
❌ LOGIN ERROR: FirebaseError: ...
Error code: auth/...
Error message: ...
```

---

## Firebase Configuration Check

**Current Configuration:**

```javascript
apiKey: "AIzaSyCC1BdzVF-GgBusft-DUwjwkUgWMXKQWyg";
authDomain: "first-hackathon-project-76ce6.firebaseapp.com";
projectId: "first-hackathon-project-76ce6";
```

### Verify in Firebase Console:

1. **Authentication is Enabled:**

   - Go to Authentication → Sign-in method
   - Verify **Google** provider is **Enabled**

2. **Check Authorized Domains:**
   - Authentication → Settings → Authorized domains
   - Add your current domain if missing

---

## File Open Protocol Issue

**If opening `index.html` directly as `file://`:**

Firebase may not work with `file://` protocol.

**Solution: Use a local server**

```powershell
# Option 1: Python
cd frontend
python -m http.server 8000
# Open: http://localhost:8000

# Option 2: Live Server (VS Code Extension)
# Install "Live Server" extension
# Right-click index.html → Open with Live Server

# Option 3: Node.js http-server
npm install -g http-server
cd frontend
http-server -p 8000
```

---

## Quick Fix Checklist

- [ ] Open browser console (F12)
- [ ] Click "Continue with Google"
- [ ] Check console for error messages
- [ ] If `auth/unauthorized-domain`:
  - [ ] Add domain to Firebase Console
- [ ] If `auth/popup-blocked`:
  - [ ] Allow popups in browser
- [ ] If using `file://` protocol:
  - [ ] Use local server instead
- [ ] If Firebase not initialized:
  - [ ] Check firebase.js is loaded
  - [ ] Check for `✅ Firebase initialized` in console

---

## Expected Flow

1. User clicks "Continue with Google"
2. Console shows: `🔐 Google Sign-In initiated`
3. Popup opens with Google sign-in page
4. User selects Google account
5. Console shows: `✅ Sign-In successful!`
6. Auth state changes: `🔐 Auth state changed: Logged in`
7. Modal closes automatically
8. Welcome toast appears
9. Profile icon shows user photo

---

## Still Not Working?

### Check These:

1. **Is Firebase loaded?**

   ```javascript
   console.log(window.firebaseAuth); // Should not be undefined
   ```

2. **Is the auth button calling the right function?**

   - Inspect button: `onclick="handleGoogleLogin()"`

3. **Is there a CORS error?**

   - Check Network tab in DevTools

4. **Is your Firebase project active?**
   - Go to Firebase Console
   - Check project status

---

## Debug Commands

Run these in browser console:

```javascript
// Check Firebase initialization
console.log("Firebase Auth:", window.firebaseAuth);

// Check auth state
console.log("Current User:", window.firebaseAuth?.auth?.currentUser);

// Manual test
handleGoogleLogin();
```

---

## Contact Support

If issue persists:

1. Copy all console error messages
2. Note the exact error code (e.g., `auth/unauthorized-domain`)
3. Check Firebase Console → Authentication → Users (to see if sign-in is being recorded)
4. Verify the domain you're accessing from

---

**Last Updated:** January 16, 2026
**Added Features:** Enhanced error logging and user feedback
