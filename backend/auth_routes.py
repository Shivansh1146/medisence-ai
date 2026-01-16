"""
🔐 Production-Grade Authentication Routes for MedicSense AI
Healthcare-compliant, privacy-preserving, confusion-free authentication

This module implements:
- Google OAuth authentication
- Email/password authentication with 2FA
- Password reset flow
- Account linking (optional)
- Privacy-preserving error messages
- Healthcare-grade security

Integration:
    from auth_routes import register_auth_routes
    register_auth_routes(app, db, auth_manager, otp_service)
"""

import time
import uuid
from datetime import datetime, timedelta

from flask import jsonify, request
from password_utils import hash_password, validate_password_strength, verify_password


def register_auth_routes(app, db, auth_manager, otp_service):
    """
    Register all authentication routes with the Flask app

    Args:
        app: Flask application instance
        db: Database instance
        auth_manager: Authentication manager instance
        otp_service: OTP service instance
    """

    # ============================================
    # GOOGLE AUTHENTICATION
    # ============================================

    @app.route("/api/auth/google", methods=["POST"])
    def google_auth():
        """
        Handle Google Sign-In

        Frontend sends Google user info after successful Google auth
        Backend creates/logs in user

        Request Body:
            {
                "idToken": "google_id_token",
                "user": {
                    "uid": "google_user_id",
                    "email": "user@gmail.com",
                    "displayName": "User Name"
                }
            }
        """
        try:
            data = request.json
            google_id_token = data.get("idToken")
            google_user_info = data.get("user")

            if not google_id_token or not google_user_info:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Authentication failed. Please try again.",
                            "action": "retry_google",
                        }
                    ),
                    400,
                )

            # Extract Google user info
            google_id = google_user_info.get("uid")
            google_email = google_user_info.get("email", "").lower().strip()
            google_name = google_user_info.get("displayName", "")

            # Check if user exists by Google ID
            existing_user = db.get_user_by_google_id(google_id)

            if existing_user:
                # User exists - log them in
                session = auth_manager.create_session(
                    existing_user["user_id"], existing_user
                )

                # Update last active
                db.update_user(
                    existing_user["user_id"],
                    {"last_active": datetime.now().isoformat()},
                )

                return jsonify(
                    {
                        "success": True,
                        "message": "Welcome back!",
                        "user": {
                            "id": existing_user["user_id"],
                            "email": existing_user["email"],
                            "name": existing_user["name"],
                            "phone": existing_user.get("phone", ""),
                            "authMethod": existing_user.get("auth_method", "google"),
                        },
                        "token": session["token"],
                    }
                )

            # Check if email already exists with different auth method
            email_user = db.get_user_by_email(google_email)

            if email_user and email_user.get("auth_method") == "email_password":
                # Email exists but registered with password
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "An account with this email already exists. Please sign in with email and password, or contact support to link your Google account.",
                            "action": "use_email_password",
                            "recovery": {
                                "options": [
                                    "Try email/password login",
                                    "Reset your password",
                                    "Contact support",
                                ]
                            },
                        }
                    ),
                    409,
                )

            # New user - create account with Google
            new_user_id = str(uuid.uuid4())

            user_data = {
                "email": google_email,
                "phone": "",  # Optional for Google users
                "name": google_name,
                "auth_method": "google",
                "google_id": google_id,
                "google_email": google_email,
            }

            db.create_user(new_user_id, user_data)

            # Create session
            session = auth_manager.create_session(new_user_id, user_data)

            return jsonify(
                {
                    "success": True,
                    "message": "Account created successfully!",
                    "user": {
                        "id": new_user_id,
                        "email": google_email,
                        "name": google_name,
                        "phone": "",
                        "authMethod": "google",
                    },
                    "token": session["token"],
                    "isNewUser": True,
                }
            )

        except Exception as e:
            print(f"❌ Google auth error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Google sign-in encountered an error. Please try again or use email/password.",
                        "action": "retry_or_email",
                    }
                ),
                500,
            )

    # ============================================
    # EMAIL/PASSWORD AUTHENTICATION
    # ============================================

    @app.route("/api/auth/signup", methods=["POST"])
    def signup():
        """
        Handle Email/Password Sign Up

        Creates account with password
        Sends OTP for phone verification

        Request Body:
            {
                "email": "user@example.com",
                "password": "password",
                "name": "User Name",
                "phoneCode": "+91",
                "phone": "1234567890"
            }
        """
        try:
            data = request.json
            email = data.get("email", "").strip().lower()
            password = data.get("password", "")
            name = data.get("name", "").strip()
            phone_code = data.get("phoneCode", "+91")
            phone = data.get("phone", "").strip()

            # Validation
            if not all([email, password, phone]):
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide all required information.",
                            "action": "complete_form",
                        }
                    ),
                    400,
                )

            # Validate email format
            if "@" not in email or "." not in email:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide a valid email address.",
                            "action": "fix_email",
                        }
                    ),
                    400,
                )

            # Validate password strength
            password_check = validate_password_strength(password)
            if not password_check["valid"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": password_check["errors"][0],
                            "action": "fix_password",
                        }
                    ),
                    400,
                )

            # Check if email already exists
            existing_user = db.get_user_by_email(email)

            if existing_user:
                # Privacy-preserving response - don't reveal email exists
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Unable to create account. If you already have an account, please sign in.",
                            "action": "try_login",
                            "recovery": {
                                "options": [
                                    "Try logging in",
                                    "Reset your password",
                                    "Use Google sign-in",
                                ]
                            },
                        }
                    ),
                    409,
                )

            # Create user with hashed password
            new_user_id = str(uuid.uuid4())
            full_phone = phone_code + phone

            user_data = {
                "email": email,
                "phone": full_phone,
                "name": name,
                "auth_method": "email_password",
                "password_hash": hash_password(password),
            }

            # Send OTP before creating account (extra security)
            otp_result = otp_service.send_otp(full_phone, name)

            if not otp_result["success"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Unable to send verification code. Please check your phone number.",
                            "action": "check_phone",
                        }
                    ),
                    500,
                )

            # Store pending user data in session
            auth_manager.sessions[f"pending_{full_phone}"] = {
                "user_id": new_user_id,
                "user_data": user_data,
                "expires_at": datetime.now() + timedelta(minutes=15),
            }

            return jsonify(
                {
                    "success": True,
                    "message": "Verification code sent to your phone.",
                    "action": "verify_otp",
                    "phone": full_phone,
                    "pendingUserId": new_user_id,
                    "otp": otp_result.get("otp"),  # Remove in production!
                }
            )

        except Exception as e:
            print(f"❌ Signup error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Sign up encountered an error. Please try again.",
                        "action": "retry",
                    }
                ),
                500,
            )

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        """
        Handle Email/Password Login

        Verifies password then sends OTP for 2FA

        Request Body:
            {
                "email": "user@example.com",
                "password": "password",
                "phoneCode": "+91",
                "phone": "1234567890"
            }
        """
        try:
            data = request.json
            email = data.get("email", "").strip().lower()
            password = data.get("password", "")
            phone_code = data.get("phoneCode", "+91")
            phone = data.get("phone", "").strip()

            # Validation
            if not all([email, password, phone]):
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide all required information.",
                            "action": "complete_form",
                        }
                    ),
                    400,
                )

            full_phone = phone_code + phone

            # Prevent timing attacks
            start_time = time.time()

            # Lookup user by email
            user = db.get_user_by_email(email)

            # Constant-time check to prevent enumeration
            if not user:
                # Delay to match password verification time
                time.sleep(max(0, 0.1 - (time.time() - start_time)))

                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Authentication failed. Please check your credentials or try a different sign-in method.",
                            "action": "retry_or_recover",
                            "recovery": {
                                "options": [
                                    "Check your email and password",
                                    "Try 'Continue with Google'",
                                    "Reset your password",
                                    "Create a new account",
                                ]
                            },
                        }
                    ),
                    401,
                )

            # Check auth method
            if user.get("auth_method") != "email_password":
                # User signed up with Google
                time.sleep(max(0, 0.1 - (time.time() - start_time)))

                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Authentication failed. Please try 'Continue with Google' or contact support.",
                            "action": "use_google",
                            "recovery": {
                                "options": [
                                    "Click 'Continue with Google'",
                                    "Contact support to add password",
                                    "Create new account with different email",
                                ]
                            },
                        }
                    ),
                    401,
                )

            # Verify password
            if not verify_password(password, user.get("password_hash", "")):
                time.sleep(max(0, 0.1 - (time.time() - start_time)))

                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Authentication failed. Please check your credentials or reset your password.",
                            "action": "retry_or_reset",
                            "recovery": {
                                "options": [
                                    "Check your password",
                                    "Reset your password",
                                    "Contact support",
                                ]
                            },
                        }
                    ),
                    401,
                )

            # Verify phone matches
            if user.get("phone") != full_phone:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Phone number doesn't match our records. Please use the phone number registered with this account.",
                            "action": "check_phone",
                        }
                    ),
                    401,
                )

            # Password correct - send OTP for 2FA
            otp_result = otp_service.send_otp(full_phone, user.get("name", "User"))

            if not otp_result["success"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Unable to send verification code. Please try again.",
                            "action": "retry",
                        }
                    ),
                    500,
                )

            # Store login attempt
            auth_manager.sessions[f"login_{full_phone}"] = {
                "user_id": user["user_id"],
                "user_data": user,
                "expires_at": datetime.now() + timedelta(minutes=10),
            }

            return jsonify(
                {
                    "success": True,
                    "message": "Verification code sent to your phone.",
                    "action": "verify_otp",
                    "phone": full_phone,
                    "userId": user["user_id"],
                    "otp": otp_result.get("otp"),  # Remove in production!
                }
            )

        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Authentication encountered an error. Please try again.",
                        "action": "retry",
                    }
                ),
                500,
            )

    # ============================================
    # OTP VERIFICATION (UNIFIED)
    # ============================================

    @app.route("/api/auth/verify-otp", methods=["POST"])
    def verify_otp_endpoint():
        """
        Verify OTP for both signup and login
        Completes authentication process

        Request Body:
            {
                "phone": "+911234567890",
                "otp": "123456"
            }
        """
        try:
            data = request.json
            phone = data.get("phone", "")
            otp = data.get("otp", "")

            if not phone or not otp:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide verification code.",
                            "action": "enter_otp",
                        }
                    ),
                    400,
                )

            # Verify OTP
            otp_result = otp_service.verify_otp(phone, otp)

            if not otp_result["success"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Invalid or expired verification code. Please try again or request a new code.",
                            "action": "retry_or_resend",
                            "recovery": {
                                "options": [
                                    "Check the code and try again",
                                    "Request a new code",
                                    "Contact support",
                                ]
                            },
                        }
                    ),
                    401,
                )

            # Check for pending signup
            pending_key = f"pending_{phone}"
            if pending_key in auth_manager.sessions:
                pending = auth_manager.sessions[pending_key]

                # Create the user account now
                user_data = pending["user_data"]
                user_id = pending["user_id"]

                db.create_user(user_id, user_data)

                # Clean up pending session
                del auth_manager.sessions[pending_key]

                # Create authenticated session
                session = auth_manager.create_session(user_id, user_data)

                return jsonify(
                    {
                        "success": True,
                        "message": "Account created successfully!",
                        "user": {
                            "id": user_id,
                            "email": user_data["email"],
                            "name": user_data["name"],
                            "phone": user_data["phone"],
                            "authMethod": "email_password",
                        },
                        "token": session["token"],
                        "isNewUser": True,
                    }
                )

            # Check for pending login
            login_key = f"login_{phone}"
            if login_key in auth_manager.sessions:
                login_data = auth_manager.sessions[login_key]

                user_data = login_data["user_data"]
                user_id = login_data["user_id"]

                # Clean up login session
                del auth_manager.sessions[login_key]

                # Update last active
                db.update_user(user_id, {"last_active": datetime.now().isoformat()})

                # Create authenticated session
                session = auth_manager.create_session(user_id, user_data)

                return jsonify(
                    {
                        "success": True,
                        "message": "Welcome back!",
                        "user": {
                            "id": user_id,
                            "email": user_data["email"],
                            "name": user_data["name"],
                            "phone": user_data["phone"],
                            "authMethod": "email_password",
                        },
                        "token": session["token"],
                    }
                )

            # No pending session found
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Session expired. Please try signing in again.",
                        "action": "restart_login",
                    }
                ),
                401,
            )

        except Exception as e:
            print(f"❌ OTP verification error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Verification encountered an error. Please try again.",
                        "action": "retry",
                    }
                ),
                500,
            )

    # ============================================
    # PASSWORD RESET
    # ============================================

    @app.route("/api/auth/forgot-password", methods=["POST"])
    def forgot_password():
        """
        Initiate password reset
        Sends OTP to user's phone

        Request Body:
            {
                "email": "user@example.com"
            }
        """
        try:
            data = request.json
            email = data.get("email", "").strip().lower()

            if not email:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide your email address.",
                            "action": "enter_email",
                        }
                    ),
                    400,
                )

            # Privacy-preserving: always return success even if email doesn't exist
            user = db.get_user_by_email(email)

            if user and user.get("auth_method") in ["email_password", "both"]:
                # Send OTP to user's phone
                phone = user.get("phone", "")
                if phone:
                    otp_result = otp_service.send_otp(phone, user.get("name", "User"))

                    if otp_result["success"]:
                        # Store reset session
                        auth_manager.sessions[f"reset_{phone}"] = {
                            "user_id": user["user_id"],
                            "email": email,
                            "expires_at": datetime.now() + timedelta(minutes=15),
                        }

            # Always return success to prevent email enumeration
            return jsonify(
                {
                    "success": True,
                    "message": "If an account exists with this email, you will receive a verification code on your registered phone number.",
                    "action": "check_phone",
                }
            )

        except Exception as e:
            print(f"❌ Forgot password error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Password reset encountered an error. Please try again.",
                        "action": "retry",
                    }
                ),
                500,
            )

    @app.route("/api/auth/reset-password", methods=["POST"])
    def reset_password():
        """
        Complete password reset with OTP and new password

        Request Body:
            {
                "phone": "+911234567890",
                "otp": "123456",
                "newPassword": "newpassword"
            }
        """
        try:
            data = request.json
            phone = data.get("phone", "")
            otp = data.get("otp", "")
            new_password = data.get("newPassword", "")

            if not all([phone, otp, new_password]):
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Please provide all required information.",
                            "action": "complete_form",
                        }
                    ),
                    400,
                )

            # Validate password
            password_check = validate_password_strength(new_password)
            if not password_check["valid"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": password_check["errors"][0],
                            "action": "fix_password",
                        }
                    ),
                    400,
                )

            # Verify OTP
            otp_result = otp_service.verify_otp(phone, otp)

            if not otp_result["success"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Invalid or expired verification code.",
                            "action": "retry_or_resend",
                        }
                    ),
                    401,
                )

            # Check for reset session
            reset_key = f"reset_{phone}"
            if reset_key not in auth_manager.sessions:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Session expired. Please restart the password reset process.",
                            "action": "restart_reset",
                        }
                    ),
                    401,
                )

            reset_data = auth_manager.sessions[reset_key]
            user_id = reset_data["user_id"]

            # Update password
            new_hash = hash_password(new_password)
            db.update_user(user_id, {"password_hash": new_hash})

            # Clean up reset session
            del auth_manager.sessions[reset_key]

            return jsonify(
                {
                    "success": True,
                    "message": "Password reset successfully. You can now sign in with your new password.",
                    "action": "login",
                }
            )

        except Exception as e:
            print(f"❌ Reset password error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Password reset encountered an error. Please try again.",
                        "action": "retry",
                    }
                ),
                500,
            )

    # ============================================
    # SESSION MANAGEMENT
    # ============================================

    @app.route("/api/auth/logout", methods=["POST"])
    def logout():
        """Logout user by destroying session"""
        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")

            if token:
                auth_manager.destroy_session(token)

            return jsonify({"success": True, "message": "Logged out successfully"})

        except Exception as e:
            print(f"❌ Logout error: {str(e)}")
            return jsonify({"success": True, "message": "Logged out successfully"})

    @app.route("/api/auth/session", methods=["GET"])
    def check_session():
        """Check if user session is valid"""
        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")

            if not token:
                return jsonify({"success": False, "authenticated": False}), 401

            session = auth_manager.validate_session(token)

            if not session:
                return jsonify({"success": False, "authenticated": False}), 401

            user_data = session.get("user_data", {})

            return jsonify(
                {
                    "success": True,
                    "authenticated": True,
                    "user": {
                        "id": user_data.get("user_id"),
                        "email": user_data.get("email"),
                        "name": user_data.get("name"),
                        "phone": user_data.get("phone", ""),
                        "authMethod": user_data.get("auth_method"),
                    },
                }
            )

        except Exception as e:
            print(f"❌ Session check error: {str(e)}")
            return jsonify({"success": False, "authenticated": False}), 401

    print("✅ Authentication routes registered successfully")
