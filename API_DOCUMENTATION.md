# MedicSense AI - API Documentation

## Base URL
```
http://localhost:3000
```

## API Endpoints

### 1. Chat & Symptom Analysis

#### POST `/api/chat`
Main chatbot endpoint for medical conversations.

**Request:**
```json
{
  "message": "I have a headache and fever",
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "response": "Based on your symptoms...",
  "severity": 2,
  "type": "medical",
  "symptoms": ["headache", "fever"],
  "recommendations": ["Rest", "Drink fluids"],
  "doctors": ["General Physician"]
}
```

### 2. Authentication

#### POST `/api/auth/otp/send`
Send OTP to phone number.

**Request:**
```json
{
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### POST `/api/auth/otp/verify`
Verify OTP and login.

**Request:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "auth_token_here",
  "user": {
    "user_id": "user_123",
    "phone": "+1234567890"
  }
}
```

### 3. Doctor Management

#### POST `/api/save-doctor`
Save family doctor information.

**Request:**
```json
{
  "user_id": "user_123",
  "name": "Dr. Smith",
  "specialty": "General Physician",
  "phone": "+1234567890"
}
```

#### GET `/api/get-doctor/<user_id>`
Get saved family doctor.

### 4. Appointments

#### POST `/api/appointments/book`
Book a new appointment.

**Request:**
```json
{
  "user_id": "user_123",
  "doctor_name": "Dr. Smith",
  "date": "2025-12-25",
  "time": "10:00 AM",
  "symptoms": ["headache", "fever"]
}
```

#### GET `/api/appointments/<user_id>`
Get all appointments for a user.

#### PUT `/api/appointments/<appointment_id>/cancel`
Cancel an appointment.

### 5. Health Records

#### POST `/api/health/vitals`
Save vital signs.

**Request:**
```json
{
  "user_id": "user_123",
  "blood_pressure": "120/80",
  "heart_rate": 75,
  "temperature": 98.6
}
```

#### GET `/api/health/vitals/<user_id>`
Get vital history for a user.

### 6. Image Analysis

#### POST `/api/analyze-injury-image`
Analyze injury/medical images.

**Request:** Multipart form data with image file

**Response:**
```json
{
  "success": true,
  "analysis": "Detected minor injury",
  "severity": "mild",
  "recommendations": ["Clean the wound", "Apply bandage"]
}
```

### 7. Search & Discovery

#### GET `/api/find-doctors?specialty=cardiologist&location=city`
Find doctors by specialty and location.

#### GET `/api/search?q=headache`
Search medical information.

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error
