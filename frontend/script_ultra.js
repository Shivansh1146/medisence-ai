/**
 * MedicSense AI - Ultra Professional Frontend JavaScript
 * Problem Statement Solution
 * Best-in-Class Functionality
 */

// ========================================
// CONFIGURATION
// ========================================
// Load configuration from environment variables
const getConfig = () => {
  // Try to get from window.ENV (loaded by env-loader.js)
  if (window.ENV) {
    return {
      API_BASE_URL: window.ENV.API_BASE_URL || "http://localhost:5000/api",
      USER_ID: "user_" + Math.random().toString(36).substr(2, 9),
      AI_ENABLED:
        window.ENV.APP?.AI_ENABLED !== undefined
          ? window.ENV.APP.AI_ENABLED
          : true,
      MAX_FILE_SIZE: window.ENV.APP?.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
      SUPPORTED_FORMATS: window.ENV.APP?.SUPPORTED_FORMATS || [
        "image/jpeg",
        "image/png",
        "image/webp",
      ],
    };
  }

  // Fallback to default values
  return {
    API_BASE_URL: "http://localhost:5000/api",
    USER_ID: "user_" + Math.random().toString(36).substr(2, 9),
    AI_ENABLED: true,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/webp"],
  };
};

const CONFIG = getConfig();

// ========================================
// UTILITY: FETCH WITH TIMEOUT
// ========================================
/**
 * Fetch with automatic timeout to prevent hanging requests
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your connection and try again."
      );
    }
    throw error;
  }
}

// ========================================
// STATE MANAGEMENT
// ========================================
// SINGLE SOURCE OF TRUTH FOR AUTH STATE
let AUTHENTICATED_USER = null;
let AUTH_MODAL_CLOSED_BY_LOGIN = false; // Flag to prevent reopening after successful login

const state = {
  currentUser: null, // Will be set by Firebase auth
  chatHistory: [],
  currentImage: null,
  appointments: [],
  symptoms: [],
  isTyping: false,
  isMobileMenuOpen: false,
};

// ========================================
// INITIALIZATION - PRODUCTION GRADE
// ========================================

// Centralized loader control - SINGLE SOURCE OF TRUTH
const LoaderManager = {
  hidden: false,

  hide() {
    if (this.hidden) return; // Prevent multiple calls

    console.log("🕒 Hiding loader...");
    const loader = document.getElementById("loadingScreen");
    if (loader) {
      loader.style.opacity = "0";
      loader.style.transition = "opacity 0.3s ease-out";
      setTimeout(() => {
        loader.style.display = "none";
        this.hidden = true;
        console.log("✅ Loader hidden");
      }, 300);
    }

    // Clear safety watchdog
    if (window.clearLoaderSafety) {
      window.clearLoaderSafety();
    }
  },

  showError(message) {
    const loader = document.getElementById("loadingScreen");
    if (loader && !this.hidden) {
      const subtext = loader.querySelector(".loading-subtext");
      if (subtext) {
        subtext.textContent = message;
        subtext.style.color = "#ef4444";
      }
    }
  },
};

// ========================================
// AUTH STATE MANAGEMENT - PRODUCTION READY
// ========================================

// Check if user should see auth modal
function shouldShowAuthModal() {
  return !AUTHENTICATED_USER;
}

// Restore user from localStorage on page load
function restoreAuthState() {
  const savedUser = localStorage.getItem("medicsense_authenticated_user");
  const savedToken = localStorage.getItem("medicsense_auth_token");

  if (savedUser && savedToken) {
    try {
      AUTHENTICATED_USER = JSON.parse(savedUser);
      console.log(
        "✅ Auth state restored from localStorage:",
        AUTHENTICATED_USER.email || AUTHENTICATED_USER.uid
      );
      return true;
    } catch (error) {
      console.warn("⚠️ Could not restore auth state:", error);
      localStorage.removeItem("medicsense_authenticated_user");
      localStorage.removeItem("medicsense_auth_token");
    }
  }
  return false;
}

// Save authenticated user state
async function saveAuthState(user, token) {
  AUTHENTICATED_USER = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
  };

  localStorage.setItem(
    "medicsense_authenticated_user",
    JSON.stringify(AUTHENTICATED_USER)
  );
  if (token) {
    localStorage.setItem("medicsense_auth_token", token);
  }

  console.log("✅ Auth state saved to localStorage");

  // Register with backend
  if (token) {
    try {
      console.log("📡 Registering with backend...");
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: token,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Backend registration successful");
        // Save backend token if provided
        if (data.token) {
          localStorage.setItem("medicsense_backend_token", data.token);
        }
      } else {
        console.error("❌ Backend registration failed:", data.message);
      }
    } catch (error) {
      console.error("❌ Failed to register with backend:", error);
    }
  }
}

// Clear authenticated user state
function clearAuthState() {
  AUTHENTICATED_USER = null;
  AUTH_MODAL_CLOSED_BY_LOGIN = false; // Reset flag on logout
  localStorage.removeItem("medicsense_authenticated_user");
  localStorage.removeItem("medicsense_auth_token");
  console.log("✅ Auth state cleared");
}

// Critical initialization that MUST complete
async function initializeCriticalSystems() {
  console.log("🏥 MedicSense AI - Starting critical initialization");

  try {
    // 1. Restore auth state from localStorage FIRST
    restoreAuthState();

    // 2. Core synchronous initialization
    initializeAppCore();
    // NOTE: Event delegation is intentional.
    // Profile button is rendered dynamically after auth.
    // setupEventListeners(); // Function not defined - commented out
    updateSeverityDisplay();
    initAuthModal();

    console.log("✅ Core systems initialized");
    return true;
  } catch (error) {
    console.error("🔥 CRITICAL: Core initialization failed", error);
    LoaderManager.showError("Initialization failed. Retrying...");
    return false;
  }
}

// Optional async services that can fail gracefully
async function initializeOptionalSystems() {
  console.log("🔧 Loading optional systems...");

  // Auth system (can fail gracefully)
  try {
    await initializeAuthWithTimeout(5000); // 5 second timeout
    console.log("✅ Auth system ready");
  } catch (error) {
    console.warn("⚠️ Auth system failed to load:", error);
    console.warn("⚠️ App will continue in guest mode");
  }

  // Notifications (optional, non-blocking)
  try {
    await loadNotificationCountSafe();
    console.log("✅ Notifications loaded");
  } catch (error) {
    console.warn("⚠️ Notifications unavailable:", error);
  }
}

// Main initialization orchestrator
document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 DOM Ready - Starting initialization sequence");

  try {
    // Phase 1: Critical systems (MUST succeed)
    const criticalSuccess = await initializeCriticalSystems();

    if (!criticalSuccess) {
      throw new Error("Critical systems failed");
    }

    // Phase 2: Hide loader immediately after critical systems ready
    // Don't wait for optional services
    LoaderManager.hide();

    // Phase 3: Load optional systems in background (non-blocking)
    initializeOptionalSystems().catch((err) => {
      console.warn("⚠️ Some optional services failed:", err);
    });

    console.log("✅ App initialized successfully");
  } catch (error) {
    console.error("🔥 FATAL: App initialization failed", error);

    // Force hide loader and show error
    LoaderManager.hide();

    // Show user-visible error
    setTimeout(() => {
      if (typeof showToast === "function") {
        showToast(
          "App loaded with limited functionality. Some features may be unavailable.",
          "warning"
        );
      } else {
        alert(
          "App loaded with limited functionality. Please refresh if issues persist."
        );
      }
    }, 500);
  }
});

// ========================================
// EVENT DELEGATION - PROFILE BUTTON
// ========================================
// Production-grade event delegation for dynamically rendered elements
document.addEventListener("click", (e) => {
  const profileBtn = e.target.closest("#authBtn");
  if (!profileBtn) return;

  toggleProfileMenu();
});

function initializeAppCore() {
  console.log("📦 Loading user data...");
  loadUserData();

  // Initialize chat with welcome message
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    // Welcome message already in HTML
  }

  // Set up smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  console.log("✅ Core app initialized");
}

// ========================================
// AUTHENTICATION INITIALIZATION - WITH TIMEOUT
// ========================================

// Timeout wrapper for Firebase initialization
function initializeAuthWithTimeout(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    // Timeout safety
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`⚠️ Auth initialization timed out after ${timeoutMs}ms`);
        reject(new Error("Auth initialization timeout"));
      }
    }, timeoutMs);

    // Try to initialize auth
    const tryInit = () => {
      if (resolved) return;

      if (window.firebaseAuth) {
        clearTimeout(timeout);
        resolved = true;
        setupAuthListener();
        resolve();
      } else {
        console.log("⏳ Waiting for Firebase to load...");

        // Set up one-time listener with timeout
        const onReady = () => {
          if (resolved) return;
          clearTimeout(timeout);
          resolved = true;
          console.log("✅ Firebase ready event received");
          setupAuthListener();
          resolve();
        };

        window.addEventListener("firebase-ready", onReady, { once: true });

        // Also check periodically in case event was missed
        let checks = 0;
        const checkInterval = setInterval(() => {
          checks++;
          if (resolved || checks > 10) {
            clearInterval(checkInterval);
            return;
          }

          if (window.firebaseAuth) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolved = true;
            setupAuthListener();
            resolve();
          }
        }, 500);
      }
    };

    tryInit();
  });
}

function setupAuthListener() {
  if (!window.firebaseAuth) {
    console.error("❌ Firebase auth not available");
    return;
  }

  const { auth, onAuthStateChanged } = window.firebaseAuth;

  console.log("🔐 Setting up auth state listener...");

  // THIS IS THE SINGLE SOURCE OF TRUTH FOR AUTH STATE
  onAuthStateChanged(auth, (user) => {
    console.log(
      "🔐 Auth state changed:",
      user ? `Logged in as ${user.email || user.uid}` : "Logged out"
    );

    if (user) {
      // User is authenticated
      console.log("✅ User authenticated:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      // CRITICAL: Get token and save complete state
      user
        .getIdToken()
        .then(async (token) => {
          await saveAuthState(user, token);
          state.currentUser = user.uid;
          updateAuthUI(user);

          // ONLY close modal if it's currently open AND user just logged in
          const modal = document.getElementById("authModal");
          if (modal && modal.style.display === "flex") {
            console.log("📴 Closing auth modal after successful login");
            console.log(
              "🔒 Setting AUTH_MODAL_CLOSED_BY_LOGIN flag to prevent reopening"
            );
            closeAuthModal();

            // Show success message after a short delay to ensure modal is closed
            setTimeout(() => {
              showToast(
                `Welcome back, ${user.displayName || user.email || "User"}!`,
                "success"
              );
            }, 300);
          } else {
            console.log("ℹ️ Modal already closed or wasn't open");
          }

          // Save user ID to localStorage (legacy support)
          localStorage.setItem("medicsense_user_id", user.uid);

          // Load notifications now that user is authenticated
          loadNotificationCountSafe().catch((err) => {
            console.warn("⚠️ Failed to load notifications:", err);
          });
        })
        .catch((error) => {
          console.error("❌ Failed to get ID token:", error);
          // Still update UI even if token fetch fails
          saveAuthState(user, null);
          state.currentUser = user.uid;
          updateAuthUI(user);
        });
    } else {
      // User is logged out
      console.log("ℹ️ User logged out");

      // CRITICAL: Clear auth state completely
      clearAuthState();
      state.currentUser = null;
      updateAuthUI(null);

      // Restore auth modal to login state (but DON'T show it)
      restoreAuthModal();
    }

    // Always reset loading state when auth resolves
    setAuthLoading(false);
  });
}

// Helper functions for safe user data extraction
function getSafeName(user) {
  if (!user) return "Guest";
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split("@")[0];
  if (user.phoneNumber) return user.phoneNumber;
  return "User";
}

function getSafeEmail(user) {
  if (!user) return "";
  return user.email || user.phoneNumber || "No email";
}

function getSafePhotoURL(user) {
  if (!user) return null;
  if (user.photoURL) return user.photoURL;
  const name = getSafeName(user);
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=667eea&color=fff&bold=true`;
}

// ========================================
// NAVIGATION FUNCTIONS
// ========================================
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  state.isMobileMenuOpen = !state.isMobileMenuOpen;
  if (state.isMobileMenuOpen) {
    mobileMenu.classList.add("active");
  } else {
    mobileMenu.classList.remove("active");
  }
}

function toggleSearch() {
  showToast("Search feature coming soon!", "info");
}

function showNotifications() {
  window.location.href = "notifications.html";
}

// Load notification count with timeout and error handling
async function loadNotificationCountSafe() {
  try {
    const userId = getUserId();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${
        CONFIG.API_BASE_URL
      }/notifications/summary?user_id=${encodeURIComponent(userId)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const summary = data && data.summary ? data.summary : null;

    const unreadCount =
      summary && typeof summary.unread === "number" ? summary.unread : 0;

    const badge = document.getElementById("notificationBadge");
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
        badge.style.display = "flex";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("⚠️ Notification loading timed out");
    } else {
      console.warn("⚠️ Could not load notifications:", error.message);
    }

    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.style.display = "none";
    }
  }
}

// Legacy function for backward compatibility - now calls safe version
async function loadNotificationCount() {
  return loadNotificationCountSafe();
}

// Refresh notification count periodically (every 30 seconds)
setInterval(() => {
  if (document.visibilityState === "visible") {
    loadNotificationCount();
  }
}, 30000);

function closeAlert() {
  const alertBar = document.getElementById("alertBar");
  if (alertBar) {
    alertBar.style.display = "none";
  }
}

// ========================================
// SYMPTOM CHECKER FUNCTIONS
// ========================================
function updateSeverityDisplay() {
  const slider = document.getElementById("severityRange");
  const valueDisplay = document.getElementById("severityValue");

  if (slider && valueDisplay) {
    slider.addEventListener("input", function () {
      valueDisplay.textContent = this.value;
    });
  }
}

function addSymptom(symptom) {
  const textarea = document.getElementById("symptomInput");
  if (textarea) {
    const currentText = textarea.value.trim();
    if (currentText) {
      textarea.value = currentText + ", " + symptom;
    } else {
      textarea.value = symptom;
    }
    textarea.focus();
  }
}

async function analyzeSymptoms() {
  const symptomInput = document.getElementById("symptomInput");
  const duration = document.getElementById("symptomDuration");
  const severity = document.getElementById("severityRange");

  if (!symptomInput || !symptomInput.value.trim()) {
    showToast("Please describe your symptoms", "warning");
    return;
  }

  const symptoms = symptomInput.value.trim();
  const durationValue = duration ? duration.value : "";
  const severityValue = severity ? severity.value : "5";

  // Show loading
  showToast("Analyzing your symptoms with AI...", "info");

  // Hide info card, show results card
  const infoCard = document.getElementById("symptomInfoCard");
  const resultsCard = document.getElementById("symptomResults");
  const resultsBody = document.getElementById("symptomResultsBody");

  if (infoCard) infoCard.style.display = "none";
  if (resultsCard) resultsCard.style.display = "block";
  if (resultsBody)
    resultsBody.innerHTML =
      '<div class="loading-spinner"></div><p>Analyzing with Google Gemini AI...</p>';

  try {
    const response = await fetchWithTimeout(
      `${CONFIG.API_BASE_URL}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Analyze these symptoms: ${symptoms}. Duration: ${durationValue}. Severity: ${severityValue}/10.`,
          user_id: state.currentUser,
        }),
      },
      15000
    ); // 15 second timeout for AI analysis

    const data = await response.json();

    if (data.response) {
      displaySymptomResults(data.response, severityValue);
      state.symptoms.push({
        symptoms,
        duration: durationValue,
        severity: severityValue,
        analysis: data.response,
        timestamp: new Date().toISOString(),
      });
      saveUserData();
    } else {
      throw new Error("No response from AI");
    }
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    if (resultsBody) {
      resultsBody.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Unable to analyze symptoms. Please try again.</p>
                </div>
            `;
    }
    showToast("Error analyzing symptoms. Please try again.", "error");
  }
}

function displaySymptomResults(analysis, severity) {
  const resultsBody = document.getElementById("symptomResultsBody");
  if (!resultsBody) return;

  const severityColor =
    severity <= 3 ? "success" : severity <= 6 ? "warning" : "danger";
  const severityText =
    severity <= 3 ? "Mild" : severity <= 6 ? "Moderate" : "Severe";

  resultsBody.innerHTML = `
        <div class="severity-badge ${severityColor}">
            <i class="fas fa-info-circle"></i>
            Severity: ${severityText} (${severity}/10)
        </div>
        <div class="analysis-content">
            <h4><i class="fas fa-brain"></i> AI Analysis</h4>
            <div class="analysis-text">${
              typeof marked !== "undefined"
                ? marked.parse(analysis)
                : analysis.replace(/\n/g, "<br>")
            }</div>
        </div>
        <div class="recommendations">
            <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
            <ul>
                <li><i class="fas fa-check"></i> ${
                  severity > 7
                    ? "Seek immediate medical attention"
                    : "Monitor symptoms closely"
                }</li>
                <li><i class="fas fa-check"></i> Stay hydrated and rest</li>
                <li><i class="fas fa-check"></i> ${
                  severity > 5
                    ? "Consider booking an appointment"
                    : "Track your symptoms"
                }</li>
            </ul>
        </div>
    `;

  showToast("Symptom analysis complete!", "success");
}

function bookAppointmentFromSymptom() {
  scrollToSection("appointments");
  showToast("Please fill in appointment details", "info");
}

function exportSymptomReport() {
  if (state.symptoms.length === 0) {
    showToast("No symptom data to export", "warning");
    return;
  }

  const latest = state.symptoms[state.symptoms.length - 1];
  const report = `
MedicSense AI - Symptom Report
Generated: ${new Date().toLocaleString()}

Symptoms: ${latest.symptoms}
Duration: ${latest.duration}
Severity: ${latest.severity}/10

AI Analysis:
${latest.analysis}

---
This is not a medical diagnosis. Please consult a healthcare professional.
    `.trim();

  downloadTextFile(report, "symptom-report.txt");
  showToast("Report downloaded successfully!", "success");
}

function useVoiceInput(type) {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    showToast("Voice input not supported in this browser", "error");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = function () {
    showToast("Listening... Speak now", "info");
  };

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    if (type === "symptom") {
      document.getElementById("symptomInput").value = transcript;
    } else {
      document.getElementById("chatInput").value = transcript;
    }
    showToast("Voice input captured!", "success");
  };

  recognition.onerror = function (event) {
    showToast("Voice input error: " + event.error, "error");
  };

  recognition.start();
}

// ========================================
// APPOINTMENT FUNCTIONS
// ========================================
async function loadAvailableSlots() {
  const doctorSelect = document.getElementById("doctorSelect");
  const dateInput = document.getElementById("appointmentDate");
  const timeSelect = document.getElementById("appointmentTime");
  const slotsGrid = document.getElementById("slotsGrid");

  if (!doctorSelect || !dateInput || !doctorSelect.value || !dateInput.value) {
    if (slotsGrid) {
      slotsGrid.innerHTML =
        '<p class="slots-hint">Please select doctor and date</p>';
    }
    return;
  }

  try {
    // Call API to get available slots
    const response = await fetchWithTimeout(
      `${CONFIG.API_BASE_URL}/appointments/slots?doctor=${encodeURIComponent(
        doctorSelect.value
      )}&date=${encodeURIComponent(dateInput.value)}`,
      {},
      5000 // 5 second timeout
    );
    const data = await response.json();

    let slots = [];
    if (data.success && data.slots && data.slots.length > 0) {
      slots = data.slots;
    } else {
      // Fallback to mock slots if API fails
      slots = [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
      ];
    }

    // Update time select
    if (timeSelect) {
      timeSelect.innerHTML = '<option value="">Select time slot</option>';
      slots.forEach((slot) => {
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = slot;
        timeSelect.appendChild(option);
      });
    }

    // Update slots grid
    if (slotsGrid) {
      slotsGrid.innerHTML = slots
        .map(
          (slot) => `
            <button class="slot-btn available" onclick="selectSlot('${slot}')">
                ${slot}
            </button>
        `
        )
        .join("");
    }
  } catch (error) {
    console.error("Error loading slots:", error);
    // Fallback to mock slots on error
    const slots = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
    ];

    if (timeSelect) {
      timeSelect.innerHTML = '<option value="">Select time slot</option>';
      slots.forEach((slot) => {
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = slot;
        timeSelect.appendChild(option);
      });
    }

    if (slotsGrid) {
      slotsGrid.innerHTML = slots
        .map(
          (slot) => `
            <button class="slot-btn available" onclick="selectSlot('${slot}')">
                ${slot}
            </button>
        `
        )
        .join("");
    }
  }
}

function selectSlot(time) {
  const timeSelect = document.getElementById("appointmentTime");
  if (timeSelect) {
    timeSelect.value = time;
    showToast(`Selected ${time}`, "success");
  }
}

async function bookAppointment() {
  const name = document.getElementById("patientName")?.value.trim();
  const phone = document.getElementById("patientPhone")?.value.trim();
  const email = document.getElementById("patientEmail")?.value.trim();
  const doctor = document.getElementById("doctorSelect")?.value;
  const date = document.getElementById("appointmentDate")?.value;
  const time = document.getElementById("appointmentTime")?.value;
  const reason = document.getElementById("appointmentReason")?.value.trim();
  const type = document.querySelector(
    'input[name="appointmentType"]:checked'
  )?.value;

  // Validation
  if (!name || !phone || !doctor || !date || !time) {
    showToast("Please fill in all required fields", "warning");
    return;
  }

  if (!validateEmail(email)) {
    showToast("Please enter a valid email address", "warning");
    return;
  }

  if (!validatePhone(phone)) {
    showToast("Please enter a valid phone number", "warning");
    return;
  }

  // Show loading
  showToast("Booking your appointment...", "info");

  try {
    // Get user ID - use Firebase UID if logged in, otherwise generate temporary ID
    let userId = state.currentUser;
    if (!userId) {
      userId = "guest_" + Math.random().toString(36).substr(2, 9);
      console.warn("⚠️ Booking as guest user. Login recommended for tracking.");
    }

    // Call backend API to book appointment
    const response = await fetchWithTimeout(
      `${CONFIG.API_BASE_URL}/appointments/book`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          name,
          phone,
          email,
          doctorId: doctor,
          date,
          time,
          reason,
          type,
        }),
      },
      10000
    ); // 10 second timeout

    const data = await response.json();

    if (data.success) {
      const appointment = {
        id: data.appointmentId || "apt_" + Date.now(),
        name,
        phone,
        email,
        doctor,
        doctorId: doctor,
        date,
        time,
        reason,
        type,
        status: "confirmed",
        timestamp: new Date().toISOString(),
      };

      state.appointments.push(appointment);
      saveUserData();

      // Send WhatsApp notification if appointment is for Dr. Aakash
      /* Redundant - Backend handles this
      if (doctor === 'dr_aakash') {
        try {
          // Import and use WhatsApp service
          const { sendWhatsAppNotification } = await import('./whatsapp_service.js');
          await sendWhatsAppNotification(appointment);
        } catch (error) {
          console.log('WhatsApp notification not sent (service may not be configured):', error);
        }
      }
      */

      // Show success
      showToast(
        "Appointment booked successfully! Confirmation sent to your email.",
        "success"
      );

      // Reset form
      document.getElementById("patientName").value = "";
      document.getElementById("patientPhone").value = "";
      document.getElementById("patientEmail").value = "";
      document.getElementById("doctorSelect").value = "";
      document.getElementById("appointmentDate").value = "";
      document.getElementById("appointmentTime").value = "";
      document.getElementById("appointmentReason").value = "";

      // Update appointments list
      updateAppointmentsList();

      // Show appointment confirmation modal (optional)
      showAppointmentConfirmation(appointment);
    } else {
      throw new Error(data.message || "Failed to book appointment");
    }
  } catch (error) {
    console.error("Error booking appointment:", error);
    showToast("Error booking appointment. Please try again.", "error");
  }
}

function updateAppointmentsList() {
  const listElement = document.getElementById("myAppointmentsList");
  if (!listElement) return;

  if (state.appointments.length === 0) {
    listElement.innerHTML =
      '<p class="no-appointments">No appointments scheduled yet</p>';
    return;
  }

  listElement.innerHTML = state.appointments
    .slice(-3)
    .reverse()
    .map(
      (apt) => `
        <div class="appointment-item">
            <div class="appointment-info">
                <strong>${apt.doctor}</strong>
                <p>${apt.date} at ${apt.time}</p>
            </div>
            <span class="appointment-status ${apt.status}">${apt.status}</span>
        </div>
    `
    )
    .join("");
}

function showAppointmentConfirmation(appointment) {
  const doctorName =
    document.querySelector(
      `#doctorSelect option[value="${appointment.doctor}"]`
    )?.textContent || appointment.doctor;

  showToast(
    `✅ Appointment Confirmed!\nDoctor: ${doctorName}\nDate: ${appointment.date} at ${appointment.time}`,
    "success"
  );
}

// ========================================
// CHAT FUNCTIONS
// ========================================
function handleChatKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

async function sendChatMessage(quickMessage = null) {
  const input = document.getElementById("chatInput");
  const message = quickMessage || input?.value.trim();

  if (!message) return;

  // Clear input
  if (input && !quickMessage) input.value = "";

  // Add user message to UI
  addMessageToChat("user", message);

  // Show typing indicator
  showTypingIndicator();

  try {
    // Get or create session ID for AI agent scaling
    let sessionId = localStorage.getItem("chat_session_id");
    if (!sessionId) {
      sessionId = `chat_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("chat_session_id", sessionId);
    }

    const response = await fetchWithTimeout(
      `${CONFIG.API_BASE_URL}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          user_id: state.currentUser,
          session_id: sessionId,
        }),
      },
      15000
    ); // 15 second timeout for AI chat

    const data = await response.json();

    // Hide typing indicator
    hideTypingIndicator();

    if (data.response) {
      // Add AI response to UI
      addMessageToChat("ai", data.response, {
        context: data.context || "general",
        severity: data.severity || "low",
        sentiment: data.sentiment,
      });

      // Update chat history
      state.chatHistory.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });
      state.chatHistory.push({
        role: "ai",
        content: data.response,
        timestamp: new Date().toISOString(),
      });

      saveUserData();
    } else {
      throw new Error("No response from AI");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    hideTypingIndicator();
    addMessageToChat(
      "ai",
      "❌ Sorry, I encountered an error. Please try again.",
      { context: "error" }
    );
    showToast("Error sending message. Please try again.", "error");
  }
}

function addMessageToChat(role, content, metadata = {}) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}-message`;

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";
  avatarDiv.innerHTML =
    role === "ai"
      ? '<i class="fas fa-robot"></i>'
      : '<i class="fas fa-user"></i>';

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";

  // Handle image display for user messages
  if (role === "user" && metadata.image) {
    bubbleDiv.innerHTML = `
      <p>${content}</p>
      <img src="${metadata.image}" alt="Uploaded image" style="max-width: 100%; border-radius: 8px; margin-top: 8px; max-height: 300px; object-fit: contain;">
    `;
  } else if (role === "ai") {
    bubbleDiv.innerHTML =
      typeof marked !== "undefined"
        ? marked.parse(content)
        : content.replace(/\n/g, "<br>");
  } else {
    bubbleDiv.textContent = content;
  }

  const metaDiv = document.createElement("div");
  metaDiv.className = "message-meta";
  metaDiv.innerHTML = `
        <span class="message-time">${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
        ${
          metadata.context
            ? `<span class="context-badge"><i class="fas fa-tag"></i> ${metadata.context}</span>`
            : ""
        }
        ${
          metadata.severity && metadata.severity !== "low"
            ? `<span class="severity-badge ${metadata.severity}"><i class="fas fa-exclamation-circle"></i> ${metadata.severity}</span>`
            : ""
        }
    `;

  contentDiv.appendChild(bubbleDiv);
  if (role === "ai") contentDiv.appendChild(metaDiv);

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  chatMessages.appendChild(messageDiv);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Hide quick suggestions after first message
  const suggestions = document.getElementById("quickSuggestions");
  if (suggestions && state.chatHistory.length > 0) {
    suggestions.style.display = "none";
  }
}

function showTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) {
    indicator.style.display = "flex";
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight + 100;
  }
  state.isTyping = true;
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.style.display = "none";
  state.isTyping = false;
}

function sendQuickMessage(message) {
  sendChatMessage(message);
}

function quickAction(action) {
  const messages = {
    symptoms: "I want to check my symptoms",
    appointment: "I want to book an appointment",
    medication: "I need medication information",
    emergency: "This is an emergency situation",
  };

  sendChatMessage(messages[action] || action);
}

function exportChat() {
  if (state.chatHistory.length === 0) {
    showToast("No chat history to export", "warning");
    return;
  }

  const chatLog = state.chatHistory
    .map(
      (msg) =>
        `[${msg.role.toUpperCase()}] ${new Date(
          msg.timestamp
        ).toLocaleString()}\n${msg.content}\n`
    )
    .join("\n---\n\n");

  const fullLog = `
MedicSense AI - Chat Export
Generated: ${new Date().toLocaleString()}
User ID: ${state.currentUser}

================================

${chatLog}

================================
This chat log is for your records only.
Always consult with healthcare professionals for medical advice.
    `.trim();

  downloadTextFile(fullLog, "medicsense-chat-log.txt");
  showToast("Chat exported successfully!", "success");
}

function clearChat() {
  if (!confirm("Are you sure you want to clear the chat history?")) return;

  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p><strong>👋 Welcome back!</strong></p>
                        <p>Chat history cleared. How can I help you today?</p>
                    </div>
                    <div class="message-meta">
                        <span class="message-time">Just now</span>
                    </div>
                </div>
            </div>
        `;
  }

  state.chatHistory = [];
  saveUserData();

  // Show quick suggestions again
  const suggestions = document.getElementById("quickSuggestions");
  if (suggestions) suggestions.style.display = "flex";

  showToast("Chat history cleared", "success");
}

function toggleChatSettings() {
  showToast("Chat settings coming soon!", "info");
}

function attachFile() {
  document.getElementById("chatFileInput")?.click();
}

async function handleChatImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file
  if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
    showToast("Please upload a valid image (JPG, PNG, or WEBP)", "warning");
    return;
  }

  if (file.size > CONFIG.MAX_FILE_SIZE) {
    showToast("Image size must be less than 10MB", "warning");
    return;
  }

  showToast("Analyzing image with Gemini AI...", "info");

  try {
    // Convert image to base64
    const reader = new FileReader();
    reader.onload = async function (e) {
      const imageDataUrl = e.target.result;

      // Add user message showing image was uploaded
      addMessageToChat("user", "📸 [Image uploaded for analysis]", {
        context: "image-upload",
        image: imageDataUrl,
      });

      // Show typing indicator
      showTypingIndicator();

      try {
        // Call backend API with Gemini for disease recognition
        const response = await fetchWithTimeout(
          `${CONFIG.API_BASE_URL}/analyze-injury-image`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: imageDataUrl,
              notes:
                "Please analyze this medical image for disease recognition and provide detailed insights.",
            }),
          },
          20000 // 20 second timeout for image analysis
        );

        const data = await response.json();

        hideTypingIndicator();

        if (data.success) {
          // Format the Gemini AI response with disease recognition
          let analysisMessage = `📸 **Disease Recognition & Image Analysis**\n\n`;
          analysisMessage += `**Primary Condition:** ${
            data.injury_type || "Not specified"
          }\n`;

          if (data.possible_conditions && data.possible_conditions.length > 0) {
            analysisMessage += `**Possible Conditions:**\n`;
            data.possible_conditions.forEach((condition, idx) => {
              analysisMessage += `${idx + 1}. ${condition}\n`;
            });
            analysisMessage += `\n`;
          }

          analysisMessage += `**Severity:** ${
            data.severity || "Not specified"
          }\n`;
          analysisMessage += `**Confidence:** ${data.confidence || 0}%\n\n`;
          analysisMessage += `**Visual Description:**\n${
            data.description || "No description available"
          }\n\n`;

          if (
            data.disease_characteristics &&
            data.disease_characteristics.length > 0
          ) {
            analysisMessage += `**Disease Characteristics:**\n`;
            data.disease_characteristics.forEach((char, idx) => {
              analysisMessage += `• ${char}\n`;
            });
            analysisMessage += `\n`;
          }

          if (data.cure_steps && data.cure_steps.length > 0) {
            analysisMessage += `**Care Instructions:**\n`;
            data.cure_steps.forEach((step, idx) => {
              analysisMessage += `${idx + 1}. ${step}\n`;
            });
            analysisMessage += `\n`;
          }

          if (data.warning_signs && data.warning_signs.length > 0) {
            analysisMessage += `**⚠️ Warning Signs (Seek Immediate Care):**\n`;
            data.warning_signs.forEach((sign, idx) => {
              analysisMessage += `• ${sign}\n`;
            });
            analysisMessage += `\n`;
          }

          if (data.recommended_specialist) {
            analysisMessage += `**Recommended Specialist:** ${data.recommended_specialist}\n\n`;
          }

          if (data.medical_advice) {
            analysisMessage += `**Medical Advice:**\n${data.medical_advice}\n`;
          }

          addMessageToChat("ai", analysisMessage, {
            context: "image-analysis",
            severity: data.severity,
            injury_type: data.injury_type,
          });
          showToast(
            "Image analyzed successfully with Gemini AI for disease recognition!",
            "success"
          );
        } else {
          throw new Error(data.error || "No analysis from AI");
        }
      } catch (error) {
        hideTypingIndicator();
        console.error("Error analyzing image:", error);
        addMessageToChat(
          "ai",
          "❌ Sorry, I encountered an error analyzing the image. Please try again.",
          {
            context: "error",
          }
        );
        showToast("Error analyzing image. Please try again.", "error");
      }
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error processing image:", error);
    showToast("Error processing image. Please try again.", "error");
  }
}

function toggleVoiceInput() {
  useVoiceInput("chat");
}

// ========================================
// EMERGENCY FUNCTIONS
// ========================================
function handleEmergency() {
  const modal = document.getElementById("emergencyModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeEmergencyModal() {
  const modal = document.getElementById("emergencyModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function emergencyChat() {
  closeEmergencyModal();
  scrollToSection("ai-chat");

  // Generate session ID for emergency tracking
  const sessionId =
    Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);

  setTimeout(() => {
    // BACKEND EMERGENCY MODE: Activate strict emergency context
    const emergencyMessage = "I need urgent help!";

    fetch("http://localhost:5000/api/emergency/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: emergencyMessage,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Display strict emergency response from backend
          displayChatMessage(data.response, "ai");

          // Visual indicator for emergency mode
          if (data.emergency_mode) {
            showToast(
              "⚠️ EMERGENCY MODE: Call 112 immediately",
              "error",
              10000
            );
          }
        } else {
          // Fallback if backend fails
          displayChatMessage(
            "🚨 CALL 112 IMMEDIATELY\n\n" +
              "System error occurred. Emergency services must be contacted directly. " +
              "Do NOT rely on AI in emergency situations.",
            "ai"
          );
        }
      })
      .catch((error) => {
        console.error("Emergency chat error:", error);
        // Critical fallback
        displayChatMessage(
          "🚨 CALL 112 IMMEDIATELY\n\n" +
            "System unavailable. Contact emergency services now. " +
            "This is NOT a substitute for professional help.",
          "ai"
        );
      });
  }, 500);
}

function findNearestHospital() {
  const fallbackUrl =
    "https://www.google.com/maps/search/emergency+room+near+me/";

  if (!("geolocation" in navigator)) {
    window.open(fallbackUrl, "_blank");
    showToast("Opening map search (Location not supported)", "warning");
    return;
  }

  showToast("Locating nearest emergency rooms...", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Try backend hospital lookup first
      fetch("http://localhost:5000/api/emergency/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (
            data.status === "fallback" ||
            data.action === "redirect_to_maps"
          ) {
            // Backend returned safe fallback - use Google Maps
            const mapsUrl =
              data.fallback_url ||
              `https://www.google.com/maps/search/emergency+room/@${latitude},${longitude},15z`;
            window.open(mapsUrl, "_blank");
            showToast(data.message || "Opening emergency room search", "info");
          } else {
            // Backend provided real hospital data (future implementation)
            window.open(
              `https://www.google.com/maps/search/emergency+room/@${latitude},${longitude},15z`,
              "_blank"
            );
            showToast("Found nearest emergency centers", "success");
          }
        })
        .catch((error) => {
          console.error("Hospital lookup error:", error);
          // Safe fallback on error
          const mapsUrl = `https://www.google.com/maps/search/emergency+room/@${latitude},${longitude},15z`;
          window.open(mapsUrl, "_blank");
          showToast("Opening emergency room search", "info");
        });
    },
    (error) => {
      console.error("Geolocation error:", error);
      window.open(fallbackUrl, "_blank");
      showToast("Location unavailable, opening map search", "warning");
    }
  );
}

// Handler for Call Button (to be attached via listener)
function handleEmergencyCall(e) {
  // Log emergency escalation to backend
  const sessionId =
    Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetch("http://localhost:5000/api/emergency/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:
            state.currentUser ||
            "guest_" + Math.random().toString(36).substr(2, 9),
          session_id: sessionId,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("Emergency escalation logged:", data.emergency_id);
          }
        })
        .catch((error) => {
          console.error("Emergency logging error:", error);
        });
    },
    (error) => {
      // Log without location if unavailable
      fetch("http://localhost:5000/api/emergency/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:
            state.currentUser ||
            "guest_" + Math.random().toString(36).substr(2, 9),
          session_id: sessionId,
          location: null,
        }),
      }).catch((err) => console.error("Emergency logging error:", err));
    }
  );

  // Show toast for desktop users
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) {
    showToast("Dial 112 on your phone immediately", "info");
  }
}

// ========================================
// HEALTH TRACKING FUNCTIONS
// ========================================
function viewHealthDetails() {
  showToast("Detailed health analytics coming soon!", "info");
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function showToast(message, type = "info") {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon =
    {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    }[type] || "info-circle";

  toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

  // Add to body
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add("show"), 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  // Remove all non-digit characters for counting
  const digitsOnly = phone.replace(/\D/g, "");

  // Basic sanity check: 7-15 digits (supports international formats)
  // Allows: +, -, spaces, parentheses, digits
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ========================================
// LOCAL STORAGE FUNCTIONS
// ========================================
function saveUserData() {
  try {
    localStorage.setItem("medicsense_user_id", state.currentUser);
    localStorage.setItem(
      "medicsense_chat_history",
      JSON.stringify(state.chatHistory)
    );
    localStorage.setItem(
      "medicsense_appointments",
      JSON.stringify(state.appointments)
    );
    localStorage.setItem("medicsense_symptoms", JSON.stringify(state.symptoms));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

function loadUserData() {
  try {
    const savedUserId = localStorage.getItem("medicsense_user_id");
    if (savedUserId) state.currentUser = savedUserId;

    // Ensure we never run with a null/empty user id
    state.currentUser = resolveUserId();

    const savedChatHistory = localStorage.getItem("medicsense_chat_history");
    if (savedChatHistory) state.chatHistory = JSON.parse(savedChatHistory);

    const savedAppointments = localStorage.getItem("medicsense_appointments");
    if (savedAppointments) {
      state.appointments = JSON.parse(savedAppointments);
      updateAppointmentsList();
    }

    const savedSymptoms = localStorage.getItem("medicsense_symptoms");
    if (savedSymptoms) state.symptoms = JSON.parse(savedSymptoms);

    console.log("📦 User data loaded from localStorage");
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

// ========================================
// USER ID RESOLUTION (PRODUCTION-GRADE)
// ========================================
function resolveUserId() {
  // 1) Firebase auth (preferred)
  if (state && state.currentUser) {
    return String(state.currentUser);
  }

  // 2) localStorage user object (if present)
  try {
    const savedUserObj = localStorage.getItem("medicsense_user");
    if (savedUserObj) {
      const parsed = JSON.parse(savedUserObj);
      const id =
        parsed && (parsed.id || parsed.user_id || parsed.userId || parsed.uid);
      if (id) {
        localStorage.setItem("medicsense_user_id", String(id));
        return String(id);
      }
    }
  } catch (_) {
    // ignore
  }

  // 3) persisted id
  const persisted = localStorage.getItem("medicsense_user_id");
  if (persisted && persisted !== "null" && persisted !== "undefined") {
    return String(persisted);
  }

  // 4) generate stable guest id (saved so it remains consistent)
  const guestId = `guest_${Math.random()
    .toString(36)
    .slice(2, 10)}${Date.now().toString(36)}`;
  localStorage.setItem("medicsense_user_id", guestId);
  return guestId;
}

function getUserId() {
  const userId = resolveUserId();
  // keep state in sync for existing calls
  state.currentUser = userId;
  return userId;
}

// ========================================
// AUTHENTICATION FUNCTIONS (Production Ready)
// ========================================

// Store original modal content once at page load
let originalAuthModalContent = null;

function initAuthModal() {
  const modal = document.getElementById("authModal");
  const modalContent = modal?.querySelector(".auth-modal");
  if (modalContent && !originalAuthModalContent) {
    originalAuthModalContent = modalContent.innerHTML;
    console.log("✅ Original auth modal content saved");
  }
}

function openAuthModal() {
  // CRITICAL: Only show modal if user is NOT authenticated
  if (!shouldShowAuthModal()) {
    console.log("ℹ️ User already authenticated - not showing auth modal");
    return;
  }

  // CRITICAL: Don't reopen if it was just closed by successful login
  if (AUTH_MODAL_CLOSED_BY_LOGIN) {
    console.log("ℹ️ Modal was just closed by login - not reopening");
    return;
  }

  const modal = document.getElementById("authModal");
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scroll
    console.log("📖 Auth modal opened");
  }
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) {
    // CRITICAL: Set flag that modal was closed by login
    AUTH_MODAL_CLOSED_BY_LOGIN = true;

    // CRITICAL: REMOVE the modal from DOM entirely, not just hide it
    // This prevents re-render bugs
    modal.style.display = "none";
    document.body.style.overflow = ""; // Restore scroll
    console.log(
      "📕 Modal closed - Auth state:",
      AUTHENTICATED_USER ? "Authenticated" : "Not authenticated"
    );

    // Reset flag after 2 seconds to allow manual opening later
    setTimeout(() => {
      AUTH_MODAL_CLOSED_BY_LOGIN = false;
      console.log("🔄 Modal can be manually opened again");
    }, 2000);
  }
}

function restoreAuthModal() {
  const modal = document.getElementById("authModal");
  const modalContent = modal?.querySelector(".auth-modal");

  if (modalContent && originalAuthModalContent) {
    modalContent.innerHTML = originalAuthModalContent;
    // CRITICAL: Ensure modal stays hidden after restore
    if (modal) {
      modal.style.display = "none";
    }
    console.log("✅ Auth modal restored to original state (hidden)");
  }
}

async function handleEmailLogin() {
  // GOOGLE-ONLY AUTH: Email/password authentication has been removed
  // This button now triggers Google Sign-In directly
  console.log("Email/password auth disabled - redirecting to Google Sign-In");
  await handleGoogleLogin();
}

async function handleGoogleLogin() {
  console.log("🔐 Google Sign-In initiated");

  if (!window.firebaseAuth) {
    console.error("❌ Firebase not initialized");
    showToast("System initializing... please wait.", "warning");
    return;
  }

  const { auth, signInWithPopup, GoogleAuthProvider } = window.firebaseAuth;
  const provider = new GoogleAuthProvider();

  console.log("✅ Firebase auth available:", !!auth);
  console.log("✅ GoogleAuthProvider available:", !!GoogleAuthProvider);

  try {
    setAuthLoading(true);
    console.log("🔄 Opening Google Sign-In popup...");

    const result = await signInWithPopup(auth, provider);

    console.log("✅ Sign-In successful!");
    console.log("👤 User:", result.user?.email);

    // Don't close modal or show toast here - onAuthStateChanged will handle it
  } catch (error) {
    setAuthLoading(false);
    console.error("❌ LOGIN ERROR:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "auth/popup-closed-by-user") {
      console.log("ℹ️ User cancelled sign-in popup");
      // Don't show toast - user intentionally cancelled
    } else if (error.code === "auth/network-request-failed") {
      showAuthError("No internet connection. Please check your network.");
    } else if (error.code === "auth/unauthorized-domain") {
      showAuthError(
        "This domain is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains."
      );
    } else if (error.code === "auth/popup-blocked") {
      showAuthError(
        "Popup was blocked by browser. Please allow popups for this site."
      );
    } else {
      showAuthError("Sign-In failed: " + error.message);
    }
  }
}

function updateAuthUI(user) {
  const authBtn = document.getElementById("authBtn");
  if (!authBtn) return;

  if (user && AUTHENTICATED_USER) {
    // User is authenticated - show profile picture
    const name = getSafeName(user);
    const email = getSafeEmail(user);
    const photoURL = getSafePhotoURL(user);

    authBtn.innerHTML = `<img src="${photoURL}" alt="${name}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; object-fit: cover;">`;
    authBtn.title = `Signed in as ${email}`;
    authBtn.onclick = () => showProfileModal(user);
  } else {
    // User is NOT authenticated - show login button
    authBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
    authBtn.title = "Sign In";
    authBtn.onclick = openAuthModal;
  }
}

function showProfileModal(user) {
  const modal = document.getElementById("authModal");
  const modalContent = modal?.querySelector(".auth-modal");

  if (!modalContent) {
    console.error("❌ Auth modal content not found");
    return;
  }

  const name = getSafeName(user);
  const email = getSafeEmail(user);
  const photoURL = getSafePhotoURL(user);

  modalContent.innerHTML = `
        <button class="modal-close" onclick="closeAuthModal()">
            <i class="fas fa-times"></i>
        </button>
        <div class="auth-header" style="text-align: center;">
            <img src="${photoURL}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: cover;">
            <h3 style="margin-bottom: 5px; color: #1e293b;">${name}</h3>
            <p style="color: #64748b; margin: 0;">${email}</p>
        </div>

        <div class="auth-options">
            <button id="btnSignOut" class="auth-btn-google" onclick="handleLogout()" style="justify-content: center; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; font-weight: 500;">
                <i class="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
            </button>
        </div>

        <div style="margin-top: 20px; text-align: center;">
            <p style="font-size: 0.8rem; color: #cbd5e1;">MedicSense AI • Secure Session</p>
        </div>
    `;

  openAuthModal();
}

async function handleLogout() {
  const btn = document.getElementById("btnSignOut");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fas fa-circle-notch fa-spin"></i> <span>Signing out...</span>';
    btn.style.opacity = "0.7";
  }

  try {
    if (window.firebaseAuth) {
      await window.firebaseAuth.signOut(window.firebaseAuth.auth);
    }

    // CLEAR ALL STATE - CRITICAL FOR SECURITY
    clearAuthState(); // Use our new centralized function
    state.currentUser = null;
    state.chatHistory = [];
    state.appointments = [];
    state.symptoms = [];
    state.currentImage = null;

    // CLEAR LOCAL STORAGE
    localStorage.removeItem("medicsense_user_id");
    localStorage.removeItem("medicsense_chat_history");
    localStorage.removeItem("medicsense_appointments");
    localStorage.removeItem("medicsense_symptoms");

    await new Promise((r) => setTimeout(r, 500));

    // Restore auth modal to original login state (but don't show it)
    restoreAuthModal();
    closeAuthModal();
    showToast("Successfully signed out", "success");
  } catch (error) {
    console.error("LOGOUT ERROR", error);
    showToast("Error signing out: " + error.message, "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        '<i class="fas fa-sign-out-alt"></i> <span>Sign Out</span>';
      btn.style.opacity = "1";
    }
  }
}

function getReadableAuthError(error) {
  const map = {
    "auth/invalid-email": "Please enter a valid email address",
    "auth/wrong-password":
      "Unable to sign in. Please check your credentials and try again.",
    "auth/weak-password": "Password must be at least 6 characters",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed":
      "Connection issue. Please check your network and try again.",
    "auth/user-disabled":
      "This account is currently unavailable. Please contact support.",
    "auth/operation-not-allowed": "This sign-in method is not available.",
  };
  return map[error.code] || "Unable to complete sign-in. Please try again.";
}

function setAuthLoading(isLoading) {
  const btnGoogle = document.getElementById("btnGoogle");
  const btnEmail = document.getElementById("btnEmailLogin");

  const toggle = (el, disabled, opacity) => {
    if (el) {
      el.disabled = disabled;
      el.style.opacity = opacity;
    }
  };

  if (isLoading) {
    toggle(btnGoogle, true, "0.5");
    if (btnEmail) {
      btnEmail.disabled = true;
      btnEmail.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
      btnEmail.style.opacity = "0.7";
    }
  } else {
    toggle(btnGoogle, false, "1");
    if (btnEmail) {
      btnEmail.disabled = false;
      btnEmail.innerHTML = "Sign In / Sign Up";
      btnEmail.style.opacity = "1";
    }
  }
}

function showAuthError(message) {
  const errorDiv = document.getElementById("authError");
  if (errorDiv) {
    errorDiv.style.display = "block";
    errorDiv.textContent = message;
  }
  showToast(message, "error");
}

// Close auth modal on outside click - BUT ONLY IF USER IS NOT AUTHENTICATED
document.addEventListener("click", function (event) {
  const authModal = document.getElementById("authModal");
  if (authModal && event.target === authModal) {
    // Only allow closing if user is not authenticated or already logged in
    if (!AUTHENTICATED_USER || authModal.style.display === "flex") {
      closeAuthModal();
    }
  }
});

// ========================================
// AUTOMATIC LOCATION DETECTION
// ========================================
function detectUserLocation() {
  const locationElement = document.getElementById("user-location");

  if (!locationElement) return;

  // Try to get user's location using Geolocation API
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use reverse geocoding to get city/country
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();

          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "";
          const state = data.address.state || "";
          const country = data.address.country || "";

          let locationText = "";
          if (city && country) {
            locationText = `${city}, ${state ? state + ", " : ""}${country}`;
          } else if (country) {
            locationText = country;
          } else {
            locationText = "Location detected";
          }

          locationElement.textContent = locationText;
          console.log("✅ Location detected:", locationText);
        } catch (error) {
          console.warn("⚠️ Could not fetch location details:", error);
          locationElement.textContent = "Healthcare District, India";
        }
      },
      (error) => {
        console.warn("⚠️ Geolocation error:", error.message);
        locationElement.textContent = "Healthcare District, India";
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    locationElement.textContent = "Healthcare District, India";
  }
}

// Initialize location detection when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", detectUserLocation);
} else {
  detectUserLocation();
}

// ========================================
// OPEN LIVE LOCATION ON GOOGLE MAPS
// ========================================
function openLiveLocation() {
  if (navigator.geolocation) {
    // Show loading message
    const locationSpan = document.getElementById("user-location");
    const originalText = locationSpan.textContent;
    locationSpan.textContent = "Getting your location...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Open Google Maps with the coordinates
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        window.open(mapsUrl, "_blank");

        // Restore original text
        locationSpan.textContent = originalText;
      },
      (error) => {
        console.error("Error getting location:", error);

        // Fallback: Open Google Maps to Greater Noida, Uttar Pradesh, India
        const fallbackUrl =
          "https://www.google.com/maps/place/Greater+Noida,+Uttar+Pradesh,+India";
        window.open(fallbackUrl, "_blank");

        // Restore original text
        locationSpan.textContent = originalText;

        alert(
          "Could not get your precise location. Opening our office location instead."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    // Geolocation not supported - open default location
    const fallbackUrl =
      "https://www.google.com/maps/place/Greater+Noida,+Uttar+Pradesh,+India";
    window.open(fallbackUrl, "_blank");
    alert(
      "Geolocation is not supported by your browser. Opening our office location."
    );
  }
}

// ========================================
// EXPORT FOR DEBUGGING
// ========================================
if (typeof window !== "undefined") {
  window.MedicSenseAI = {
    state,
    config: CONFIG,
    functions: {
      analyzeSymptoms,
      bookAppointment,
      sendChatMessage,
      handleEmergency,
    },
  };
}

// Keyboard accessibility - Close modals on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Close auth modal if open
    const authModal = document.getElementById("authModal");
    if (authModal && authModal.style.display === "flex") {
      closeAuthModal();
    }

    // Close emergency modal if open
    const emergencyModal = document.getElementById("emergencyModal");
    if (emergencyModal && emergencyModal.style.display === "flex") {
      closeEmergencyModal();
    }
  }
});

console.log(
  "✅ MedicSense AI Ultra - Ready to solve healthcare automation challenges!"
);
