/**
 * MedicSense AI - Professional Frontend JavaScript
 * With Google Gemini AI Integration
 * Advanced Chat & Camera Features
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
  healthData: {
    vitals: [],
    symptoms: [],
    appointments: [],
  },
  isTyping: false,
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  console.log("🏥 MedicSense AI Professional - Initialized");
  console.log("🧠 AI Status: Gemini-Powered");

  initializeChat();
  initializeCamera();
  initializeHealthTracker();
  setupEventListeners();
  setupScrollAnimations();

  // Show welcome message
  showNotification(
    "Welcome to MedicSense AI! Powered by Google Gemini.",
    "success"
  );
});

// ========================================
// CHAT FUNCTIONALITY
// ========================================
function initializeChat() {
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    // Auto-resize textarea
    chatInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });

    // Enter to send (Shift+Enter for new line)
    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message) return;

  // Clear input
  input.value = "";
  input.style.height = "auto";

  // Add user message to UI
  addMessageToUI(message, "user");

  // Hide quick suggestions after first message
  document.getElementById("quickSuggestions").style.display = "none";

  // Show typing indicator
  showTypingIndicator();

  try {
    // Call API with Gemini-powered backend
    const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        user_id: state.currentUser,
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();

    // Hide typing indicator
    hideTypingIndicator();

    // Add AI response to UI
    addMessageToUI(data.response, "ai", {
      severity: data.severity,
      type: data.type,
      context_aware: data.context_aware,
      sentiment: data.sentiment,
    });

    // Show follow-up questions if available
    if (data.follow_up_questions && data.follow_up_questions.length > 0) {
      showFollowUpQuestions(data.follow_up_questions);
    }

    // Show quick actions if available
    if (data.quick_actions && data.quick_actions.length > 0) {
      showQuickActions(data.quick_actions);
    }

    // Handle emergency
    if (data.severity >= 4) {
      showEmergencyAlert(data);
    }

    // Save to history
    state.chatHistory.push({
      user: message,
      ai: data.response,
      timestamp: new Date().toISOString(),
      severity: data.severity,
    });
  } catch (error) {
    console.error("Chat error:", error);
    hideTypingIndicator();
    addMessageToUI(
      "⚠️ I encountered an error. Please try again or check your internet connection.",
      "ai"
    );
  }
}

function sendQuickMessage(message) {
  document.getElementById("chatInput").value = message;
  sendChatMessage();
}

function addMessageToUI(text, type, metadata = {}) {
  const messagesContainer = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.innerHTML =
    type === "user"
      ? '<i class="fas fa-user"></i>'
      : '<i class="fas fa-robot"></i>';

  const content = document.createElement("div");
  content.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // Parse markdown if AI message
  if (type === "ai") {
    bubble.innerHTML = marked.parse(text);

    // Add severity indicator
    if (metadata.severity) {
      const severityBadge = document.createElement("div");
      severityBadge.className = `severity-badge severity-${metadata.severity}`;
      severityBadge.innerHTML = getSeverityLabel(metadata.severity);
      bubble.appendChild(severityBadge);
    }

    // Add AI context indicator
    if (metadata.context_aware) {
      const contextBadge = document.createElement("div");
      contextBadge.className = "context-badge";
      contextBadge.innerHTML =
        '<i class="fas fa-brain"></i> Context-aware response';
      bubble.appendChild(contextBadge);
    }
  } else {
    bubble.textContent = text;
  }

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  content.appendChild(bubble);
  content.appendChild(time);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getSeverityLabel(severity) {
  const labels = {
    1: '<i class="fas fa-check-circle"></i> Mild',
    2: '<i class="fas fa-info-circle"></i> Moderate',
    3: '<i class="fas fa-exclamation-triangle"></i> Serious',
    4: '<i class="fas fa-ambulance"></i> Emergency',
  };
  return labels[severity] || "Unknown";
}

function showTypingIndicator() {
  document.getElementById("typingIndicator").style.display = "flex";
  const messagesContainer = document.getElementById("chatMessages");
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  document.getElementById("typingIndicator").style.display = "none";
}

function showFollowUpQuestions(questions) {
  const container = document.getElementById("quickSuggestions");
  container.innerHTML =
    '<div class="suggestion-label">Suggested Questions:</div>';

  questions.forEach((question) => {
    const btn = document.createElement("button");
    btn.className = "suggestion-chip";
    btn.textContent = question;
    btn.onclick = () => sendQuickMessage(question);
    container.appendChild(btn);
  });

  container.style.display = "flex";
}

function showQuickActions(actions) {
  // Add quick action buttons to the last AI message
  const lastMessage = document.querySelector(
    ".message.ai-message:last-child .message-bubble"
  );
  if (lastMessage) {
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "quick-actions-inline";
    actionsDiv.innerHTML = '<div class="actions-label">Quick Actions:</div>';

    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.className = "action-chip";
      btn.innerHTML = `<i class="${action.icon}"></i> ${action.label}`;
      btn.onclick = () => handleQuickAction(action.type);
      actionsDiv.appendChild(btn);
    });

    lastMessage.appendChild(actionsDiv);
  }
}

function handleQuickAction(type) {
  switch (type) {
    case "scan_injury":
      scrollToCamera();
      break;
    case "schedule_appointment":
      scheduleAppointment();
      break;
    case "track_symptoms":
      scrollToSection("health-tracker");
      break;
    case "emergency":
      handleEmergency();
      break;
  }
}

function clearChat() {
  if (confirm("Are you sure you want to clear this conversation?")) {
    document.getElementById("chatMessages").innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>👋 Hello! I'm your AI Medical Assistant powered by <strong>Google Gemini</strong>.</p>
                        <p><strong>How can I help you today?</strong></p>
                    </div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
    state.chatHistory = [];
    document.getElementById("quickSuggestions").style.display = "flex";
    showNotification("Chat cleared successfully", "success");
  }
}

function exportChat() {
  if (state.chatHistory.length === 0) {
    showNotification("No chat history to export", "warning");
    return;
  }

  const chatText = state.chatHistory
    .map((entry, index) => {
      return `[${index + 1}] User: ${entry.user}\nAI: ${
        entry.ai
      }\nTime: ${new Date(entry.timestamp).toLocaleString()}\nSeverity: ${
        entry.severity
      }\n\n`;
    })
    .join("");

  const blob = new Blob([chatText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medicsense-chat-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();

  showNotification("Chat exported successfully", "success");
}

// ========================================
// CAMERA FUNCTIONALITY
// ========================================
function initializeCamera() {
  console.log("📷 Camera module initialized");
}

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  // Validate file size
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    showNotification("File size too large. Maximum size is 10MB.", "error");
    return;
  }

  // Validate file type
  if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
    showNotification(
      "Unsupported file format. Please use JPG, PNG, or WEBP.",
      "error"
    );
    return;
  }

  // Read and preview image
  const reader = new FileReader();
  reader.onload = function (e) {
    state.currentImage = {
      file: file,
      dataUrl: e.target.result,
    };

    // Show preview
    document.getElementById("previewImage").src = e.target.result;
    document.getElementById("imagePreview").style.display = "block";

    showNotification(
      'Image uploaded successfully. Click "Analyze with AI" to continue.',
      "success"
    );
  };

  reader.readAsDataURL(file);
}

function removeImage() {
  state.currentImage = null;
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("cameraInput").value = "";
  document.getElementById("analysisResults").style.display = "none";
}

async function analyzeImage() {
  if (!state.currentImage) {
    showNotification("Please upload an image first", "warning");
    return;
  }

  showLoading("Analyzing image with AI...");

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append("image", state.currentImage.file);
    formData.append("user_id", state.currentUser);

    // Call API
    const response = await fetch(`${CONFIG.API_BASE_URL}/analyze-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image analysis failed");
    }

    const data = await response.json();

    hideLoading();

    // Display results
    displayImageAnalysisResults(data);

    showNotification("Analysis complete!", "success");
  } catch (error) {
    console.error("Image analysis error:", error);
    hideLoading();
    showNotification("Failed to analyze image. Please try again.", "error");
  }
}

function displayImageAnalysisResults(data) {
  const resultsCard = document.getElementById("analysisResults");
  const severityBadge = document.getElementById("severityBadge");
  const resultsContent = document.getElementById("resultsContent");

  // Show results card
  resultsCard.style.display = "block";

  // Set severity badge
  severityBadge.textContent = getSeverityText(data.severity);
  severityBadge.className = `analysis-badge severity-${data.severity}`;
  severityBadge.style.background = getSeverityColor(data.severity);

  // Build results HTML
  let resultsHTML = `
        <div class="analysis-section">
            <h4><i class="fas fa-microscope"></i> Analysis</h4>
            <p class="analysis-text">${data.analysis || data.response}</p>
        </div>
    `;

  if (data.recommendations && data.recommendations.length > 0) {
    resultsHTML += `
            <div class="analysis-section">
                <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                <ul class="recommendations-list">
                    ${data.recommendations
                      .map(
                        (rec) =>
                          `<li><i class="fas fa-check-circle"></i> ${rec}</li>`
                      )
                      .join("")}
                </ul>
            </div>
        `;
  }

  if (data.first_aid && data.first_aid.length > 0) {
    resultsHTML += `
            <div class="analysis-section alert-section">
                <h4><i class="fas fa-first-aid"></i> First Aid Steps</h4>
                <ol class="first-aid-list">
                    ${data.first_aid.map((step) => `<li>${step}</li>`).join("")}
                </ol>
            </div>
        `;
  }

  resultsContent.innerHTML = resultsHTML;

  // Scroll to results
  resultsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getSeverityText(severity) {
  const texts = {
    1: "✓ Mild",
    2: "⚠ Moderate",
    3: "⚠⚠ Serious",
    4: "🚨 Emergency",
  };
  return texts[severity] || "Unknown";
}

function getSeverityColor(severity) {
  const colors = {
    1: "#10b981",
    2: "#f59e0b",
    3: "#f97316",
    4: "#ef4444",
  };
  return colors[severity] || "#6b7280";
}

function downloadReport() {
  showNotification("Download feature coming soon!", "info");
}

function shareResults() {
  showNotification("Share feature coming soon!", "info");
}

// ========================================
// HEALTH TRACKER
// ========================================
function initializeHealthTracker() {
  console.log("📊 Health tracker initialized");
}

async function recordVitals() {
  const vitals = {
    temperature: document.getElementById("temperature").value,
    heartRate: document.getElementById("heartRate").value,
    bloodPressure: document.getElementById("bloodPressure").value,
    oxygenLevel: document.getElementById("oxygenLevel").value,
  };

  // Validate
  if (
    !vitals.temperature &&
    !vitals.heartRate &&
    !vitals.bloodPressure &&
    !vitals.oxygenLevel
  ) {
    showNotification("Please enter at least one vital sign", "warning");
    return;
  }

  showLoading("Saving vitals...");

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/health/vitals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: state.currentUser,
        ...vitals,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save vitals");
    }

    const data = await response.json();

    hideLoading();
    showNotification("Vitals recorded successfully!", "success");

    // Clear inputs
    document.getElementById("temperature").value = "";
    document.getElementById("heartRate").value = "";
    document.getElementById("bloodPressure").value = "";
    document.getElementById("oxygenLevel").value = "";

    // Add to activity list
    addActivityItem("Vital Signs Recorded", "Just now", "heartbeat");
  } catch (error) {
    console.error("Error saving vitals:", error);
    hideLoading();
    showNotification("Failed to save vitals. Please try again.", "error");
  }
}

function addActivityItem(title, time, icon) {
  const activityList = document.getElementById("activityList");
  const item = document.createElement("div");
  item.className = "activity-item";
  item.innerHTML = `
        <div class="activity-icon"><i class="fas fa-${icon}"></i></div>
        <div class="activity-content">
            <p class="activity-title">${title}</p>
            <p class="activity-time">${time}</p>
        </div>
    `;
  activityList.insertBefore(item, activityList.firstChild);
}

function viewHealthHistory() {
  showNotification("Opening health history...", "info");
  // This would open a modal or navigate to history page
}

function scheduleAppointment() {
  showNotification("Appointment scheduler coming soon!", "info");
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToChat() {
  scrollToSection("ai-chat");
  setTimeout(() => {
    document.getElementById("chatInput")?.focus();
  }, 800);
}

function scrollToCamera() {
  scrollToSection("camera");
}

function handleEmergency() {
  if (
    confirm(
      "🚨 Are you experiencing a medical emergency?\n\nClick OK to get emergency guidance."
    )
  ) {
    showEmergencyModal();
  }
}

function showEmergencyModal() {
  const modal = document.createElement("div");
  modal.className = "emergency-modal";
  modal.innerHTML = `
        <div class="emergency-modal-content">
            <div class="emergency-header">
                <i class="fas fa-ambulance"></i>
                <h2>Emergency Assistance</h2>
            </div>
            <div class="emergency-body">
                <p class="emergency-message">If this is a life-threatening emergency:</p>
                <button class="emergency-call-btn" onclick="window.location.href='tel:911'">
                    <i class="fas fa-phone"></i> Call 911 Now
                </button>
                <p class="emergency-desc">Or describe your emergency to our AI for immediate guidance:</p>
                <textarea id="emergencyDesc" placeholder="Describe the emergency..." rows="4"></textarea>
                <button class="emergency-analyze-btn" onclick="analyzeEmergency()">
                    <i class="fas fa-brain"></i> Get AI Guidance
                </button>
            </div>
            <button class="emergency-close-btn" onclick="closeEmergencyModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
  document.body.appendChild(modal);
}

function closeEmergencyModal() {
  const modal = document.querySelector(".emergency-modal");
  if (modal) {
    modal.remove();
  }
}

async function analyzeEmergency() {
  const desc = document.getElementById("emergencyDesc").value.trim();
  if (!desc) {
    showNotification("Please describe the emergency", "warning");
    return;
  }

  closeEmergencyModal();
  scrollToChat();
  document.getElementById("chatInput").value = `EMERGENCY: ${desc}`;
  sendChatMessage();
}

function showEmergencyAlert(data) {
  const alert = document.createElement("div");
  alert.className = "emergency-alert";
  alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-ambulance"></i>
            <div>
                <strong>Emergency Detected!</strong>
                <p>Call 911 or seek immediate medical attention</p>
            </div>
        </div>
    `;

  document.body.appendChild(alert);

  // Play alert sound (optional)
  // const audio = new Audio('emergency-alert.mp3');
  // audio.play();

  // Remove after 10 seconds
  setTimeout(() => {
    alert.remove();
  }, 10000);
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  const icons = {
    success: "check-circle",
    error: "exclamation-circle",
    warning: "exclamation-triangle",
    info: "info-circle",
  };

  notification.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add("show"), 100);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function showLoading(message = "Processing...") {
  const overlay = document.getElementById("loadingOverlay");
  const text = overlay.querySelector(".loading-text");
  text.textContent = message;
  overlay.style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const icon = event.target.querySelector("i");
  icon.className = document.body.classList.contains("dark-theme")
    ? "fas fa-sun"
    : "fas fa-moon";
}

function toggleMobileMenu() {
  const navMenu = document.querySelector(".nav-menu");
  navMenu.classList.toggle("mobile-open");
}

function attachFile() {
  document.getElementById("cameraInput").click();
}

function voiceInput() {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = function () {
      showNotification("Listening...", "info");
    };

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      document.getElementById("chatInput").value = transcript;
      showNotification("Speech recognized!", "success");
    };

    recognition.onerror = function (event) {
      showNotification("Speech recognition failed", "error");
    };

    recognition.start();
  } else {
    showNotification(
      "Speech recognition not supported in this browser",
      "warning"
    );
  }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });

        // Update active nav link
        document
          .querySelectorAll(".nav-link")
          .forEach((link) => link.classList.remove("active"));
        this.classList.add("active");
      }
    });
  });
}

function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
      }
    });
  }, observerOptions);

  // Observe all sections
  document.querySelectorAll("section").forEach((section) => {
    observer.observe(section);
  });
}

// ========================================
// CONSOLE BRANDING
// ========================================
console.log(
  "%c🏥 MedicSense AI ",
  "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; border-radius: 5px; font-size: 16px; font-weight: bold;"
);
console.log(
  "%c🧠 Powered by Google Gemini AI",
  "color: #4f46e5; font-size: 14px; font-weight: bold;"
);
console.log(
  "%c📱 Professional Healthcare Platform",
  "color: #10b981; font-size: 12px;"
);
console.log(
  "%c⚡ Advanced Features: Chat, Camera, Health Tracking",
  "color: #6b7280; font-size: 11px;"
);
