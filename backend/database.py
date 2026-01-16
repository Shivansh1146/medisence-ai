"""
Database Module for MedicSense AI
Handles all data storage and retrieval operations
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class Database:
    """Simple JSON-based database for storing user data"""

    def __init__(self):
        self.data_dir = "data"
        self.ensure_data_directory()

        # Database files
        self.users_file = os.path.join(self.data_dir, "users.json")
        self.conversations_file = os.path.join(self.data_dir, "conversations.json")
        self.appointments_file = os.path.join(self.data_dir, "appointments.json")
        self.health_records_file = os.path.join(self.data_dir, "health_records.json")

        self.initialize_databases()

    def ensure_data_directory(self):
        """Create data directory if it doesn't exist"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def initialize_databases(self):
        """Initialize all database files"""
        databases = {
            self.users_file: {},
            self.conversations_file: {},
            self.appointments_file: [],
            self.health_records_file: {},
        }

        for db_file, default_data in databases.items():
            if not os.path.exists(db_file):
                self.save_json(db_file, default_data)

    def load_json(self, filepath: str) -> dict:
        """Load data from JSON file"""
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {} if filepath != self.appointments_file else []

    def save_json(self, filepath: str, data: dict):
        """Save data to JSON file"""
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

    # User operations
    def create_user(self, user_id: str, user_data: Dict) -> Dict:
        """
        Create a new user with authentication method tracking

        Args:
            user_id: Unique user identifier
            user_data: Dict containing:
                - email: str (required)
                - phone: str (required for email_password, optional for google initially)
                - name: str (required)
                - auth_method: 'google' | 'email_password' | 'both' (required)
                - password_hash: str (required for email_password)
                - google_id: str (required for google)
                - google_email: str (optional for google)

        Returns:
            Created user record
        """
        users = self.load_json(self.users_file)

        # Build base user record
        user_record = {
            "user_id": user_id,
            "email": user_data["email"].lower().strip(),
            "phone": user_data.get("phone", ""),
            "name": user_data.get("name", ""),
            "auth_method": user_data["auth_method"],
            "created_at": datetime.now().isoformat(),
            "last_active": datetime.now().isoformat(),
            "account_status": "active",
        }

        # Add password hash for email_password users
        if user_data["auth_method"] in ["email_password", "both"]:
            if "password_hash" not in user_data:
                raise ValueError("password_hash required for email_password auth")
            user_record["password_hash"] = user_data["password_hash"]

        # Add Google-specific fields
        if user_data["auth_method"] in ["google", "both"]:
            if "google_id" not in user_data:
                raise ValueError("google_id required for google auth")
            user_record["google_id"] = user_data["google_id"]
            user_record["google_email"] = user_data.get(
                "google_email", user_data["email"]
            )

        users[user_id] = user_record
        self.save_json(self.users_file, users)
        return user_record

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        users = self.load_json(self.users_file)
        return users.get(user_id)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """
        Get user by email (case-insensitive)

        Args:
            email: Email address to search for

        Returns:
            User dict if found, None otherwise
        """
        users = self.load_json(self.users_file)
        email_lower = email.lower().strip()

        for user_id, user_data in users.items():
            if user_data.get("email", "").lower() == email_lower:
                return user_data
        return None

    def get_user_by_google_id(self, google_id: str) -> Optional[Dict]:
        """
        Get user by Google provider ID

        Args:
            google_id: Google user ID (sub claim from ID token)

        Returns:
            User dict if found, None otherwise
        """
        users = self.load_json(self.users_file)

        for user_id, user_data in users.items():
            if user_data.get("google_id") == google_id:
                return user_data
        return None

    def get_user_by_phone(self, phone: str) -> Optional[Dict]:
        """
        Get user by phone number

        Args:
            phone: Phone number (with country code)

        Returns:
            User dict if found, None otherwise
        """
        users = self.load_json(self.users_file)

        for user_id, user_data in users.items():
            if user_data.get("phone") == phone:
                return user_data
        return None

    def update_user(self, user_id: str, updates: Dict):
        """Update user information"""
        users = self.load_json(self.users_file)
        if user_id in users:
            users[user_id].update(updates)
            users[user_id]["last_active"] = datetime.now().isoformat()
            self.save_json(self.users_file, users)

    # Conversation operations
    def save_conversation(
        self, user_id: str, message: str, response: str, severity: int
    ):
        """Save a conversation message"""
        conversations = self.load_json(self.conversations_file)

        if user_id not in conversations:
            conversations[user_id] = []

        conversations[user_id].append(
            {
                "timestamp": datetime.now().isoformat(),
                "message": message,
                "response": response,
                "severity": severity,
            }
        )

        # Keep only last 50 messages per user
        conversations[user_id] = conversations[user_id][-50:]

        self.save_json(self.conversations_file, conversations)

    def get_conversations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a user"""
        conversations = self.load_json(self.conversations_file)
        user_conversations = conversations.get(user_id, [])
        return user_conversations[-limit:]

    # Appointment operations
    def create_appointment(self, appointment_data: Dict) -> Dict:
        """Create a new appointment"""
        appointments = self.load_json(self.appointments_file)

        appointment = {
            "id": f"apt_{len(appointments) + 1}",
            "user_id": appointment_data["user_id"],
            "doctor_name": appointment_data["doctor_name"],
            "specialty": appointment_data.get("specialty", "General"),
            "date": appointment_data["date"],
            "time": appointment_data["time"],
            "symptoms": appointment_data.get("symptoms", []),
            "status": "scheduled",
            "created_at": datetime.now().isoformat(),
        }

        appointments.append(appointment)
        self.save_json(self.appointments_file, appointments)
        return appointment

    def get_appointments(self, user_id: str) -> List[Dict]:
        """Get all appointments for a user"""
        appointments = self.load_json(self.appointments_file)
        return [apt for apt in appointments if apt["user_id"] == user_id]

    def cancel_appointment(self, appointment_id: str) -> bool:
        """Cancel an appointment"""
        appointments = self.load_json(self.appointments_file)

        for apt in appointments:
            if apt["id"] == appointment_id:
                apt["status"] = "cancelled"
                apt["cancelled_at"] = datetime.now().isoformat()
                self.save_json(self.appointments_file, appointments)
                return True
        return False

    # Health records operations
    def save_health_record(self, user_id: str, record_type: str, data: Dict):
        """Save health record (vitals, symptoms, etc.)"""
        records = self.load_json(self.health_records_file)

        if user_id not in records:
            records[user_id] = {
                "vitals": [],
                "symptoms": [],
                "medications": [],
                "allergies": [],
            }

        if record_type not in records[user_id]:
            records[user_id][record_type] = []

        data["timestamp"] = datetime.now().isoformat()
        records[user_id][record_type].append(data)

        # Keep only last 30 records
        records[user_id][record_type] = records[user_id][record_type][-30:]

        self.save_json(self.health_records_file, records)

    def get_health_records(
        self, user_id: str, record_type: Optional[str] = None
    ) -> Dict:
        """Get health records for a user"""
        records = self.load_json(self.health_records_file)
        user_records = records.get(user_id, {})

        if record_type:
            return user_records.get(record_type, [])
        return user_records

    # User management operations
    def update_user_phone(self, user_id: str, phone: str) -> bool:
        """Update user phone number"""
        users = self.load_json(self.users_file)

        if user_id in users:
            users[user_id]["phone"] = phone
            users[user_id]["updated_at"] = datetime.now().isoformat()
            self.save_json(self.users_file, users)
            return True
        return False

    def delete_user(self, user_id: str) -> bool:
        """Delete user account (for rollback scenarios)"""
        users = self.load_json(self.users_file)

        if user_id in users:
            del users[user_id]
            self.save_json(self.users_file, users)
            return True
        return False


# Singleton instance
db = Database()
