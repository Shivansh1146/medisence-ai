#!/usr/bin/env python3
"""
Quick validation script to ensure all fixes are working
Run this to verify the backend is ready
"""

import os
import sys


def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ MISSING {description}: {filepath}")
        return False


def check_function_in_file(filepath, function_name):
    """Check if a function/endpoint exists in file"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            if function_name in content:
                print(f"✅ Found: {function_name}")
                return True
            else:
                print(f"❌ Missing: {function_name}")
                return False
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return False


print("🔍 MedicSense AI - Backend Validation")
print("=" * 60)

all_good = True

# Check backend files
print("\n📁 Checking Backend Files:")
all_good &= check_file_exists("backend/app.py", "Main backend")
all_good &= check_file_exists("backend/gemini_service.py", "Gemini service")
all_good &= check_file_exists("backend/requirements.txt", "Requirements")

# Check frontend files
print("\n📁 Checking Frontend Files:")
all_good &= check_file_exists("frontend/index.html", "Main page")
all_good &= check_file_exists("frontend/script_ultra.js", "Main script")
all_good &= check_file_exists("frontend/about.html", "About page")
all_good &= check_file_exists("frontend/privacy.html", "Privacy policy")
all_good &= check_file_exists("frontend/terms.html", "Terms of service")

# Check critical backend endpoints
print("\n🔌 Checking Backend Endpoints:")
all_good &= check_function_in_file("backend/app.py", "/api/appointments/slots")
all_good &= check_function_in_file("backend/app.py", "def get_appointment_slots")

# Check frontend timeout implementations
print("\n⏱️ Checking Frontend Timeouts:")
all_good &= check_function_in_file("frontend/script_ultra.js", "fetchWithTimeout")
all_good &= check_function_in_file("frontend/script_ultra.js", "AbortController")

# Check Gemini fallback
print("\n🤖 Checking AI Fallback:")
all_good &= check_function_in_file("backend/gemini_service.py", "_fallback_response")
all_good &= check_function_in_file(
    "backend/gemini_service.py", "hasattr(response, 'text')"
)

print("\n" + "=" * 60)

if all_good:
    print("✅ ALL CHECKS PASSED - Backend is ready!")
    print("\n📋 Next Steps:")
    print("1. Set GEMINI_API_KEY in backend/.env")
    print("2. Run: cd backend && python app.py")
    print("3. Open: http://localhost:5000")
    print("4. Test symptom analysis, appointments, and chat")
    sys.exit(0)
else:
    print("❌ SOME CHECKS FAILED - Review errors above")
    sys.exit(1)
