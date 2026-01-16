# 🧪 Testing Guide - MedicSense AI Authentication

## Quick Test Steps

### 1. Test Login Flow (Google)

1. Open `http://localhost:5000` in browser
2. Click the user icon (top right)
3. **Expected:** Modal opens with "Welcome Back" header
4. Click "Continue with Google"
5. **Expected:** Google popup appears
6. Complete Google sign-in
7. **Expected:**
   - Modal closes automatically
   - Toast shows "Welcome back!"
   - User avatar appears in navbar
   - No console errors

### 2. Test Profile View

1. Click your avatar in navbar
2. **Expected:**
   - Modal opens showing profile
   - Your name displayed correctly
   - Email displayed correctly
   - "Sign Out" button visible
   - No UID or sensitive data shown

### 3. Test Logout

1. Click "Sign Out" button
2. **Expected:**
   - Modal closes
   - Navbar returns to user icon
   - Console shows: "🔐 Auth state changed: Logged out"
   - localStorage cleared (check DevTools → Application)

### 4. Test Refresh Persistence

1. Log in
2. Refresh the page (F5)
3. **Expected:** Still logged in, avatar still shows

### 5. Test Email Login

1. Log out if logged in
2. Click user icon
3. Enter email and password (6+ chars)
4. Click "Sign In / Sign Up"
5. **Expected:**
   - If email exists: signs in
   - If email new: creates account
   - Modal closes, avatar shows

### 6. Test Error Handling

1. **Wrong Password:**

   - Enter existing email + wrong password
   - **Expected:** Error message shown in modal

2. **Cancel Google Popup:**

   - Start Google login
   - Close popup without signing in
   - **Expected:** No error toast (intentional cancellation)

3. **Network Error:**
   - Open DevTools → Network tab
   - Set to "Offline"
   - Try to login
   - **Expected:** "No internet connection" error

### 7. Test Keyboard Accessibility

1. Open login modal
2. Press `Escape` key
3. **Expected:** Modal closes

### 8. Test Guest User Booking

1. Log out completely
2. Scroll to "Book Appointment"
3. Fill form and submit
4. **Expected:**
   - Booking succeeds
   - Console shows: "⚠️ Booking as guest user"

### 9. Test Phone Auth User (if available)

1. Log in with phone number
2. View profile
3. **Expected:** Shows phone number instead of email

### 10. Test Multiple Logins/Logouts

1. Login → Logout → Login → Logout (repeat 3 times)
2. **Expected:** No errors, consistent behavior each time

---

## What to Check in Console

### ✅ Good Messages:

```
✅ Firebase initialized & exposed to window
🔐 Initializing authentication system...
🔐 Setting up auth state listener...
🔐 Auth state changed: Logged in as user@email.com
✅ Original auth modal content saved
📦 User data loaded from localStorage
```

### ❌ Bad Messages (should NOT appear):

```
❌ Firebase auth not available
🚨 APP TIMEOUT
❌ Auth modal content not found
Uncaught TypeError
Reference Error
```

---

## What to Check in DevTools

### Application → Local Storage

**When logged in:**

- `medicsense_user_id` = Firebase UID (like "abc123xyz...")

**When logged out:**

- `medicsense_user_id` = Should NOT exist

### Network Tab

**On login:**

- Request to `identitytoolkit.googleapis.com` (Firebase auth)
- Status: 200 OK

---

## Common Issues & Fixes

### Issue: Modal doesn't open

**Cause:** JavaScript error before auth functions load
**Check:** Console for errors

### Issue: Still shows "Sign In" after login

**Cause:** Auth state listener not working
**Check:** Console should show "🔐 Auth state changed: Logged in"

### Issue: Profile shows wrong user

**Cause:** Cached state not cleared
**Fix:** Hard refresh (Ctrl+F5), clear localStorage

### Issue: "Firebase not ready" error

**Cause:** Trying to login before Firebase loads
**Fix:** Wait 2-3 seconds after page load

---

## Browser Compatibility Test

Test in:

- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browser (responsive)

---

## Performance Test

1. Open DevTools → Performance tab
2. Start recording
3. Click login → sign in → close modal
4. Stop recording
5. **Expected:** No long tasks (>50ms), smooth animations

---

## Security Test

### Check These:

1. **No UID visible** in profile modal
2. **localStorage cleared** after logout
3. **No auth tokens** visible in HTML
4. **Previous user data** not accessible after logout

### How to Test:

1. Login as User A
2. Book appointment
3. Logout
4. Login as User B
5. Check appointments list
6. **Expected:** User A's appointments NOT visible

---

## Automated Test (Optional)

If you have time, run these in browser console:

```javascript
// Test 1: Check auth functions exist
console.assert(typeof openAuthModal === "function", "❌ openAuthModal missing");
console.assert(
  typeof closeAuthModal === "function",
  "❌ closeAuthModal missing"
);
console.assert(
  typeof handleGoogleLogin === "function",
  "❌ handleGoogleLogin missing"
);

// Test 2: Check state initialization
console.assert(
  state.currentUser === null || typeof state.currentUser === "string",
  "❌ Invalid currentUser"
);

// Test 3: Check Firebase loaded
console.assert(
  typeof window.firebaseAuth === "object",
  "❌ Firebase not loaded"
);

console.log("✅ All basic checks passed!");
```

---

## What Success Looks Like

✅ Can login with Google smoothly
✅ Can login with email/password
✅ Avatar shows immediately after login
✅ Profile shows correct user info
✅ Logout clears everything
✅ Refresh keeps user logged in
✅ No errors in console
✅ Modal opens/closes smoothly
✅ Escape key closes modal
✅ Network errors handled gracefully
✅ Guest users can still book appointments

---

## If Something Breaks

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Clear localStorage** (DevTools → Application → Clear storage)
3. **Hard refresh** (Ctrl+F5)
4. **Check console** for specific error
5. **Check Network tab** for failed requests

---

## Report Issues

If you find bugs, note:

1. What you did (steps to reproduce)
2. What you expected
3. What actually happened
4. Console errors (screenshot)
5. Browser and version

---

_Last updated: January 16, 2026_
