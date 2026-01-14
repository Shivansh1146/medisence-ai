# MedicSense AI - Medical Intelligence Chatbot 🏥

## 🚀 Project Overview

MedicSense AI is an AI-assisted medical chatbot prototype that provides healthcare guidance, symptom analysis, and emergency assistance. Built for hackathons with beginner-friendly code.

**GitHub Repository:** [https://github.com/aakash4dev/medisence-ai](https://github.com/aakash4dev/medisence-ai)

## ✨ Features

- **Symptom Analysis**: Intelligent symptom extraction and severity classification (Levels 1-4)
- **Emergency Detection**: Life-saving first-aid guidance for critical situations
- **Family Doctor System**: Store and personalize mild symptom advice
- **Doctor Matching**: Find specialists based on symptoms and location
- **Ethical AI**: Non-diagnostic, safety-first medical guidance
- **Primarily local logic with optional AI service integration**

## 📁 Project Structure

```
e:\hackspace hackthon bot check\
├── backend/
│   ├── app.py                    # Main Flask server
│   ├── symptom_analyzer.py       # Symptom extraction engine
│   ├── severity_classifier.py    # Urgency classification (1-4)
│   ├── emergency_detector.py     # Emergency detection & first-aid
│   ├── medical_kb.json           # Medical knowledge base
│   ├── doctors_db.json           # Sample doctors/hospitals
│   └── requirements.txt          # Python dependencies
├── index.html                     # Main website (frontend)
├── style.css                      # Complete styling
├── script.js                      # Chatbot logic (renamed from chatbot.js)
└── README.md                      # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- **Python 3.8+** (You already have Python 3.14.2 ✅)
- Modern web browser (Chrome, Firefox, Edge)
- VS Code (recommended)

### Step 1: Install Backend Dependencies

Open terminal in VS Code and run:

```powershell
cd backend
pip install -r requirements.txt
```

This will install:

- Flask 2.3.3 (Web server)
- flask-cors 4.0.0 (Cross-origin requests)

### Step 2: Start the Backend Server

```powershell
python app.py
```

You should see:

```
🚀 MedicSense AI Backend Starting...
📡 Server running at http://localhost:3000
💊 Medical chatbot ready to assist
```

**Keep this terminal running!**

### Step 3: Open the Frontend

Two options:

**Option A - Direct File Open:**

1. Right-click `index.html`
2. Select "Open with" → Your browser

**Option B - Live Server (Recommended):**

1. Install Live Server extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

The website will open at `http://localhost:3000` or similar.

### Step 4: Start Using MedicSense AI! 🎉

1. Click the **blue chat icon** (bottom-right corner)
2. Describe your symptoms
3. Get medical guidance!

## 🩺 How It Works

### Severity Classification System

| Level | Name      | Description                  | Response                                   |
| ----- | --------- | ---------------------------- | ------------------------------------------ |
| **1** | Mild      | Common cold, headache        | Self-care advice, family doctor suggestion |
| **2** | Moderate  | Fever, persistent cough      | Doctor consultation recommended            |
| **3** | Serious   | Chronic symptoms, chest pain | Specialist referral, urgent care           |
| **4** | Emergency | Snake bite, unconscious      | Immediate first-aid, call 112              |

### Example Interactions

**Mild Symptoms:**

```
User: "I have a mild headache"
Bot: This appears to be a mild condition.
     💡 Rest and stay hydrated. Monitor symptoms.
     👨‍⚕️ Consider consulting family doctor if persists.
```

**Emergency:**

```
User: "Snake bite!"
Bot: 🚨 EMERGENCY: Snake Bite
     1. Call emergency services IMMEDIATELY
     2. Keep patient calm and still
     3. Position wound below heart level
     [+ First aid steps]
```

## 🎯 Key Features

### 1. Symptom Analysis

- Natural language processing
- Pattern matching for symptoms
- Synonym recognition ("fever" = "temperature")

### 2. Emergency Detection

Recognizes critical keywords:

- unconscious, bleeding heavily, snake bite
- cannot breathe, heart attack, stroke
- Provides immediate first-aid instructions

### 3. Family Doctor System

- Save your doctor's information
- Personalized responses for mild symptoms
- Quick reference for consultations

### 4. Safety First

- **Non-medical query filter**: "Tell me a joke" → "I'm trained only for medical problems"
- **Emergency override**: Always directs to emergency services when needed
- **Clear disclaimers**: Not a medical diagnosis tool

## 🔧 Customization Guide

### Add More Symptoms

Edit `backend/medical_kb.json`:

```json
"new_symptom": {
  "description": "Symptom description",
  "urgency": "low",
  "common_causes": ["Cause1", "Cause2"],
  "keywords": ["keyword1", "keyword2"]
}
```

### Add Doctors/Hospitals

Edit `backend/doctors_db.json`:

```json
{
  "name": "Dr. New Doctor",
  "specialization": "Cardiologist",
  "city": "Mumbai",
  "contact": "+91-555-1234"
}
```

### Modify Severity Rules

Edit `backend/severity_classifier.py`:

- Update `level_indicators` dictionary
- Adjust time-based urgency rules

## 🐛 Troubleshooting

### Backend Server Won't Start

```powershell
# Check Python
python --version

# Reinstall dependencies
pip install --upgrade flask flask-cors
```

### Frontend Not Connecting

1. Ensure backend is running: `http://localhost:3000`
2. Check browser console (F12) for errors
3. Verify CORS is enabled in `app.py`

### Chatbot Not Responding

1. Open browser console (F12)
2. Check for network errors
3. Verify backend URL: `http://localhost:3000/api/chat`

## 🎓 Learning Resources

### For Beginners

- [Flask Tutorial](https://flask.palletsprojects.com/tutorial/)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CSS Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

### Medical References

- [CDC Symptom Guidelines](https://www.cdc.gov/)
- [American Red Cross First Aid](https://www.redcross.org/take-a-class/first-aid)
- [WHO Emergency Care](https://www.who.int/emergencies)

### Key Points to Emphasize

✅ **Local Intelligence**: Primarily rule-based logic with optional AI assistance
✅ **Safety First**: Ethical constraints, emergency detection
✅ **Beginner-Friendly**: Well-commented, modular code
✅ **Complete System**: Backend + Frontend + Knowledge Base
✅ **Impact**: Potentially life-saving emergency guidance

## ⚖️ Disclaimer

> **IMPORTANT**: This is a hackathon project for educational purposes only.
>
> **NOT for actual medical use.** Always consult qualified healthcare professionals for medical advice.
>
> In life-threatening emergencies, call local emergency services immediately:
>
> - 🇺🇸 USA: 911
> - 🇬🇧 UK: 999 or 112
> - 🇮🇳 India: 102 (Ambulance), 108 (Emergency)
> - 🇦🇺 Australia: 000

## 📋 Scope, Claims & Responsible Positioning

### Production-Ready Clarification

MedicSense AI is:

- **Demo-ready**: Fully functional demonstration of medical chatbot capabilities
- **Hackathon-ready**: Complete feature set suitable for hackathon evaluation
- **UX-complete**: Polished user interface with comprehensive workflow coverage

MedicSense AI is **NOT production-ready** due to the following limitations:

- No persistent storage layer (data stored in local JSON files)
- No hardened authentication enforcement (demo-level security implementation)
- No audit logging (no comprehensive tracking of system interactions)
- No regulatory compliance (HIPAA, GDPR, or other healthcare data protection standards)
- AI safety is heuristic-based and intended for demonstration purposes only

**Positioning Statement**: A production-aligned prototype designed for real-world workflows.

### Security & Encryption Messaging Clarification

Security banners and encryption mentions in this project reflect intended production deployment standards and architectural design goals. The current demo infrastructure may not include full TLS certificate configuration or production-grade security hardening.

**Q: Is this fully secured for production?**
**A: Security messaging reflects intended production deployment, not current demo infrastructure.**

HTTPS indicators shown in the UI are illustrative of intended deployment, not guaranteed in the demo environment.

### AI / Gemini Integration Claim Clarification

This project explicitly avoids claims of:

- Accurate diagnosis
- Clinical reliability

Instead, MedicSense AI provides:

- **AI-assisted medical guidance**: Supportive information to help users understand their symptoms
- **Safety-first recommendations with disclaimers**: Guidance that prioritizes user safety while clearly communicating limitations

**Important**: This system is **NOT a diagnostic tool**. It does not provide medical diagnoses, clinical assessments, or replace professional medical consultation. All guidance is informational and should be verified with qualified healthcare professionals.

## 📝 License

This is a hackathon project. Feel free to use, modify, and extend for your hackathon!

## 🤝 Contributing

- Add more symptoms to `medical_kb.json`
- Improve symptom matching algorithm
- Enhance UI/UX
- Add more first-aid scenarios
- Implement voice input more robustly

---

**Built with ❤️ for the Hackspace Hackathon**

🚀 Good luck with your hackathon! 🏆
