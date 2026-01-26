import { seedFirestoreData } from './src/services/firestore-seed.service.ts';

async function main() {
  try {
    const result = await seedFirestoreData();
    console.log(result.message);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    process.exit(1);
  }
}

main();