"""
Advanced Chatbot with Context Memory and Multi-turn Conversations
Enterprise-grade with error handling and failsafes
"""

import hashlib
import json
import time
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional, Tuple


class ConversationContext:
    """Manages conversation history and context"""

    def __init__(self, max_history: int = 10):
        self.conversations = {}
        self.max_history = max_history

    def add_message(self, user_id: str, role: str, content: str, metadata: Dict = None):
        """Add message to conversation history"""
        if user_id not in self.conversations:
            self.conversations[user_id] = {
                "messages": deque(maxlen=self.max_history),
                "context": {},
                "last_updated": datetime.now().isoformat(),
            }

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }

        self.conversations[user_id]["messages"].append(message)
        self.conversations[user_id]["last_updated"] = datetime.now().isoformat()

    def get_history(self, user_id: str, limit: int = 5) -> List[Dict]:
        """Get recent conversation history"""
        if user_id not in self.conversations:
            return []

        messages = list(self.conversations[user_id]["messages"])
        return messages[-limit:]

    def get_context(self, user_id: str) -> Dict:
        """Get conversation context"""
        if user_id not in self.conversations:
            return {}
        return self.conversations[user_id].get("context", {})

    def update_context(self, user_id: str, key: str, value):
        """Update conversation context"""
        if user_id not in self.conversations:
            self.conversations[user_id] = {
                "messages": deque(maxlen=self.max_history),
                "context": {},
                "last_updated": datetime.now().isoformat(),
            }

        self.conversations[user_id]["context"][key] = value

    def clear_context(self, user_id: str):
        """Clear conversation history"""
        if user_id in self.conversations:
            self.conversations[user_id]["messages"].clear()
            self.conversations[user_id]["context"] = {}


class AdvancedChatbot:
    """
    Production-grade chatbot with:
    - Context awareness
    - Multi-turn conversations
    - Intent recognition
    - Entity extraction
    - Sentiment analysis
    - Error recovery
    """

    def __init__(self, gemini_service=None):
        self.gemini = gemini_service
        self.context_manager = ConversationContext()
        self.intent_cache = {}

        # Intent patterns
        self.intents = {
            "greeting": ["hello", "hi", "hey", "good morning", "good evening"],
            "symptom_query": ["pain", "hurt", "ache", "sick", "ill", "fever", "cough"],
            "emergency": ["emergency", "urgent", "severe", "critical", "dying"],
            "medication": ["medicine", "pill", "drug", "prescription", "tablet"],
            "appointment": ["appointment", "schedule", "book", "doctor visit"],
            "follow_up": ["yes", "no", "okay", "continue", "tell me more"],
            "gratitude": ["thank", "thanks", "appreciate"],
            "farewell": ["bye", "goodbye", "see you", "later"],
        }

    def detect_intent(self, message: str) -> Tuple[str, float]:
        """
        Detect user intent with confidence score
        Returns: (intent, confidence)
        """
        message_lower = message.lower()

        # Check cache
        cache_key = hashlib.md5(message_lower.encode()).hexdigest()
        if cache_key in self.intent_cache:
            return self.intent_cache[cache_key]

        scores = {}
        for intent, keywords in self.intents.items():
            score = sum(1 for keyword in keywords if keyword in message_lower)
            if score > 0:
                scores[intent] = score / len(keywords)

        if not scores:
            result = ("unknown", 0.0)
        else:
            intent = max(scores, key=scores.get)
            confidence = scores[intent]
            result = (intent, confidence)

        # Cache result
        self.intent_cache[cache_key] = result
        return result

    def extract_entities(self, message: str) -> Dict:
        """
        Extract key entities from message
        - Symptoms
        - Duration
        - Severity
        - Body parts
        """
        entities = {
            "symptoms": [],
            "duration": None,
            "severity": None,
            "body_parts": [],
            "medications": [],
        }

        message_lower = message.lower()

        # Symptom detection
        common_symptoms = [
            "fever",
            "cough",
            "headache",
            "pain",
            "nausea",
            "vomiting",
            "diarrhea",
            "fatigue",
            "dizziness",
            "rash",
            "swelling",
        ]
        entities["symptoms"] = [s for s in common_symptoms if s in message_lower]

        # Duration detection
        duration_patterns = ["day", "days", "week", "weeks", "month", "hour", "hours"]
        for pattern in duration_patterns:
            if pattern in message_lower:
                # Extract number before pattern
                words = message_lower.split()
                for i, word in enumerate(words):
                    if pattern in word and i > 0:
                        try:
                            num = int(words[i - 1])
                            entities["duration"] = f"{num} {pattern}"
                            break
                        except ValueError:
                            pass

        # Severity detection
        severity_keywords = {
            "mild": ["mild", "slight", "little"],
            "moderate": ["moderate", "medium", "average"],
            "severe": ["severe", "intense", "extreme", "unbearable", "terrible"],
        }
        for severity, keywords in severity_keywords.items():
            if any(kw in message_lower for kw in keywords):
                entities["severity"] = severity
                break

        # Body parts detection
        body_parts = [
            "head",
            "chest",
            "stomach",
            "abdomen",
            "back",
            "leg",
            "arm",
            "throat",
            "neck",
            "shoulder",
            "knee",
            "ankle",
            "foot",
            "hand",
        ]
        entities["body_parts"] = [part for part in body_parts if part in message_lower]

        return entities

    def analyze_sentiment(self, message: str) -> str:
        """
        Simple sentiment analysis
        Returns: positive, negative, neutral, anxious
        """
        message_lower = message.lower()

        positive_words = ["good", "better", "improving", "happy", "fine", "great"]
        negative_words = ["bad", "worse", "terrible", "awful", "horrible", "pain"]
        anxiety_words = ["worried", "scared", "anxious", "concerned", "afraid", "panic"]

        pos_count = sum(1 for word in positive_words if word in message_lower)
        neg_count = sum(1 for word in negative_words if word in message_lower)
        anx_count = sum(1 for word in anxiety_words if word in message_lower)

        if anx_count > 0:
            return "anxious"
        elif neg_count > pos_count:
            return "negative"
        elif pos_count > neg_count:
            return "positive"
        else:
            return "neutral"

    def generate_response(
        self,
        user_id: str,
        message: str,
        symptoms: List[str],
        severity: int,
        use_ai: bool = True,
    ) -> Dict:
        """
        Generate advanced response with context awareness
        """
        # Detect intent
        intent, confidence = self.detect_intent(message)

        # Extract entities
        entities = self.extract_entities(message)

        # Analyze sentiment
        sentiment = self.analyze_sentiment(message)

        # Get conversation history
        history = self.context_manager.get_history(user_id)
        context = self.context_manager.get_context(user_id)

        # Update context with new information
        if entities["symptoms"]:
            self.context_manager.update_context(
                user_id, "symptoms", entities["symptoms"]
            )
        if entities["severity"]:
            self.context_manager.update_context(
                user_id, "severity", entities["severity"]
            )

        # Generate response based on intent and context
        response_data = self._generate_contextual_response(
            user_id,
            message,
            intent,
            entities,
            sentiment,
            history,
            context,
            symptoms,
            severity,
        )

        # Try AI enhancement if available
        if use_ai and self.gemini and self.gemini.is_configured:
            try:
                # Build context for AI
                ai_context = self._build_ai_context(history, entities, sentiment)
                ai_response = self.gemini.chat_medical(message, symptoms, severity)

                if ai_response:
                    response_data["text"] = ai_response
                    response_data["ai_enhanced"] = True
            except Exception as e:
                print(f"AI enhancement failed, using fallback: {e}")
                response_data["ai_enhanced"] = False

        # Add message to history
        self.context_manager.add_message(
            user_id,
            "user",
            message,
            {"intent": intent, "sentiment": sentiment, "entities": entities},
        )
        self.context_manager.add_message(
            user_id,
            "assistant",
            response_data["text"],
            {"severity": severity, "type": response_data["type"]},
        )

        return response_data

    def _build_ai_context(
        self, history: List[Dict], entities: Dict, sentiment: str
    ) -> str:
        """Build context string for AI"""
        context_parts = []

        if history:
            context_parts.append(f"Previous messages: {len(history)}")

        if entities["symptoms"]:
            context_parts.append(
                f"Mentioned symptoms: {', '.join(entities['symptoms'])}"
            )

        if entities["duration"]:
            context_parts.append(f"Duration: {entities['duration']}")

        if sentiment != "neutral":
            context_parts.append(f"User sentiment: {sentiment}")

        return " | ".join(context_parts)

    def _generate_contextual_response(
        self,
        user_id: str,
        message: str,
        intent: str,
        entities: Dict,
        sentiment: str,
        history: List[Dict],
        context: Dict,
        symptoms: List[str],
        severity: int,
    ) -> Dict:
        """Generate response based on context and intent"""

        # Handle different intents
        if intent == "greeting":
            return self._handle_greeting(user_id, history)

        elif intent == "gratitude":
            return self._handle_gratitude()

        elif intent == "farewell":
            return self._handle_farewell(user_id)

        elif intent == "follow_up":
            return self._handle_follow_up(user_id, message, context)

        elif intent == "symptom_query" or severity > 0:
            return self._handle_medical_query(
                user_id, message, symptoms, severity, entities, sentiment, history
            )

        else:
            return self._handle_general_query(message)

    def _handle_greeting(self, user_id: str, history: List[Dict]) -> Dict:
        """Handle greeting intent"""
        if len(history) > 0:
            text = "Hello again! How can I help you today? Are your symptoms improving?"
        else:
            text = "Hello! I'm MedicSense AI, your medical assistant. How can I help you today?"

        return {
            "text": text,
            "type": "greeting",
            "severity": 0,
            "follow_up": ["Tell me about your symptoms", "I need medical advice"],
            "quick_actions": ["Report Symptoms", "Emergency", "Find Doctor"],
        }

    def _handle_gratitude(self) -> Dict:
        """Handle thank you messages"""
        return {
            "text": "You're welcome! I'm here to help anytime. Feel free to reach out if you have more questions or if your symptoms change. Stay healthy! 💚",
            "type": "acknowledgment",
            "severity": 0,
            "follow_up": ["Anything else I can help with?"],
        }

    def _handle_farewell(self, user_id: str) -> Dict:
        """Handle goodbye messages"""
        self.context_manager.clear_context(user_id)
        return {
            "text": "Take care and feel better soon! Remember, I'm always here if you need medical guidance. Goodbye! 👋",
            "type": "farewell",
            "severity": 0,
        }

    def _handle_follow_up(self, user_id: str, message: str, context: Dict) -> Dict:
        """Handle follow-up questions"""
        previous_symptoms = context.get("symptoms", [])

        if previous_symptoms:
            text = f"I understand you're still concerned about {', '.join(previous_symptoms)}. Let me provide more details..."
        else:
            text = "I'm here to help. Could you tell me more about what you're experiencing?"

        return {
            "text": text,
            "type": "follow_up",
            "severity": context.get("severity", 1),
            "follow_up": ["What specific information do you need?"],
        }

    def _handle_medical_query(
        self,
        user_id: str,
        message: str,
        symptoms: List[str],
        severity: int,
        entities: Dict,
        sentiment: str,
        history: List[Dict],
    ) -> Dict:
        """Handle medical queries with full context"""

        # Build comprehensive response
        symptom_list = symptoms if symptoms else entities.get("symptoms", [])
        duration_info = entities.get("duration", "")
        severity_info = entities.get("severity", "")

        # Adjust response based on sentiment
        empathy_prefix = ""
        if sentiment == "anxious":
            empathy_prefix = (
                "I understand you're worried. Let me help calm your concerns. "
            )
        elif sentiment == "negative":
            empathy_prefix = "I can see you're not feeling well. "

        # Check for recurring issues
        is_recurring = False
        if len(history) > 2:
            for msg in history[-3:]:
                if msg["role"] == "user" and any(
                    s in msg["content"].lower() for s in symptom_list
                ):
                    is_recurring = True
                    break

        recurring_note = ""
        if is_recurring:
            recurring_note = "\n\n⚠️ **Note**: I notice you've mentioned similar symptoms before. This may require professional medical evaluation to identify the underlying cause."

        # Generate response based on severity
        if severity == 1:
            text = f"""{empathy_prefix}Based on your symptoms ({', '.join(symptom_list)}){' for ' + duration_info if duration_info else ''}, this appears to be a mild condition.

**My Assessment:**
• Severity: Mild
• Likely manageable with self-care
• Monitor for changes

**Recommendations:**
1. **Rest**: Get adequate sleep (7-9 hours)
2. **Hydration**: Drink plenty of water
3. **Nutrition**: Eat balanced, light meals
4. **Monitor**: Keep track of symptom changes

**When to Seek Help:**
• Symptoms persist beyond 3-5 days
• Symptoms worsen significantly
• New concerning symptoms develop{recurring_note}

How are you feeling right now? Is there anything specific bothering you?"""

        elif severity == 2:
            text = f"""{empathy_prefix}Your symptoms ({', '.join(symptom_list)}){' lasting ' + duration_info if duration_info else ''} indicate a moderate condition that needs attention.

**My Assessment:**
• Severity: Moderate
• Medical consultation recommended
• Should not be ignored

**Immediate Actions:**
1. **Schedule Doctor Visit**: Within 24-48 hours
2. **Document Symptoms**: Note times, triggers, severity
3. **Avoid Self-Medication**: Wait for professional advice
4. **Rest**: Reduce physical activity

**Warning Signs** (Seek immediate care if you experience):
• Sudden worsening of symptoms
• High fever (>103°F/39.4°C)
• Difficulty breathing
• Severe pain{recurring_note}

Would you like help finding a suitable doctor in your area?"""

        elif severity == 3:
            text = f"""⚠️ **IMPORTANT MEDICAL ALERT**

{empathy_prefix}Your symptoms ({', '.join(symptom_list)}){' for ' + duration_info if duration_info else ''} are concerning and require prompt medical attention.

**Critical Assessment:**
• Severity: HIGH
• Professional evaluation needed within 24 hours
• Do not delay seeking care

**IMMEDIATE ACTIONS REQUIRED:**
1. **Contact Healthcare Provider TODAY**
   - Call your doctor immediately
   - If unavailable, visit urgent care
   - Do NOT wait to see if symptoms improve

2. **Prepare for Medical Visit:**
   - List all symptoms and when they started
   - Note any medications you're taking
   - Bring your medical history
   - Have someone accompany you if possible

3. **Monitor Closely:**
   - Watch for symptom progression
   - Keep emergency contacts ready
   - Prepare to call 911 if symptoms worsen{recurring_note}

**CALL 911 OR GO TO ER IF:**
• Chest pain or pressure
• Difficulty breathing or shortness of breath
• Severe bleeding
• Loss of consciousness
• Confusion or severe disorientation
• Sudden severe pain

This is serious. Please prioritize getting medical care TODAY. Can someone help you get to a doctor?"""

        else:  # severity >= 4 (Emergency)
            text = f"""🚨 **MEDICAL EMERGENCY - IMMEDIATE ACTION REQUIRED** 🚨

{empathy_prefix}

**CALL 911 OR GO TO NEAREST EMERGENCY ROOM IMMEDIATELY**

Your symptoms indicate a potentially life-threatening situation:
• {', '.join(symptom_list)}

**DO THIS RIGHT NOW:**
1. **Call 911** - Do not drive yourself
2. **Stay calm** - Help is coming
3. **Do not eat or drink** - May interfere with treatment
4. **Inform someone nearby** - You need help

**While Waiting for Help:**
• Stay in a safe, comfortable position
• Loosen tight clothing
• Do not leave the person alone
• Have medical information ready (allergies, medications, conditions)

**Critical Information to Provide to 911:**
• Your exact symptoms
• When symptoms started
• Any known medical conditions
• Current medications
• Any allergies

⚠️ **THIS IS A MEDICAL EMERGENCY. PROFESSIONAL EMERGENCY CARE IS ESSENTIAL.**

Are you able to call 911 right now? Is someone with you?"""

        return {
            "text": text,
            "type": "medical_advice",
            "severity": severity,
            "symptoms": symptom_list,
            "entities": entities,
            "sentiment": sentiment,
            "is_recurring": is_recurring,
            "follow_up": self._generate_follow_up_questions(severity, symptom_list),
            "quick_actions": self._generate_quick_actions(severity),
        }

    def _handle_general_query(self, message: str) -> Dict:
        """Handle non-medical queries"""
        return {
            "text": "I'm specifically designed to help with medical and health-related concerns. "
            "I can assist with:\n\n"
            "• Symptom analysis and guidance\n"
            "• Emergency medical advice\n"
            "• Doctor recommendations\n"
            "• Medication information\n"
            "• Health tracking\n\n"
            "What health concern can I help you with today?",
            "type": "redirect",
            "severity": 0,
            "follow_up": ["Tell me about your symptoms", "I need emergency help"],
        }

    def _generate_follow_up_questions(
        self, severity: int, symptoms: List[str]
    ) -> List[str]:
        """Generate relevant follow-up questions"""
        questions = []

        if severity <= 2:
            questions.extend(
                [
                    "How long have you had these symptoms?",
                    "Have you tried any remedies?",
                    "Are the symptoms getting better or worse?",
                ]
            )
        else:
            questions.extend(
                [
                    "Can you get to a doctor today?",
                    "Is someone with you?",
                    "Do you have transportation to emergency care?",
                ]
            )

        return questions

    def _generate_quick_actions(self, severity: int) -> List[str]:
        """Generate quick action buttons"""
        if severity <= 1:
            return ["Find Home Remedies", "Track Symptoms", "Schedule Checkup"]
        elif severity == 2:
            return ["Find Doctor", "Schedule Appointment", "Get Second Opinion"]
        elif severity == 3:
            return ["Find Urgent Care", "Call Doctor", "Emergency Contacts"]
        else:
            return ["Call 911", "Find ER", "Emergency Instructions"]

    def get_conversation_summary(self, user_id: str) -> Dict:
        """Get summary of conversation"""
        history = self.context_manager.get_history(user_id, limit=100)
        context = self.context_manager.get_context(user_id)

        if not history:
            return {"summary": "No conversation history"}

        return {
            "total_messages": len(history),
            "duration": f"{len(history)} exchanges",
            "main_symptoms": context.get("symptoms", []),
            "last_severity": context.get("severity"),
            "conversation_started": history[0]["timestamp"] if history else None,
            "last_updated": history[-1]["timestamp"] if history else None,
        }


# Global instance
advanced_chatbot = None


def get_advanced_chatbot(gemini_service=None):
    """Get or create advanced chatbot instance"""
    global advanced_chatbot
    if advanced_chatbot is None:
        advanced_chatbot = AdvancedChatbot(gemini_service)
    return advanced_chatbot
