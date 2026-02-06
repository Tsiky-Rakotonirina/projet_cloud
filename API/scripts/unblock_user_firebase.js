const admin = require('firebase-admin');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

(async () => {
  try {
    const email = 'ramarosonblessed@gmail.com';
    console.log(`=== DÉBLOCAGE UTILISATEUR: ${email} ===\n`);
    
    // Chercher tous les documents avec cet email
    const users = await db.collection('utilisateurs').where('email', '==', email).get();
    
    for (const doc of users.docs) {
      const data = doc.data();
      if (data.disabled === true) {
        console.log(`Déblocage du document ${doc.id}...`);
        await db.collection('utilisateurs').doc(doc.id).update({
          disabled: false,
          blocked: false,
          disabledAt: null,
          disabledReason: null,
          reactivatedAt: new Date().toISOString(),
          reactivatedBy: 'admin_sync',
          statutId: 'Actif',
          loginAttempts: 0,
        });
        console.log(`✅ Document ${doc.id} débloqué!`);
      } else {
        console.log(`Document ${doc.id} déjà actif`);
      }
    }
    
    // Supprimer les doublons (garder celui avec l'UID Auth)
    if (users.docs.length > 1) {
      console.log('\n⚠️ Doublons détectés, nettoyage...');
      // Garder le premier (celui avec l'UID Auth) et supprimer les autres
      const duplicates = users.docs.slice(1);
      for (const dup of duplicates) {
        await db.collection('utilisateurs').doc(dup.id).delete();
        console.log(`🗑️ Doublon supprimé: ${dup.id}`);
      }
    }
    
    console.log('\n✅ Terminé!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
