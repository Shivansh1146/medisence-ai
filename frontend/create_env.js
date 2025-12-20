const fs = require('fs');
const path = require('path');

const envContent = `API_BASE_URL=http://localhost:3000/api
FIREBASE_API_KEY=AIzaSyDYafuD9h41VWV6TdlTUqvcAmoeNeiOO9s
FIREBASE_AUTH_DOMAIN=medisenceai.firebaseapp.com
FIREBASE_PROJECT_ID=medisenceai
FIREBASE_STORAGE_BUCKET=medisenceai.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=894203517434
FIREBASE_APP_ID=1:894203517434:web:2cd12e3453322ee59e6c43
FIREBASE_MEASUREMENT_ID=G-932YNSBXPC
WHATSAPP_DOCTOR_Aakash_NAME=Dr. Aakash Singh Rajput
WHATSAPP_DOCTOR_Aakash_PHONE=+91 9770064169
WHATSAPP_DOCTOR_Aakash_WHATSAPP=+919770064169
AI_ENABLED=true
MAX_FILE_SIZE=10485760
SUPPORTED_FORMATS=image/jpeg,image/png,image/webp
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('.env file created successfully');
