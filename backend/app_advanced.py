"""
MedicSense AI - Advanced Optimized Backend
Production-ready with caching, logging, and advanced medical features
"""

import json
import logging
import os
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Optional

# Import advanced chatbot
from advanced_chatbot import AdvancedChatbot

# Import new advanced features
from advanced_features import (
    advanced_kb,
    appointment_manager,
    health_tracker,
    medication_reminder,
)

# Import existing modules
from camera_analyzer import camera_analyzer
from emergency_detector import EmergencyDetector
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from gemini_service import gemini_service
from severity_classifier import SeverityClassifier
from symptom_analyzer import SymptomAnalyzer
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("medicsense.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"],
        }
    },
)

# Initialize medical modules
analyzer = SymptomAnalyzer()
classifier = SeverityClassifier()
emergency = EmergencyDetector()
advanced_chatbot = AdvancedChatbot()


# Cache configuration
@lru_cache(maxsize=128)
def load_medical_kb():
    """Load medical knowledge base with caching"""
    try:
        with open("medical_kb.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("Medical KB not found, using defaults")
        return {}


@lru_cache(maxsize=128)
def load_doctors_db():
    """Load doctors database with caching"""
    try:
        with open("doctors_db.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("Doctors DB not found")
        return {"doctors": [], "hospitals": []}


MEDICAL_KB = load_medical_kb()
DOCTORS_DB = load_doctors_db()
FAMILY_DOCTOR_FILE = "family_doctor.json"


# ========== CORE ROUTES ==========


@app.route("/")
def home():
    """Serve frontend"""
    return send_from_directory("..", "index.html")


@app.route("/<path:path>")
def serve_frontend(path):
    """Serve static files"""
    if path.startswith("api/"):
        return None
    try:
        return send_from_directory("..", path)
    except Exception as e:
        logger.error(f"Error serving {path}: {e}")
        return jsonify({"error": "File not found"}), 404


# ========== ENHANCED CHAT API ==========


@app.route("/api/chat", methods=["POST"])
def chat():
    """Advanced chat with health tracking and AI"""
    try:
        data = request.json
        user_message = data.get("message", "").lower().strip()
        user_id = data.get("user_id", "anonymous")

        logger.info(f"Chat request from {user_id}: {user_message[:50]}")

        # Simulate AI thinking time
        import random
        import time

        time.sleep(random.uniform(0.3, 0.8))

        # Check for non-medical query
        if is_non_medical(user_message):
            return jsonify(
                {
                    "response": "I'm specifically designed for medical and health-related concerns. How can I help with your health today?",
                    "severity": 0,
                    "type": "general",
                }
            )

        # Check for emergency
        emergency_result = emergency.check_emergency(user_message)
        if emergency_result["is_emergency"]:
            logger.warning(f"EMERGENCY detected for user {user_id}")
            return jsonify(
                {
                    "response": emergency_result["response"],
                    "severity": 4,
                    "type": "emergency",
                    "first_aid": emergency_result.get("first_aid", []),
                    "hospitals": get_nearby_hospitals(data.get("city", "unknown")),
                }
            )

        # Analyze symptoms
        symptoms = analyzer.extract_symptoms(user_message)
        severity = classifier.classify(user_message, symptoms)

        # Log symptoms to health tracker
        health_tracker.add_symptom_log(user_id, symptoms, severity)

        # Get symptom patterns
        pattern = health_tracker.get_symptom_pattern(user_id)

        # Use advanced chatbot for response generation
        response = advanced_chatbot.generate_response(
            user_id=user_id,
            message=user_message,
            symptoms=symptoms,
            severity=severity,
            use_ai=True,  # Enable AI-powered responses
        )

        # Add pattern insights if recurring symptoms detected
        if pattern.get("pattern") == "recurring":
            response[
                "text"
            ] += f"\n\n📊 **Pattern Alert**: I've noticed recurring symptoms over the past week. {pattern.get('recommendation')}"

        return jsonify(
            {
                "response": response["text"],
                "severity": response["severity"],
                "type": response["type"],
                "context_aware": response.get("context_aware", False),
                "sentiment": response.get("sentiment", "neutral"),
                "pattern_analysis": pattern,
                "follow_up_questions": response.get("follow_up_questions", []),
                "quick_actions": response.get("quick_actions", []),
            }
        )

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        return (
            jsonify(
                {
                    "response": "I encountered an issue. Please try rephrasing your symptoms.",
                    "severity": 0,
                    "type": "error",
                }
            ),
            500,
        )


# ========== HEALTH TRACKING APIs ==========


@app.route("/api/health/vitals", methods=["POST"])
def add_vitals():
    """Record vital signs"""
    try:
        data = request.json
        user_id = data.get("user_id")
        vitals = {
            "temperature": data.get("temperature"),
            "blood_pressure": data.get("blood_pressure"),
            "heart_rate": data.get("heart_rate"),
            "oxygen_saturation": data.get("oxygen_saturation"),
            "weight": data.get("weight"),
        }

        health_tracker.add_vital_signs(user_id, vitals)
        logger.info(f"Vitals recorded for {user_id}")

        return jsonify({"success": True, "message": "Vitals recorded"})
    except Exception as e:
        logger.error(f"Error recording vitals: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/health/history/<user_id>", methods=["GET"])
def get_health_history(user_id):
    """Get user's health history"""
    try:
        pattern = health_tracker.get_symptom_pattern(user_id, days=30)
        return jsonify({"success": True, "pattern": pattern})
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ========== APPOINTMENT APIs ==========


@app.route("/api/appointments/schedule", methods=["POST"])
def schedule_appointment():
    """Schedule a doctor appointment"""
    try:
        data = request.json
        user_id = data.get("user_id")

        result = appointment_manager.schedule_appointment(
            user_id,
            {
                "doctor": data.get("doctor"),
                "specialization": data.get("specialization"),
                "date": data.get("date"),
                "time": data.get("time"),
                "reason": data.get("reason"),
            },
        )

        logger.info(f"Appointment scheduled for {user_id}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Appointment error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/appointments/<user_id>", methods=["GET"])
def get_appointments(user_id):
    """Get user's appointments"""
    try:
        appointments = appointment_manager.get_upcoming_appointments(user_id)
        return jsonify({"success": True, "appointments": appointments})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/appointments/cancel", methods=["POST"])
def cancel_appointment():
    """Cancel an appointment"""
    try:
        data = request.json
        result = appointment_manager.cancel_appointment(
            data.get("user_id"), data.get("appointment_id")
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ========== MEDICATION APIs ==========


@app.route("/api/medications/add", methods=["POST"])
def add_medication():
    """Add medication to schedule"""
    try:
        data = request.json
        user_id = data.get("user_id")

        result = medication_reminder.add_medication(
            user_id,
            {
                "name": data.get("name"),
                "dosage": data.get("dosage"),
                "frequency": data.get("frequency"),
                "times": data.get("times", []),
                "instructions": data.get("instructions"),
            },
        )

        logger.info(f"Medication added for {user_id}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Medication error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/medications/<user_id>", methods=["GET"])
def get_medications(user_id):
    """Get user's medications"""
    try:
        medications = medication_reminder.get_active_medications(user_id)
        return jsonify({"success": True, "medications": medications})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/medications/schedule/<user_id>", methods=["GET"])
def get_medication_schedule(user_id):
    """Get today's medication schedule"""
    try:
        schedule = medication_reminder.get_medication_schedule(user_id)
        return jsonify({"success": True, "schedule": schedule})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ========== DRUG INTERACTION API ==========


@app.route("/api/drug-interaction", methods=["POST"])
def check_drug_interaction():
    """Check for drug interactions"""
    try:
        data = request.json
        drug1 = data.get("drug1")
        drug2 = data.get("drug2")

        result = advanced_kb.check_drug_interaction(drug1, drug2)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ========== EXISTING ROUTES (Optimized) ==========


@app.route("/api/analyze-injury-image", methods=["POST"])
def analyze_injury_image():
    """AI-powered injury analysis"""
    try:
        data = request.json
        image_data = data.get("image")

        if not image_data:
            return jsonify({"success": False, "error": "No image provided"}), 400

        # Use Gemini AI for analysis
        analysis = gemini_service.analyze_injury_image(image_data)

        logger.info("Image analysis completed")
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return (
            jsonify({"success": False, "error": "Analysis failed. Please try again."}),
            500,
        )


@app.route("/api/save-doctor", methods=["POST"])
def save_doctor():
    """Save family doctor"""
    try:
        data = request.json
        user_id = data.get("user_id")

        doctor_info = {
            "user_id": user_id,
            "name": data.get("name"),
            "contact": data.get("contact"),
            "specialization": data.get("specialization", "General Physician"),
        }

        doctors = []
        if os.path.exists(FAMILY_DOCTOR_FILE):
            with open(FAMILY_DOCTOR_FILE, "r") as f:
                doctors = json.load(f)

        # Update or add
        found = False
        for i, doc in enumerate(doctors):
            if doc["user_id"] == user_id:
                doctors[i] = doctor_info
                found = True
                break

        if not found:
            doctors.append(doctor_info)

        with open(FAMILY_DOCTOR_FILE, "w") as f:
            json.dump(doctors, f, indent=2)

        logger.info(f"Doctor saved for {user_id}")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Save doctor error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/get-doctor/<user_id>")
def get_family_doctor(user_id):
    """Get family doctor"""
    try:
        if not os.path.exists(FAMILY_DOCTOR_FILE):
            return jsonify({"success": False, "message": "No doctors found"})

        with open(FAMILY_DOCTOR_FILE, "r") as f:
            doctors = json.load(f)

        for doctor in doctors:
            if doctor["user_id"] == user_id:
                return jsonify({"success": True, "doctor": doctor})

        return jsonify({"success": False, "message": "No doctor found"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ========== HELPER FUNCTIONS ==========


def is_non_medical(message: str) -> bool:
    """Check if query is non-medical"""
    non_medical = ["joke", "weather", "date", "time", "sport", "movie", "music"]
    return any(kw in message for kw in non_medical)


def get_nearby_hospitals(city: str) -> List[Dict]:
    """Get hospitals in city"""
    hospitals = []
    for hospital in DOCTORS_DB.get("hospitals", []):
        if city.lower() in hospital.get("city", "").lower():
            hospitals.append(hospital)
    return hospitals[:3]


def generate_enhanced_response(
    message: str, symptoms: List[str], severity: int, user_id: str, pattern: Dict
) -> Dict:
    """Generate enhanced response with pattern analysis"""

    # Load family doctor
    family_doctor = None
    if os.path.exists(FAMILY_DOCTOR_FILE):
        with open(FAMILY_DOCTOR_FILE, "r") as f:
            doctors = json.load(f)
            for doc in doctors:
                if doc["user_id"] == user_id:
                    family_doctor = doc
                    break

    symptom_list = ", ".join(symptoms[:5]) if symptoms else "your symptoms"

    responses = {
        1: {
            "type": "mild",
            "text": f"Based on {symptom_list}, this appears mild. Rest, hydrate, and monitor your symptoms.",
            "actions": ["Rest", "Hydrate", "Monitor"],
            "follow_up": ["How long have you had these symptoms?"],
        },
        2: {
            "type": "moderate",
            "text": f"Your symptoms ({symptom_list}) suggest moderate concern. Consider seeing a doctor within 24-48 hours.",
            "doctors": ["General Physician", "Specialist"],
            "actions": ["Schedule appointment", "Monitor symptoms"],
            "follow_up": ["Would you like help finding a doctor?"],
        },
        3: {
            "type": "serious",
            "text": f"⚠️ These symptoms require prompt medical attention. Please consult a healthcare provider within 24 hours.",
            "doctors": ["Specialist", "Urgent Care"],
            "actions": ["Seek medical care today", "Monitor closely"],
            "follow_up": ["Can you get to a doctor today?"],
        },
    }

    return responses.get(severity, responses[1])


# ========== HEALTH CHECK ==========


@app.route("/api/health-check")
def health_check():
    """API health check"""
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "features": {
                "ai_chat": gemini_service.is_configured,
                "image_analysis": True,
                "health_tracking": True,
                "appointments": True,
                "medications": True,
            },
        }
    )


# ========== SERVER START ==========

if __name__ == "__main__":
    logger.info("🚀 MedicSense AI Advanced Backend Starting...")
    logger.info("📡 Server: http://localhost:5000")
    logger.info(
        "✅ AI: " + ("Enabled" if gemini_service.is_configured else "Fallback Mode")
    )
    logger.info("💊 Features: Chat, Camera, Health Tracking, Appointments, Medications")

    app.run(debug=False, port=5000, use_reloader=False, threaded=True)
