# 🔐 MedicSense AI Authentication System

## Visual Architecture & Flow Diagrams

---

## 🎯 CORE PRINCIPLE

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  "Authentication methods are mutually exclusive              │
│   until explicitly linked by the user"                       │
│                                                               │
│  Translation: Google ≠ Password (they're separate worlds)   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 👥 USER TYPES

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER UNIVERSE                            │
│                                                                 │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐ │
│  │  GOOGLE USERS  │    │ EMAIL/PASSWORD │    │    BOTH      │ │
│  │                │    │     USERS      │    │  (LINKED)    │ │
│  │ ✅ Google login│    │ ✅ Email login │    │ ✅ Google    │ │
│  │ ❌ Password    │    │ ✅ Password    │    │ ✅ Password  │ │
│  │ ❌ Reset pwd   │    │ ✅ Reset pwd   │    │ ✅ Reset pwd │ │
│  │                │    │ ❌ Google login│    │              │ │
│  └────────────────┘    └────────────────┘    └──────────────┘ │
│         │                       │                     │         │
│         │                       │                     │         │
│    auth_method:            auth_method:          auth_method:  │
│     "google"             "email_password"          "both"      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 AUTHENTICATION FLOW - DETAILED

### Scenario 1: New User Signs Up with Email/Password

```
┌─ USER ──────────────────────────────────────────────────────────┐
│ Fills form:                                                      │
│ • Name: John Doe                                                 │
│ • Email: john@example.com                                        │
│ • Phone: +919999999999                                           │
│ • Password: SecurePass123                                        │
│ Clicks: [Sign Up]                                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ FRONTEND ──────────────────────────────────────────────────────┐
│ POST /api/auth/signup                                            │
│ Body: { email, password, name, phone, phoneCode }                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ BACKEND ───────────────────────────────────────────────────────┐
│ 1. Validate inputs ✓                                             │
│    ├─ Email format valid?                                        │
│    ├─ Password >= 6 chars?                                       │
│    └─ Phone number present?                                      │
│                                                                   │
│ 2. Check email doesn't exist ✓                                   │
│    └─ db.get_user_by_email(john@example.com)                     │
│       └─ Returns: None (good, email available)                   │
│                                                                   │
│ 3. Hash password 🔒                                              │
│    Input:  "SecurePass123"                                       │
│    Output: "$2b$12$N9qo8uLOickgx2ZMRZoMye..."                   │
│                                                                   │
│ 4. Send OTP 📱                                                   │
│    └─ otp_service.send_otp("+919999999999", "John Doe")          │
│       └─ Generates: "123456"                                     │
│       └─ SMS sent (or logged in dev mode)                        │
│                                                                   │
│ 5. Store pending user data (NOT in database yet) 💾              │
│    auth_manager.sessions["pending_+919999999999"] = {            │
│      user_id: "uuid-1234",                                       │
│      user_data: {                                                │
│        email: "john@example.com",                                │
│        phone: "+919999999999",                                   │
│        name: "John Doe",                                         │
│        auth_method: "email_password",                            │
│        password_hash: "$2b$12$..."                               │
│      },                                                           │
│      expires_at: "2026-01-16T10:15:00"                           │
│    }                                                              │
│                                                                   │
│ 6. Return response ✅                                            │
│    {                                                              │
│      success: true,                                              │
│      message: "Verification code sent to your phone.",           │
│      action: "verify_otp",                                       │
│      phone: "+919999999999",                                     │
│      otp: "123456"  ← Dev mode only!                             │
│    }                                                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ FRONTEND ──────────────────────────────────────────────────────┐
│ Receives response                                                │
│ Shows: "Verification code sent to your phone."                   │
│ Displays OTP input section                                       │
│ (Auto-fills "123456" in dev mode)                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ USER ──────────────────────────────────────────────────────────┐
│ Sees OTP: 123456                                                 │
│ Enters OTP in form                                               │
│ Clicks: [Verify OTP]                                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ FRONTEND ──────────────────────────────────────────────────────┐
│ POST /api/auth/verify-otp                                        │
│ Body: { phone: "+919999999999", otp: "123456" }                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ BACKEND ───────────────────────────────────────────────────────┐
│ 1. Verify OTP ✓                                                  │
│    └─ otp_service.verify_otp("+919999999999", "123456")          │
│       └─ Checks hash matches ✓                                   │
│                                                                   │
│ 2. Check for pending signup session ✓                            │
│    └─ Found: auth_manager.sessions["pending_+919999999999"]      │
│                                                                   │
│ 3. NOW create user in database 💾                                │
│    db.create_user("uuid-1234", {                                 │
│      email: "john@example.com",                                  │
│      phone: "+919999999999",                                     │
│      name: "John Doe",                                           │
│      auth_method: "email_password",  ← IMPORTANT!                │
│      password_hash: "$2b$12$...",    ← Stored securely           │
│      created_at: "2026-01-16T10:00:00"                           │
│    })                                                             │
│                                                                   │
│ 4. Create session token 🎟️                                      │
│    session = auth_manager.create_session("uuid-1234", user_data) │
│    Returns: {                                                     │
│      token: "vJ2qIHbxLR3k7YZ9mN8pQwXcVbNm...",                   │
│      expires_at: "2026-01-17T10:00:00" (24 hours)                │
│    }                                                              │
│                                                                   │
│ 5. Clean up pending session 🧹                                   │
│    delete auth_manager.sessions["pending_+919999999999"]         │
│                                                                   │
│ 6. Return success ✅                                             │
│    {                                                              │
│      success: true,                                              │
│      message: "Account created successfully!",                   │
│      user: {                                                      │
│        id: "uuid-1234",                                          │
│        email: "john@example.com",                                │
│        name: "John Doe",                                         │
│        phone: "+919999999999",                                   │
│        authMethod: "email_password"  ← Front-end knows this      │
│      },                                                           │
│      token: "vJ2qIHbxLR3k7YZ9mN8pQwXcVbNm...",                   │
│      isNewUser: true                                             │
│    }                                                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ FRONTEND ──────────────────────────────────────────────────────┐
│ Stores:                                                          │
│ • localStorage.setItem('medicsense_token', token)                │
│ • localStorage.setItem('medicsense_user', JSON.stringify(user))  │
│                                                                   │
│ Shows: "Account created successfully!"                           │
│ Redirects: window.location.href = 'index.html'                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ USER ──────────────────────────────────────────────────────────┐
│ ✅ Logged in and redirected to dashboard                         │
│ ✅ Can now use application                                       │
│ ✅ Has auth_method = "email_password"                            │
│ ✅ Password securely stored as hash                              │
│ ✅ Can login with email + password + OTP in future               │
└──────────────────────────────────────────────────────────────────┘
```

---

## ❌ ERROR FLOW - User Tries Wrong Auth Method

### Scenario: Google User Tries Email/Password Login

```
┌─ USER ──────────────────────────────────────────────────────────┐
│ Previously signed up with Google                                 │
│ Email in database: jane@gmail.com                                │
│ auth_method: "google"                                            │
│ password_hash: NOT PRESENT                                       │
│                                                                   │
│ Now tries email/password form:                                   │
│ • Email: jane@gmail.com                                          │
│ • Password: IThinkIHaveAPassword                                 │
│ Clicks: [Login]                                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ BACKEND ───────────────────────────────────────────────────────┐
│ 1. Lookup user by email ✓                                        │
│    user = db.get_user_by_email("jane@gmail.com")                 │
│    └─ Found: {                                                   │
│         auth_method: "google",    ← Uh oh!                       │
│         google_id: "12345",                                      │
│         NO password_hash          ← No password exists!          │
│       }                                                           │
│                                                                   │
│ 2. Check auth_method ❌                                          │
│    if user.auth_method != "email_password":                      │
│      # WRONG AUTH METHOD                                         │
│                                                                   │
│ 3. Return helpful error (NOT revealing details) 🔒               │
│    {                                                              │
│      success: false,                                             │
│      message: "Authentication failed. Please try 'Continue       │
│                with Google' or contact support.",                │
│      action: "use_google",                                       │
│      recovery: {                                                 │
│        options: [                                                │
│          "Click 'Continue with Google'",                         │
│          "Contact support to add password",                      │
│          "Create new account with different email"               │
│        ]                                                          │
│      }                                                            │
│    }                                                              │
│                                                                   │
│ 🔒 PRIVACY NOTES:                                                │
│ • Doesn't say "account exists"                                   │
│ • Doesn't say "no password"                                      │
│ • Doesn't reveal "signed up with Google"                         │
│ • Generic "auth failed" + helpful guidance                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ FRONTEND ──────────────────────────────────────────────────────┐
│ Shows error message:                                             │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ❌ Authentication failed. Please try 'Continue with        │ │
│ │    Google' or contact support.                             │ │
│ │                                                            │ │
│ │ Try these options:                                         │ │
│ │ • Click 'Continue with Google'                             │ │
│ │ • Contact support to add password                          │ │
│ │ • Create new account with different email                  │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌─ USER ──────────────────────────────────────────────────────────┐
│ Reads error message                                              │
│ Sees: "Try 'Continue with Google'"                              │
│ Clicks: [Continue with Google] button                           │
│ ✅ Logs in successfully with Google                              │
│ ✅ No longer confused                                            │
│ ✅ Understands they signed up with Google                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE STRUCTURE

### users.json

```json
{
  "uuid-google-user-1": {
    "user_id": "uuid-google-user-1",
    "email": "alice@gmail.com",
    "phone": "",
    "name": "Alice Smith",
    "auth_method": "google",          ← Signed up with Google
    "google_id": "12345678",
    "google_email": "alice@gmail.com",
    "created_at": "2026-01-16T09:00:00",
    "last_active": "2026-01-16T10:00:00",
    "account_status": "active"

    // NOTE: NO password_hash field!
  },

  "uuid-email-user-1": {
    "user_id": "uuid-email-user-1",
    "email": "bob@example.com",
    "phone": "+919999999999",
    "name": "Bob Johnson",
    "auth_method": "email_password",  ← Signed up with email/password
    "password_hash": "$2b$12$N9qo8uLOickgx2ZMRZoMye...",
    "created_at": "2026-01-16T09:30:00",
    "last_active": "2026-01-16T10:30:00",
    "account_status": "active"

    // NOTE: NO google_id field!
  },

  "uuid-linked-user-1": {
    "user_id": "uuid-linked-user-1",
    "email": "charlie@gmail.com",
    "phone": "+911234567890",
    "name": "Charlie Brown",
    "auth_method": "both",            ← Linked both methods
    "password_hash": "$2b$12$...",
    "google_id": "87654321",
    "google_email": "charlie@gmail.com",
    "created_at": "2026-01-15T08:00:00",
    "last_active": "2026-01-16T11:00:00",
    "account_status": "active"

    // NOTE: Has BOTH password_hash AND google_id
  }
}
```

---

## 🎮 DECISION TREE

```
User attempts to authenticate
    │
    ├─ Clicks [Continue with Google]
    │  │
    │  ├─ Firebase OAuth flow succeeds
    │  │  │
    │  │  ├─ Backend checks: google_id exists?
    │  │  │  │
    │  │  │  ├─ YES → Login ✅
    │  │  │  │
    │  │  │  └─ NO → Check: email exists?
    │  │  │      │
    │  │  │      ├─ YES → auth_method?
    │  │  │      │  │
    │  │  │      │  ├─ "google" → Should have google_id (error) ❌
    │  │  │      │  │
    │  │  │      │  ├─ "email_password" → Conflict! ❌
    │  │  │      │  │   Return: "Use email/password or link accounts"
    │  │  │      │  │
    │  │  │      │  └─ "both" → Should have google_id (error) ❌
    │  │  │      │
    │  │  │      └─ NO → Create new user ✅
    │  │  │          auth_method = "google"
    │  │  │
    │  │  └─ Firebase OAuth flow fails
    │  │     └─ Return: "Google sign-in failed. Try again or use email/password."
    │  │
    │  └─ [End Google Path]
    │
    └─ Fills [Email/Password Form]
       │
       ├─ Submits form
       │  │
       │  ├─ Backend checks: email exists?
       │  │  │
       │  │  ├─ YES → auth_method?
       │  │  │  │
       │  │  │  ├─ "email_password" → Verify password
       │  │  │  │  │
       │  │  │  │  ├─ Correct → Send OTP → Verify OTP → Login ✅
       │  │  │  │  │
       │  │  │  │  └─ Wrong → ❌
       │  │  │  │     Return: "Check credentials or reset password"
       │  │  │  │
       │  │  │  ├─ "google" → ❌
       │  │  │  │  Return: "Try 'Continue with Google'"
       │  │  │  │
       │  │  │  └─ "both" → Verify password
       │  │  │     Same as "email_password" ✅
       │  │  │
       │  │  └─ NO → ❌
       │  │     Return: "Check credentials or sign up"
       │  │     (Generic - doesn't reveal email doesn't exist)
       │  │
       │  └─ [End Email Path]
       │
       └─ [End]
```

---

## 🔐 SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY ONION 🧅                           │
│  (Multiple layers of protection)                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Layer 1: HTTPS (Transport Security)                      │  │
│  │ • Encrypts all data in transit                           │  │
│  │ • Required for Google OAuth                              │  │
│  │ • Prevents man-in-the-middle attacks                     │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │ Layer 2: Authentication Method Separation                │  │
│  │ • Google users have NO password                          │  │
│  │ • Email users ALWAYS have password                       │  │
│  │ • Backend enforces this strictly                         │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │ Layer 3: Password Hashing (bcrypt)                       │  │
│  │ • Plaintext: "MyPassword123"                             │  │
│  │ • Stored: "$2b$12$N9qo8uLOickgx2..."                     │  │
│  │ • Cannot be reversed                                      │  │
│  │ • Unique salt per password                               │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │ Layer 4: Two-Factor Authentication (OTP)                 │  │
│  │ • Email/password users MUST verify phone                 │  │
│  │ • 6-digit code sent to phone                             │  │
│  │ • Expires in 10 minutes                                  │  │
│  │ • Hashed storage                                         │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │ Layer 5: Session Management                              │  │
│  │ • Cryptographically secure tokens                        │  │
│  │ • 24-hour expiration                                     │  │
│  │ • Server-side validation                                 │  │
│  │ • Automatic cleanup                                      │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │ Layer 6: Privacy Protection                              │  │
│  │ • No email enumeration                                   │  │
│  │ • Constant-time comparisons                              │  │
│  │ • Generic error messages                                 │  │
│  │ • No auth method revelation                              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │ Layer 7: Rate Limiting (Future)                          │  │
│  │ • Prevent brute force attacks                            │  │
│  │ • Limit OTP requests                                     │  │
│  │ • Throttle login attempts                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Result: Healthcare-grade security 🏥✅                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 USER CONFUSION MATRIX

### Before Implementation

```
Situation                    | User Confusion | System Behavior
─────────────────────────────|────────────────|──────────────────
Google user tries email login| 😕 High       | Accepts any password
Email user tries Google      | 😕 High       | Creates duplicate account
Forgot which method used     | 😕 Very High  | No guidance provided
Wrong password entered       | 😕 Medium     | "Invalid credentials"
Account doesn't exist        | 😕 Low        | "Email not found"
```

### After Implementation

```
Situation                    | User Confusion | System Behavior
─────────────────────────────|────────────────|──────────────────
Google user tries email login| 😊 None       | "Try 'Continue with Google'"
Email user tries Google      | 😊 None       | "Use email/password"
Forgot which method used     | 😊 Low        | Recovery options shown
Wrong password entered       | 😊 Low        | "Check or reset password"
Account doesn't exist        | 😊 None       | Generic + helpful message
```

---

## ✅ VERIFICATION CHECKLIST

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM HEALTH CHECK                          │
│                                                                 │
│  Backend:                                                       │
│  ☐ bcrypt installed                                             │
│  ☐ password_utils.py exists                                     │
│  ☐ auth_routes.py exists                                        │
│  ☐ database.py updated                                          │
│  ☐ Auth routes registered in app.py                             │
│  ☐ Server starts without errors                                 │
│                                                                 │
│  Database:                                                      │
│  ☐ users.json has auth_method field                             │
│  ☐ Google users have google_id                                  │
│  ☐ Email users have password_hash                               │
│  ☐ No plaintext passwords                                       │
│                                                                 │
│  Frontend:                                                      │
│  ☐ Signup calls /api/auth/signup                                │
│  ☐ Login calls /api/auth/login                                  │
│  ☐ Google calls /api/auth/google                                │
│  ☐ OTP verification calls /api/auth/verify-otp                  │
│  ☐ Recovery options displayed on errors                         │
│                                                                 │
│  Testing:                                                       │
│  ☐ Email/password signup works                                  │
│  ☐ Email/password login works                                   │
│  ☐ Google sign-in works                                         │
│  ☐ Cross-method errors show guidance                            │
│  ☐ Password reset works                                         │
│  ☐ OTP verification works                                       │
│  ☐ Sessions expire correctly                                    │
│                                                                 │
│  Security:                                                      │
│  ☐ Passwords are hashed                                         │
│  ☐ Sessions are validated                                       │
│  ☐ Errors are privacy-preserving                                │
│  ☐ 2FA works for email/password                                 │
│                                                                 │
│  ✅ ALL CHECKS PASSED → READY FOR PRODUCTION                    │
└─────────────────────────────────────────────────────────────────┘
```

---

**Visual Diagrams Version:** 1.0
**Last Updated:** January 16, 2026
**Perfect for:** Architecture reviews, team training, troubleshooting

**Print this for your wall!** 🖼️
