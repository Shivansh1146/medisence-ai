import { auth, googleProvider, onAuthStateChanged, signInWithPopup, signOut } from './firebase_config.js';

// UI Elements
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');

// Open/Close Modal
window.openAuthModal = () => {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        // Add animation class if needed
        const content = modal.querySelector('.auth-modal');
        if (content) {
            content.classList.add('animate__animated', 'animate__fadeInQP');
        }
    }
};

window.closeAuthModal = () => {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
};

// Google Login
window.handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log("User logged in:", user);
        showToast(`Welcome back, ${user.displayName}!`, "success");
        closeAuthModal();
    } catch (error) {
        console.error("Login failed:", error);
        showToast("Login failed: " + error.message, "error");
    }
};

// Email Login using backend mock API
window.handleEmailLogin = async (e) => {
    e.preventDefault();
    const form = e.target || document.getElementById("emailAuthForm");
    const email = form?.querySelector('input[type="email"]')?.value;
    const password = form?.querySelector('input[type="password"]')?.value;

    if (!email || !password) {
        showToast("Please enter email and password", "warning");
        return;
    }

    try {
        const API_BASE_URL = (window.ENV && window.ENV.API_BASE_URL) || "http://localhost:5000/api";
        showToast("Logging in...", "info");

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Save to LocalStorage to persist state even without Firebase
            localStorage.setItem('medicsense_user', JSON.stringify(data.user));

            showToast(`Welcome, ${data.user.name}!`, "success");
            closeAuthModal();

            // Manually update UI if Firebase observer doesn't fire (since this is custom auth)
            if (authBtn) {
                authBtn.innerHTML = `<img src="${data.user.photoURL}" style="width: 24px; height: 24px; border-radius: 50%;">`;
                authBtn.title = `Logged in as ${data.user.name}`;
                // Set click to logout
                 authBtn.onclick = () => window.handleLogout();
            }
        } else {
            showToast(data.message || "Login failed", "error");
        }
    } catch (error) {
        console.error("Login error:", error);
        showToast("Login connection failed", "error");
    }
};

// Expose handleLogout globally
window.handleLogout = async () => {
    try {
        // Try Firebase signout
        if (auth.currentUser) {
            await signOut(auth);
        }

        // Clear local storage
        localStorage.removeItem('medicsense_user');

        showToast("Logged out successfully", "info");

        // Reset UI
        if (authBtn) {
            authBtn.innerHTML = `<i class="fas fa-user-circle"></i>`;
            authBtn.title = "Login";
            authBtn.onclick = window.openAuthModal;
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
};



// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        if (authBtn) {
            authBtn.innerHTML = `<img src="${user.photoURL}" style="width: 24px; height: 24px; border-radius: 50%;">`;
            authBtn.title = `Logged in as ${user.displayName}`;
        }
    } else {
        // User is signed out
        if (authBtn) {
            authBtn.innerHTML = `<i class="fas fa-user-circle"></i>`;
            authBtn.title = "Login";
        }
    }
});

// Helper for Toast (reusing existing one from script_ultra.js if available, else simple alert)
function showToast(msg, type) {
    if (window.showToast) {
        window.showToast(msg, type);
    } else {
        alert(msg);
    }
}
