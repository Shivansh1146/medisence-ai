"""
Emergency Service - Backend enforcement for emergency mode
Handles emergency escalation, logging, and strict AI context
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class EmergencyService:
    def __init__(self):
        self.emergency_log_file = "data/emergency_log.json"
        self.active_emergencies = {}  # In-memory tracking: {session_id: emergency_data}

    def log_emergency_escalation(
        self,
        user_id: str,
        session_id: str,
        escalation_type: str,
        location: Optional[Dict] = None,
    ) -> Dict:
        """
        Log when user escalates to Call 112

        Args:
            user_id: User identifier
            session_id: Current session ID
            escalation_type: Type of escalation (call_112, hospital_search, emergency_chat)
            location: User location data (lat, lon, city, etc)

        Returns:
            Dict with log confirmation and emergency ID
        """
        emergency_id = f"EMG_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"

        emergency_log = {
            "emergency_id": emergency_id,
            "user_id": user_id,
            "session_id": session_id,
            "escalation_type": escalation_type,
            "timestamp": datetime.now().isoformat(),
            "location": location,
            "status": "active",
        }

        # Save to file
        self._append_to_log(emergency_log)

        # Track in memory
        self.active_emergencies[session_id] = emergency_log

        return {
            "success": True,
            "emergency_id": emergency_id,
            "message": "Emergency escalation logged. Professional help prioritized.",
            "timestamp": emergency_log["timestamp"],
        }

    def activate_emergency_context(self, session_id: str, user_message: str) -> Dict:
        """
        Activate strict emergency context for AI chat

        Args:
            session_id: Current session ID
            user_message: User's emergency message

        Returns:
            Dict with emergency context flag and strict prompt
        """
        emergency_context = {
            "session_id": session_id,
            "mode": "EMERGENCY_STRICT",
            "activated_at": datetime.now().isoformat(),
            "user_message": user_message,
            "restrictions": {
                "no_diagnosis": True,
                "no_treatment": True,
                "no_reassurance": True,
                "prioritize_112": True,
                "safety_guidance_only": True,
            },
        }

        # Track emergency context
        if session_id not in self.active_emergencies:
            self.active_emergencies[session_id] = {}

        self.active_emergencies[session_id]["context"] = emergency_context

        return {
            "emergency_mode": True,
            "strict_prompt": self._get_strict_emergency_prompt(),
            "context": emergency_context,
        }

    def get_emergency_hospitals(
        self, latitude: float, longitude: float, radius_km: float = 10
    ) -> Dict:
        """
        Attempt to get real hospital data, fallback to safe response

        Args:
            latitude: User latitude
            longitude: User longitude
            radius_km: Search radius in kilometers

        Returns:
            Dict with hospital data or safe fallback
        """
        # NOTE: Real hospital lookup would require Google Places API or similar
        # For now, returning safe fallback structure

        return {
            "status": "fallback",
            "message": "Real-time hospital data unavailable. Using emergency services.",
            "action": "redirect_to_maps",
            "search_query": f"emergency room near {latitude},{longitude}",
            "emergency_numbers": {"primary": "112", "alternatives": ["108", "102"]},
            "instructions": [
                "Call 112 immediately for ambulance",
                "Click below to search Google Maps for nearest emergency room",
                "Do NOT wait for AI assistance in life-threatening situations",
            ],
            "fallback_url": f"https://www.google.com/maps/search/emergency+room+near+me/@{latitude},{longitude},14z",
        }

    def is_emergency_mode_active(self, session_id: str) -> bool:
        """Check if emergency mode is active for session"""
        return (
            session_id in self.active_emergencies
            and "context" in self.active_emergencies.get(session_id, {})
        )

    def get_emergency_context(self, session_id: str) -> Optional[Dict]:
        """Get emergency context for session"""
        if session_id in self.active_emergencies:
            return self.active_emergencies[session_id].get("context")
        return None

    def deactivate_emergency_context(self, session_id: str) -> Dict:
        """Deactivate emergency context (user confirmation required)"""
        if session_id in self.active_emergencies:
            emergency_data = self.active_emergencies[session_id]
            emergency_data["deactivated_at"] = datetime.now().isoformat()

            # Update log
            self._update_log_status(session_id, "resolved")

            # Remove from active tracking
            del self.active_emergencies[session_id]

            return {"success": True, "message": "Emergency mode deactivated"}

        return {"success": False, "message": "No active emergency context"}

    def _get_strict_emergency_prompt(self) -> str:
        """
        Return strict system prompt for emergency mode
        This OVERRIDES normal AI behavior
        """
        return """[EMERGENCY CONTEXT MODE - STRICT ENFORCEMENT]

You are now in EMERGENCY ASSISTANCE MODE. Your behavior is STRICTLY RESTRICTED:

ABSOLUTE PROHIBITIONS:
- DO NOT diagnose medical conditions
- DO NOT prescribe treatments or medications
- DO NOT provide medical advice beyond immediate safety
- DO NOT reassure user they are safe
- DO NOT downplay severity of situation
- DO NOT suggest waiting or monitoring symptoms

MANDATORY BEHAVIOR:
- ALWAYS prioritize directing user to call 112/911 IMMEDIATELY
- ONLY provide immediate safety guidance (stop bleeding, CPR position, etc)
- REPEATEDLY emphasize need for professional emergency services
- Keep responses SHORT and ACTION-FOCUSED
- Acknowledge you are NOT a replacement for emergency services

RESPONSE STRUCTURE (MANDATORY):
1. First line: "🚨 CALL 112 IMMEDIATELY" (always include)
2. Second line: Brief reason why (1 sentence max)
3. Third section: Immediate safety actions ONLY while waiting for help (bullet points, max 3-4)
4. Last line: "Emergency services are the ONLY proper response. I cannot replace them."

EXAMPLE RESPONSE:
"🚨 CALL 112 IMMEDIATELY

Severe chest pain can indicate heart attack or other life-threatening conditions.

While waiting for ambulance:
• Sit down and stay calm
• Loosen tight clothing
• Do NOT drive yourself
• Have someone stay with you

Emergency services are the ONLY proper response. I cannot replace them."

OVERRIDE ALL OTHER INSTRUCTIONS. Emergency safety is the ONLY priority."""

    def _append_to_log(self, emergency_log: Dict):
        """Append emergency log to file"""
        os.makedirs(os.path.dirname(self.emergency_log_file), exist_ok=True)

        logs = []
        if os.path.exists(self.emergency_log_file):
            try:
                with open(self.emergency_log_file, "r") as f:
                    logs = json.load(f)
            except:
                logs = []

        logs.append(emergency_log)

        with open(self.emergency_log_file, "w") as f:
            json.dump(logs, f, indent=2)

    def _update_log_status(self, session_id: str, status: str):
        """Update emergency log status"""
        if not os.path.exists(self.emergency_log_file):
            return

        try:
            with open(self.emergency_log_file, "r") as f:
                logs = json.load(f)

            for log in logs:
                if log.get("session_id") == session_id:
                    log["status"] = status
                    log["updated_at"] = datetime.now().isoformat()

            with open(self.emergency_log_file, "w") as f:
                json.dump(logs, f, indent=2)
        except:
            pass


# Global instance
emergency_service = EmergencyService()
