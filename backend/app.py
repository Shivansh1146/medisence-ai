"""
MedicSense AI Backend - Flask Server
Handles all chatbot requests and medical logic
"""

import datetime
import json
import os

from auth_manager import auth_manager
from auth_routes import register_auth_routes
from camera_analyzer import camera_analyzer
from database import db
from emergency_detector import EmergencyDetector
from emergency_service import emergency_service
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from gemini_service import gemini_service

# Notifications
from notifications_service import NotificationsService
from otp_service import otp_service
from severity_classifier import SeverityClassifier
from symptom_analyzer import SymptomAnalyzer

app = Flask(__name__)

# Enable CORS with proper configuration for authentication
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)


# Request logging for debugging
@app.before_request
def log_all_requests():
    print(f"➡️ {request.method} {request.path}")


# Register authentication routes
register_auth_routes(app, db, auth_manager, otp_service)

# Notifications service (JSON-backed)
notifications_service = NotificationsService(data_dir="data")

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
    return send_from_directory("../frontend", "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint with LLM-style responses"""
    try:
        data = request.json
        raw_message = data.get("message", "").strip()
        user_id = data.get("user_id", "anonymous")

        # 1. Input Validation & Sanitization
        if not raw_message or len(raw_message) < 5:
             # Safe fallback for empty/short input
             return jsonify({
                 "response": "Please describe your symptoms in more detail so I can help you.",
                 "severity": 1,
                 "type": "general",
                 "follow_up": ["Can you describe what you're feeling?"]
             })

        # Extract explicitly set severity from message if present (e.g., "Severity: 5/10")
        import re
        severity_match = re.search(r"Severity:\s*(\d+)/10", raw_message)
        user_severity_input = int(severity_match.group(1)) if severity_match else None

        # Clamp severity 1-10
        if user_severity_input:
            user_severity_input = max(1, min(10, user_severity_input))

        # 3. Medical Safety Guardrails (High-Risk Detection - MASTER LIST)
        high_risk_keywords = [
            # 1. Cardiac / Heart
            "chest pain", "chest tightness", "pressure in chest", "crushing chest",
            "burning chest", "pain in left arm", "pain in jaw", "pain in neck",
            "heart pain", "heart attack", "cardiac arrest", "palpitations with dizziness",
            "irregular heartbeat with pain", "sudden chest discomfort",
            "shortness of breath with chest pain",

            # 2. Stroke / Neuro
            "sudden weakness", "weakness on one side", "face drooping", "slurred speech",
            "trouble speaking", "trouble understanding", "sudden confusion",
            "sudden vision loss", "blurred vision suddenly", "loss of balance",
            "sudden dizziness", "severe headache sudden", "worst headache",
            "numbness on one side", "loss of coordination",

            # 3. Respiratory
            "difficulty breathing", "cannot breathe", "shortness of breath",
            "breathlessness", "gasping", "wheezing severe", "choking",
            "airway blocked", "tight throat", "bluish lips", "bluish face",
            "rapid breathing", "chest retractions",

            # 4. Trauma / Pain
            "unbearable pain", "extreme pain", "severe pain sudden",
            "intense abdominal pain", "sharp abdominal pain", "severe back pain sudden",
            "head injury", "loss of consciousness", "fainted", "collapsed",
            "severe injury", "major accident", "fracture", "bone sticking out",

            # 5. Bleeding
            "heavy bleeding", "bleeding won't stop", "vomiting blood",
            "coughing blood", "blood in stool black", "blood in urine",
            "internal bleeding", "pale skin", "cold clammy", "shock symptoms",

            # 6. Allergy
            "swelling of face", "swelling of lips", "swelling of tongue",
            "throat swelling", "difficulty swallowing", "severe allergic",
            "anaphylaxis", "hives with breathing",

            # 7. Fever / Infection
            "very high fever", "fever above 104", "fever with rash",
            "fever with confusion", "stiff neck", "fever and seizure", "febrile seizure",

            # 8. Poisoning / Overdose
            "poisoning", "overdose", "took too much", "swallowed poison",
            "chemical ingestion", "alcohol poisoning", "substance ingestion",

            # 9. Mental Health
            "suicidal", "want to die", "harm myself", "kill myself",
            "self harm", "cutting myself", "overdose intentionally", "hearing voices",

            # 10. Pregnancy / Child
            "pregnant bleeding", "abdominal pain pregnancy", "baby not moving",
            "child unconscious", "child not breathing", "newborn fever", "seizure in child"
        ]
        is_high_risk = any(k in raw_message.lower() for k in high_risk_keywords)

        # 7. Logging (Privacy-Safe)
        import datetime
        print(f"[{datetime.datetime.now().isoformat()}] REQ | SeverityInput: {user_severity_input} | RiskDetect: {is_high_risk}")

        # Emergency Override
        if is_high_risk:
            # Force severity to 4 (Emergency)
            mapped_severity = 4
            ai_response = gemini_service.chat_medical(raw_message, ["Critical Symptoms"], mapped_severity, system_override="🚨 EMERGENCY PROTOCOL ACTIVE.")
            return jsonify({
                "response": ai_response,
                "severity": 4,
                "type": "emergency",
                "thinking_process": "Critical keywords detected. Activating safety protocol.",
                "reasoning": "High-risk symptoms detected requiring immediate medical attention."
            })

        # 2. Severity Interpretation Logic (Mapping 1-10 -> 1-4 for Internal Context)
        # 1-3 -> Mild (1)
        # 4-6 -> Moderate (2)
        # 7-10 -> Severe (3)
        if user_severity_input:
            if user_severity_input <= 3:
                mapped_severity = 1
            elif user_severity_input <= 6:
                mapped_severity = 2
            else:
                mapped_severity = 3
        else:
            # Fallback to classifier if no explicit input
            symptoms = analyzer.extract_symptoms(raw_message)
            mapped_severity = classifier.classify(raw_message, symptoms)

        # Simulate thinking time
        import random
        import time
        time.sleep(random.uniform(0.5, 1.0))

        # Check non-medical
        if is_non_medical(raw_message):
             return jsonify({
                 "response": "I am a medical AI assistant. Please describe your health symptoms.",
                 "severity": 0,
                 "type": "general"
             })

        # Analyze symptoms
        symptoms = analyzer.extract_symptoms(raw_message)

        # Generate AI response
        ai_response = gemini_service.chat_medical(raw_message, symptoms, mapped_severity)

        # Generate metadata (doctors, type, etc.) using existing logic
        response_metadata = generate_medical_response_llm(
            raw_message, symptoms, mapped_severity, user_id
        )

        return jsonify(
            {
                "response": ai_response,
                "severity": mapped_severity,
                "type": response_metadata["type"],
                "suggested_doctors": response_metadata.get("doctors", []),
                "actions": response_metadata.get("actions", []),
                "redirect_to": response_metadata.get("redirect_to"),
                "thinking_process": response_metadata.get("thinking_process", ""),
                "reasoning": response_metadata.get("reasoning", ""),
                "follow_up": response_metadata.get("follow_up", []),
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


# ==================== DEPRECATED AUTH ENDPOINTS ====================
# Email/password authentication has been REMOVED
# Only Google OAuth is supported now
# All auth routes are now handled by auth_routes.py via register_auth_routes()


# Chat Endpoints
@app.route("/api/chat/message", methods=["POST"])
def chat_message():
    """Send message to AI chat"""
    data = request.json
    message = data.get("message", "")
    user_id = data.get("userId", "anonymous")

    # Use existing chat endpoint logic (same as /api/chat)
    try:
        # Analyze symptoms
        symptoms = analyzer.extract_symptoms(message)
        severity = classifier.classify(message, symptoms)

        # Generate AI-powered response using Gemini for disease recognition
        ai_response = gemini_service.chat_medical(message, symptoms, severity)

        return jsonify(
            {
                "success": True,
                "response": ai_response,
                "severity": severity,
                "context": "medical",
                "symptoms": symptoms,
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "response": "I encountered an error. Please try again.",
                    "severity": 0,
                    "context": "error",
                }
            ),
            500,
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
APPOINTMENTS_FILE = "appointments.json"


@app.route("/api/appointments/slots", methods=["GET"])
def get_appointment_slots():
    """Get available appointment slots for a doctor on a specific date"""
    try:
        doctor_id = request.args.get("doctor")
        date = request.args.get("date")

        if not doctor_id or not date:
            return (
                jsonify(
                    {"success": False, "message": "Doctor and date parameters required"}
                ),
                400,
            )

        # Define all possible time slots (business hours)
        all_slots = [
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
        ]

        # Load existing appointments to find booked slots
        booked_slots = []
        if os.path.exists(APPOINTMENTS_FILE):
            try:
                with open(APPOINTMENTS_FILE, "r") as f:
                    appointments = json.load(f)
                    # Find all booked slots for this doctor on this date
                    booked_slots = [
                        apt.get("time")
                        for apt in appointments
                        if apt.get("doctorId") == doctor_id and apt.get("date") == date
                    ]
            except Exception as e:
                print(f"[WARNING] Error reading appointments: {e}")
                # Continue with empty booked_slots

        # Filter out booked slots to get available ones
        available_slots = [slot for slot in all_slots if slot not in booked_slots]

        return jsonify(
            {
                "success": True,
                "slots": available_slots,
                "total_available": len(available_slots),
                "total_booked": len(booked_slots),
            }
        )

    except Exception as e:
        print(f"❌ Error fetching appointment slots: {e}")
        # FALLBACK: Return all slots if error occurs
        return jsonify(
            {
                "success": True,
                "slots": [
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
                ],
                "message": "Showing default availability (real-time data unavailable)",
            }
        )


@app.route("/api/appointments/book", methods=["POST"])
def book_appointment():
    """Book an appointment and save to database"""
    try:
        data = request.json
        user_id = data.get("userId", "anonymous")

        print(f"📋 Booking appointment for user: {user_id}")
        print(f"📋 Appointment data: {data}")

        # Generate appointment ID
        import uuid

        appointment_id = f"APT{uuid.uuid4().hex[:8].upper()}"

        # Create appointment object
        appointment = {
            "id": appointment_id,
            "userId": user_id,
            "name": data.get("name", ""),
            "phone": data.get("phone", ""),
            "email": data.get("email", ""),
            "doctorId": data.get("doctorId", ""),
            "date": data.get("date", ""),
            "time": data.get("time", ""),
            "reason": data.get("reason", ""),
            "type": data.get("type", "in-person"),
            "status": "confirmed",
            "created_at": datetime.datetime.now().isoformat(),
        }

        # Load existing appointments
        appointments = []
        if os.path.exists(APPOINTMENTS_FILE):
            try:
                with open(APPOINTMENTS_FILE, "r") as f:
                    appointments = json.load(f)
            except:
                appointments = []

        # Add new appointment
        appointments.append(appointment)

        # Save to file
        with open(APPOINTMENTS_FILE, "w") as f:
            json.dump(appointments, f, indent=2)

        # Create appointment confirmation notification
        try:
            doctor_name = "your doctor"
            if appointment.get("doctorId"):
                for doc in DOCTORS_DB.get("doctors", []):
                    if doc.get("id") == appointment["doctorId"]:
                        doctor_name = doc.get("name", "your doctor")
                        break

            notifications_service.create_appointment_notification(
                user_id=user_id,
                appointment_id=appointment_id,
                title="Appointment Confirmed",
                message=f"Your appointment with {doctor_name} on {appointment['date']} at {appointment['time']} has been confirmed.",
                metadata={
                    "appointment_id": appointment_id,
                    "doctor_id": appointment.get("doctorId"),
                    "date": appointment.get("date"),
                    "time": appointment.get("time"),
                    "deep_link": "#appointments",
                },
            )
            print(f"✅ Notification created for appointment {appointment_id}")
        except Exception as e:
            print(f"⚠️  Notification creation failed: {e}")
            # Don't fail appointment booking if notification fails

        # Send WhatsApp notification if appointment is for Dr. Aakash
        if appointment.get("doctorId") == "dr_aakash":
            try:
                send_whatsapp_notification(appointment)
            except Exception as e:
                print(f"⚠️  WhatsApp notification failed: {e}")
                # Don't fail the appointment booking if WhatsApp fails

        return jsonify(
            {
                "success": True,
                "message": "Appointment booked successfully",
                "appointmentId": appointment_id,
                "appointment": appointment,
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Error booking appointment: {str(e)}",
                }
            ),
            500,
        )


@app.route("/api/appointments/<user_id>", methods=["GET"])
def get_appointments(user_id):
    """Get user appointments from database"""
    try:
        appointments = []
        if os.path.exists(APPOINTMENTS_FILE):
            try:
                with open(APPOINTMENTS_FILE, "r") as f:
                    all_appointments = json.load(f)
                    # Filter by user_id
                    appointments = [
                        apt for apt in all_appointments if apt.get("userId") == user_id
                    ]
            except:
                appointments = []

        return jsonify(
            {
                "success": True,
                "data": appointments,
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Error fetching appointments: {str(e)}",
                    "data": [],
                }
            ),
            500,
        )


@app.route("/api/appointments/<appointment_id>/cancel", methods=["PUT"])
def cancel_appointment(appointment_id):
    """Cancel an appointment"""
    try:
        data = request.json or {}
        user_id = data.get("userId", "anonymous")

        # Load appointments
        appointments = []
        if os.path.exists(APPOINTMENTS_FILE):
            try:
                with open(APPOINTMENTS_FILE, "r") as f:
                    appointments = json.load(f)
            except:
                appointments = []

        # Find and update appointment
        appointment_found = False
        for apt in appointments:
            if apt.get("id") == appointment_id and apt.get("userId") == user_id:
                apt["status"] = "cancelled"
                appointment_found = True

                # Create cancellation notification
                try:
                    notifications_service.create_notification(
                        user_id=user_id,
                        notification_type="appointment",
                        title="Appointment Cancelled",
                        message=f"Your appointment on {apt.get('date')} at {apt.get('time')} has been cancelled.",
                        metadata={
                            "appointment_id": appointment_id,
                            "deep_link": "#appointments",
                        },
                        dedupe_key=f"apt:{appointment_id}:cancelled",
                    )
                    print(f"✅ Cancellation notification created for {appointment_id}")
                except Exception as e:
                    print(f"⚠️  Cancellation notification failed: {e}")

                break

        if appointment_found:
            # Save updated appointments
            with open(APPOINTMENTS_FILE, "w") as f:
                json.dump(appointments, f, indent=2)

        return jsonify(
            {"success": True, "message": "Appointment cancelled successfully"}
        )
    except Exception as e:
        print(f"❌ Error cancelling appointment: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/appointments/<appointment_id>/reschedule", methods=["PUT"])
def reschedule_appointment(appointment_id):
    """Reschedule an appointment"""
    try:
        data = request.json or {}
        user_id = data.get("userId", "anonymous")
        new_date = data.get("date")
        new_time = data.get("time")

        # Load appointments
        appointments = []
        if os.path.exists(APPOINTMENTS_FILE):
            try:
                with open(APPOINTMENTS_FILE, "r") as f:
                    appointments = json.load(f)
            except:
                appointments = []

        # Find and update appointment
        appointment_found = False
        for apt in appointments:
            if apt.get("id") == appointment_id and apt.get("userId") == user_id:
                old_date = apt.get("date")
                old_time = apt.get("time")

                if new_date:
                    apt["date"] = new_date
                if new_time:
                    apt["time"] = new_time

                apt["status"] = "rescheduled"
                appointment_found = True

                # Create reschedule notification
                try:
                    notifications_service.create_notification(
                        user_id=user_id,
                        notification_type="appointment",
                        title="Appointment Rescheduled",
                        message=f"Your appointment has been rescheduled from {old_date} at {old_time} to {apt['date']} at {apt['time']}.",
                        metadata={
                            "appointment_id": appointment_id,
                            "old_date": old_date,
                            "old_time": old_time,
                            "new_date": apt.get("date"),
                            "new_time": apt.get("time"),
                            "deep_link": "#appointments",
                        },
                        dedupe_key=f"apt:{appointment_id}:rescheduled:{apt['date']}",
                    )
                    print(f"✅ Reschedule notification created for {appointment_id}")
                except Exception as e:
                    print(f"⚠️  Reschedule notification failed: {e}")

                break

        if appointment_found:
            # Save updated appointments
            with open(APPOINTMENTS_FILE, "w") as f:
                json.dump(appointments, f, indent=2)

            return jsonify(
                {
                    "success": True,
                    "message": "Appointment rescheduled successfully",
                    "data": data,
                }
            )
        else:
            return jsonify({"success": False, "message": "Appointment not found"}), 404

    except Exception as e:
        print(f"❌ Error rescheduling appointment: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


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
    """Get user notifications (production JSON-backed)."""
    try:
        # Basic user scoping. Frontend can pass 'anonymous' if not logged in.
        filter_key = request.args.get("filter", "all")
        limit = int(request.args.get("limit", "50"))
        cursor = request.args.get("cursor")
        cursor_int = int(cursor) if cursor is not None else None

        # Refresh opportunistically to keep page accurate without frontend changes
        notifications_service.refresh(user_id=user_id)

        items, next_cursor = notifications_service.fetch(
            user_id=user_id,
            filter_key=filter_key,
            limit=limit,
            cursor=cursor_int,
        )

        return jsonify(
            {
                "success": True,
                "data": items,
                "pagination": {"next_cursor": next_cursor, "limit": limit},
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "data": []}), 500


@app.route("/api/notifications", methods=["GET"])
def get_notifications_v2():
    """Fetch Notifications (contract-compliant).

    Query params:
      - user_id: required (until real auth middleware exists)
      - filter: all | unread | appointments | medications | health_tips
      - limit: int
      - cursor: int offset

    Sorted by created_at DESC.
    """
    try:
        user_id = request.args.get("user_id") or request.headers.get("X-User-Id")
        if not user_id:
            return (
                jsonify(
                    {
                        "success": True,
                        "data": [],
                        "summary": {
                            "total": 0,
                            "unread": 0,
                            "appointments": 0,
                            "medications": 0,
                        },
                        "pagination": {"next_cursor": None, "limit": 0},
                    }
                ),
                200,
            )

        filter_key = request.args.get("filter", "all")
        limit = int(request.args.get("limit", "50"))
        cursor = request.args.get("cursor")
        cursor_int = int(cursor) if cursor is not None else None

        # Idempotent generation
        notifications_service.refresh(user_id=str(user_id))

        items, next_cursor = notifications_service.fetch(
            user_id=str(user_id),
            filter_key=filter_key,
            limit=limit,
            cursor=cursor_int,
        )
        summary = notifications_service.summary(user_id=str(user_id))

        return jsonify(
            {
                "success": True,
                "data": items,
                "summary": summary,
                "pagination": {"next_cursor": next_cursor, "limit": limit},
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "data": [],
                    "summary": {
                        "total": 0,
                        "unread": 0,
                        "appointments": 0,
                        "medications": 0,
                    },
                }
            ),
            500,
        )


@app.route("/api/notifications/<notification_id>/read", methods=["PUT", "PATCH"])
def mark_notification_read(notification_id):
    """Mark a single notification as read (user-scoped)."""
    try:
        # Frontend currently calls PUT without auth; infer user_id from stored user if possible.
        user_id = request.args.get("user_id") or request.headers.get("X-User-Id")
        if not user_id:
            body = request.get_json(silent=True) or {}
            user_id = body.get("user_id") or body.get("userId")

        # Last resort: allow anonymous to mark only its own notifications
        if not user_id:
            user_id = "anonymous"

        ok = notifications_service.mark_one_read(
            user_id=user_id, notification_id=notification_id
        )
        if not ok:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/notifications/read-all", methods=["PATCH", "PUT"])
def mark_all_notifications_read():
    """Mark all notifications as read for current user."""
    try:
        user_id = request.args.get("user_id") or request.headers.get("X-User-Id")
        if not user_id:
            body = request.get_json(silent=True) or {}
            user_id = body.get("user_id")
        if not user_id:
            return jsonify({"success": False, "error": "Missing user_id"}), 401

        changed = notifications_service.mark_all_read(user_id=user_id)
        return jsonify({"success": True, "updated": changed})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/notifications/mark-all-read", methods=["POST", "PUT", "PATCH"])
def mark_all_notifications_read_compat():
    """Compatibility endpoint for existing frontend (no user_id passed)."""
    try:
        user_id = request.args.get("user_id") or request.headers.get("X-User-Id")
        if not user_id:
            body = request.get_json(silent=True) or {}
            user_id = body.get("user_id") or body.get("userId") or "anonymous"

        changed = notifications_service.mark_all_read(user_id=str(user_id))
        return jsonify({"success": True, "updated": changed})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/notifications/refresh", methods=["POST"])
def notifications_refresh():
    """Idempotent refresh: pulls notifications from appointments/medications/tips."""
    try:
        user_id = request.args.get("user_id") or request.headers.get("X-User-Id")
        if not user_id:
            body = request.get_json(silent=True) or {}
            user_id = body.get("user_id") or body.get("userId") or "anonymous"

        result = notifications_service.refresh(user_id=str(user_id))
        summary = notifications_service.summary(user_id=str(user_id))
        return jsonify(
            {"success": True, "created": result.get("created", 0), "summary": summary}
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/notifications/summary", methods=["GET"])
def notifications_summary():
    """Notification Summary (computed counters).

    Query params:
      - user_id: required for non-empty summary

    Returns empty state summary when user_id is missing.
    """
    try:
        user_id = request.args.get("user_id") or request.headers.get("X-User-Id")

        if not user_id:
            return jsonify(
                {
                    "success": True,
                    "summary": {
                        "total": 0,
                        "unread": 0,
                        "appointments": 0,
                        "medications": 0,
                    },
                }
            )

        # Refresh to include any newly generated events
        notifications_service.refresh(user_id=str(user_id))
        summary = notifications_service.summary(user_id=str(user_id))
        return jsonify({"success": True, "summary": summary})
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "summary": {
                        "total": 0,
                        "unread": 0,
                        "appointments": 0,
                        "medications": 0,
                    },
                }
            ),
            500,
        )


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

        # DEPRECATED - Email/password auth removed
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Authentication method no longer supported",
                    "message": "Please use Google Sign-In to continue",
                }
            ),
            410,
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/auth/otp/verify", methods=["POST"])
def verify_otp():
    """DEPRECATED: Email/password auth removed - use Google Sign-In only"""
    return (
        jsonify(
            {
                "success": False,
                "error": "Authentication method no longer supported",
                "message": "Please use Google Sign-In to continue",
            }
        ),
        410,
    )


@app.route("/api/auth/otp/resend", methods=["POST"])
def resend_otp():
    """DEPRECATED: Email/password auth removed - use Google Sign-In only"""
    return (
        jsonify(
            {
                "success": False,
                "error": "Authentication method no longer supported",
                "message": "Please use Google Sign-In to continue",
            }
        ),
        410,
    )


# ================================
# WHATSAPP NOTIFICATION ENDPOINTS
# ================================


def send_whatsapp_notification(appointment):
    """Send WhatsApp notification to doctor"""
    try:
        from dotenv import load_dotenv

        load_dotenv()

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER")

        # Check if Twilio is configured
        if not account_sid or not auth_token or not whatsapp_number:
            print("⚠️  Twilio not configured. Add credentials to .env file")
            return {"success": False, "message": "Twilio not configured"}

        try:
            from twilio.rest import Client
        except ImportError:
            print("⚠️  Twilio SDK not installed. Run: pip install twilio")
            return {"success": False, "message": "Twilio SDK not installed"}

        # Doctor WhatsApp number
        doctor_whatsapp = "+919770064169"  # Dr. Aakash Singh Rajput

        # Format message
        try:
            date_str = datetime.datetime.fromisoformat(appointment["date"]).strftime(
                "%B %d, %Y"
            )
        except:
            date_str = appointment["date"]

        message = f"""🏥 *New Appointment Booking*

👤 *Patient Details:*
Name: {appointment['name']}
Phone: {appointment['phone']}
Email: {appointment.get('email', 'Not provided')}

📅 *Appointment Details:*
Date: {date_str}
Time: {appointment['time']}
Type: {appointment.get('type', 'In-Person')}

📝 *Reason:*
{appointment.get('reason', 'Not specified')}

🆔 Appointment ID: {appointment['id']}

Please confirm this appointment."""

        # Send WhatsApp message
        client = Client(account_sid, auth_token)
        message_obj = client.messages.create(
            body=message, from_=whatsapp_number, to=f"whatsapp:{doctor_whatsapp}"
        )

        print(f"✅ WhatsApp notification sent to Dr. Aakash: {message_obj.sid}")
        return {"success": True, "message_sid": message_obj.sid}

    except Exception as e:
        print(f"❌ WhatsApp notification error: {e}")
        return {"success": False, "error": str(e)}


@app.route("/api/whatsapp/send", methods=["POST"])
def send_whatsapp():
    """Send WhatsApp message via Twilio"""
    try:
        data = request.json
        to_number = data.get("to", "").strip()
        message_text = data.get("message", "")
        doctor_name = data.get("doctor_name", "Doctor")

        if not to_number or not message_text:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Phone number and message are required",
                    }
                ),
                400,
            )

        from dotenv import load_dotenv

        load_dotenv()

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER")

        if not account_sid or not auth_token or not whatsapp_number:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Twilio not configured. Please add credentials to .env file",
                        "setup_required": True,
                    }
                ),
                500,
            )

        try:
            from twilio.rest import Client
        except ImportError:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Twilio SDK not installed. Run: pip install twilio",
                    }
                ),
                500,
            )

        # Format phone number (ensure it starts with whatsapp:)
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"

        # Send message
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_text, from_=whatsapp_number, to=to_number
        )

        return jsonify(
            {
                "success": True,
                "message": "WhatsApp notification sent successfully",
                "message_sid": message.sid,
                "to": to_number,
            }
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Error sending WhatsApp: {str(e)}",
                }
            ),
            500,
        )


# ============================================
# EMERGENCY ENDPOINTS - BACKEND ENFORCEMENT
# ============================================


@app.route("/api/emergency/escalate", methods=["POST"])
def emergency_escalate():
    """
    Log emergency escalation when user clicks Call 112
    This is the highest priority action - stop AI processing
    """
    try:
        data = request.json
        user_id = data.get("user_id", "anonymous")
        session_id = data.get("session_id", "")
        location = data.get("location", {})

        result = emergency_service.log_emergency_escalation(
            user_id=user_id,
            session_id=session_id,
            escalation_type="call_112",
            location=location,
        )

        return jsonify(result), 200

    except Exception as e:
        print(f"❌ Emergency escalation error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Emergency logging failed",
                    "message": "Call 112 immediately regardless of system status",
                }
            ),
            500,
        )


@app.route("/api/emergency/chat", methods=["POST"])
def emergency_chat():
    """
    Handle emergency chat with STRICT AI restrictions
    This endpoint enforces Emergency Context Mode
    """
    try:
        data = request.json
        session_id = data.get("session_id", "")
        user_message = data.get("message", "")

        # Activate strict emergency context
        emergency_context = emergency_service.activate_emergency_context(
            session_id=session_id, user_message=user_message
        )

        # Get strict emergency prompt to override normal AI
        strict_prompt = emergency_context["strict_prompt"]

        # Generate AI response with emergency restrictions
        # This MUST NOT diagnose, treat, or reassure
        emergency_response = gemini_service.chat_medical(
            user_message=user_message,
            symptoms=[],
            severity=4,
            system_override=strict_prompt,  # Force emergency mode
        )

        # Ensure response prioritizes 112
        if "🚨 CALL 112 IMMEDIATELY" not in emergency_response:
            emergency_response = (
                "🚨 CALL 112 IMMEDIATELY\n\n"
                "This is a potential emergency situation. "
                "Professional emergency services are the ONLY appropriate response.\n\n"
                + emergency_response
            )

        return (
            jsonify(
                {
                    "success": True,
                    "response": emergency_response,
                    "emergency_mode": True,
                    "restrictions": emergency_context["context"]["restrictions"],
                    "session_id": session_id,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"❌ Emergency chat error: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "response": (
                        "🚨 CALL 112 IMMEDIATELY\n\n"
                        "System error occurred. Emergency services must be contacted directly. "
                        "Do NOT rely on AI in emergency situations."
                    ),
                    "emergency_mode": True,
                }
            ),
            500,
        )


@app.route("/api/emergency/hospitals", methods=["POST"])
def emergency_hospitals():
    """
    Attempt real hospital lookup, safe fallback if unavailable
    NEVER fake hospital data
    """
    try:
        data = request.json
        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if not latitude or not longitude:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Location required for hospital search",
                        "action": "call_112",
                        "instructions": [
                            "Call 112 immediately for ambulance",
                            "They will direct you to nearest emergency room",
                        ],
                    }
                ),
                400,
            )

        # Attempt real hospital lookup (safe fallback implemented)
        hospital_data = emergency_service.get_emergency_hospitals(
            latitude=float(latitude), longitude=float(longitude)
        )

        return jsonify(hospital_data), 200

    except Exception as e:
        print(f"❌ Hospital lookup error: {e}")
        return (
            jsonify(
                {
                    "status": "fallback",
                    "message": "Hospital lookup unavailable. Use emergency services.",
                    "action": "call_112",
                    "emergency_numbers": {
                        "primary": "112",
                        "alternatives": ["108", "102"],
                    },
                    "instructions": [
                        "Call 112 immediately for ambulance",
                        "Emergency services will direct you to nearest hospital",
                        "Do NOT delay seeking professional help",
                    ],
                }
            ),
            200,
        )


# ============================================
# CATCH-ALL ROUTE - MUST BE LAST!
# ============================================
# This route serves frontend static files
# It MUST be at the bottom to avoid intercepting API routes
@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path):
    """Serve frontend static files - GET ONLY"""
    # API routes are handled above - this should never be reached for /api/*
    if path.startswith("api/"):
        from flask import abort

        abort(404)

    try:
        return send_from_directory("../frontend", path)
    except:
        # Fallback to index.html for SPA routing
        return send_from_directory("../frontend", "index.html")


# ============================================
# GOOGLE-ONLY AUTHENTICATION
# ============================================
# Email/password authentication has been removed
# Only Google OAuth is supported
# All email/password endpoints return 410 Gone


if __name__ == "__main__":
    print("🚀 MedicSense AI Backend Starting...")
    print("📡 Server running at http://localhost:5000")
    print("💊 Medical chatbot ready to assist")
    print("🤖 AI-powered responses enabled")
    print("📸 Image analysis ready")
    print("🔔 Notifications endpoint enabled")
    print("📄 Reports endpoint enabled")
    print("🔍 Search endpoint enabled")
    print("� Google OAuth authentication ONLY")
    print("⚠️  Email/password auth has been removed")
    print(
        "\n💡 Tip: Get a free Gemini API key from https://makersuite.google.com/app/apikey"
    )
    print("   Add it to backend/.env file to enable advanced AI features\n")
    app.run(debug=False, port=5000, use_reloader=False)
