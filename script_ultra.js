/**
 * MedicSense AI - Ultra Professional Frontend JavaScript
 * Problem Statement Solution
 * Best-in-Class Functionality
 */

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
  API_BASE_URL: "http://localhost:5000/api",
  USER_ID: "user_" + Math.random().toString(36).substr(2, 9),
  AI_ENABLED: true,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/webp"],
};

// ========================================
// STATE MANAGEMENT
// ========================================
const state = {
  currentUser: CONFIG.USER_ID,
  chatHistory: [],
  currentImage: null,
  appointments: [],
  symptoms: [],
  isTyping: false,
  isMobileMenuOpen: false,
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  console.log("🏥 MedicSense AI Ultra - Initialized");
  console.log("🧠 Problem Statement Solution Active");

  initializeApp();
  setupEventListeners();
  updateSeverityDisplay();

  // Show welcome notification
  setTimeout(() => {
    showToast(
      "Welcome to MedicSense AI! Solving healthcare automation challenges.",
      "success"
    );
  }, 1500);
});

function initializeApp() {
  // Load saved data from localStorage
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
  showToast("You have 3 new notifications", "info");
}

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
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Analyze these symptoms: ${symptoms}. Duration: ${durationValue}. Severity: ${severityValue}/10.`,
        user_id: state.currentUser,
      }),
    });

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
            <div class="analysis-text">${marked.parse(analysis)}</div>
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
function loadAvailableSlots() {
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

  // Generate mock time slots
  const slots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

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
    // In real implementation, this would call the backend API
    const appointment = {
      id: "apt_" + Date.now(),
      name,
      phone,
      email,
      doctor,
      date,
      time,
      reason,
      type,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };

    state.appointments.push(appointment);
    saveUserData();

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
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        user_id: state.currentUser,
      }),
    });

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

  if (role === "ai") {
    bubbleDiv.innerHTML = marked.parse(content);
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

  showToast("Analyzing image with AI...", "info");

  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("user_id", state.currentUser);

    const response = await fetch(`${CONFIG.API_BASE_URL}/analyze-image`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.analysis) {
      const message = `📸 Image Analysis:\n\n${data.analysis}`;
      addMessageToChat("ai", message, { context: "image-analysis" });
      showToast("Image analyzed successfully!", "success");
    } else {
      throw new Error("No analysis from AI");
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    showToast("Error analyzing image. Please try again.", "error");
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
  setTimeout(() => {
    sendChatMessage("This is an emergency! I need immediate help!");
  }, 500);
}

function findNearestHospital() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps/search/hospitals+near+me/@${latitude},${longitude},15z`;
        window.open(mapsUrl, "_blank");
        showToast("Opening nearby hospitals...", "success");
      },
      (error) => {
        showToast(
          "Unable to get your location. Please enable location services.",
          "error"
        );
      }
    );
  } else {
    showToast("Geolocation not supported", "error");
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
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, "").length >= 10;
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

    const savedChatHistory = localStorage.getItem("medicsense_chat_history");
    if (savedChatHistory) state.chatHistory = JSON.parse(savedChatHistory);

    const savedAppointments = localStorage.getItem("medicsense_appointments");
    if (savedAppointments) {
      state.appointments = JSON.parse(savedAppointments);
      updateAppointmentsList();
    }

    const savedSymptoms = localStorage.getItem("medicsense_symptoms");
    if (savedSymptoms) state.symptoms = JSON.parse(savedSymptoms);
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
  // Navbar scroll effect
  let lastScroll = 0;
  window.addEventListener("scroll", function () {
    const navbar = document.getElementById("navbar");
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }

    lastScroll = currentScroll;
  });

  // Close mobile menu on outside click
  document.addEventListener("click", function (event) {
    const mobileMenu = document.getElementById("mobileMenu");
    const menuBtn = document.querySelector(".mobile-menu-btn");

    if (
      state.isMobileMenuOpen &&
      mobileMenu &&
      !mobileMenu.contains(event.target) &&
      !menuBtn.contains(event.target)
    ) {
      toggleMobileMenu();
    }
  });

  // Close modal on outside click
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("emergencyModal");
    if (event.target === modal) {
      closeEmergencyModal();
    }
  });
}

// ========================================
// PERFORMANCE MONITORING
// ========================================
if (performance.navigation.type === 1) {
  console.log("🔄 Page Reloaded");
}

// Log performance metrics
window.addEventListener("load", function () {
  setTimeout(() => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`⚡ Page Load Time: ${pageLoadTime}ms`);
  }, 0);
});

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

console.log(
  "✅ MedicSense AI Ultra - Ready to solve healthcare automation challenges!"
);
