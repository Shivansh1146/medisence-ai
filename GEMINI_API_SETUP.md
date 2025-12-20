# 🔑 Getting Your Free Gemini API Key

## Why Do I Need This?

The Gemini API enables:

- 🤖 **Smart AI Chatbot** - Natural, conversational medical guidance
- 📸 **Image Analysis** - AI-powered injury assessment from photos
- 💡 **Better Responses** - More accurate and helpful medical advice

**Don't worry!** The app works without an API key using intelligent fallback responses.

## How to Get Your FREE Gemini API Key

### Step 1: Visit Google AI Studio

Go to: **https://makersuite.google.com/app/apikey**

### Step 2: Sign In

- Sign in with your Google account
- Accept the terms of service

### Step 3: Create API Key

1. Click "Create API Key"
2. Select "Create API key in new project" (or use existing project)
3. Copy the generated API key

### Step 4: Add to Your App

1. Open `backend/.env` file
2. Replace `GEMINI_API_KEY=` with `GEMINI_API_KEY=your_actual_key_here`
3. Save the file
4. Restart the server

Example:

```
GEMINI_API_KEY=AIzaSyABC123_your_actual_key_here_XYZ789
```

### Step 5: Restart Server

Stop the server (Ctrl+C) and run it again:

```powershell
cd medisence-ai\backend
python app.py
```

## ✅ Verification

If configured correctly, you'll see:

```
✅ Gemini API configured successfully
```

If not configured, you'll see:

```
📝 No Gemini API key found - using fallback mode
💡 Get a free API key from: https://makersuite.google.com/app/apikey
```

## 🎁 Benefits of Using API Key

### Without API Key (Fallback Mode):

- ✅ Works fine with rule-based responses
- ✅ Symptom analysis
- ✅ Emergency detection
- ✅ Basic injury analysis

### With API Key (AI Mode):

- ✅ Everything above, PLUS:
- 🚀 Natural conversation flow
- 🧠 Context-aware responses
- 📊 More accurate symptom interpretation
- 🎯 Better injury image analysis
- 💬 Personalized health advice

## 💰 Pricing

- **FREE TIER**: 60 requests per minute
- Perfect for personal use and testing
- No credit card required

## 🔒 Security

- Never share your API key publicly
- The `.env` file is ignored by git
- Keep your key private

## 🆘 Troubleshooting

**Problem**: "API key invalid"
**Solution**: Double-check you copied the entire key correctly

**Problem**: "Quota exceeded"
**Solution**: Wait a minute - free tier has rate limits

**Problem**: Still using fallback after adding key
**Solution**: Make sure you restarted the server after adding the key

## Need Help?

The app works great even without the API key! Try it first, then add the key later if you want enhanced features.
