/**
 * MedicSense AI - Enhanced Frontend JavaScript
 * Fully integrated with new modern interface
 */

// User State
const userState = {
    userId: 'user_' + Math.random().toString(36).substr(2, 9),
    currentSeverity: 1,
    messageHistory: []
};

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    loadFamilyDoctor();
    setupSmoothScrolling();
});

// Initialize Application
function initializeApp() {
    console.log('🏥 MedicSense AI Initialized');

    // Auto-resize textarea
    const textarea = document.getElementById('messageInputMain');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Enter to send (Shift+Enter for new line)
        textarea.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Smooth Scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// Scroll to Section
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Open Chat Section
function openChat() {
    scrollToSection('chat');
    setTimeout(() => {
        document.getElementById('messageInputMain')?.focus();
    }, 800);
}

// Send Message
async function sendMessage() {
    const textarea = document.getElementById('messageInputMain');
    const message = textarea.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    textarea.value = '';
    textarea.style.height = 'auto';

    // Show typing indicator
    showTypingIndicator(true);

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                user_id: userState.userId
            })
        });

        const data = await response.json();

        // Hide typing indicator
        showTypingIndicator(false);

        // Add bot response
        addMessageToChat(data.response, 'bot', data);

        // Update severity indicator
        if (data.severity) {
            updateSeverityIndicator(data.severity);
        }

        // Save to history
        userState.messageHistory.push({
            user: message,
            bot: data.response,
            timestamp: new Date().toISOString(),
            severity: data.severity
        });

    } catch (error) {
        console.error('Error:', error);
        showTypingIndicator(false);
        addMessageToChat("Sorry, I'm having trouble connecting. Please check if the backend server is running.", 'bot');
    }
}

// Send Quick Message
function sendQuickMessage(message) {
    const textarea = document.getElementById('messageInputMain');
    textarea.value = message;
    textarea.focus();
    sendMessage();
}

// Show Thinking Animation (LLM-style)
function showThinkingAnimation() {
    const chatMessages = document.getElementById('chatMessagesMain');

    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinkingAnimation';
    thinkingDiv.className = 'chat-message message-bot thinking-message';
    thinkingDiv.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse-bot 1.5s infinite;">
                    <i class="fas fa-brain" style="color: white;"></i>
                </div>
                <div>
                    <div style="font-weight: 600; color: #1e293b;">MedicSense AI is thinking...</div>
                    <div id="thinkingSteps" style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
                        Analyzing your symptoms...
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 4px;">
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
                <div class="thinking-dot"></div>
            </div>
        </div>
    `;

    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate thinking steps
    const steps = [
        'Analyzing your symptoms...',
        'Cross-referencing medical knowledge base...',
        'Evaluating severity level...',
        'Formulating personalized response...'
    ];

    let stepIndex = 0;
    const thinkingInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
            const stepsEl = document.getElementById('thinkingSteps');
            if (stepsEl) {
                stepsEl.textContent = steps[stepIndex];
            }
        } else {
            clearInterval(thinkingInterval);
        }
    }, 400);

    // Store interval ID to clear it later
    thinkingDiv.dataset.intervalId = thinkingInterval;
}

// Hide Thinking Animation
function hideThinkingAnimation() {
    const thinkingEl = document.getElementById('thinkingAnimation');
    if (thinkingEl) {
        const intervalId = thinkingEl.dataset.intervalId;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
        }
        thinkingEl.remove();
    }
}

// Add LLM-Style Message with Reasoning
function addLLMStyleMessage(data) {
    const chatMessages = document.getElementById('chatMessagesMain');

    // Remove welcome message if exists
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message message-bot';

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Severity badge
    let severityBadge = '';
    if (data.severity) {
        const severityData = [
            { text: '', color: '' },
            { text: 'Mild', color: '#10b981' },
            { text: 'Moderate', color: '#f59e0b' },
            { text: 'Serious', color: '#ef4444' },
            { text: 'EMERGENCY', color: '#dc2626' }
        ];
        const sev = severityData[data.severity];
        severityBadge = `<span style="background: ${sev.color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin-left: 8px;">${sev.text}</span>`;
    }

    // Build message HTML
    let messageHTML = `
        <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div class="message-sender" style="display: flex; align-items: center; margin-bottom: 12px;">
                <i class="fas fa-robot" style="color: #667eea; margin-right: 8px;"></i> 
                <span style="font-weight: 600;">MedicSense AI</span>
                ${severityBadge}
            </div>
    `;

    // Thinking Process (collapsible)
    if (data.thinking_process) {
        messageHTML += `
            <div style="background: #f8fafc; border-left: 3px solid #667eea; padding: 10px 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 6px; color: #475569; font-weight: 500;">
                    <i class="fas fa-lightbulb" style="color: #667eea;"></i>
                    <span>Thinking Process:</span>
                </div>
                <div style="color: #64748b; margin-top: 6px; font-size: 0.8rem;">${data.thinking_process}</div>
            </div>
        `;
    }

    // Main Response
    messageHTML += `
        <div class="message-text" style="color: #1e293b; line-height: 1.7; margin-bottom: 12px;">
            ${formatMessageLLM(data.response)}
        </div>
    `;

    // Reasoning Section
    if (data.reasoning) {
        messageHTML += `
            <div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 15px 0;">
                <div style="display: flex; align-items: start; gap: 8px;">
                    <i class="fas fa-brain" style="color: #f59e0b; margin-top: 2px;"></i>
                    <div>
                        <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">My Reasoning:</div>
                        <div style="color: #78350f; font-size: 0.9rem; line-height: 1.6;">${data.reasoning}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Suggested Doctors
    if (data.suggested_doctors && data.suggested_doctors.length > 0) {
        messageHTML += `
            <div style="margin: 15px 0; padding: 12px; background: #f0f9ff; border-left: 3px solid #3b82f6; border-radius: 8px;">
                <strong style="color: #1e40af; display: block; margin-bottom: 6px;">
                    <i class="fas fa-user-md"></i> Recommended Specialists:
                </strong>
                <span style="color: #475569;">${data.suggested_doctors.join(', ')}</span>
            </div>
        `;
    }

    // First Aid
    if (data.first_aid && data.first_aid.length > 0) {
        messageHTML += `
            <div style="margin: 15px 0; padding: 12px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 8px;">
                <strong style="color: #dc2626; display: block; margin-bottom: 8px;">
                    <i class="fas fa-first-aid"></i> Emergency First Aid Steps:
                </strong>
                <ol style="margin: 4px 0 0 0; padding-left: 20px; color: #475569;">
                    ${data.first_aid.map(step => `<li style="margin: 4px 0;">${step}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    // Follow-up Questions
    if (data.follow_up && data.follow_up.length > 0) {
        messageHTML += `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px; font-weight: 500;">
                    <i class="fas fa-question-circle"></i> I'd like to understand better:
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${data.follow_up.map(question => `
                        <button 
                            onclick="sendQuickMessage('${question.replace(/'/g, "\\'")}')"
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 8px 14px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.3s ease;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.4)'"
                            onmouseout="this.style.transform=''; this.style.boxShadow=''">
                            ${question}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Timestamp
    messageHTML += `
            <div class="message-time" style="font-size: 0.75rem; color: #94a3b8; margin-top: 12px;">
                ${time}
            </div>
        </div>
    `;

    messageDiv.innerHTML = messageHTML;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add Message to Chat (Kept for user messages and simple bot messages)
function addMessageToChat(message, sender, data = {}) {
    const chatMessages = document.getElementById('chatMessagesMain');

    // Remove welcome message if exists
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message message-${sender}`;

    const formattedMessage = formatMessageLLM(message); // Use LLM formatter
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sender === 'bot') {
        // This block is mostly for fallback or specific simple bot messages,
        // as addLLMStyleMessage handles rich bot responses.
        let severityBadge = '';
        if (data.severity) {
            const severityText = ['', 'Mild', 'Moderate', 'Serious', 'EMERGENCY'][data.severity];
            const severityColor = ['', '#10b981', '#f59e0b', '#ef4444', '#dc2626'][data.severity];
            severityBadge = `<span style="background: ${severityColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin-left: 8px;">${severityText}</span>`;
        }

        messageDiv.innerHTML = `
            <div class="message-sender">
                <i class="fas fa-robot"></i> MedicSense AI ${severityBadge}
            </div>
            <div class="message-text">${formattedMessage}</div>
            ${data.suggested_doctors && data.suggested_doctors.length > 0 ?
                `<div style="margin-top: 12px; padding: 10px; background: #f0f9ff; border-left: 3px solid #3b82f6; border-radius: 8px;">
                    <strong style="color: #1e40af;">Recommended Specialists:</strong><br>
                    <span style="color: #475569;">${data.suggested_doctors.join(', ')}</span>
                </div>` : ''}
            ${data.first_aid && data.first_aid.length > 0 ?
                `<div style="margin-top: 12px; padding: 12px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 8px;">
                    <strong style="color: #dc2626;"><i class="fas fa-first-aid"></i> First Aid Steps:</strong>
                    <ol style="margin: 8px 0 0 0; padding-left: 20px; color: #475569;">
                        ${data.first_aid.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>` : ''}
            <div class="message-time">${time}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-sender">
                <i class="fas fa-user"></i> You
            </div>
            <div class="message-text">${formattedMessage}</div>
            <div class="message-time">${time}</div>
        `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format Message for LLM style
function formatMessageLLM(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '<span style="color: #667eea;">•</span> ')
        .split('\n').join('<br>');
}

// Show/Hide Typing Indicator
function showTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'block' : 'none';
    }
}

// Update Severity Indicator
function updateSeverityIndicator(level) {
    userState.currentSeverity = level;

    document.querySelectorAll('.severity-level-indicator').forEach(el => {
        el.classList.remove('active');
        if (parseInt(el.dataset.level) === level) {
            el.classList.add('active');
        }
    });
}

// Voice Input
function startVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = false;

        const voiceBtn = document.querySelector('.voice-btn');
        voiceBtn.style.color = '#ef4444';

        recognition.start();

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('messageInputMain').value = transcript;
            voiceBtn.style.color = '';
        };

        recognition.onspeechend = function () {
            recognition.stop();
            voiceBtn.style.color = '';
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error:', event.error);
            voiceBtn.style.color = '';
            addMessageToChat("Sorry, voice input is not available. Please type your message.", 'bot');
        };
    } else {
        addMessageToChat("Sorry, your browser doesn't support voice input.", 'bot');
    }
}

// Show Symptom Check list
function showSymptomChecklist() {
    const symptoms = [
        'Fever', 'Cough', 'Headache', 'Fatigue', 'Sore throat',
        'Shortness of breath', 'Chest pain', 'Nausea', 'Dizziness',
        'Body aches', 'Rash', 'Vomiting', 'Diarrhea', 'Loss of taste/smell'
    ];

    let checklistHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; margin: 15px 0;">
            <h4 style="margin-bottom: 15px; color: #1e293b;"><i class="fas fa-list-check"></i> Symptom Checklist</h4>
            <p style="color: #64748b; margin-bottom: 15px;">Select all symptoms you're experiencing:</p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
    `;

    symptoms.forEach(symptom => {
        checklistHTML += `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8fafc; border-radius: 8px; cursor: pointer;">
                <input type="checkbox" value="${symptom.toLowerCase()}" style="width: 18px; height: 18px;">
                <span style="font-size: 0.95rem;">${symptom}</span>
            </label>
        `;
    });

    checklistHTML += `
            </div>
            <button onclick="submitSymptomChecklist()" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer;">
                <i class="fas fa-paper-plane"></i> Submit Symptoms
            </button>
        </div>
    `;

    addMessageToChat(checklistHTML, 'bot');
}

// Submit Symptom Checklist
function submitSymptomChecklist() {
    const selected = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        selected.push(cb.value);
    });

    if (selected.length > 0) {
        const message = `I have ${selected.join(', ')}`;
        document.getElementById('messageInputMain').value = message;
        sendMessage();
    } else {
        addMessageToChat("Please select at least one symptom from the checklist.", 'bot');
    }
}

// Save Family Doctor
async function saveFamilyDoctor(event) {
    event.preventDefault();

    const name = document.getElementById('doctorName').value.trim();
    const contact = document.getElementById('doctorContact').value.trim();
    const specialization = document.getElementById('doctorSpecialization').value;

    if (!name || !contact) {
        showFormMessage('Please fill in all required fields.', 'error');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/save-doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                contact: contact,
                specialization: specialization,
                user_id: userState.userId
            })
        });

        const data = await response.json();

        if (data.success) {
            showFormMessage('✅ Family doctor saved successfully!', 'success');

            // Wait a moment then reload doctor display
            setTimeout(() => {
                loadFamilyDoctor();
            }, 300);

            // Clear form
            document.getElementById('doctorName').value = '';
            document.getElementById('doctorContact').value = '';
            document.getElementById('doctorSpecialization').value = 'General Physician';
        } else {
            showFormMessage('❌ Error: ' + (data.error || 'Could not save doctor'), 'error');
        }
    } catch (error) {
        console.error('Error saving doctor:', error);
        showFormMessage('❌ Network error. Please check if the backend server is running.', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

// Load Family Doctor
async function loadFamilyDoctor() {
    try {
        console.log('Loading family doctor for user:', userState.userId);

        const response = await fetch(`http://localhost:3000/api/get-doctor/${userState.userId}`);
        const data = await response.json();

        console.log('Doctor data received:', data);

        const displayDiv = document.getElementById('currentDoctorDisplay');

        if (!displayDiv) {
            console.error('currentDoctorDisplay element not found!');
            return;
        }

        if (data.success && data.doctor) {
            const doctor = data.doctor;
            displayDiv.innerHTML = `
                <div class="doctor-info">
                    <h4><i class="fas fa-user-doctor"></i> ${doctor.name}</h4>
                    <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                    <p><strong>Contact:</strong> <a href="tel:${doctor.contact}" style="color: #6366f1; text-decoration: none;">${doctor.contact}</a></p>
                    <div class="saved-badge">
                        <i class="fas fa-check-circle"></i> Saved to your profile
                    </div>
                </div>
            `;
            console.log('Doctor displayed successfully');
        } else {
            displayDiv.innerHTML = `
                <div class="no-doctor-state">
                    <i class="fas fa-user-slash"></i>
                    <p>No family doctor added yet</p>
                    <small>Add your doctor using the form</small>
                </div>
            `;
            console.log('No doctor found, showing empty state');
        }
    } catch (error) {
        console.error('Error loading family doctor:', error);
        const displayDiv = document.getElementById('currentDoctorDisplay');
        if (displayDiv) {
            displayDiv.innerHTML = `
                <div class="no-doctor-state">
                    <i class ="fas fa-exclamation-triangle"></i>
                    <p>Error loading doctor</p>
                    <small>Please try refreshing the page</small>
                </div>
            `;
        }
    }
}

// Show Form Message
function showFormMessage(message, type) {
    const messageDiv = document.getElementById('doctorFormMessage');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;

    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';
    }, 5000);
}

// Export functions for HTML onclick handlers
window.openChat = openChat;
window.scrollToSection = scrollToSection;
window.sendMessage = sendMessage;
window.sendQuickMessage = sendQuickMessage;
window.startVoiceInput = startVoiceInput;
window.showSymptomChecklist = showSymptomChecklist;
window.submitSymptomChecklist = submitSymptomChecklist;
window.saveFamilyDoctor = saveFamilyDoctor;
