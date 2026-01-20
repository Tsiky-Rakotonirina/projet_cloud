#!/usr/bin/env node

/**
 * Script de seeding Firestore (Version simplifiée)
 * Usage: node seed-firestore-simple.js
 */

// Charger les variables d'environnement depuis .env
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv non disponible, utilisation des valeurs par défaut');
}

// Utiliser require au lieu d'import pour éviter les problèmes ES modules
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Configuration Firebase (utilise les variables d'environnement)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDIWOJvZx9RTmPQ5Cs_HIhDkhsupOHRH1Q",
  authDomain: "tp-firebase-b195d.firebaseapp.com",
  projectId: "tp-firebase-b195d",
  storageBucket: "tp-firebase-b195d.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "79410079282",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:79410079282:web:79ea5bb57d79bbc7ae7e2b",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2CL6MR5X2T"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Données de seed (version complète basée sur nosql.sql)
const seedData = {
  profils: [
    {
      libelle: "Admin",
      descri: "Administrateur système"
    }
  ],
  villes: [
    {
      nom: "Antananarivo",
      location: { lat: -18.8792, lng: 47.5079 },
      rues: [
        {
          nom: "Indépendance",
          type: "avenue",
          path: [
            { lat: -18.88, lng: 47.50 },
            { lat: -18.87, lng: 47.51 }
          ]
        }
      ]
    }
  ],
  entreprises: [
    {
      nom: "okok",
      adresse: "Antananarivo",
      telephone: "+261000000"
    }
  ],
  signalement_statuts: [
    {
      libelle: "En cours",
      descri: "Traitement en cours"
    }
  ],
  probleme_statuts: [
    {
      libelle: "Résolu",
      descri: "Travaux terminés",
      pourcentage: 100
    }
  ],
  utilisateurs: [
    {
      email: "user@mail.com",
      github: "kasaina",
      dateNaissance: "2002-01-01",
      profilId: "profil_1",
      disabled: false,
      loginAttempts: 0,
      role: "user"
    }
  ],
  signalements: [
    {
      description: "Route endommagée",
      utilisateurId: "user_1",
      statutId: "signalementStatut_1",
      point: {
        lat: -18.88,
        lng: 47.50,
        villeId: "ville_1"
      },
      createdAt: new Date("2026-01-20T10:00:00Z"),
      historiques: [
        {
          date: new Date("2026-01-20T12:00:00Z"),
          utilisateurId: "user_1",
          statutId: "signalementStatut_1"
        }
      ]
    }
  ],
  problemes: [
    {
      surface: 120,
      budget: 500000,
      entrepriseId: "entreprise_1",
      signalementId: "signalement_1",
      statutId: "problemeStatut_1",
      historiques: [
        {
          date: new Date("2026-01-21T09:00:00Z"),
          surface: 150,
          budget: 600000,
          utilisateurId: "user_1",
          statutId: "problemeStatut_1"
        }
      ]
    }
  ]
};

async function seedFirestoreData() {
  try {
    console.log('🚀 Début du seeding des données Firestore...');

    // Insérer les profils
    for (let i = 0; i < seedData.profils.length; i++) {
      const profil = seedData.profils[i];
      await setDoc(doc(db, 'profils', `profil_${i + 1}`), profil);
      console.log(`✅ Profil inséré: ${profil.libelle}`);
    }

    // Insérer les villes
    for (let i = 0; i < seedData.villes.length; i++) {
      const ville = seedData.villes[i];
      await setDoc(doc(db, 'villes', `ville_${i + 1}`), ville);
      console.log(`✅ Ville insérée: ${ville.nom}`);
    }

    // Insérer les entreprises
    for (let i = 0; i < seedData.entreprises.length; i++) {
      const entreprise = seedData.entreprises[i];
      await setDoc(doc(db, 'entreprises', `entreprise_${i + 1}`), entreprise);
      console.log(`✅ Entreprise insérée: ${entreprise.nom}`);
    }

    console.log('🎉 Données de base insérées avec succès !');
    return { success: true, message: 'Données insérées avec succès' };

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    return { success: false, message: `Erreur: ${error.message}` };
  }
}

async function main() {
  console.log('🌱 Firestore Seeding Script (Simple)');
  console.log('====================================');
  console.log('⚠️  IMPORTANT: Modifiez la configuration Firebase dans ce fichier avant execution !');
  console.log('');

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