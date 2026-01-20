#!/usr/bin/env node

/**
 * Script de seeding Firestore
 * Usage: node seed-firestore.js
 */

import { seedFirestoreData, clearAllCollections } from './src/services/firestore-seed.service.ts';

async function main() {
  console.log('🌱 Firestore Seeding Script');
  console.log('==========================');

  const args = process.argv.slice(2);

  if (args.includes('--clear')) {
    console.log('🗑️ Mode CLEAR: Suppression de toutes les données existantes...');
    const result = await clearAllCollections();
    if (!result.success) {
      console.error('❌ Erreur lors de la suppression:', result.message);
      process.exit(1);
    }
  }

  console.log('🚀 Insertion des données de seed...');
  const result = await seedFirestoreData();

  if (result.success) {
    console.log('🎉 Seeding terminé avec succès !');
    process.exit(0);
  } else {
    console.error('❌ Erreur lors du seeding:', result.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});