"""
Enhanced Authentication Module for MedicSense AI
Handles user sessions, tokens, and authentication
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict

class AuthManager:
    """Manage user authentication and sessions"""
    
    def __init__(self):
        self.sessions = {}  # Store active sessions in memory
        self.session_duration = timedelta(hours=24)  # 24 hour sessions
    
    def generate_token(self) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    def generate_user_id(self, phone: str) -> str:
        """Generate a unique user ID from phone number"""
        # Create hash of phone number
        hash_object = hashlib.sha256(phone.encode())
        return f"user_{hash_object.hexdigest()[:16]}"
    
    def create_session(self, user_id: str, user_data: Dict) -> Dict:
        """Create a new session for user"""
        token = self.generate_token()
        
        session = {
            "token": token,
            "user_id": user_id,
            "user_data": user_data,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + self.session_duration
        }
        
        self.sessions[token] = session
        return session
    
    def validate_session(self, token: str) -> Optional[Dict]:
        """Validate a session token"""
        session = self.sessions.get(token)
        
        if not session:
            return None
        
        # Check if expired
        if datetime.now() > session["expires_at"]:
            del self.sessions[token]
            return None
        
        # Extend session
        session["expires_at"] = datetime.now() + self.session_duration
        return session
    
    def get_user_from_token(self, token: str) -> Optional[str]:
        """Get user ID from session token"""
        session = self.validate_session(token)
        return session["user_id"] if session else None
    
    def destroy_session(self, token: str) -> bool:
        """Destroy a session (logout)"""
        if token in self.sessions:
            del self.sessions[token]
            return True
        return False
    
    def cleanup_expired_sessions(self):
        """Remove all expired sessions"""
        current_time = datetime.now()
        expired_tokens = [
            token for token, session in self.sessions.items()
            if current_time > session["expires_at"]
        ]
        
        for token in expired_tokens:
            del self.sessions[token]
        
        return len(expired_tokens)

# Singleton instance
auth_manager = AuthManager()
