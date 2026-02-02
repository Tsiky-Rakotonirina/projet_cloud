/**
 * Script pour nettoyer les signalements dupliqués dans Firebase
 * Supprime les documents Firebase qui n'ont pas de mapping dans PostgreSQL
 */

const admin = require('firebase-admin');
const { Sequelize } = require('sequelize');
const serviceAccount = require('../src/config/firebase-admin-sdk.json');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Connexion PostgreSQL
const sequelize = new Sequelize('route', 'admin', 'admin', {
  host: 'bdd',
  dialect: 'postgres',
  logging: false
});

async function cleanDuplicates() {
  try {
    console.log('🔄 Connexion aux bases de données...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connecté');

    // Récupérer tous les firebase_id des mappings signalement
    const [mappings] = await sequelize.query(`
      SELECT firebase_id FROM firebase_mapping WHERE entity_type = 'signalement'
    `);
    const mappedFirebaseIds = new Set(mappings.map(m => m.firebase_id));
    console.log(`📊 ${mappedFirebaseIds.size} signalements mappés dans PostgreSQL`);

    // Récupérer tous les signalements Firebase
    const firebaseSignalements = await db.collection('signalements').get();
    console.log(`📊 ${firebaseSignalements.docs.length} signalements dans Firebase`);

    // Identifier les documents à supprimer
    const toDelete = [];
    for (const doc of firebaseSignalements.docs) {
      if (!mappedFirebaseIds.has(doc.id)) {
        toDelete.push(doc.id);
      }
    }

    console.log(`🗑️ ${toDelete.length} signalements Firebase sans mapping à supprimer`);

    if (toDelete.length > 0) {
      // Supprimer les documents orphelins
      const batch = db.batch();
      for (const docId of toDelete) {
        console.log(`  - Suppression: ${docId}`);
        batch.delete(db.collection('signalements').doc(docId));
      }
      await batch.commit();
      console.log(`✅ ${toDelete.length} signalements orphelins supprimés de Firebase`);
    } else {
      console.log('✅ Aucun signalement orphelin à supprimer');
    }

    // Vérification finale
    const finalCount = await db.collection('signalements').get();
    console.log(`📊 Nombre final de signalements dans Firebase: ${finalCount.docs.length}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanDuplicates();
