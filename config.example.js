// Firebase Configuration Template
// Copy this file to 'config.js' and fill in your Firebase credentials

const FIREBASE_CONFIG = {
  // Get your API key from Firebase Console
  // https://console.firebase.google.com/project/YOUR-PROJECT/settings/general
  apiKey: "YOUR_FIREBASE_API_KEY",
  
  // Your Firebase project ID
  projectId: "YOUR_PROJECT_ID",
  
  // Firestore collection name for flags
  collectionPath: "flags",
  
  // Minimum flags needed to show badge
  minimumFlagCount: 1
};

// Don't change this line
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIREBASE_CONFIG;
}

