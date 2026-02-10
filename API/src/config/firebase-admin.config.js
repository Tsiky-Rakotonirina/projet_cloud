/**
 * Configuration Firebase Admin SDK
 * Utilise les variables d'environnement pour éviter de remplacer le fichier JSON à chaque fois
 * 
 * Si les variables d'environnement ne sont pas définies, tente de charger le fichier JSON
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

/**
 * Initialise Firebase Admin SDK
 * Priorité: Variables d'environnement > Fichier JSON local > Fichier JSON racine
 */
function initializeFirebase() {
  // Si déjà initialisé, retourner l'instance existante
  if (admin.apps.length) {
    return admin;
  }

  let credential = null;

  // Option 1: Variables d'environnement (recommandé pour production)
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
  } else {
    // Option 2: Fichier JSON local
    const localJsonPath = path.join(__dirname, 'firebase-admin-sdk.json');
    const rootJsonPath = path.join(__dirname, '..', '..', '..', 'firebase-admin-sdk.json');

    let serviceAccount = null;

    if (fs.existsSync(localJsonPath)) {
      console.log('🔥 Firebase: Utilisation du fichier local firebase-admin-sdk.json');
      serviceAccount = require('./firebase-admin-sdk.json');
    } else if (fs.existsSync(rootJsonPath)) {
      console.log('🔥 Firebase: Utilisation du fichier racine firebase-admin-sdk.json');
      serviceAccount = require(rootJsonPath);
    } else {
      throw new Error(
        '❌ Firebase: Aucune configuration trouvée!\n' +
        'Veuillez soit:\n' +
        '1. Définir les variables d\'environnement FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL\n' +
        '2. Ou placer le fichier firebase-admin-sdk.json dans API/src/config/ ou à la racine du projet'
      );
    }

    credential = admin.credential.cert(serviceAccount);
  }

  firebaseApp = admin.initializeApp({
    credential: credential
  });

  return admin;
}

// Initialise Firebase au chargement du module
const firebaseAdmin = initializeFirebase();
const firebaseDB = firebaseAdmin.firestore();

// Configuration Firestore
try {
  firebaseDB.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Ignorer si les settings ne sont pas supportés
}

module.exports = {
  admin: firebaseAdmin,
  firebaseDB,
  initializeFirebase
};
