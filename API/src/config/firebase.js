/**
 * Configuration Firebase Admin SDK
 * Utilise les variables d'environnement ou le fichier JSON de fallback
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

/**
 * Initialise Firebase Admin SDK
 * Priorité: Variables d'environnement > Fichier JSON
 */
function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  let credential;

  // Option 1: Variables d'environnement (recommandé en production)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    console.log('🔥 Firebase: Utilisation des variables d\'environnement');
    
    credential = admin.credential.cert({
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
      universe_domain: 'googleapis.com'
    });
  } 
  // Option 2: Fichier JSON (fallback pour développement local)
  else {
    const jsonPath = path.join(__dirname, 'firebase-admin-sdk.json');
    
    if (fs.existsSync(jsonPath)) {
      console.log('🔥 Firebase: Utilisation du fichier firebase-admin-sdk.json');
      const serviceAccount = require('./firebase-admin-sdk.json');
      credential = admin.credential.cert(serviceAccount);
    } else {
      throw new Error(
        'Firebase non configuré. Définissez les variables d\'environnement ' +
        '(FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) ' +
        'ou créez le fichier config/firebase-admin-sdk.json'
      );
    }
  }

  firebaseApp = admin.initializeApp({
    credential: credential
  });

  return firebaseApp;
}

/**
 * Retourne l'instance Firestore
 */
function getFirestore() {
  initializeFirebase();
  return admin.firestore();
}

/**
 * Retourne l'instance Auth
 */
function getAuth() {
  initializeFirebase();
  return admin.auth();
}

/**
 * Retourne l'instance Admin
 */
function getAdmin() {
  initializeFirebase();
  return admin;
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  getAdmin,
  admin
};
