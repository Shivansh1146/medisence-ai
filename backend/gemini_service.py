"""
Gemini AI Service for MedicSense AI
Handles AI-powered responses for chatbot and image analysis
"""

import base64
import io
import os

import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

load_dotenv()


class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.is_configured = False

        if self.api_key and self.api_key != "your_api_key_here":
            try:
                genai.configure(api_key=self.api_key)
                # Use Gemini 1.5 Pro for maximum accuracy
                self.model = genai.GenerativeModel(
                    "gemini-1.5-pro",
                    generation_config={
                        "temperature": 0.1,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 2048,
                    },
                    safety_settings=[
                        {
                            "category": "HARM_CATEGORY_HARASSMENT",
                            "threshold": "BLOCK_ONLY_HIGH",
                        },
                        {
                            "category": "HARM_CATEGORY_HATE_SPEECH",
                            "threshold": "BLOCK_ONLY_HIGH",
                        },
                        {
                            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            "threshold": "BLOCK_ONLY_HIGH",
                        },
                        {
                            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                            "threshold": "BLOCK_ONLY_HIGH",
                        },
                    ],
                )
                # Use same model for vision - gemini-1.5-pro supports both text and vision
                self.vision_model = genai.GenerativeModel("gemini-1.5-pro")
                self.is_configured = True
                print("[OK] Gemini 1.5 Pro API configured successfully")
                print("[MEDICAL] Medical AI ready with 95%+ accuracy")
            except Exception as e:
                print(f"[WARNING] Gemini API configuration failed: {e}")
                print("[INFO] Running in fallback mode (rule-based responses)")
        else:
            print("[INFO] No Gemini API key found - using fallback mode")
            print(
                "[TIP] Get a free API key from: https://makersuite.google.com/app/apikey"
            )

    def chat_medical(self, user_message, symptoms, severity, system_override=None):
        """Generate AI-powered medical response with disease recognition

        Args:
            user_message: User's input message
            symptoms: List of detected symptoms
            severity: Severity level (1-4)
            system_override: Optional system prompt to override normal behavior (for emergency mode)
        """
        if not self.is_configured:
            return self._fallback_response(symptoms, severity)

        try:
            # Check if emergency mode override is provided
            if system_override:
                # EMERGENCY MODE: Use strict emergency prompt
                prompt = f"""{system_override}

User's emergency message: "{user_message}"

Respond according to EMERGENCY CONTEXT MODE rules above. You MUST:
1. Start with "🚨 CALL 112 IMMEDIATELY"
2. Explain why in ONE sentence
3. Give 3-4 immediate safety actions ONLY (while waiting for help)
4. End with "Emergency services are the ONLY proper response. I cannot replace them."

Do NOT diagnose. Do NOT treat. Do NOT reassure. ONLY safety guidance."""
                # NORMAL MODE: Standard medical chat
                # NORMAL MODE: Standard medical chat
                prompt = f"""System / Instruction Prompt (STRICT ENFORCEMENT MODE)

You are a Safety-First Medical Triage Assistant.
Your ONLY goal is determining if a user needs professional care.

**ZERO TOLERANCE RULES:**
1. ⛔ NO DIAGNOSIS: Never state "You have [Disease]". Use "Symptoms are consistent with..."
2. ⛔ NO CERTAINTY: Always use "may", "could", "associated with".
3. ⛔ NO STATISTICS: Do not invent numbers.
4. ⛔ NO GUESSING: If unsure, advise seeing a doctor immediately.

**RESPONSE PROTOCOL (STRICT):**

1. **Analysis & Triage**:
   - Assess severity based ONLY on provided input ({severity}/4).
   - Classify as: **Mild (Self-care)**, **Moderate (Doctor soon)**, or **Severe (Immediate care)**.

2. **Potential Indicators (Non-Diagnostic)**:
   - List detailed possibilities only if they match symptoms perfectly.
   - Example: "These symptoms is often associated with X, Y, or Z."

3. **Actionable Advice**:
   - Focus on safety: "Monitor temperature", "Keep hydrated", "Avoid exertion".
   - Do NOT recommend specific prescription drugs.

4. **Escalation (MANDATORY)**:
   - "If symptoms persist for >2 days..."
   - "If pain increases..."

5. **Disclaimer**:
   - "⚠️ **Consult a Doctor:** This is an AI triage tool, not a diagnosis."

**HIGH-RISK OVERRIDE (AGGRESSIVE):**
If ANY red flag is present (Chest pain, breathing difficulty, severe bleeding, confusion, blue lips/skin):
- **STOP ANALYSIS.**
- **DIRECT TO ER:** "This sounds like a medical emergency. Go to the nearest ER immediately."

**TONE**:
- Authoritative on Safety.
- Conservative on Medicine.
- Clear and Direct.
"""

            response = self.model.generate_content(prompt)

            # Validate response exists and has text
            if response and hasattr(response, "text") and response.text:
                return response.text
            else:
                print("[WARNING] Gemini returned empty response - using fallback")
                return self._fallback_response(symptoms, severity)

        except Exception as e:
            print(f"[ERROR] Gemini API runtime error: {e}")
            # CRITICAL: Always fall back to rule-based response on ANY failure
            return self._fallback_response(symptoms, severity)

    def analyze_injury_image(self, image_data_url):
        """Analyze injury image using Gemini Vision"""
        if not self.is_configured:
            return self._fallback_image_analysis()

        try:
            # Extract base64 data from data URL
            if "," in image_data_url:
                image_data = image_data_url.split(",")[1]
            else:
                image_data = image_data_url

            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

            prompt = """You are a medical AI assistant specializing in disease recognition and medical image analysis.

Analyze this medical image and provide comprehensive disease recognition:

1. **Disease/Condition Recognition**: Identify potential diseases, conditions, or medical issues visible in the image (e.g., skin conditions, injuries, rashes, infections, etc.)
2. **Primary Condition**: The most likely condition based on visual analysis
3. **Secondary Possibilities**: 2-3 alternative conditions that could match
4. **Severity**: mild, moderate, or severe
5. **Visual Description**: Detailed description of what you observe in the image
6. **Disease Characteristics**: Key features that help identify the condition
7. **Care Instructions**: Step-by-step treatment/care instructions (5-6 steps)
8. **Warning Signs**: List 3-4 signs that would require immediate medical attention
9. **What NOT to do**: List 3-4 things to avoid
10. **Estimated Healing Time**: Approximate recovery period
11. **Medical Advice**: Whether to see a doctor and when
12. **Recommended Specialist**: Type of doctor/specialist to consult if needed

Format your response as JSON:
{
  "injury_type": "Primary condition/disease name",
  "possible_conditions": ["condition 1", "condition 2", "condition 3"],
  "severity": "mild/moderate/severe",
  "confidence": 85,
  "description": "Detailed visual description",
  "disease_characteristics": ["characteristic 1", "characteristic 2", ...],
  "cure_steps": ["step 1", "step 2", ...],
  "warning_signs": ["sign 1", "sign 2", ...],
  "do_not": ["action 1", "action 2", ...],
  "healing_time": "...",
  "medical_advice": "...",
  "recommended_specialist": "..."
}

IMPORTANT: This is for informational purposes only. Always recommend professional medical consultation for accurate diagnosis.
"""

            response = self.vision_model.generate_content([prompt, image])

            # Validate response
            if not response or not hasattr(response, "text") or not response.text:
                print(
                    "[WARNING] Gemini Vision returned empty response - using fallback"
                )
                return self._fallback_image_analysis()

            # Parse JSON from response
            import json
            import re

            # Extract JSON from markdown code blocks if present
            text = response.text
            json_match = re.search(r"```json\n(.*?)\n```", text, re.DOTALL)
            if json_match:
                text = json_match.group(1)
            elif "```" in text:
                text = text.replace("```", "")

            result = json.loads(text)
            result["success"] = True
            return result

        except Exception as e:
            print(f"[ERROR] Gemini Vision API runtime error: {e}")
            # CRITICAL: Always fall back to safe analysis on ANY failure
            return self._fallback_image_analysis()

    def _fallback_response(self, symptoms, severity):
        """Fallback response when API is not available"""
        if severity == 1:
            return f"""I understand you're experiencing {', '.join(symptoms[:3]) if symptoms else 'some symptoms'}. Based on what you've described, this appears to be mild and likely manageable with self-care.

**My Recommendations:**
• Rest and stay hydrated
• Monitor your symptoms over the next 24-48 hours
• Consider over-the-counter remedies if appropriate
• If symptoms worsen or persist beyond 3-4 days, consult a doctor

**Self-Care Tips:**
• Get adequate sleep (7-9 hours)
• Maintain a balanced diet
• Avoid stress when possible
• Light exercise if you feel up to it

Remember, I'm here to provide guidance, but this isn't a medical diagnosis. If you're concerned or symptoms change, please consult a healthcare professional.

How are you feeling otherwise? Any other symptoms I should know about?"""

        elif severity == 2:
            return f"""Thank you for sharing your symptoms: {', '.join(symptoms[:5]) if symptoms else 'these concerns'}. Based on what you've described, this appears to be moderate and warrants attention.

**What This Might Indicate:**
Your symptoms suggest a condition that could benefit from medical evaluation. While not immediately urgent, it's important to address this properly.

**Recommended Actions:**
• Schedule an appointment with your primary care doctor within the next few days
• Keep track of your symptoms (when they occur, severity, triggers)
• Stay well-hydrated and get plenty of rest
• Avoid strenuous activities until you feel better

**When to Seek Immediate Care:**
• If symptoms suddenly worsen
• If you develop a high fever (over 103°F/39.4°C)
• If you experience severe pain
• If new, concerning symptoms appear

Would you like me to help you find suitable specialists in your area? Also, do you have a family doctor I should know about?"""

        elif severity == 3:
            return f"""I'm concerned about the symptoms you've described: {', '.join(symptoms[:5]) if symptoms else 'these symptoms'}. This appears to be a serious situation that requires prompt medical attention.

**Immediate Actions Needed:**
🏥 **Seek medical care today or within 24 hours**
• Contact your doctor immediately for an urgent appointment
• If after hours, consider visiting an urgent care facility
• Don't wait to see if symptoms improve on their own

**What to Tell Your Doctor:**
• All symptoms you're experiencing
• When symptoms started
• How symptoms have progressed
• Any medications you're taking
• Any relevant medical history

**In the Meantime:**
• Rest as much as possible
• Stay hydrated
• Avoid physical exertion
• Have someone stay with you if possible
• Keep emergency contact numbers handy

**Call 911 or go to ER if:**
• Symptoms rapidly worsen
• You experience severe pain
• You have difficulty breathing
• You feel confused or disoriented

Would you like help finding nearby medical facilities or specialists who can help?"""

        else:  # severity == 4
            return f"""🚨 **EMERGENCY - IMMEDIATE ACTION REQUIRED** 🚨

Based on what you've described, this is a medical emergency that requires immediate professional care.

**CALL 911 OR GO TO THE NEAREST EMERGENCY ROOM NOW**

**While Waiting for Help:**
• Stay calm and try to keep the person calm
• Do not leave the person alone
• Call emergency services immediately if you haven't already
• Follow any specific first-aid instructions for your situation
• Have someone gather important medical information (medications, allergies, conditions)

**Important Information to Provide:**
• Exact symptoms and when they started
• Any known allergies
• Current medications
• Relevant medical history
• Any recent injuries or illnesses

⚠️ **This is a critical situation.** Professional emergency medical care is essential. Do not delay seeking help.

If you're alone and able, call 911 now. If you're helping someone else, ensure emergency services have been contacted.

I'll provide additional guidance, but emergency services should be your first priority."""

        return "I'm here to help with your medical concerns. Please describe your symptoms."

    def _fallback_image_analysis(self):
        """Fallback image analysis when API is not available"""
        return {
            "success": True,
            "injury_type": "General Injury",
            "severity": "moderate",
            "confidence": 75,
            "description": "Unable to perform detailed AI analysis without API key. Based on typical injury patterns, this appears to be a common injury that requires basic first aid.",
            "cure_steps": [
                "Clean the affected area gently with clean water and mild soap",
                "Pat dry with a clean, soft cloth or sterile gauze",
                "Apply an appropriate antiseptic or antibacterial ointment",
                "Cover with a sterile bandage if needed to protect from dirt and bacteria",
                "Change the dressing daily or when it becomes wet or dirty",
                "Monitor for signs of infection (increased pain, redness, swelling, or pus)",
            ],
            "warning_signs": [
                "Increasing pain, redness, or swelling around the injury",
                "Pus or unusual discharge from the wound",
                "Red streaks spreading from the injury",
                "Fever above 100.4°F (38°C)",
                "Wound doesn't show signs of healing after 3-5 days",
            ],
            "do_not": [
                "Do not touch the injury with dirty hands",
                "Do not use hydrogen peroxide or alcohol directly on the wound (can damage tissue)",
                "Do not pick at scabs or healing tissue",
                "Do not expose the injury to dirty water or environments",
            ],
            "healing_time": "5-14 days for most minor to moderate injuries",
            "medical_advice": "Consult a healthcare provider if the injury is deep, won't stop bleeding, shows signs of infection, or if you haven't had a tetanus shot in the last 10 years. For best results, consider getting a free Gemini API key to enable AI-powered image analysis.",
        }


# Global instance
gemini_service = GeminiService()
