"""
Emergency Detector - Identifies life-threatening situations
"""

import re


class EmergencyDetector:
    def __init__(self):
        self.emergency_keywords = {
            "unconscious": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Unconscious Person**\n\n1. Check responsiveness\n2. Call emergency services IMMEDIATELY\n3. Check breathing\n4. Begin CPR if trained\n5. Do NOT move unless in danger",
                "first_aid": [
                    "Call 911/112",
                    "Check ABC (Airway, Breathing, Circulation)",
                    "CPR if needed",
                ],
            },
            "bleeding heavily": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Severe Bleeding**\n\n1. Apply direct pressure with clean cloth\n2. Elevate wound above heart if possible\n3. CALL EMERGENCY SERVICES NOW\n4. Do NOT remove soaked bandages\n5. Keep patient warm",
                "first_aid": ["Direct pressure", "Elevate wound", "Call emergency"],
            },
            "severe bleeding": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Severe Bleeding**\n\n1. Apply direct pressure with clean cloth\n2. Elevate wound above heart if possible\n3. CALL EMERGENCY SERVICES NOW\n4. Do NOT remove soaked bandages\n5. Keep patient warm",
                "first_aid": ["Direct pressure", "Elevate wound", "Call emergency"],
            },
            "snake bite": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Snake Bite**\n\n1. Call emergency services IMMEDIATELY\n2. Keep patient calm and still\n3. Position wound below heart level\n4. Remove tight clothing/jewelry\n5. DO NOT suck venom or apply tourniquet\n6. Identify snake if safe",
                "first_aid": [
                    "Call emergency",
                    "Immobilize area",
                    "Keep calm",
                    "Remove constrictions",
                ],
            },
            "cannot breathe": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Breathing Difficulty**\n\n1. Call emergency services NOW\n2. Help sit upright\n3. Loosen tight clothing\n4. Check for choking\n5. Prepare for CPR if breathing stops",
                "first_aid": ["Call emergency", "Sitting position", "Check airway"],
            },
            "can't breathe": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Breathing Difficulty**\n\n1. Call emergency services NOW\n2. Help sit upright\n3. Loosen tight clothing\n4. Check for choking\n5. Prepare for CPR if breathing stops",
                "first_aid": ["Call emergency", "Sitting position", "Check airway"],
            },
            "heart attack": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Possible Heart Attack**\n\nSymptoms: Chest pain, arm/jaw pain, sweating, nausea\n\n1. CALL EMERGENCY IMMEDIATELY\n2. Have patient sit/lie down\n3. Give aspirin if available and not allergic\n4. Monitor consciousness\n5. Prepare for CPR",
                "first_aid": [
                    "Call emergency",
                    "Rest position",
                    "Aspirin if available",
                ],
            },
            "stroke": {
                "level": 4,
                "response": "🚨 **EMERGENCY: Possible Stroke**\n\nFAST Test:\nF - Face drooping\nA - Arm weakness\nS - Speech difficulty\nT - TIME TO CALL EMERGENCY\n\n1. Call emergency NOW\n2. Note time symptoms started\n3. Keep patient comfortable\n4. Do NOT give food/drink",
                "first_aid": ["Call emergency", "Note time", "Monitor symptoms"],
            },
        }

        self.first_aid_guide = {
            "cut": [
                "Clean wound with water",
                "Apply pressure to stop bleeding",
                "Cover with sterile bandage",
                "Seek medical help if deep or infected",
            ],
            "burn": [
                "Cool with running water for 20 minutes",
                "Cover with sterile dressing",
                "Do NOT apply ice or creams",
                "Seek help for large or severe burns",
            ],
            "fracture": [
                "Immobilize the area",
                "Apply ice wrapped in cloth",
                "Elevate if possible",
                "Seek immediate medical attention",
            ],
        }

    def check_emergency(self, text):
        """
        Check if text indicates emergency situation
        """
        text_lower = text.lower()

        for keyword, info in self.emergency_keywords.items():
            if keyword in text_lower:
                return {
                    "is_emergency": True,
                    "level": info["level"],
                    "response": info["response"],
                    "first_aid": info.get("first_aid", []),
                }

        # Check for injury-related emergencies
        injuries = ["accident", "broken", "fracture", "dislocation", "cut", "burn"]
        injury_found = None
        for injury in injuries:
            if injury in text_lower:
                injury_found = injury
                break

        if injury_found:
            first_aid = self.first_aid_guide.get(
                injury_found,
                [
                    "Seek medical attention immediately",
                    "Keep the injured area still",
                    "Call for emergency help if severe",
                ],
            )

            return {
                "is_emergency": True,
                "level": 4,
                "response": f"🚨 **INJURY DETECTED: {injury_found.upper()}**\n\nSeek medical attention immediately. First aid steps:\n\n"
                + "\n".join([f"{i+1}. {step}" for i, step in enumerate(first_aid)]),
                "first_aid": first_aid,
            }

        return {"is_emergency": False}

    def get_first_aid(self, injury_type):
        """Get first aid instructions for specific injuries"""
        return self.first_aid_guide.get(
            injury_type.lower(),
            [
                "Seek professional medical help",
                "Keep patient calm and still",
                "Call emergency services if severe",
            ],
        )
