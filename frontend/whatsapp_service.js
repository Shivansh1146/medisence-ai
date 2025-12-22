/**
 * WhatsApp Notification Service
 * For sending WhatsApp notifications to doctors
 * 
 * API Provider: Twilio WhatsApp API
 * Website: https://www.twilio.com/whatsapp
 * 
 * Setup Instructions:
 * 1. Sign up at https://www.twilio.com/try-twilio
 * 2. Get your Account SID and Auth Token from Twilio Console
 * 3. Get a Twilio WhatsApp number (starts with whatsapp:+)
 * 4. Add credentials to backend/.env file:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
 * 5. For production, verify your recipient number in Twilio Console
 */

// Load WhatsApp config from environment variables
const getWhatsAppConfig = () => {
    // Try to get from window.ENV (loaded by env-loader.js)
    if (window.ENV && window.ENV.WHATSAPP) {
        return {
            API_BASE_URL: window.ENV.API_BASE_URL || "http://localhost:5000/api",
            DOCTOR_Aakash: window.ENV.WHATSAPP.DOCTOR_Aakash || {
                name: "Dr. Aakash Singh Rajput",
                phone: "+91 9770064169",
                whatsapp: "+919770064169"
            }
        };
    }
    
    // Fallback to default values
    return {
        API_BASE_URL: "http://localhost:5000/api",
        DOCTOR_Aakash: {
            name: "Dr. Aakash Singh Rajput",
            phone: "+91 9770064169",
            whatsapp: "+919770064169" // WhatsApp format (no spaces)
        }
    };
};

const WHATSAPP_CONFIG = getWhatsAppConfig();

/**
 * Send WhatsApp notification to doctor when appointment is booked
 * @param {Object} appointmentData - Appointment details
 */
async function sendWhatsAppNotification(appointmentData) {
    try {
        // Check if appointment is for Dr. Aakash
        if (appointmentData.doctorId === 'dr_aakash' || 
            appointmentData.doctorId === 'Dr. Aakash Singh Rajput') {
            
            const message = formatAppointmentMessage(appointmentData);
            
            const response = await fetch(`${WHATSAPP_CONFIG.API_BASE_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: WHATSAPP_CONFIG.DOCTOR_Aakash.whatsapp,
                    message: message,
                    doctor_name: WHATSAPP_CONFIG.DOCTOR_Aakash.name
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ WhatsApp notification sent successfully');
                return true;
            } else {
                console.error('❌ Failed to send WhatsApp notification:', data.message);
                return false;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return false;
    }
}

/**
 * Format appointment message for WhatsApp
 */
function formatAppointmentMessage(appointment) {
    const date = new Date(appointment.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `🏥 *New Appointment Booking*

👤 *Patient Details:*
Name: ${appointment.name}
Phone: ${appointment.phone}
Email: ${appointment.email || 'Not provided'}

📅 *Appointment Details:*
Date: ${date}
Time: ${appointment.time}
Type: ${appointment.type || 'In-Person'}

📝 *Reason:*
${appointment.reason || 'Not specified'}

🆔 Appointment ID: ${appointment.id || 'N/A'}

Please confirm this appointment.`;
}

/**
 * Send appointment reminder via WhatsApp
 */
async function sendAppointmentReminder(appointmentData) {
    try {
        if (appointmentData.doctorId === 'dr_aakash') {
            const message = formatReminderMessage(appointmentData);
            
            const response = await fetch(`${WHATSAPP_CONFIG.API_BASE_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: WHATSAPP_CONFIG.DOCTOR_Aakash.whatsapp,
                    message: message,
                    doctor_name: WHATSAPP_CONFIG.DOCTOR_Aakash.name
                })
            });

            return await response.json();
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Format reminder message
 */
function formatReminderMessage(appointment) {
    const date = new Date(appointment.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `🔔 *Appointment Reminder*

You have an appointment scheduled:

👤 Patient: ${appointment.name}
📅 Date: ${date}
⏰ Time: ${appointment.time}

Please be ready for the appointment.`;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendWhatsAppNotification,
        sendAppointmentReminder,
        WHATSAPP_CONFIG
    };
}

// Make functions available globally
window.sendWhatsAppNotification = sendWhatsAppNotification;
window.sendAppointmentReminder = sendAppointmentReminder;

