import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase/firebase';

/* ======================================================
   DONNÉES DE SEED (SQL ➜ FIRESTORE)
====================================================== */

const seedData = {
  profils: [
    { _id: "profil_1", libelle: "admin", descri: "Administrateur du système" },
    { _id: "profil_2", libelle: "utilisateur", descri: "Utilisateur standard" }
  ],

  statuts_utilisateur: [
    { _id: "statut_1", libelle: "actif" },
    { _id: "statut_2", libelle: "bloque" },
    { _id: "statut_3", libelle: "suspendu" },
    { _id: "statut_4", libelle: "inactif" }
  ],

  villes: [
    { _id: "ville_1", nom: "Antananarivo", location: { lat: -18.8792, lng: 47.5233 } },
    { _id: "ville_2", nom: "Toliara", location: { lat: -23.3636, lng: 43.6671 } },
    { _id: "ville_3", nom: "Antsirabe", location: { lat: -19.8667, lng: 47.1167 } }
  ],

  entreprises: [
    { _id: "ent_1", nom: "SORGETRAM", adresse: "123 Avenue de l'Indépendance, Antananarivo", telephone: "+261202212345" },
    { _id: "ent_2", nom: "BTP Madagascar", adresse: "456 Rue de la Reine, Antananarivo", telephone: "+261202223456" },
    { _id: "ent_3", nom: "Travaux Publics Plus", adresse: "789 Boulevard de l'Unité, Antananarivo", telephone: "+261202234567" },
    { _id: "ent_4", nom: "Infrastructure Solutions", adresse: "321 Route de l'Est, Toliara", telephone: "+261202445678" }
  ],

  signalement_statuts: [
    { _id: "sig_1", libelle: "nouveau", descri: "Nouveau signalement signalé" },
    { _id: "sig_2", libelle: "en_cours", descri: "En cours de traitement" },
    { _id: "sig_3", libelle: "resolu", descri: "Signalement traité et fermé" },
    { _id: "sig_4", libelle: "rejete", descri: "Signalement rejeté" }
  ],

  probleme_statuts: [
    { _id: "prob_1", libelle: "non_commence", descri: "Travaux non commencés", pourcentage: 0 },
    { _id: "prob_2", libelle: "en_cours", descri: "Travaux en cours", pourcentage: 50 },
    { _id: "prob_3", libelle: "termine", descri: "Travaux terminés", pourcentage: 100 },
    { _id: "prob_4", libelle: "suspendu", descri: "Travaux suspendus temporairement", pourcentage: 25 },
    { _id: "prob_5", libelle: "planifie", descri: "Travaux planifiés", pourcentage: 10 }
  ],

  utilisateurs: [
    { _id: "user_1", email: "admin@route.mg", dateNaissance: "1990-01-15", profilId: "profil_1", statutId: "statut_1", role: "admin", password: "admin123" },
    { _id: "user_2", email: "jean.dupont@gmail.com", dateNaissance: "1995-03-22", profilId: "profil_2", statutId: "statut_1", role: "user", password: "user123" },
    { _id: "user_3", email: "marie.martin@gmail.com", dateNaissance: "1992-07-10", profilId: "profil_2", statutId: "statut_1", role: "user", password: "user123" },
    { _id: "user_4", email: "pierre.bernard@gmail.com", dateNaissance: "1988-11-05", profilId: "profil_2", statutId: "statut_1", role: "user", password: "user123" },
    { _id: "user_5", email: "sophie.laurent@gmail.com", dateNaissance: "1998-02-14", profilId: "profil_2", statutId: "statut_1", role: "user", password: "user123" }
  ],

  signalements: [
    {
      _id: "sigmnt_1",
      description: "Nid de poule sur Avenue de l'Indépendance - très dangereux",
      utilisateurId: "user_2",
      statutId: "sig_1",
      point: { lat: -18.8850, lng: 47.5200, villeId: "ville_1" },
      historiques: [{ utilisateurId: "user_2", statutId: "sig_1", date: new Date(Date.now() - 5 * 86400000) }]
    },
    {
      _id: "sigmnt_2",
      description: "Fissure importante sur la chaussée - Rue de la Reine",
      utilisateurId: "user_3",
      statutId: "sig_1",
      point: { lat: -18.8780, lng: 47.5250, villeId: "ville_1" },
      historiques: [{ utilisateurId: "user_3", statutId: "sig_1", date: new Date(Date.now() - 4 * 86400000) }]
    },
    {
      _id: "sigmnt_3",
      description: "Asphalt dégradé et affaissements - Boulevard du 26 Juin",
      utilisateurId: "user_4",
      statutId: "sig_1",
      point: { lat: -18.8900, lng: 47.5150, villeId: "ville_1" },
      historiques: [{ utilisateurId: "user_4", statutId: "sig_1", date: new Date(Date.now() - 3 * 86400000) }]
    },
    {
      _id: "sigmnt_4",
      description: "Trous multiples sur Route de l'Est - risque d'accident",
      utilisateurId: "user_5",
      statutId: "sig_1",
      point: { lat: -18.8750, lng: 47.5300, villeId: "ville_1" },
      historiques: [{ utilisateurId: "user_5", statutId: "sig_1", date: new Date(Date.now() - 2 * 86400000) }]
    },
    {
      _id: "sigmnt_5",
      description: "Nid de poule grave au croisement Avenue/Route Circulaire",
      utilisateurId: "user_2",
      statutId: "sig_1",
      point: { lat: -18.8820, lng: 47.5100, villeId: "ville_1" },
      historiques: [{ utilisateurId: "user_2", statutId: "sig_1", date: new Date(Date.now() - 1 * 86400000) }]
    },
    {
      _id: "sigmnt_6",
      description: "Déformation de la chaussée - perte de revêtement",
      utilisateurId: "user_3",
      statutId: "sig_1",
      point: { lat: -18.8900, lng: 47.5270, villeId: "ville_1" },
      historiques: [{ utilisateurId: "user_3", statutId: "sig_1", date: new Date() }]
    }
  ],


  problemes: [
    { _id: "pb_1", surface: 25.5, budget: 5000, entrepriseId: "ent_1", signalementId: "sigmnt_1", statutId: "prob_1" },
    { _id: "pb_2", surface: 48, budget: 12000, entrepriseId: "ent_1", signalementId: "sigmnt_2", statutId: "prob_2" },
    { _id: "pb_3", surface: 35.75, budget: 8500, entrepriseId: "ent_2", signalementId: "sigmnt_3", statutId: "prob_2" },
    { _id: "pb_4", surface: 60, budget: 15000, entrepriseId: "ent_2", signalementId: "sigmnt_4", statutId: "prob_1" },
    { _id: "pb_5", surface: 42.25, budget: 10000, entrepriseId: "ent_3", signalementId: "sigmnt_5", statutId: "prob_5" },
    { _id: "pb_6", surface: 55.5, budget: 13000, entrepriseId: "ent_3", signalementId: "sigmnt_6", statutId: "prob_1" }
  ]
};

/* ======================================================
   FONCTIONS FIRESTORE
====================================================== */

export const seedFirestoreData = async () => {
  try {
    console.log('🚀 Seeding Firestore...');

    for (const p of seedData.profils)
      await setDoc(doc(db, 'profils', p._id), p);

    for (const s of seedData.statuts_utilisateur)
      await setDoc(doc(db, 'statuts_utilisateur', s._id), s);

    for (const s of seedData.signalement_statuts)
      await setDoc(doc(db, 'signalement_statuts', s._id), s);

    for (const s of seedData.probleme_statuts)
      await setDoc(doc(db, 'probleme_statuts', s._id), s);

    for (const v of seedData.villes)
      await setDoc(doc(db, 'villes', v._id), v);

    for (const e of seedData.entreprises)
      await setDoc(doc(db, 'entreprises', e._id), e);

    for (const u of seedData.utilisateurs)
      await setDoc(doc(db, 'utilisateurs', u._id), {
        ...u,
        disabled: false,
        loginAttempts: 0,
        createdAt: new Date()
      });

    for (const s of seedData.signalements)
      await setDoc(doc(db, 'signalements', s._id), {
        ...s,
        createdAt: new Date()
      });

    for (const p of seedData.problemes)
      await setDoc(doc(db, 'problemes', p._id), {
        ...p,
        createdAt: new Date(),
        historiques: [{
          date: new Date(),
          surface: p.surface,
          budget: p.budget,
          statutId: p.statutId
        }]
      });

    console.log('🎉 Seeding terminé');
    return { success: true, message: 'Données insérées avec succès' };

  } catch (error: any) {
    console.error('❌ Erreur seeding:', error);
    return { success: false, message: error.message };
  }
};

/* ======================================================
   UTILITAIRES
====================================================== */

export const clearAllCollections = async () => {
  const cols = [
    'profils',
    'statuts_utilisateur',
    'signalement_statuts',
    'probleme_statuts',
    'villes',
    'entreprises',
    'utilisateurs',
    'signalements',
    'problemes'
  ];

  try {
    for (const c of cols) {
      const snap = await getDocs(collection(db, c));
      for (const d of snap.docs) await deleteDoc(d.ref);
      console.log(`🗑️ ${c} vidé`);
    }
    return { success: true, message: 'Toutes les collections ont été vidées avec succès' };
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression:', error);
    return { success: false, message: error.message };
  }
};
