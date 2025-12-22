/**
 * MedicSense AI - Advanced Features JavaScript
 * Health Tracking, Appointments, Medications, and More
 */

// ========== HEALTH TRACKING ==========

async function recordVitals() {
  const vitalsData = {
    user_id: userState.userId,
    temperature: document.getElementById("temperature")?.value,
    blood_pressure: document.getElementById("blood_pressure")?.value,
    heart_rate: document.getElementById("heart_rate")?.value,
    oxygen_saturation: document.getElementById("oxygen_saturation")?.value,
    weight: document.getElementById("weight")?.value,
  };

  try {
    const response = await fetch("http://localhost:5000/api/health/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vitalsData),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Vitals recorded successfully!", "success");
      clearVitalsForm();
    }
  } catch (error) {
    console.error("Error recording vitals:", error);
    showNotification("❌ Failed to record vitals", "error");
  }
}

async function loadHealthHistory() {
  try {
    const response = await fetch(
      `http://localhost:5000/api/health/vitals/${userState.userId}`
    );
    const data = await response.json();

    if (data.success && data.pattern) {
      displayHealthPattern(data.pattern);
    }
  } catch (error) {
    console.error("Error loading health history:", error);
  }
}

function displayHealthPattern(pattern) {
  const patternDiv = document.getElementById("healthPattern");
  if (!patternDiv) return;

  let html = `
        <div class="pattern-card">
            <h3>📊 Your Health Pattern</h3>
            <div class="pattern-info">
                <p><strong>Pattern Type:</strong> ${pattern.pattern}</p>
                <p><strong>Frequency:</strong> ${pattern.frequency} occurrences in last 7 days</p>
                <p><strong>Severity Trend:</strong> ${pattern.severity_trend}</p>
            </div>
    `;

  if (pattern.most_common_symptoms && pattern.most_common_symptoms.length > 0) {
    html += `
            <div class="common-symptoms">
                <h4>Most Common Symptoms:</h4>
                <ul>
                    ${pattern.most_common_symptoms
                      .map(
                        ([symptom, count]) =>
                          `<li>${symptom} (${count} times)</li>`
                      )
                      .join("")}
                </ul>
            </div>
        `;
  }

  html += `
            <div class="recommendation">
                <strong>Recommendation:</strong> ${pattern.recommendation}
            </div>
        </div>
    `;

  patternDiv.innerHTML = html;
}

// ========== APPOINTMENT MANAGEMENT ==========

async function scheduleAppointment() {
  const appointmentData = {
    user_id: userState.userId,
    doctor: document.getElementById("apt_doctor")?.value,
    specialization: document.getElementById("apt_specialization")?.value,
    date: document.getElementById("apt_date")?.value,
    time: document.getElementById("apt_time")?.value,
    reason: document.getElementById("apt_reason")?.value,
  };

  try {
    const response = await fetch(
      "http://localhost:5000/api/appointments/book",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      }
    );

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Appointment scheduled!", "success");
      clearAppointmentForm();
      loadAppointments();
    }
  } catch (error) {
    console.error("Error scheduling appointment:", error);
    showNotification("❌ Failed to schedule appointment", "error");
  }
}

async function loadAppointments() {
  try {
    const response = await fetch(
      `http://localhost:5000/api/appointments/${userState.userId}`
    );
    const data = await response.json();

    if (data.success) {
      displayAppointments(data.appointments);
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
  }
}

function displayAppointments(appointments) {
  const aptList = document.getElementById("appointmentsList");
  if (!aptList) return;

  if (appointments.length === 0) {
    aptList.innerHTML = '<p class="no-data">No upcoming appointments</p>';
    return;
  }

  let html = '<div class="appointments-grid">';

  appointments.forEach((apt) => {
    html += `
            <div class="appointment-card">
                <div class="apt-header">
                    <h4>Dr. ${apt.doctor}</h4>
                    <span class="apt-status">${apt.status}</span>
                </div>
                <div class="apt-details">
                    <p><i class="fas fa-stethoscope"></i> ${
                      apt.specialization
                    }</p>
                    <p><i class="fas fa-calendar"></i> ${new Date(
                      apt.date
                    ).toLocaleDateString()}</p>
                    <p><i class="fas fa-clock"></i> ${apt.time}</p>
                    <p><i class="fas fa-notes-medical"></i> ${apt.reason}</p>
                </div>
                <button class="btn-cancel" onclick="cancelAppointment('${
                  apt.id
                }')">
                    Cancel Appointment
                </button>
            </div>
        `;
  });

  html += "</div>";
  aptList.innerHTML = html;
}

async function cancelAppointment(appointmentId) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/appointments/${appointmentId}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userState.userId,
          appointment_id: appointmentId,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Appointment cancelled", "success");
      loadAppointments();
    }
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    showNotification("❌ Failed to cancel appointment", "error");
  }
}

// ========== MEDICATION MANAGEMENT ==========

async function addMedication() {
  const times = [];
  document.querySelectorAll(".med-time:checked").forEach((checkbox) => {
    times.push(checkbox.value);
  });

  const medicationData = {
    user_id: userState.userId,
    name: document.getElementById("med_name")?.value,
    dosage: document.getElementById("med_dosage")?.value,
    frequency: document.getElementById("med_frequency")?.value,
    times: times,
    instructions: document.getElementById("med_instructions")?.value,
  };

  try {
    const response = await fetch("http://localhost:5000/api/medications/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(medicationData),
    });

    const data = await response.json();

    if (data.success) {
      showNotification("✅ Medication added!", "success");
      clearMedicationForm();
      loadMedications();
    }
  } catch (error) {
    console.error("Error adding medication:", error);
    showNotification("❌ Failed to add medication", "error");
  }
}

async function loadMedications() {
  try {
    const response = await fetch(
      `http://localhost:5000/api/medications/${userState.userId}`
    );
    const data = await response.json();

    if (data.success) {
      displayMedications(data.medications);
    }
  } catch (error) {
    console.error("Error loading medications:", error);
  }
}

function displayMedications(medications) {
  const medList = document.getElementById("medicationsList");
  if (!medList) return;

  if (medications.length === 0) {
    medList.innerHTML = '<p class="no-data">No active medications</p>';
    return;
  }

  let html = '<div class="medications-grid">';

  medications.forEach((med) => {
    html += `
            <div class="medication-card">
                <div class="med-header">
                    <h4>${med.name}</h4>
                    <span class="med-dosage">${med.dosage}</span>
                </div>
                <div class="med-details">
                    <p><i class="fas fa-pills"></i> Frequency: ${
                      med.frequency
                    }</p>
                    <p><i class="fas fa-clock"></i> Times: ${med.times.join(
                      ", "
                    )}</p>
                    ${
                      med.instructions
                        ? `<p><i class="fas fa-info-circle"></i> ${med.instructions}</p>`
                        : ""
                    }
                </div>
            </div>
        `;
  });

  html += "</div>";
  medList.innerHTML = html;
}

async function loadMedicationSchedule() {
  try {
    const response = await fetch(
      `http://localhost:5000/api/medications/schedule/${userState.userId}`
    );
    const data = await response.json();

    if (data.success) {
      displayMedicationSchedule(data.schedule);
    }
  } catch (error) {
    console.error("Error loading medication schedule:", error);
  }
}

function displayMedicationSchedule(schedule) {
  const scheduleDiv = document.getElementById("medicationSchedule");
  if (!scheduleDiv) return;

  let html = `
        <div class="schedule-card">
            <h3>📅 Today's Medication Schedule</h3>
            <p class="schedule-date">${schedule.date}</p>
            <div class="schedule-timeline">
    `;

  if (Object.keys(schedule.schedule).length === 0) {
    html += '<p class="no-data">No medications scheduled for today</p>';
  } else {
    for (const [time, meds] of Object.entries(schedule.schedule)) {
      html += `
                <div class="schedule-time">
                    <div class="time-label">${time}</div>
                    <div class="time-meds">
                        ${meds
                          .map(
                            (med) => `
                            <div class="scheduled-med">
                                <strong>${med.name}</strong> - ${med.dosage}
                                ${
                                  med.instructions
                                    ? `<br><small>${med.instructions}</small>`
                                    : ""
                                }
                                <button class="btn-taken" onclick="markMedTaken('${time}', '${
                              med.name
                            }')">
                                    ✓ Taken
                                </button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `;
    }
  }

  html += `
            </div>
        </div>
    `;

  scheduleDiv.innerHTML = html;
}

function markMedTaken(time, medName) {
  showNotification(`✅ Marked ${medName} as taken at ${time}`, "success");
  // Could add API call to track medication adherence
}

// ========== DRUG INTERACTION CHECKER ==========

async function checkDrugInteraction() {
  const drug1 = document.getElementById("drug1")?.value;
  const drug2 = document.getElementById("drug2")?.value;

  if (!drug1 || !drug2) {
    showNotification("Please enter both medications", "warning");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/drug-interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drug1, drug2 }),
    });

    const data = await response.json();
    displayInteractionResult(data);
  } catch (error) {
    console.error("Error checking interaction:", error);
    showNotification("❌ Failed to check interaction", "error");
  }
}

function displayInteractionResult(result) {
  const resultDiv = document.getElementById("interactionResult");
  if (!resultDiv) return;

  let html = `
        <div class="interaction-result ${
          result.has_interaction ? "has-interaction" : "no-interaction"
        }">
            <h4>${
              result.has_interaction
                ? "⚠️ Interaction Found"
                : "✅ No Known Interaction"
            }</h4>
    `;

  if (result.has_interaction) {
    html += `
            <p class="severity severity-${
              result.severity
            }">Severity: ${result.severity.toUpperCase()}</p>
            ${
              result.details.side_effects
                ? `
                <div class="side-effects">
                    <strong>Possible Side Effects:</strong>
                    <ul>
                        ${result.details.side_effects
                          .map((effect) => `<li>${effect}</li>`)
                          .join("")}
                    </ul>
                </div>
            `
                : ""
            }
            <p class="warning-text">⚠️ Consult your doctor or pharmacist before taking these medications together.</p>
        `;
  } else {
    html += `<p>These medications appear safe to take together, but always consult your healthcare provider.</p>`;
  }

  html += "</div>";
  resultDiv.innerHTML = html;
}

// ========== UTILITY FUNCTIONS ==========

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function clearVitalsForm() {
  document
    .querySelectorAll("#vitalsForm input")
    .forEach((input) => (input.value = ""));
}

function clearAppointmentForm() {
  document
    .querySelectorAll("#appointmentForm input, #appointmentForm textarea")
    .forEach((input) => (input.value = ""));
}

function clearMedicationForm() {
  document
    .querySelectorAll("#medicationForm input, #medicationForm textarea")
    .forEach((input) => (input.value = ""));
  document
    .querySelectorAll(".med-time")
    .forEach((checkbox) => (checkbox.checked = false));
}

// ========== INITIALIZATION ==========

document.addEventListener("DOMContentLoaded", function () {
  // Load all data on page load
  loadHealthHistory();
  loadAppointments();
  loadMedications();
  loadMedicationSchedule();

  // Set up periodic refresh for medication schedule
  setInterval(loadMedicationSchedule, 60000); // Refresh every minute
});

// Export functions
window.recordVitals = recordVitals;
window.scheduleAppointment = scheduleAppointment;
window.cancelAppointment = cancelAppointment;
window.addMedication = addMedication;
window.checkDrugInteraction = checkDrugInteraction;
window.markMedTaken = markMedTaken;
