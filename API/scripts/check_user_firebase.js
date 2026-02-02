const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

(async () => {
  try {
    const email = 'ramarosonblessed@gmail.com';
    console.log(`=== RECHERCHE UTILISATEUR: ${email} ===\n`);
    
    // Chercher dans Firestore
    const users = await db.collection('utilisateurs').where('email', '==', email).get();
    
    if (users.empty) {
      console.log('Utilisateur non trouvé dans Firestore');
    } else {
      users.forEach(doc => {
        const data = doc.data();
        console.log('Firebase ID:', doc.id);
        console.log('Email:', data.email);
        console.log('Statut ID:', data.statutId);
        console.log('Disabled:', data.disabled);
        console.log('Blocked:', data.blocked);
        console.log('DisabledAt:', data.disabledAt);
        console.log('DisabledReason:', data.disabledReason);
        console.log('ReactivatedAt:', data.reactivatedAt);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
