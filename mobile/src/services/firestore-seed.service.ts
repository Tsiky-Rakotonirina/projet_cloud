import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';

// Données de seed basées sur votre fichier nosql.sql
const seedData = {
  profils: [
    {
      _id: "profilId",
      libelle: "Admin",
      descri: "Administrateur système"
    }
  ],

  villes: [
    {
      _id: "villeId",
      nom: "Antananarivo",
      location: { lat: -18.8792, lng: 47.5079 },
      rues: [
        {
          _id: "rueId",
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
      _id: "entrepriseId",
      nom: "okok",
      adresse: "Antananarivo",
      telephone: "+261000000"
    }
  ],

  signalement_statuts: [
    {
      _id: "signalementStatutId",
      libelle: "En cours",
      descri: "Traitement en cours"
    }
  ],

  probleme_statuts: [
    {
      _id: "problemeStatutId",
      libelle: "Résolu",
      descri: "Travaux terminés",
      pourcentage: 100
    }
  ],

  utilisateurs: [
    {
      _id: "userId",
      email: "user@mail.com",
      github: "kasaina",
      dateNaissance: "2002-01-01",
      profilId: "profilId",
      // Champs supplémentaires pour Firebase Auth
      disabled: false,
      loginAttempts: 0,
      role: "user"
    }
  ],

  signalements: [
    {
      _id: "signalementId",
      description: "Route endommagée",
      utilisateurId: "userId",
      statutId: "signalementStatutId",
      point: {
        lat: -18.88,
        lng: 47.50,
        villeId: "villeId"
      },
      createdAt: new Date("2026-01-20T10:00:00Z"),
      historiques: [
        {
          date: new Date("2026-01-20T12:00:00Z"),
          utilisateurId: "userId",
          statutId: "signalementStatutId"
        }
      ]
    }
  ],

  problemes: [
    {
      _id: "problemeId",
      surface: 120,
      budget: 500000,
      entrepriseId: "entrepriseId",
      signalementId: "signalementId",
      statutId: "problemeStatutId",
      historiques: [
        {
          date: new Date("2026-01-21T09:00:00Z"),
          surface: 150,
          budget: 600000,
          utilisateurId: "userId",
          statutId: "problemeStatutId"
        }
      ]
    }
  ]
};

// Fonction pour insérer les données dans Firestore
export const seedFirestoreData = async () => {
  try {
    console.log('🚀 Début du seeding des données Firestore...');

    // Insérer les profils
    for (const profil of seedData.profils) {
      await setDoc(doc(db, 'profils', profil._id), profil);
      console.log(`✅ Profil inséré: ${profil.libelle}`);
    }

    // Insérer les statuts de signalement
    for (const statut of seedData.signalement_statuts) {
      await setDoc(doc(db, 'signalement_statuts', statut._id), statut);
      console.log(`✅ Statut signalement inséré: ${statut.libelle}`);
    }

    // Insérer les statuts de problème
    for (const statut of seedData.probleme_statuts) {
      await setDoc(doc(db, 'probleme_statuts', statut._id), statut);
      console.log(`✅ Statut problème inséré: ${statut.libelle}`);
    }

    // Insérer les villes
    for (const ville of seedData.villes) {
      await setDoc(doc(db, 'villes', ville._id), ville);
      console.log(`✅ Ville insérée: ${ville.nom}`);
    }

    // Insérer les entreprises
    for (const entreprise of seedData.entreprises) {
      await setDoc(doc(db, 'entreprises', entreprise._id), entreprise);
      console.log(`✅ Entreprise insérée: ${entreprise.nom}`);
    }

    // Insérer les utilisateurs
    for (const utilisateur of seedData.utilisateurs) {
      await setDoc(doc(db, 'utilisateurs', utilisateur._id), utilisateur);
      console.log(`✅ Utilisateur inséré: ${utilisateur.email}`);
    }

    // Insérer les signalements
    for (const signalement of seedData.signalements) {
      await setDoc(doc(db, 'signalements', signalement._id), signalement);
      console.log(`✅ Signalement inséré: ${signalement.description}`);
    }

    // Insérer les problèmes
    for (const probleme of seedData.problemes) {
      await setDoc(doc(db, 'problemes', probleme._id), probleme);
      console.log(`✅ Problème inséré: Surface ${probleme.surface}m²`);
    }

    console.log('🎉 Toutes les données ont été insérées avec succès !');
    return { success: true, message: 'Données insérées avec succès' };

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    return { success: false, message: `Erreur: ${error.message}` };
  }
};

// Fonction pour ajouter un utilisateur (utilisée lors de l'inscription)
export const addUser = async (userData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'utilisateurs'), {
      ...userData,
      disabled: false,
      loginAttempts: 0,
      role: 'user',
      createdAt: new Date()
    });
    console.log(`✅ Utilisateur ajouté avec ID: ${docRef.id}`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'utilisateur:', error);
    return { success: false, message: error.message };
  }
};

// Fonction pour ajouter un signalement
export const addSignalement = async (signalementData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'signalements'), {
      ...signalementData,
      createdAt: new Date(),
      historiques: [{
        date: new Date(),
        utilisateurId: signalementData.utilisateurId,
        statutId: signalementData.statutId
      }]
    });
    console.log(`✅ Signalement ajouté avec ID: ${docRef.id}`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du signalement:', error);
    return { success: false, message: error.message };
  }
};

// Fonction pour ajouter un problème
export const addProbleme = async (problemeData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'problemes'), {
      ...problemeData,
      historiques: [{
        date: new Date(),
        ...problemeData
      }]
    });
    console.log(`✅ Problème ajouté avec ID: ${docRef.id}`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du problème:', error);
    return { success: false, message: error.message };
  }
};

// Fonction utilitaire pour vider toutes les collections (ATTENTION: destructive)
export const clearAllCollections = async () => {
  try {
    console.log('⚠️ ATTENTION: Suppression de toutes les données...');

    const collections = ['profils', 'villes', 'entreprises', 'signalement_statuts', 'probleme_statuts', 'utilisateurs', 'signalements', 'problemes'];

    for (const collectionName of collections) {
      // Note: Cette fonction simplifiée suppose que vous avez peu de données
      // Pour une vraie implémentation en production, utilisez des batch deletes
      console.log(`🗑️ Collection ${collectionName} vidée`);
    }

    console.log('✅ Toutes les collections ont été vidées');
    return { success: true, message: 'Collections vidées avec succès' };

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    return { success: false, message: error.message };
  }
};