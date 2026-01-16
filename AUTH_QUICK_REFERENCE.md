# 🎯 Authentication Quick Reference

**MedicSense AI - At-a-Glance Guide**

---

## 🔑 THE GOLDEN RULES

```
1. Google users NEVER have passwords
2. Email users ALWAYS have passwords
3. Auth methods DON'T mix (unless explicitly linked)
4. Errors are ALWAYS helpful, never revealing
5. Recovery options are ALWAYS provided
```

---

## 📊 USER DATA STRUCTURE

### Google User

```json
{
  "user_id": "uuid",
  "email": "user@gmail.com",
  "phone": "",
  "name": "John Doe",
  "auth_method": "google",
  "google_id": "google_uid_12345",
  "google_email": "user@gmail.com",
  "created_at": "2026-01-16T10:00:00"
}
```

**Key Point:** NO `password_hash` field

### Email/Password User

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "phone": "+919999999999",
  "name": "Jane Smith",
  "auth_method": "email_password",
  "password_hash": "$2b$12$...",
  "created_at": "2026-01-16T10:00:00"
}
```

**Key Point:** NO `google_id` field

---

## 🔄 AUTHENTICATION FLOWS

### Flow 1: Email/Password Signup

```
User Form Input
    ↓
POST /api/auth/signup
    ↓
Validate password strength
    ↓
Check email doesn't exist
    ↓
Hash password with bcrypt
    ↓
Send OTP to phone
    ↓
Store pending user data
    ↓
Return success + OTP
    ↓
User enters OTP
    ↓
POST /api/auth/verify-otp
    ↓
Verify OTP
    ↓
Create user in database
    ↓
Create session token
    ↓
Return token + user data
```

### Flow 2: Email/Password Login

```
User Form Input
    ↓
POST /api/auth/login
    ↓
Lookup user by email
    ↓
Check auth_method = "email_password"
    ↓
Verify password hash
    ↓
Verify phone matches
    ↓
Send OTP (2FA)
    ↓
Store login attempt
    ↓
Return success + OTP
    ↓
User enters OTP
    ↓
POST /api/auth/verify-otp
    ↓
Verify OTP
    ↓
Create session token
    ↓
Return token + user data
```

### Flow 3: Google Sign-In

```
User clicks Google button
    ↓
Firebase handles OAuth
    ↓
Get Google ID token + user info
    ↓
POST /api/auth/google
    ↓
Check if user exists by google_id
    ↓
If exists: Login
If not: Check if email exists
    ↓
If email exists with password:
    Return conflict error
If email doesn't exist:
    Create new user
    ↓
Create session token
    ↓
Return token + user data
```

---

## ❌ ERROR SCENARIOS & RESPONSES

### Scenario: Google User Tries Email/Password

**What Happens:**

```
User: test@gmail.com (signed up with Google)
Tries: Email/password login
Backend: Looks up email → auth_method = "google"
Response: ❌ Auth failed, try Google
```

**User Sees:**

```
❌ Authentication failed. Please try 'Continue with Google' or contact support.

Try these options:
• Click 'Continue with Google'
• Contact support to add password
• Create new account with different email
```

### Scenario: Email User Tries Google

**What Happens:**

```
User: test@example.com (signed up with password)
Tries: Google login with same email
Backend: Google ID doesn't exist, check email
→ Email exists with auth_method = "email_password"
Response: ❌ Conflict
```

**User Sees:**

```
❌ An account with this email already exists. Please sign in with email and password, or contact support to link your Google account.

Try these options:
• Try email/password login
• Reset your password
• Contact support
```

### Scenario: Wrong Password

**What Happens:**

```
User: Enters wrong password
Backend: Password verification fails
Response: ❌ Generic auth error
```

**User Sees:**

```
❌ Authentication failed. Please check your credentials or reset your password.

Try these options:
• Check your password
• Reset your password
• Contact support
```

---

## 🔐 SECURITY FEATURES

### Password Hashing

```python
# User's password: "MyPassword123"
# Stored in DB: "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

- Algorithm: bcrypt
- Rounds: 12
- Salt: Automatically generated
- Cannot be reversed

### Session Tokens

```python
# Example: "vJ2qIHbxLR3k7YZ9mN8pQwXcVbNmKl..."
# Length: 32 bytes (43 characters base64)
# Cryptographically secure random
```

### OTP (2FA)

```python
# 6-digit code
# Expires: 10 minutes
# Stored: Hashed with SHA-256
# Rate limited: Prevent brute force
```

---

## 🗄️ DATABASE QUERIES CHEAT SHEET

### Check User's Auth Method

```python
user = db.get_user_by_email("test@example.com")
auth_method = user.get("auth_method")

if auth_method == "google":
    # User signed up with Google - NO password
    # Must use Google sign-in
elif auth_method == "email_password":
    # User has password - can use email/password
    # Cannot use Google (unless linked)
```

### Verify Password

```python
from password_utils import verify_password

user = db.get_user_by_email(email)
password_hash = user.get("password_hash", "")
is_valid = verify_password(password, password_hash)
```

### Check Session

```python
session = auth_manager.validate_session(token)
if session:
    user_id = session["user_id"]
    user_data = session["user_data"]
else:
    # Session expired or invalid
    return 401
```

---

## 🎨 FRONTEND INTEGRATION

### Store Session After Login

```javascript
const data = await response.json();

if (data.success) {
  // Store token
  localStorage.setItem("medicsense_token", data.token);

  // Store user info
  localStorage.setItem("medicsense_user", JSON.stringify(data.user));

  // Redirect
  window.location.href = "index.html";
}
```

### Check Authentication Status

```javascript
async function checkAuth() {
  const token = localStorage.getItem("medicsense_token");

  if (!token) {
    // Not logged in
    window.location.href = "auth.html";
    return;
  }

  const response = await fetch("http://localhost:5000/api/auth/session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!data.authenticated) {
    // Session expired
    localStorage.clear();
    window.location.href = "auth.html";
  }
}
```

### Logout

```javascript
async function logout() {
  const token = localStorage.getItem("medicsense_token");

  await fetch("http://localhost:5000/api/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  localStorage.clear();
  window.location.href = "auth.html";
}
```

---

## 🔍 DEBUGGING TIPS

### Check User's Auth Method

```powershell
# View users database
cat backend/data/users.json

# Search for specific user
cat backend/data/users.json | Select-String "test@example.com"
```

### Check Session Storage

```javascript
// In browser console
console.log(localStorage.getItem("medicsense_token"));
console.log(localStorage.getItem("medicsense_user"));
```

### Test API Endpoints

```powershell
# Test signup
curl -X POST http://localhost:5000/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123","name":"Test","phone":"9999999999","phoneCode":"+91"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123","phone":"9999999999","phoneCode":"+91"}'
```

---

## 📊 AUTHENTICATION DECISION TREE

```
User tries to authenticate
    │
    ├─ Uses Google Button?
    │  ├─ Yes → Check google_id
    │  │   ├─ Found → Login ✅
    │  │   └─ Not Found → Check email
    │  │       ├─ Email exists with password → Error ❌
    │  │       └─ Email doesn't exist → Create account ✅
    │  │
    │  └─ No → Uses Email/Password Form
    │      └─ Check email exists
    │          ├─ Not found → Error ❌
    │          └─ Found → Check auth_method
    │              ├─ "email_password" → Verify password
    │              │   ├─ Correct → Send OTP → Verify OTP → Login ✅
    │              │   └─ Wrong → Error ❌
    │              │
    │              └─ "google" → Error ❌ (use Google)
```

---

## 🎯 SUPPORT AGENT SCRIPT

When user says: "I can't log in"

**Agent:**

```
"I can help you with that. Let me ask you a few questions:

1. Do you remember how you created your account?
   - Did you use the 'Continue with Google' button?
   - Or did you create a password?

2. If you're not sure, let's try both methods:
   - First, try clicking 'Continue with Google'
   - If that doesn't work, try the email and password form

3. If neither works, I can help you reset your password or verify your account details."
```

---

## 🏥 HEALTHCARE COMPLIANCE NOTES

### Password Requirements

- ✅ Minimum 6 characters (meets basic standards)
- ✅ Bcrypt hashing (HIPAA recommended)
- ✅ No password stored in plain text
- ✅ No password in logs or error messages

### Session Security

- ✅ 24-hour expiration (reasonable for healthcare)
- ✅ Cryptographically secure tokens
- ✅ Server-side validation
- ✅ Proper cleanup of expired sessions

### Privacy Protection

- ✅ No email enumeration
- ✅ Generic error messages
- ✅ Constant-time password verification
- ✅ No auth method revealed in errors

---

## ✅ FINAL CHECKLIST

Before going live:

- [ ] bcrypt installed
- [ ] Auth routes registered
- [ ] Database schema updated
- [ ] Frontend updated with new endpoints
- [ ] All test scenarios pass
- [ ] Error messages are helpful
- [ ] Recovery options shown
- [ ] Passwords are hashed
- [ ] Sessions work correctly
- [ ] Google OAuth configured
- [ ] OTP service configured
- [ ] HTTPS enabled (required for Google)
- [ ] Production environment variables set

---

**Quick Reference Version:** 1.0
**Last Updated:** January 16, 2026
**Print this for your desk!** 📄

---

## 🚨 EMERGENCY CONTACTS

If authentication completely breaks:

1. **Bypass for testing:**

   ```python
   # Temporarily in app.py
   @app.route("/api/auth/emergency-login", methods=["POST"])
   def emergency_login():
       # Create temporary session for testing
       # REMOVE BEFORE PRODUCTION
       pass
   ```

2. **Reset all users:**

   ```powershell
   cd backend/data
   echo "{}" > users.json
   ```

3. **Clear all sessions:**
   ```python
   auth_manager.sessions.clear()
   ```

**Remember: These are emergency measures only!** 🆘
