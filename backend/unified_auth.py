"""
🔐 Unified Email Authentication - Seamless Sign-In/Sign-Up
Healthcare-compliant, privacy-preserving, confusion-free authentication

This module implements automatic email detection:
- If email exists → Sign in
- If email doesn't exist → Sign up automatically
- Frontend never knows the difference
- All errors are safe, calm, and non-diagnostic
"""

import time
import uuid
from datetime import datetime

from flask import jsonify, request
from password_utils import hash_password, validate_password_strength, verify_password


def register_unified_auth_route(app, db, otp_service):
    """
    Register unified authentication route that handles both sign-in and sign-up

    Args:
        app: Flask application instance
        db: Database instance
        otp_service: OTP service instance
    """

    @app.route("/api/auth/unified", methods=["POST"])
    def unified_email_auth():
        """
        Unified Email Authentication - Handles Both Sign-In and Sign-Up

        This endpoint automatically:
        1. Checks if email exists (server-side only)
        2. If exists: Verify password and log in
        3. If doesn't exist: Create account and log in
        4. Never expose which path was taken

        Request Body:
            {
                "email": "user@example.com",
                "password": "password123",
                "phoneCode": "+91",
                "phone": "1234567890",
                "name": "User Name" (optional, used for sign-up)
            }

        Response:
            {
                "success": true/false,
                "message": "Success message or safe error",
                "user": {user_data},
                "token": "session_token",
                "action": "signed_in" / "signed_up" / "retry"
            }
        """
        try:
            data = request.json
            email = data.get("email", "").strip().lower()
            password = data.get("password", "")
            phone_code = data.get("phoneCode", "+91")
            phone = data.get("phone", "").strip()
            name = data.get("name", "").strip()

            # Validation
            if not all([email, password, phone]):
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide email, password, and phone number.",
                            "action": "complete_form",
                        }
                    ),
                    400,
                )

            # Basic email format validation
            if "@" not in email or "." not in email:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please enter a valid email address.",
                            "action": "check_email",
                        }
                    ),
                    400,
                )

            full_phone = phone_code + phone

            # Prevent timing attacks - start timer
            start_time = time.time()

            # ============================================
            # STEP 1: CHECK IF USER EXISTS (SERVER-SIDE ONLY)
            # ============================================
            existing_user = db.get_user_by_email(email)

            if existing_user:
                # ============================================
                # PATH A: USER EXISTS → SIGN IN
                # ============================================

                # Check auth method
                if existing_user.get("auth_method") != "email_password":
                    # User signed up with Google
                    time.sleep(max(0, 0.1 - (time.time() - start_time)))

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "We couldn't sign you in with those details. Please try 'Continue with Google' or contact support.",
                                "action": "use_google",
                            }
                        ),
                        401,
                    )

                # Verify password
                if not verify_password(
                    password, existing_user.get("password_hash", "")
                ):
                    time.sleep(max(0, 0.1 - (time.time() - start_time)))

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "We couldn't sign you in with those details. Please try again or reset your password.",
                                "action": "retry_or_reset",
                            }
                        ),
                        401,
                    )

                # Verify phone matches (or update if missing)
                if (
                    existing_user.get("phone")
                    and existing_user.get("phone") != full_phone
                ):
                    time.sleep(max(0, 0.1 - (time.time() - start_time)))

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "Phone number doesn't match our records. Please use the registered phone number.",
                                "action": "check_phone",
                            }
                        ),
                        401,
                    )

                # Update phone if it was missing
                if not existing_user.get("phone"):
                    db.update_user_phone(existing_user["id"], full_phone)

                # Send OTP for 2FA
                otp_result = otp_service.send_otp(full_phone)

                if not otp_result["success"]:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "We couldn't send the verification code. Please try again.",
                                "action": "retry",
                            }
                        ),
                        500,
                    )

                # Ensure consistent timing
                time.sleep(max(0, 0.1 - (time.time() - start_time)))

                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Verification code sent. Please check your phone.",
                            "action": "verify_otp",
                            "require_otp": True,
                            "user_id": existing_user["id"],
                            "phone": full_phone,
                        }
                    ),
                    200,
                )

            else:
                # ============================================
                # PATH B: USER DOESN'T EXIST → SIGN UP
                # ============================================

                # Validate password strength
                password_validation = validate_password_strength(password)
                if not password_validation["valid"]:
                    time.sleep(max(0, 0.1 - (time.time() - start_time)))

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"Please choose a stronger password. {password_validation['message']}",
                                "action": "improve_password",
                                "requirements": password_validation.get(
                                    "requirements", []
                                ),
                            }
                        ),
                        400,
                    )

                # Check if phone is already used
                existing_phone_user = db.get_user_by_phone(full_phone)
                if existing_phone_user:
                    time.sleep(max(0, 0.1 - (time.time() - start_time)))

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "This phone number is already registered. Please sign in or use a different number.",
                                "action": "use_different_phone",
                            }
                        ),
                        409,
                    )

                # Hash password
                password_hash = hash_password(password)

                # Generate user ID
                user_id = f"user_{uuid.uuid4().hex[:12]}"

                # Create user account
                new_user = {
                    "id": user_id,
                    "email": email,
                    "name": name or email.split("@")[0].capitalize(),
                    "phone": full_phone,
                    "password_hash": password_hash,
                    "auth_method": "email_password",
                    "created_at": datetime.now().isoformat(),
                    "email_verified": False,
                    "phone_verified": False,
                }

                # Save to database
                db.create_user(new_user)

                # Send OTP for verification
                otp_result = otp_service.send_otp(full_phone)

                if not otp_result["success"]:
                    # Rollback user creation if OTP fails
                    db.delete_user(user_id)

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "We couldn't create your account right now. Please try again or use Google sign-in.",
                                "action": "retry_or_google",
                            }
                        ),
                        500,
                    )

                # Ensure consistent timing
                time.sleep(max(0, 0.1 - (time.time() - start_time)))

                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Account created! Verification code sent to your phone.",
                            "action": "verify_otp",
                            "require_otp": True,
                            "user_id": user_id,
                            "phone": full_phone,
                            "new_user": True,
                        }
                    ),
                    201,
                )

        except Exception as e:
            print(f"❌ Unified auth error: {e}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Something went wrong. Please try again or use Google sign-in.",
                        "action": "retry",
                    }
                ),
                500,
            )
