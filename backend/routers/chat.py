from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add project root to sys.path to allow importing from ai module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai import triage_service

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    intent: str
    response: dict

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # 1. Detect Intent
    intent_data = await triage_service.detect_intent(request.message)
    intent = intent_data.get("intent", "general_chat")

    # 2. Handle Intent
    if intent == "symptom_triage":
        triage_result = await triage_service.analyze_symptoms(request.message)
        return ChatResponse(intent=intent, response=triage_result)
    
    elif intent == "appointment_booking":
        # For now, just return a placeholder. In a real app, this would trigger a booking flow.
        return ChatResponse(intent=intent, response={"message": "I can help you book an appointment. Please provide your preferred date and time."})
    
    else:
        # General chat or fallback
        return ChatResponse(intent="general_chat", response={"message": "I'm here to help with your health concerns. Please describe your symptoms or ask about appointments."})
