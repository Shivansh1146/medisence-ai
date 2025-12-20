"""
Professional OTP Service for MedicSense AI
Handles OTP generation, verification, and SMS delivery
"""

import hashlib
import os
import random
import time
from datetime import datetime, timedelta
from typing import Dict, Optional

# OTP Storage (In production, use Redis or database)
otp_store: Dict[str, Dict] = {}


class OTPService:
    """
    Professional OTP Service
    - Generates secure 6-digit OTPs
    - Handles OTP verification
    - Rate limiting
    - Expiration management
    """

    def __init__(self):
        self.otp_length = 6
        self.otp_expiry_minutes = 5
        self.max_attempts = 3
        self.rate_limit_seconds = 60  # 1 OTP per minute

    def generate_otp(self, phone: str) -> Dict:
        """
        Generate a new OTP for phone number

        Args:
            phone: Phone number with country code (+91XXXXXXXXXX)

        Returns:
            dict with status and message
        """
        try:
            # Check rate limiting
            if phone in otp_store:
                last_sent = otp_store[phone].get("sent_at")
                if last_sent:
                    time_diff = (datetime.now() - last_sent).seconds
                    if time_diff < self.rate_limit_seconds:
                        remaining = self.rate_limit_seconds - time_diff
                        return {
                            "success": False,
                            "message": f"Please wait {remaining} seconds before requesting new OTP",
                        }

            # Generate 6-digit OTP
            otp = "".join([str(random.randint(0, 9)) for _ in range(self.otp_length)])

            # Calculate expiry time
            expiry_time = datetime.now() + timedelta(minutes=self.otp_expiry_minutes)

            # Store OTP with metadata
            otp_store[phone] = {
                "otp": self._hash_otp(otp),
                "plain_otp": otp,  # For demo - Remove in production
                "sent_at": datetime.now(),
                "expires_at": expiry_time,
                "attempts": 0,
                "verified": False,
            }

            # In production, send SMS here
            sms_sent = self._send_sms(phone, otp)

            return {
                "success": True,
                "message": "OTP sent successfully",
                "otp": otp,  # For demo - Remove in production
                "expires_in": self.otp_expiry_minutes * 60,  # seconds
                "phone": phone,
            }

        except Exception as e:
            return {"success": False, "message": f"Failed to generate OTP: {str(e)}"}

    def verify_otp(self, phone: str, otp: str) -> Dict:
        """
        Verify OTP for phone number

        Args:
            phone: Phone number
            otp: OTP to verify

        Returns:
            dict with verification status
        """
        try:
            # Check if OTP exists
            if phone not in otp_store:
                return {
                    "success": False,
                    "message": "No OTP found. Please request a new one.",
                }

            otp_data = otp_store[phone]

            # Check if already verified
            if otp_data.get("verified"):
                return {
                    "success": False,
                    "message": "OTP already used. Please request a new one.",
                }

            # Check attempts
            if otp_data["attempts"] >= self.max_attempts:
                # Delete OTP after max attempts
                del otp_store[phone]
                return {
                    "success": False,
                    "message": "Maximum attempts exceeded. Please request a new OTP.",
                }

            # Check expiry
            if datetime.now() > otp_data["expires_at"]:
                del otp_store[phone]
                return {
                    "success": False,
                    "message": "OTP expired. Please request a new one.",
                }

            # Increment attempts
            otp_store[phone]["attempts"] += 1

            # Verify OTP
            if self._hash_otp(otp) == otp_data["otp"]:
                # Mark as verified
                otp_store[phone]["verified"] = True
                return {
                    "success": True,
                    "message": "OTP verified successfully",
                    "phone": phone,
                }
            else:
                remaining_attempts = self.max_attempts - otp_data["attempts"]
                return {
                    "success": False,
                    "message": f"Invalid OTP. {remaining_attempts} attempts remaining.",
                }

        except Exception as e:
            return {"success": False, "message": f"Verification failed: {str(e)}"}

    def resend_otp(self, phone: str) -> Dict:
        """Resend OTP to phone number"""
        # Delete old OTP
        if phone in otp_store:
            del otp_store[phone]

        # Generate new OTP
        return self.generate_otp(phone)

    def _hash_otp(self, otp: str) -> str:
        """Hash OTP for secure storage"""
        return hashlib.sha256(otp.encode()).hexdigest()

    def _send_sms(self, phone: str, otp: str) -> bool:
        """
        Send SMS with OTP

        In production, integrate with:
        - Twilio
        - MSG91
        - AWS SNS
        - Firebase Cloud Messaging
        """
        try:
            # Demo mode - just print
            print(
                f"📱 SMS to {phone}: Your MedicSense AI OTP is {otp}. Valid for {self.otp_expiry_minutes} minutes."
            )

            # Production code example (Twilio):
            # from twilio.rest import Client
            # client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
            # message = client.messages.create(
            #     body=f"Your MedicSense AI OTP is {otp}. Valid for {self.otp_expiry_minutes} minutes.",
            #     from_=os.getenv('TWILIO_PHONE_NUMBER'),
            #     to=phone
            # )

            return True
        except Exception as e:
            print(f"❌ SMS send failed: {e}")
            return False

    def cleanup_expired(self):
        """Clean up expired OTPs"""
        now = datetime.now()
        expired_phones = [
            phone for phone, data in otp_store.items() if now > data["expires_at"]
        ]
        for phone in expired_phones:
            del otp_store[phone]
        return len(expired_phones)


# Global instance
otp_service = OTPService()
