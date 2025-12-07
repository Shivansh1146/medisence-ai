import os
import google.generativeai as genai
import json
from .prompts import TRIAGE_SYSTEM_PROMPT, INTENT_CLASSIFICATION_PROMPT

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-pro')

async def analyze_symptoms(user_input: str):
    try:
        response = model.generate_content(
            f"{TRIAGE_SYSTEM_PROMPT}\n\nUser Input: {user_input}"
        )
        # Clean up response to ensure it's valid JSON (Gemini sometimes adds markdown)
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Error in analyze_symptoms: {e}")
        return {
            "intent": "error",
            "error": "Failed to process symptoms. Please try again."
        }

async def detect_intent(user_input: str):
    try:
        response = model.generate_content(
            f"{INTENT_CLASSIFICATION_PROMPT}\n\nUser Input: {user_input}"
        )
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Error in detect_intent: {e}")
        return {"intent": "general_chat"}
