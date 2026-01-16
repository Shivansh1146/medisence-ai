"""
Secure Password Hashing for MedicSense AI
Uses bcrypt for healthcare-grade security
"""

import bcrypt


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt

    Args:
        password: Plain text password

    Returns:
        base64-encoded hash string

    Security:
        - Uses bcrypt with 12 rounds
        - Automatically generates salt
        - Industry-standard for healthcare apps
    """
    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=12)  # 12 rounds = good security/performance balance
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify password against stored hash

    Args:
        password: Plain text password to verify
        password_hash: Stored bcrypt hash

    Returns:
        True if password matches, False otherwise

    Security:
        - Constant-time comparison (prevents timing attacks)
        - No exceptions leaked to caller
    """
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        # Invalid hash format or other error
        # Return False instead of raising exception
        return False


def validate_password_strength(password: str) -> dict:
    """
    Validate password meets minimum security requirements

    Args:
        password: Password to validate

    Returns:
        {
            "valid": bool,
            "errors": List[str],
            "strength": "weak" | "medium" | "strong"
        }

    Requirements:
        - Minimum 6 characters (as per frontend requirement)
        - Strength tiers: 6-7=weak, 8-11=medium, 12+=strong
    """
    errors = []

    # Length check (must match frontend validation)
    if len(password) < 6:
        errors.append("Password must be at least 6 characters")

    # Strength assessment
    if len(password) < 8:
        strength = "weak"
    elif len(password) < 12:
        strength = "medium"
    else:
        strength = "strong"

    # Additional security recommendations (not enforced)
    warnings = []
    if len(password) < 10:
        warnings.append("Consider using a longer password")
    if password.lower() == password or password.upper() == password:
        warnings.append("Consider mixing uppercase and lowercase letters")
    if not any(char.isdigit() for char in password):
        warnings.append("Consider adding numbers")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "strength": strength,
    }


def generate_secure_token(length: int = 32) -> str:
    """
    Generate cryptographically secure random token

    Args:
        length: Token length in bytes (default 32)

    Returns:
        URL-safe base64-encoded token

    Use cases:
        - Session tokens
        - Password reset tokens
        - API keys
    """
    import secrets

    return secrets.token_urlsafe(length)


# Example usage and testing
if __name__ == "__main__":
    print("🔐 Password Utilities Test")
    print("=" * 50)

    # Test password hashing
    test_password = "SecurePassword123"
    print(f"\n1. Hashing password: {test_password}")
    hashed = hash_password(test_password)
    print(f"   Hash: {hashed[:30]}...")

    # Test verification
    print(f"\n2. Verifying correct password...")
    is_valid = verify_password(test_password, hashed)
    print(f"   ✅ Valid: {is_valid}")

    print(f"\n3. Verifying wrong password...")
    is_valid = verify_password("WrongPassword", hashed)
    print(f"   ❌ Valid: {is_valid}")

    # Test strength validation
    print(f"\n4. Testing password strength...")
    test_passwords = [
        "abc",  # Too short
        "short",  # Weak
        "medium123",  # Medium
        "VeryStrongPassword2024!",  # Strong
    ]

    for pwd in test_passwords:
        result = validate_password_strength(pwd)
        print(f"\n   Password: '{pwd}'")
        print(f"   Valid: {result['valid']}")
        print(f"   Strength: {result['strength']}")
        if result["errors"]:
            print(f"   Errors: {', '.join(result['errors'])}")
        if result["warnings"]:
            print(f"   Warnings: {', '.join(result['warnings'])}")

    # Test token generation
    print(f"\n5. Generating secure token...")
    token = generate_secure_token()
    print(f"   Token: {token[:40]}...")

    print(f"\n✅ All tests completed!")
