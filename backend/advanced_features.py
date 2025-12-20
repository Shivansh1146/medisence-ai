"""
Advanced Medical Knowledge Base with ML-ready features
Includes symptom patterns, drug interactions, and health tracking
"""

import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class AdvancedMedicalKB:
    """Advanced Medical Knowledge Base with caching and optimization"""

    def __init__(self):
        self.symptom_cache = {}
        self.interaction_cache = {}
        self.load_data()

    def load_data(self):
        """Load medical data with error handling"""
        try:
            with open("medical_kb.json", "r") as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = self._create_default_kb()

    def _create_default_kb(self) -> Dict:
        """Create default knowledge base"""
        return {
            "common_symptoms": {
                "fever": {
                    "severity_indicators": ["high_temp", "persistent", "with_chills"],
                    "associated_conditions": ["flu", "infection", "covid"],
                    "red_flags": ["temp_over_103", "lasting_3_days"],
                    "self_care": ["rest", "hydrate", "monitor_temperature"],
                },
                "headache": {
                    "severity_indicators": ["severe", "sudden", "with_vision_changes"],
                    "associated_conditions": ["migraine", "tension", "dehydration"],
                    "red_flags": [
                        "worst_headache_ever",
                        "with_neck_stiffness",
                        "fever",
                    ],
                    "self_care": ["rest_dark_room", "hydrate", "otc_pain_relief"],
                },
                "cough": {
                    "severity_indicators": [
                        "persistent",
                        "bloody",
                        "difficulty_breathing",
                    ],
                    "associated_conditions": ["cold", "bronchitis", "pneumonia"],
                    "red_flags": ["blood_in_sputum", "chest_pain", "high_fever"],
                    "self_care": ["fluids", "honey_tea", "humidifier", "rest"],
                },
                "chest_pain": {
                    "severity_indicators": [
                        "crushing",
                        "radiating",
                        "with_breathlessness",
                    ],
                    "associated_conditions": ["heart_attack", "angina", "anxiety"],
                    "red_flags": ["all_symptoms_emergency"],
                    "self_care": ["call_911_immediately"],
                },
            },
            "drug_interactions": {
                "aspirin": {
                    "avoid_with": ["warfarin", "ibuprofen", "alcohol"],
                    "side_effects": ["stomach_upset", "bleeding"],
                    "warnings": ["not_for_children"],
                },
                "antibiotics": {
                    "avoid_with": ["alcohol", "dairy_products"],
                    "side_effects": ["nausea", "diarrhea"],
                    "warnings": ["complete_full_course"],
                },
            },
            "preventive_care": {
                "vaccinations": ["flu_yearly", "covid_updated", "tetanus_10yrs"],
                "screenings": ["blood_pressure", "cholesterol", "diabetes"],
                "lifestyle": ["exercise_30min", "balanced_diet", "adequate_sleep"],
            },
        }

    def get_symptom_info(self, symptom: str) -> Dict:
        """Get cached symptom information"""
        cache_key = hashlib.md5(symptom.encode()).hexdigest()

        if cache_key in self.symptom_cache:
            return self.symptom_cache[cache_key]

        symptom_lower = symptom.lower()
        info = self.data.get("common_symptoms", {}).get(symptom_lower, {})

        self.symptom_cache[cache_key] = info
        return info

    def check_drug_interaction(self, drug1: str, drug2: str) -> Dict:
        """Check for drug interactions"""
        cache_key = f"{drug1}_{drug2}"

        if cache_key in self.interaction_cache:
            return self.interaction_cache[cache_key]

        drug1_info = self.data.get("drug_interactions", {}).get(drug1.lower(), {})
        avoid_list = drug1_info.get("avoid_with", [])

        result = {
            "has_interaction": drug2.lower() in avoid_list,
            "severity": "high" if drug2.lower() in avoid_list else "none",
            "details": drug1_info if drug2.lower() in avoid_list else {},
        }

        self.interaction_cache[cache_key] = result
        return result


class HealthTracker:
    """Track user health metrics and history"""

    def __init__(self, storage_file="health_records.json"):
        self.storage_file = storage_file
        self.records = self._load_records()

    def _load_records(self) -> Dict:
        """Load health records"""
        try:
            with open(self.storage_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _save_records(self):
        """Save health records"""
        with open(self.storage_file, "w") as f:
            json.dump(self.records, f, indent=2)

    def add_symptom_log(self, user_id: str, symptoms: List[str], severity: int):
        """Log user symptoms"""
        if user_id not in self.records:
            self.records[user_id] = {
                "symptom_history": [],
                "medication_history": [],
                "vital_signs": [],
            }

        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "symptoms": symptoms,
            "severity": severity,
        }

        self.records[user_id]["symptom_history"].append(log_entry)
        self._save_records()

    def add_vital_signs(self, user_id: str, vitals: Dict):
        """Record vital signs (temperature, BP, heart rate, etc.)"""
        if user_id not in self.records:
            self.records[user_id] = {
                "symptom_history": [],
                "medication_history": [],
                "vital_signs": [],
            }

        vital_entry = {"timestamp": datetime.now().isoformat(), "data": vitals}

        self.records[user_id]["vital_signs"].append(vital_entry)
        self._save_records()

    def get_symptom_pattern(self, user_id: str, days: int = 7) -> Dict:
        """Analyze symptom patterns over time"""
        if user_id not in self.records:
            return {"pattern": "no_data"}

        cutoff_date = datetime.now() - timedelta(days=days)
        recent_symptoms = [
            entry
            for entry in self.records[user_id]["symptom_history"]
            if datetime.fromisoformat(entry["timestamp"]) > cutoff_date
        ]

        if not recent_symptoms:
            return {"pattern": "no_recent_data"}

        # Analyze patterns
        symptom_frequency = {}
        severity_trend = []

        for entry in recent_symptoms:
            for symptom in entry["symptoms"]:
                symptom_frequency[symptom] = symptom_frequency.get(symptom, 0) + 1
            severity_trend.append(entry["severity"])

        return {
            "pattern": "recurring" if len(recent_symptoms) > 3 else "isolated",
            "most_common_symptoms": sorted(
                symptom_frequency.items(), key=lambda x: x[1], reverse=True
            )[:3],
            "severity_trend": (
                "increasing" if severity_trend[-1] > severity_trend[0] else "stable"
            ),
            "frequency": len(recent_symptoms),
            "recommendation": self._get_pattern_recommendation(recent_symptoms),
        }

    def _get_pattern_recommendation(self, symptoms: List[Dict]) -> str:
        """Get recommendation based on symptom patterns"""
        if len(symptoms) > 5:
            return "Recurring symptoms detected. Recommend comprehensive medical evaluation."
        elif any(s["severity"] > 2 for s in symptoms):
            return "High severity symptoms present. Consult healthcare provider soon."
        else:
            return "Monitor symptoms and maintain healthy lifestyle."


class AppointmentManager:
    """Manage doctor appointments and reminders"""

    def __init__(self, storage_file="appointments.json"):
        self.storage_file = storage_file
        self.appointments = self._load_appointments()

    def _load_appointments(self) -> Dict:
        """Load appointments"""
        try:
            with open(self.storage_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _save_appointments(self):
        """Save appointments"""
        with open(self.storage_file, "w") as f:
            json.dump(self.appointments, f, indent=2)

    def schedule_appointment(self, user_id: str, appointment_data: Dict) -> Dict:
        """Schedule a new appointment"""
        if user_id not in self.appointments:
            self.appointments[user_id] = []

        appointment = {
            "id": hashlib.md5(f"{user_id}{datetime.now()}".encode()).hexdigest()[:8],
            "doctor": appointment_data.get("doctor"),
            "specialization": appointment_data.get("specialization"),
            "date": appointment_data.get("date"),
            "time": appointment_data.get("time"),
            "reason": appointment_data.get("reason"),
            "status": "scheduled",
            "created_at": datetime.now().isoformat(),
        }

        self.appointments[user_id].append(appointment)
        self._save_appointments()

        return {"success": True, "appointment": appointment}

    def get_upcoming_appointments(self, user_id: str) -> List[Dict]:
        """Get upcoming appointments for user"""
        if user_id not in self.appointments:
            return []

        now = datetime.now()
        upcoming = [
            apt
            for apt in self.appointments[user_id]
            if apt["status"] == "scheduled"
            and datetime.fromisoformat(apt.get("date", apt["created_at"])) > now
        ]

        return sorted(upcoming, key=lambda x: x.get("date", x["created_at"]))

    def cancel_appointment(self, user_id: str, appointment_id: str) -> Dict:
        """Cancel an appointment"""
        if user_id not in self.appointments:
            return {"success": False, "error": "No appointments found"}

        for apt in self.appointments[user_id]:
            if apt["id"] == appointment_id:
                apt["status"] = "cancelled"
                self._save_appointments()
                return {"success": True, "message": "Appointment cancelled"}

        return {"success": False, "error": "Appointment not found"}


class MedicationReminder:
    """Manage medication schedules and reminders"""

    def __init__(self, storage_file="medications.json"):
        self.storage_file = storage_file
        self.medications = self._load_medications()

    def _load_medications(self) -> Dict:
        """Load medication data"""
        try:
            with open(self.storage_file, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _save_medications(self):
        """Save medication data"""
        with open(self.storage_file, "w") as f:
            json.dump(self.medications, f, indent=2)

    def add_medication(self, user_id: str, medication: Dict) -> Dict:
        """Add medication to schedule"""
        if user_id not in self.medications:
            self.medications[user_id] = []

        med_entry = {
            "id": hashlib.md5(
                f"{user_id}{medication['name']}{datetime.now()}".encode()
            ).hexdigest()[:8],
            "name": medication["name"],
            "dosage": medication["dosage"],
            "frequency": medication["frequency"],
            "times": medication["times"],
            "start_date": medication.get("start_date", datetime.now().isoformat()),
            "end_date": medication.get("end_date"),
            "instructions": medication.get("instructions", ""),
            "active": True,
        }

        self.medications[user_id].append(med_entry)
        self._save_medications()

        return {"success": True, "medication": med_entry}

    def get_active_medications(self, user_id: str) -> List[Dict]:
        """Get user's active medications"""
        if user_id not in self.medications:
            return []

        return [med for med in self.medications[user_id] if med.get("active", True)]

    def get_medication_schedule(self, user_id: str) -> Dict:
        """Get today's medication schedule"""
        active_meds = self.get_active_medications(user_id)

        schedule = {}
        for med in active_meds:
            for time in med.get("times", []):
                if time not in schedule:
                    schedule[time] = []
                schedule[time].append(
                    {
                        "name": med["name"],
                        "dosage": med["dosage"],
                        "instructions": med.get("instructions", ""),
                    }
                )

        return {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "schedule": dict(sorted(schedule.items())),
        }


# Global instances
advanced_kb = AdvancedMedicalKB()
health_tracker = HealthTracker()
appointment_manager = AppointmentManager()
medication_reminder = MedicationReminder()
