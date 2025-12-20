/**
 * Environment Variables Loader
 * Loads environment variables from .env file and makes them available globally
 * 
 * Note: Browsers cannot directly read .env files, so this script
 * needs to be processed by a build tool or server-side script.
 * 
 * For development, you can manually set window._env or use a simple server.
 * For production, use a build tool like Vite, Webpack, or Parcel.
 */

// Try to load from window._env (set by server or build tool)
const env = window._env || {};

// Fallback: Try to read from a script tag with id="env-config"
(function() {
    const envScript = document.getElementById('env-config');
    if (envScript) {
        try {
            const envData = JSON.parse(envScript.textContent);
            Object.assign(env, envData);
        } catch (e) {
            console.warn('Failed to parse env-config script:', e);
        }
    }
})();

// Default values (fallback if env vars not loaded)
const defaultEnv = {
    API_BASE_URL: 'http://localhost:3000/api',
    FIREBASE_API_KEY: '',
    FIREBASE_AUTH_DOMAIN: '',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_STORAGE_BUCKET: '',
    FIREBASE_MESSAGING_SENDER_ID: '',
    FIREBASE_APP_ID: '',
    FIREBASE_MEASUREMENT_ID: '',
    WHATSAPP_DOCTOR_Aakash_NAME: 'Dr. Aakash Singh Rajput',
    WHATSAPP_DOCTOR_Aakash_PHONE: '+91 9770064169',
    WHATSAPP_DOCTOR_Aakash_WHATSAPP: '+919770064169',
    AI_ENABLED: 'true',
    MAX_FILE_SIZE: '10485760',
    SUPPORTED_FORMATS: 'image/jpeg,image/png,image/webp'
};

// Merge with defaults
const config = {};
for (const key in defaultEnv) {
    // Check if env var exists (from window._env or env-config script)
    if (env[key] !== undefined) {
        config[key] = env[key];
    } else {
        // Use default
        config[key] = defaultEnv[key];
    }
}

// Helper function to get env variable
export function getEnv(key, defaultValue = null) {
    return config[key] !== undefined ? config[key] : defaultValue;
}

// Export config object
export const ENV = {
    API_BASE_URL: config.API_BASE_URL,
    
    FIREBASE: {
        apiKey: config.FIREBASE_API_KEY,
        authDomain: config.FIREBASE_AUTH_DOMAIN,
        projectId: config.FIREBASE_PROJECT_ID,
        storageBucket: config.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
        appId: config.FIREBASE_APP_ID,
        measurementId: config.FIREBASE_MEASUREMENT_ID
    },
    
    WHATSAPP: {
        DOCTOR_Aakash: {
            name: config.WHATSAPP_DOCTOR_Aakash_NAME,
            phone: config.WHATSAPP_DOCTOR_Aakash_PHONE,
            whatsapp: config.WHATSAPP_DOCTOR_Aakash_WHATSAPP
        }
    },
    
    APP: {
        AI_ENABLED: config.AI_ENABLED === 'true',
        MAX_FILE_SIZE: parseInt(config.MAX_FILE_SIZE, 10),
        SUPPORTED_FORMATS: config.SUPPORTED_FORMATS.split(',')
    }
};

// Make available globally
window.ENV = ENV;

export default ENV;

