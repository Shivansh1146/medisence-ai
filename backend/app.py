"""
MedicSense AI Backend - Flask Server
Handles all chatbot requests and medical logic
"""

import json
import os

from camera_analyzer import camera_analyzer
from emergency_detector import EmergencyDetector
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from gemini_service import gemini_service
from otp_service import otp_service
from severity_classifier import SeverityClassifier
from symptom_analyzer import SymptomAnalyzer

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate

# Initialize medical modules
analyzer = SymptomAnalyzer()
classifier = SeverityClassifier()
emergency = EmergencyDetector()

# Load knowledge bases
with open("medical_kb.json", "r") as f:
    MEDICAL_KB = json.load(f)
with open("doctors_db.json", "r") as f:
    DOCTORS_DB = json.load(f)

# Store family doctors locally (simple file-based)
FAMILY_DOCTOR_FILE = "family_doctor.json"


@app.route("/")
def home():
    """Serve frontend files"""
    return send_from_directory("..", "index.html")


@app.route("/<path:path>")
def serve_frontend(path):
    """Serve other frontend files"""
    # Ignore api routes
    if path.startswith("api/"):
        return None
    return send_from_directory("..", path)


@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint with LLM-style responses"""
    try:
        data = request.json
        user_message = data.get("message", "").lower().strip()
        user_id = data.get("user_id", "anonymous")

        # Simulate thinking time (like LLM processing)
        import random
        import time

        thinking_time = random.uniform(0.5, 1.5)  # 0.5-1.5 seconds
        time.sleep(thinking_time)

        # Check if non-medical query
        if is_non_medical(user_message):
            return jsonify(
                {
                    "response": generate_llm_style_response(
                        "I appreciate you reaching out, but I'm specifically designed to assist with medical and health-related concerns. I'm trained to analyze symptoms, provide health guidance, and help in medical emergencies.\n\nIs there a health concern I can help you with today?",
                        thinking_process="Analyzing query intent → Detected non-medical topic → Providing polite redirection",
                    ),
                    "severity": 0,
                    "type": "general",
                    "thinking_process": "I analyzed your message and determined it's not health-related. Redirecting to medical topics.",
                    "follow_up": [
                        "Do you have any health symptoms?",
                        "Is there a medical concern I can help with?",
                    ],
                }
            )

        # Check for emergency first
        emergency_result = emergency.check_emergency(user_message)
        if emergency_result["is_emergency"]:
            return jsonify(
                {
                    "response": generate_llm_style_response(
                        emergency_result["response"],
                        thinking_process=f"Analyzing symptoms → CRITICAL: Emergency detected → Activating emergency protocol",
                    ),
                    "severity": 4,
                    "type": "emergency",
                    "first_aid": emergency_result.get("first_aid", []),
                    "hospitals": get_nearby_hospitals(data.get("city", "unknown")),
                    "thinking_process": "Emergency situation identified. Prioritizing immediate safety instructions.",
                    "reasoning": "Based on the keywords in your message, this appears to be a medical emergency requiring immediate attention.",
                }
            )

        # Analyze symptoms with detailed reasoning
        symptoms = analyzer.extract_symptoms(user_message)
        severity = classifier.classify(user_message, symptoms)

        # Generate AI-powered response using Gemini
        ai_response = gemini_service.chat_medical(user_message, symptoms, severity)

        # Generate enhanced LLM-style response with reasoning
        response = generate_medical_response_llm(
            user_message, symptoms, severity, user_id
        )

        # Use AI response if available, otherwise use fallback
        final_response = (
            ai_response if ai_response != response["text"] else response["text"]
        )

        return jsonify(
            {
                "response": final_response,
                "severity": severity,
                "type": response["type"],
                "suggested_doctors": response.get("doctors", []),
                "actions": response.get("actions", []),
                "redirect_to": response.get("redirect_to"),
                "thinking_process": response.get("thinking_process", ""),
                "reasoning": response.get("reasoning", ""),
                "follow_up": response.get("follow_up", []),
            }
        )

    except Exception as e:
        return jsonify(
            {
                "response": generate_llm_style_response(
                    "I encountered an issue processing your message. Could you please rephrase your symptoms more clearly? For example: 'I have a fever and cough for 2 days.'",
                    thinking_process="Error in processing → Requesting clarification",
                ),
                "severity": 0,
                "type": "error",
                "thinking_process": "I had trouble understanding. Let me help you rephrase.",
                "follow_up": [
                    "Can you describe your main symptom?",
                    "How long have you had these symptoms?",
                ],
            }
        )


@app.route("/api/save-doctor", methods=["POST"])
def save_doctor():
    """Save user's family doctor"""
    try:
        data = request.json
        user_id = data.get("user_id", "anonymous")
        doctor_info = {
            "user_id": user_id,
            "name": data.get("name"),
            "contact": data.get("contact"),
            "specialization": data.get("specialization", "General Physician"),
        }

        # Load existing doctors
        doctors = []
        if os.path.exists(FAMILY_DOCTOR_FILE):
            with open(FAMILY_DOCTOR_FILE, "r") as f:
                doctors = json.load(f)

        # Update or add doctor
        found = False
        for i, doc in enumerate(doctors):
            if doc["user_id"] == user_id:
                doctors[i] = doctor_info
                found = True
                break

        if not found:
            doctors.append(doctor_info)

        # Save
        with open(FAMILY_DOCTOR_FILE, "w") as f:
            json.dump(doctors, f, indent=2)

        return jsonify({"success": True, "message": "Doctor saved successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/get-doctor/<user_id>")
def get_family_doctor(user_id):
    """Get family doctor for user"""
    try:
        if not os.path.exists(FAMILY_DOCTOR_FILE):
            return jsonify({"success": False, "message": "No doctors found"})

        with open(FAMILY_DOCTOR_FILE, "r") as f:
            doctors = json.load(f)

        for doctor in doctors:
            if doctor["user_id"] == user_id:
                return jsonify({"success": True, "doctor": doctor})

        return jsonify({"success": False, "message": "No doctor found for this user"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/analyze-injury-image", methods=["POST"])
def analyze_injury_image():
    """
    📸 Camera Injury Analysis - Analyzes injury from uploaded image with AI
    Returns injury type, severity, and complete cure process
    """
    try:
        data = request.json
        image_data = data.get("image")
        user_notes = data.get("notes", "")

        if not image_data:
            return jsonify({"success": False, "error": "No image data provided"})

        # Analyze injury using Gemini AI Vision
        analysis = gemini_service.analyze_injury_image(image_data)

        # Add user notes if provided
        if user_notes and analysis.get("success"):
            analysis["user_notes"] = user_notes

        return jsonify(analysis)

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": str(e),
                "message": "Analysis failed. Please try again.",
            }
        )


@app.route("/api/injury-stats", methods=["GET"])
def get_injury_stats():
    """Get available injury types and statistics"""
    try:
        stats = camera_analyzer.get_injury_statistics()
        return jsonify({"success": True, "stats": stats, "total_types": len(stats)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/find-doctors")
def find_doctors():
    """Find doctors by city and specialization"""
    city = request.args.get("city", "").lower()
    specialization = request.args.get("specialization", "").lower()

    matches = []
    for doctor in DOCTORS_DB["doctors"]:
        if (
            city in doctor["city"].lower()
            and specialization in doctor["specialization"].lower()
        ):
            matches.append(doctor)

    return jsonify({"doctors": matches[:5]})  # Return top 5


def is_non_medical(message):
    """Detect non-medical queries"""
    non_medical_keywords = [
        "joke",
        "weather",
        "date",
        "time",
        "sport",
        "movie",
        "music",
        "politics",
        "celebrity",
        "recipe",
        "game",
    ]
    return any(keyword in message for keyword in non_medical_keywords)


def generate_medical_response(message, symptoms, severity, user_id):
    """Generate appropriate medical response based on severity"""

    # Load family doctor if available
    family_doctor = None
    if os.path.exists(FAMILY_DOCTOR_FILE):
        with open(FAMILY_DOCTOR_FILE, "r") as f:
            doctors = json.load(f)
            for doc in doctors:
                if doc["user_id"] == user_id:
                    family_doctor = doc
                    break

    responses = {
        1: {  # Mild
            "type": "mild",
            "text": f"I understand you're experiencing {', '.join(symptoms[:3]) if symptoms else 'these symptoms'}. This appears to be a mild condition.\n\n"
            + f"💡 **Suggestions:**\n"
            + f"• Rest and stay hydrated\n"
            + f"• Monitor your symptoms\n"
            + f"• Consider over-the-counter remedies if appropriate\n\n"
            + (
                f"👨‍⚕️ Your family doctor, Dr. {family_doctor['name']}, can help with this. No need to worry!"
                if family_doctor
                else "👨‍⚕️ Consider consulting a family doctor if symptoms persist."
            ),
            "actions": ["Rest", "Hydrate", "Monitor", "Consult if persists"],
        },
        2: {  # Moderate
            "type": "moderate",
            "text": f"Your symptoms ({', '.join(symptoms[:5]) if symptoms else 'these symptoms'}) suggest a moderate condition that may require medical attention.\n\n"
            + f"🚨 **Recommended Actions:**\n"
            + f"• Consult a doctor within 24-48 hours\n"
            + f"• Avoid self-medication\n"
            + f"• Isolate if infectious symptoms are present\n"
            + f"• Monitor for worsening symptoms\n\n"
            + f"📋 I can help you find specialists in your area.",
            "doctors": get_doctors_by_symptoms(symptoms),
            "redirect_to": "find-doctors",
        },
        3: {  # Serious
            "type": "serious",
            "text": f"⚠️ **IMPORTANT: Serious Symptoms Detected**\n\n"
            + f"Your reported symptoms ({', '.join(symptoms[:5]) if symptoms else 'these symptoms'}) require prompt medical evaluation.\n\n"
            + f"🔴 **Immediate Actions Required:**\n"
            + f"• Consult a specialist within 24 hours\n"
            + f"• Do not ignore persistent symptoms\n"
            + f"• Seek emergency care if symptoms worsen\n"
            + f"• Keep a symptom diary for your doctor\n\n"
            + f"🏥 I strongly recommend contacting a healthcare provider immediately.",
            "doctors": get_specialists(symptoms),
            "actions": [
                "Consult specialist within 24h",
                "Monitor closely",
                "Prepare for hospital visit",
            ],
        },
    }

    return responses.get(severity, responses[1])


def get_doctors_by_symptoms(symptoms):
    """Find relevant doctors based on symptoms"""
    # Simplified matching - in real implementation, use symptom-specialty mapping
    if any(s in ["cough", "fever", "cold"] for s in symptoms):
        return ["General Physician", "Pulmonologist"]
    elif any(s in ["pain", "ache", "injury"] for s in symptoms):
        return ["Orthopedic", "General Physician"]
    elif any(s in ["skin", "rash", "itch"] for s in symptoms):
        return ["Dermatologist"]
    return ["General Physician"]


def get_specialists(symptoms):
    """Get specialists for serious conditions"""
    specializations = []
    if any(s in ["cancer", "tumor", "lump"] for s in symptoms):
        specializations.append("Oncologist")
    if any(s in ["heart", "chest", "pressure"] for s in symptoms):
        specializations.append("Cardiologist")
    if any(s in ["brain", "neuro", "seizure"] for s in symptoms):
        specializations.append("Neurologist")
    return specializations if specializations else ["Specialist Physician"]


def get_nearby_hospitals(city):
    """Get hospitals in the city"""
    hospitals = []
    for hospital in DOCTORS_DB["hospitals"]:
        if city.lower() in hospital["city"].lower():
            hospitals.append(hospital)
    return hospitals[:3]


def generate_llm_style_response(base_response, thinking_process=""):
    """Add LLM-style formatting to responses"""
    return base_response


def generate_medical_response_llm(message, symptoms, severity, user_id):
    """Generate LLM-style medical response with reasoning and thinking"""

    # Load family doctor if available
    family_doctor = None
    if os.path.exists(FAMILY_DOCTOR_FILE):
        with open(FAMILY_DOCTOR_FILE, "r") as f:
            doctors = json.load(f)
            for doc in doctors:
                if doc["user_id"] == user_id:
                    family_doctor = doc
                    break

    symptom_list = ", ".join(symptoms[:5]) if symptoms else "the symptoms you described"

    responses = {
        1: {  # Mild
            "type": "mild",
            "text": f"Thank you for sharing your symptoms with me. Let me analyze what you've told me.\n\n"
            f"**My Assessment:**\n"
            f"Based on your description of {symptom_list}, I'm identifying this as a mild condition. These symptoms, while uncomfortable, typically don't require immediate medical intervention.\n\n"
            f"**My Recommendations:**\n"
            f"Here's what I suggest you do:\n\n"
            f"1. **Rest:** Your body needs energy to recover. Get adequate sleep.\n"
            f"2. **Hydration:** Drink plenty of water to help your body function optimally.\n"
            f"3. **Monitor:** Keep track of any changes in your symptoms.\n"
            f"4. **Over-the-counter relief:** If appropriate, consider mild remedies for comfort.\n\n"
            + (
                f"**Good News:** I see you have Dr. {family_doctor['name']} ({family_doctor.get('specialization', 'General Physician')}) saved as your family doctor. For mild symptoms like these, they're the perfect first point of contact if you need professional guidance. You can reach them at {family_doctor.get('contact', 'your saved number')}.\n\n"
                if family_doctor
                else "**Suggestion:** Consider establishing a relationship with a family doctor. They can provide personalized care for situations like this. You can add one in the 'Manage Your Healthcare Team' section.\n\n"
            )
            + f"**When to Seek Help:**\n"
            f"While this seems mild now, consult a doctor if:\n"
            f"• Symptoms persist beyond 3-5 days\n"
            f"• Symptoms worsen significantly\n"
            f"• New concerning symptoms develop\n\n"
            f"Is there anything specific about your symptoms you'd like me to clarify?",
            "actions": ["Rest", "Hydrate", "Monitor", "Consult if persists"],
            "thinking_process": f"Analyzing input → Extracted symptoms: {symptom_list} → Severity classification: Mild → Checking for family doctor → Generating personalized recommendations",
            "reasoning": f"I classified this as mild because the symptoms ({symptom_list}) typically present as minor health concerns that can be managed with self-care. The absence of severe indicators like high fever, severe pain, or breathing difficulties supports this assessment.",
            "follow_up": [
                "How long have you had these symptoms?",
                "Have you tried any remedies yet?",
                "Are the symptoms getting better or worse?",
            ],
        },
        2: {  # Moderate
            "type": "moderate",
            "text": f"I've carefully analyzed your symptoms, and I want to give you a thorough assessment.\n\n"
            f"**My Analysis:**\n"
            f"You've mentioned {symptom_list}. Based on the combination and nature of these symptoms, I'm classifying this as a **moderate** health concern. This means it's more than just something minor, but it's not an emergency either.\n\n"
            f"**Why This Matters:**\n"
            f"Moderate symptoms suggest your body is dealing with something that may need professional medical attention. While taking immediate action isn't critical, you shouldn't ignore these signs.\n\n"
            f"**My Detailed Recommendations:**\n\n"
            f"**1. Medical Consultation (Priority)**\n"
            f"   • Schedule a doctor's appointment within 24-48 hours\n"
            f"   • Explain all your symptoms clearly\n"
            f"   • Mention how long you've had them\n\n"
            f"**2. Self-Care in the Meantime**\n"
            f"   • Avoid self-medication without professional advice\n"
            f"   • If symptoms suggest something infectious, consider isolating\n"
            f"   • Keep monitoring for any worsening\n"
            f"   • Maintain a symptom diary with times and severity\n\n"
            f"**3. Specialist Consideration**\n"
            f"   Based on your symptoms, you might benefit from seeing a {', '.join(get_doctors_by_symptoms(symptoms)[:2])}.\n\n"
            f"**Red Flags to Watch:**\n"
            f"If you experience any of these, seek immediate care:\n"
            f"• Difficulty breathing\n"
            f"• Severe pain that won't subside\n"
            f"• High fever (above 103°F/39.4°C)\n"
            f"• Symptoms that rapidly worsen\n\n"
            f"Would you like me to help you find a specialist in your area?",
            "doctors": get_doctors_by_symptoms(symptoms),
            "redirect_to": "find-doctors",
            "thinking_process": f"Deep analysis → Symptoms: {symptom_list} → Pattern matching with medical knowledge base → Severity: Moderate → Identifying appropriate specialists → Formulating care plan",
            "reasoning": f"The moderate classification is based on the persistence and combination of symptoms. Your symptoms ({symptom_list}) indicate a condition that, while not immediately dangerous, requires professional evaluation to prevent potential complications and ensure proper treatment.",
            "follow_up": [
                "Do you have any pre-existing medical conditions?",
                "Have you had anything similar before?",
                "Would you like help finding a doctor nearby?",
            ],
        },
        3: {  # Serious
            "type": "serious",
            "text": f"After carefully reviewing your symptoms, I need to express some concern and provide you with important guidance.\n\n"
            f"⚠️ **IMPORTANT: Serious Medical Situation**\n\n"
            f"**What I'm Seeing:**\n"
            f"Your reported symptoms - {symptom_list} - are concerning and suggest a potentially serious medical condition that requires prompt professional evaluation.\n\n"
            f"**Why This Is Serious:**\n"
            f"These symptoms can indicate conditions that, if left untreated, could lead to complications. I'm not trying to alarm you, but I want to ensure you get the appropriate care quickly.\n\n"
            f"**Immediate Action Plan:**\n\n"
            f"**1. Contact a Healthcare Provider TODAY**\n"
            f"   • Don't wait more than 24 hours\n"
            f"   • Call your doctor or go to an urgent care facility\n"
            f"   • If unsure, call a medical hotline for guidance\n\n"
            f"**2. What to Tell Them**\n"
            f"   • All symptoms you're experiencing\n"
            f"   • When they started and how they've progressed\n"
            f"   • Any medications or treatments you've tried\n"
            f"   • Your medical history\n\n"
            f"**3. Specialist Recommendation**\n"
            f"   Given your symptoms, you may need to see a specialist such as:\n"
            f"   • {', '.join(get_specialists(symptoms))}\n\n"
            f"**4. Monitoring**\n"
            f"   Until you see a doctor:\n"
            f"   • Keep detailed notes of symptom changes\n"
            f"   • Don't ignore worsening symptoms\n"
            f"   • Prepare to seek emergency care if needed\n\n"
            f"**When to Go to Emergency Room:**\n"
            f"If you experience:\n"
            f"• Severe, unbearable pain\n"
            f"• Difficulty breathing or chest pain\n"
            f"• Loss of consciousness\n"
            f"• Severe bleeding or injuries\n"
            f"• Sudden confusion or inability to speak\n\n"
            f"Please take this seriously and seek medical help soon. Your health is important.",
            "doctors": get_specialists(symptoms),
            "actions": [
                "Consult specialist within 24h",
                "Monitor closely",
                "Prepare for hospital visit",
            ],
            "thinking_process": f"Comprehensive analysis → Critical symptom evaluation: {symptom_list} → Cross-referencing with serious condition indicators → Risk assessment: High → Urgent care protocol activated",
            "reasoning": f"I classified this as serious due to the nature and severity of the symptoms you described ({symptom_list}). These symptoms are associated with conditions that can have significant health implications. My priority is ensuring you receive proper medical attention to diagnose and treat the underlying cause.",
            "follow_up": [
                "How severe is the pain on a scale of 1-10?",
                "Can you get to a doctor today?",
                "Do you have someone who can take you to urgent care?",
            ],
        },
    }

    return responses.get(severity, responses[1])


# ==================== NEW ENDPOINTS FOR NEXT.JS FRONTEND ====================


# Authentication Endpoints
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    """Send OTP to phone number"""
    data = request.json
    phone = data.get("phone")

    # Generate OTP (6 digits)
    import random

    otp = str(random.randint(100000, 999999))

    # In production, send via SMS provider (Twilio, MSG91)
    # For now, just return success and log OTP
    print(f"📱 OTP for {phone}: {otp}")

    return jsonify(
        {
            "success": True,
            "message": f"OTP sent to {phone}",
            "otp": otp,  # Remove in production!
        }
    )


@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    """Verify OTP and login"""
    data = request.json
    phone = data.get("phone")
    otp = data.get("otp")

    # In production, verify against stored OTP
    # For now, accept any 6-digit OTP
    if len(otp) == 6:
        import uuid

        user_id = str(uuid.uuid4())

        return jsonify(
            {
                "success": True,
                "token": f"jwt_token_{user_id}",
                "user": {
                    "id": user_id,
                    "phone": phone,
                    "name": "User",
                    "email": f"{phone}@medicsense.ai",
                },
            }
        )

    return jsonify({"success": False, "message": "Invalid OTP"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Logout user"""
    return jsonify({"success": True, "message": "Logged out successfully"})


# Chat Endpoints
@app.route("/api/chat/message", methods=["POST"])
def chat_message():
    """Send message to AI chat"""
    data = request.json
    message = data.get("message", "")
    user_id = data.get("userId", "")

    # Use existing chat endpoint logic
    response = gemini_service.get_response(message)

    return jsonify(
        {"success": True, "response": response, "severity": "low", "context": "general"}
    )


@app.route("/api/chat/history/<user_id>", methods=["GET"])
def chat_history(user_id):
    """Get chat history for user"""
    # In production, fetch from database
    return jsonify({"success": True, "history": []})


# Image Analysis Endpoint
@app.route("/api/image/analyze", methods=["POST"])
def analyze_image():
    """Analyze medical image"""
    if "image" not in request.files:
        return jsonify({"success": False, "message": "No image provided"}), 400

    file = request.files["image"]

    # Use existing camera analyzer
    result = camera_analyzer.analyze_image(file)

    return jsonify(
        {
            "success": True,
            "analysis": result.get("analysis", "Image analyzed successfully"),
            "severity": result.get("severity", "medium"),
            "recommendations": result.get("recommendations", []),
            "requiresImmediate": result.get("emergency", False),
        }
    )


# Health Vitals Endpoints
@app.route("/api/health/vitals", methods=["POST"])
def record_vitals():
    """Record health vitals"""
    data = request.json
    # In production, save to database
    return jsonify(
        {"success": True, "message": "Vitals recorded successfully", "data": data}
    )


@app.route("/api/health/vitals/<user_id>", methods=["GET"])
def get_vitals(user_id):
    """Get health vitals history"""
    # In production, fetch from database
    # Return mock data for now
    import datetime

    return jsonify(
        {
            "success": True,
            "data": [
                {
                    "id": "1",
                    "userId": user_id,
                    "temperature": 98.6,
                    "heartRate": 72,
                    "bloodPressure": "120/80",
                    "oxygenLevel": 98,
                    "weight": 70,
                    "timestamp": datetime.datetime.now().isoformat(),
                }
            ],
        }
    )


@app.route("/api/health/symptoms", methods=["POST"])
def record_symptoms():
    """Record symptoms"""
    data = request.json
    symptoms = data.get("symptoms", [])

    # Analyze symptoms
    analysis = analyzer.analyze(symptoms)

    return jsonify(
        {
            "success": True,
            "analysis": analysis,
            "recommendations": ["Consult a doctor", "Rest well", "Monitor symptoms"],
        }
    )


# Appointments Endpoints
@app.route("/api/appointments/book", methods=["POST"])
def book_appointment():
    """Book an appointment"""
    data = request.json
    # In production, save to database
    return jsonify(
        {
            "success": True,
            "message": "Appointment booked successfully",
            "appointmentId": "APT123456",
            "data": data,
        }
    )


@app.route("/api/appointments/<user_id>", methods=["GET"])
def get_appointments(user_id):
    """Get user appointments"""
    # Return mock appointments
    import datetime

    return jsonify(
        {
            "success": True,
            "data": [
                {
                    "id": "1",
                    "userId": user_id,
                    "doctorId": "Dr. Smith",
                    "date": (
                        datetime.datetime.now() + datetime.timedelta(days=3)
                    ).isoformat(),
                    "time": "10:00 AM",
                    "type": "video",
                    "status": "confirmed",
                    "reason": "Regular checkup",
                }
            ],
        }
    )


@app.route("/api/appointments/<appointment_id>/cancel", methods=["PUT"])
def cancel_appointment(appointment_id):
    """Cancel an appointment"""
    return jsonify({"success": True, "message": "Appointment cancelled successfully"})


@app.route("/api/appointments/<appointment_id>/reschedule", methods=["PUT"])
def reschedule_appointment(appointment_id):
    """Reschedule an appointment"""
    data = request.json
    return jsonify(
        {
            "success": True,
            "message": "Appointment rescheduled successfully",
            "data": data,
        }
    )


# Doctors Endpoints
@app.route("/api/doctors", methods=["GET"])
def get_all_doctors():
    """Get all doctors"""
    return jsonify({"success": True, "data": DOCTORS_DB.get("doctors", [])})


@app.route("/api/doctors/<doctor_id>/availability", methods=["GET"])
def get_doctor_availability(doctor_id):
    """Get doctor availability"""
    date = request.args.get("date")
    return jsonify(
        {
            "success": True,
            "data": {
                "availableDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                ],
                "availableSlots": [
                    "09:00 AM",
                    "10:00 AM",
                    "11:00 AM",
                    "02:00 PM",
                    "03:00 PM",
                    "04:00 PM",
                ],
            },
        }
    )


# Notifications Endpoint
@app.route("/api/notifications/<user_id>", methods=["GET"])
def get_notifications(user_id):
    """Get user notifications"""
    import datetime

    return jsonify(
        {
            "success": True,
            "data": [
                {
                    "id": "1",
                    "userId": user_id,
                    "title": "Appointment Reminder",
                    "message": "Your appointment with Dr. Smith is tomorrow at 10:00 AM",
                    "type": "appointment",
                    "read": False,
                    "timestamp": datetime.datetime.now().isoformat(),
                },
                {
                    "id": "2",
                    "userId": user_id,
                    "title": "Medication Reminder",
                    "message": "Time to take your morning medication",
                    "type": "medication",
                    "read": False,
                    "timestamp": (
                        datetime.datetime.now() - datetime.timedelta(hours=2)
                    ).isoformat(),
                },
                {
                    "id": "3",
                    "userId": user_id,
                    "title": "Health Tip",
                    "message": "Stay hydrated! Drink at least 8 glasses of water today.",
                    "type": "health_tip",
                    "read": True,
                    "timestamp": (
                        datetime.datetime.now() - datetime.timedelta(days=1)
                    ).isoformat(),
                },
            ],
        }
    )


@app.route("/api/notifications/<notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    """Mark notification as read"""
    return jsonify({"success": True, "message": "Notification marked as read"})


# Reports Endpoint
@app.route("/api/reports/<user_id>", methods=["GET"])
def get_reports(user_id):
    """Get user medical reports"""
    import datetime

    return jsonify(
        {
            "success": True,
            "data": [
                {
                    "id": "1",
                    "userId": user_id,
                    "title": "Blood Test Report",
                    "date": (
                        datetime.datetime.now() - datetime.timedelta(days=7)
                    ).isoformat(),
                    "type": "Lab Test",
                    "doctor": "Dr. Smith",
                    "fileUrl": "/reports/blood_test_123.pdf",
                    "summary": "All parameters within normal range",
                },
                {
                    "id": "2",
                    "userId": user_id,
                    "title": "X-Ray Report - Chest",
                    "date": (
                        datetime.datetime.now() - datetime.timedelta(days=15)
                    ).isoformat(),
                    "type": "Imaging",
                    "doctor": "Dr. Johnson",
                    "fileUrl": "/reports/xray_456.pdf",
                    "summary": "No abnormalities detected",
                },
                {
                    "id": "3",
                    "userId": user_id,
                    "title": "Annual Health Checkup",
                    "date": (
                        datetime.datetime.now() - datetime.timedelta(days=30)
                    ).isoformat(),
                    "type": "General",
                    "doctor": "Dr. Williams",
                    "fileUrl": "/reports/checkup_789.pdf",
                    "summary": "Overall health status: Good",
                },
            ],
        }
    )


@app.route("/api/reports/upload", methods=["POST"])
def upload_report():
    """Upload a medical report"""
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files["file"]
    data = request.form

    return jsonify(
        {
            "success": True,
            "message": "Report uploaded successfully",
            "reportId": "RPT123456",
        }
    )


# Search Endpoint
@app.route("/api/search", methods=["GET"])
def search():
    """Search for doctors, symptoms, medicines"""
    query = request.args.get("q", "").lower()
    search_type = request.args.get("type", "all")

    results = {"doctors": [], "symptoms": [], "medicines": [], "articles": []}

    # Search doctors
    if search_type in ["all", "doctors"]:
        doctors = DOCTORS_DB.get("doctors", [])
        results["doctors"] = [
            doc
            for doc in doctors
            if query in doc.get("name", "").lower()
            or query in doc.get("specialty", "").lower()
        ][:5]

    # Search symptoms
    if search_type in ["all", "symptoms"]:
        symptoms = MEDICAL_KB.get("symptoms", {})
        results["symptoms"] = [
            {"name": symptom, "info": info}
            for symptom, info in symptoms.items()
            if query in symptom.lower()
        ][:5]

    # Search medicines
    if search_type in ["all", "medicines"]:
        medicines = MEDICAL_KB.get("medicines", {})
        results["medicines"] = [
            {"name": med, "info": info}
            for med, info in medicines.items()
            if query in med.lower()
        ][:5]

    return jsonify({"success": True, "query": query, "results": results})


# ================================
# OTP AUTHENTICATION ENDPOINTS
# ================================


@app.route("/api/auth/otp/send", methods=["POST"])
def send_otp():
    """Send OTP to phone number"""
    try:
        data = request.json
        phone = data.get("phone", "").strip()

        if not phone:
            return (
                jsonify({"success": False, "message": "Phone number is required"}),
                400,
            )

        # Validate phone format
        if not phone.startswith("+") or len(phone) < 10:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid phone number format. Use +91XXXXXXXXXX",
                    }
                ),
                400,
            )

        # Generate and send OTP
        result = otp_service.generate_otp(phone)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 429  # Too Many Requests

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/auth/otp/verify", methods=["POST"])
def verify_otp():
    """Verify OTP"""
    try:
        data = request.json
        phone = data.get("phone", "").strip()
        otp = data.get("otp", "").strip()

        if not phone or not otp:
            return (
                jsonify({"success": False, "message": "Phone and OTP are required"}),
                400,
            )

        # Verify OTP
        result = otp_service.verify_otp(phone, otp)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/auth/otp/resend", methods=["POST"])
def resend_otp():
    """Resend OTP"""
    try:
        data = request.json
        phone = data.get("phone", "").strip()

        if not phone:
            return (
                jsonify({"success": False, "message": "Phone number is required"}),
                400,
            )

        # Resend OTP
        result = otp_service.resend_otp(phone)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 429

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    print("🚀 MedicSense AI Backend Starting...")
    print("📡 Server running at http://localhost:5000")
    print("💊 Medical chatbot ready to assist")
    print("🤖 AI-powered responses enabled")
    print("📸 Image analysis ready")
    print("🔔 Notifications endpoint enabled")
    print("📄 Reports endpoint enabled")
    print("🔍 Search endpoint enabled")
    print("📱 OTP authentication enabled")
    print(
        "\n💡 Tip: Get a free Gemini API key from https://makersuite.google.com/app/apikey"
    )
    print("   Add it to backend/.env file to enable advanced AI features\n")
    app.run(debug=False, port=5000, use_reloader=False)
