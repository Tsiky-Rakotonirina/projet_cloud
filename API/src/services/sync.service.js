const { 
  Utilisateur, 
  UtilisateurStatut, 
  Statut, 
  Signalement, 
  SignalementStatut, 
  Point, 
  Profil, 
  FirebaseMapping,
  Entreprise,
  Probleme,
  ProblemeStatut,
  Ville
} = require('../models');

// Configuration Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-admin-sdk.json');

// Vérifier si Firebase n'est pas déjà initialisé
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firebaseDB = admin.firestore();
// Ensure Firestore ignores undefined properties when updating documents
try {
  firebaseDB.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // ignore if settings not supported in this environment
}

const syncService = {
  /**
   * PUSH: Synchronise les utilisateurs de Firebase vers PostgreSQL
   */
  async pushUtilisateursToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };

      // Récupérer tous les utilisateurs depuis Firebase
      const firebaseUsers = await firebaseDB.collection('users').get();
      stats.total = firebaseUsers.docs.length;

      console.log(`🔄 PUSH: ${stats.total} utilisateurs trouvés dans Firebase`);

      for (const doc of firebaseUsers.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          // Vérifier si un mapping existe déjà
          const existingMapping = await FirebaseMapping.findOne({
            where: {
              entity_type: 'utilisateur',
              firebase_id: firebaseId,
            },
          });

          if (existingMapping) {
            // UPDATE: L'utilisateur existe déjà dans PostgreSQL
            const user = await Utilisateur.findByPk(existingMapping.postgres_id);
            if (user) {
              // Normalize date_naissance coming from Firebase
              let dateNaissance = null;
              if (firebaseData.date_naissance) {
                const d = new Date(firebaseData.date_naissance);
                if (!isNaN(d.getTime())) {
                  dateNaissance = d;
                }
              }

              await user.update({
                email: firebaseData.email,
                mot_de_passe: firebaseData.password_hash,
                date_naissance: dateNaissance,
                profil_id: firebaseData.profil_id || 2, // Par défaut: utilisateur
              });

              // Mettre à jour le mapping
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Utilisateur ${firebaseData.email} mis à jour (PG ID: ${user.id_utilisateurs})`);
            }
          } else {
            // INSERT: Nouvel utilisateur
            // Normalize date_naissance coming from Firebase
            let dateNaissanceNew = null;
            if (firebaseData.date_naissance) {
              const d2 = new Date(firebaseData.date_naissance);
              if (!isNaN(d2.getTime())) {
                dateNaissanceNew = d2;
              }
            }

            const newUser = await Utilisateur.create({
              email: firebaseData.email,
              mot_de_passe: firebaseData.password_hash,
              date_naissance: dateNaissanceNew,
              profil_id: firebaseData.profil_id || 2,
            });

            // Créer le mapping
            await FirebaseMapping.create({
              entity_type: 'utilisateur',
              postgres_id: newUser.id_utilisateurs,
              firebase_id: firebaseId,
            });

            // Créer le statut actif par défaut
            await UtilisateurStatut.create({
              utilisateur_id: newUser.id_utilisateurs,
              statut_id: 1, // actif
            });

            stats.inserted++;
            console.log(`✅ Nouvel utilisateur ${firebaseData.email} créé (PG ID: ${newUser.id_utilisateurs})`);
          }
        } catch (error) {
          stats.errors.push({
            firebase_id: doc.id,
            error: error.message,
          });
          console.error(`❌ Erreur pour l'utilisateur Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH utilisateurs: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH utilisateurs:', error);
      throw {
        code: 'SYNC_ERROR',
        message: error.message || 'Erreur lors de la synchronisation Firebase → PostgreSQL',
        status: 500,
      };
    }
  },

  /**
   * PULL: Synchronise les utilisateurs de PostgreSQL vers Firebase
   */
  async pullUtilisateursToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };

      // Récupérer tous les utilisateurs depuis PostgreSQL avec leurs statuts
      const users = await Utilisateur.findAll({
        include: [
          {
            model: Profil,
            as: 'profil',
          },
          {
            model: UtilisateurStatut,
            as: 'utilisateur_statuts',
            include: [
              {
                model: Statut,
                as: 'statut',
              },
            ],
            order: [['date_statut', 'DESC']],
            limit: 1,
          },
        ],
      });

      stats.total = users.length;
      console.log(`🔄 PULL: ${stats.total} utilisateurs trouvés dans PostgreSQL`);

      for (const user of users) {
        try {
          const postgresId = user.id_utilisateurs;

          // Vérifier si un mapping existe déjà
          const existingMapping = await FirebaseMapping.findOne({
            where: {
              entity_type: 'utilisateur',
              postgres_id: postgresId,
            },
          });

          // Préparer les données pour Firebase
          const firebaseData = {
            email: user.email,
            password_hash: user.mot_de_passe,
            date_naissance: user.date_naissance,
            profil_id: user.profil_id,
            profil_libelle: user.profil?.libelle,
            statut: user.utilisateur_statuts?.[0]?.statut?.libelle || 'actif',
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            // UPDATE: Le document existe déjà dans Firebase
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('users').doc(firebaseId).update(firebaseData);

            // Mettre à jour le mapping
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Utilisateur ${user.email} mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            // INSERT: Nouveau document dans Firebase
            const docRef = await firebaseDB.collection('users').add(firebaseData);
            const firebaseId = docRef.id;

            // Créer le mapping
            await FirebaseMapping.create({
              entity_type: 'utilisateur',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });

            stats.inserted++;
            console.log(`✅ Nouvel utilisateur ${user.email} créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({
            postgres_id: user.id_utilisateurs,
            email: user.email,
            error: error.message,
          });
          console.error(`❌ Erreur pour l'utilisateur PG ${user.id_utilisateurs}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL utilisateurs: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL utilisateurs:', error);
      throw {
        code: 'SYNC_ERROR',
        message: error.message || 'Erreur lors de la synchronisation PostgreSQL → Firebase',
        status: 500,
      };
    }
  },

  /**
   * PUSH: Synchronise les signalements de Firebase vers PostgreSQL
   */
  async pushSignalementsToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };

      // Récupérer tous les signalements depuis Firebase
      const firebaseSignalements = await firebaseDB.collection('signalements').get();
      stats.total = firebaseSignalements.docs.length;

      console.log(`🔄 PUSH: ${stats.total} signalements trouvés dans Firebase`);

      for (const doc of firebaseSignalements.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          // Vérifier si un mapping existe déjà
          const existingMapping = await FirebaseMapping.findOne({
            where: {
              entity_type: 'signalement',
              firebase_id: firebaseId,
            },
          });

          // Récupérer l'utilisateur PostgreSQL depuis le mapping
          let utilisateurId = null;
          if (firebaseData.utilisateur_firebase_id) {
            const userMapping = await FirebaseMapping.findOne({
              where: {
                entity_type: 'utilisateur',
                firebase_id: firebaseData.utilisateur_firebase_id,
              },
            });
            utilisateurId = userMapping?.postgres_id;
          }

          if (existingMapping) {
            // UPDATE: Le signalement existe déjà dans PostgreSQL
            const signalement = await Signalement.findByPk(existingMapping.postgres_id);
            if (signalement) {
              await signalement.update({
                description: firebaseData.description,
                utilisateur_id: utilisateurId,
                point_id: firebaseData.point_id,
                signalement_statut_id: firebaseData.statut_id || 1, // nouveau par défaut
              });

              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Signalement mis à jour (PG ID: ${signalement.id_signalements})`);
            }
          } else {
            // INSERT: Nouveau signalement
            const newSignalement = await Signalement.create({
              description: firebaseData.description,
              utilisateur_id: utilisateurId,
              point_id: firebaseData.point_id,
              signalement_statut_id: firebaseData.statut_id || 1,
            });

            // Créer le mapping
            await FirebaseMapping.create({
              entity_type: 'signalement',
              postgres_id: newSignalement.id_signalements,
              firebase_id: firebaseId,
            });

            stats.inserted++;
            console.log(`✅ Nouveau signalement créé (PG ID: ${newSignalement.id_signalements})`);
          }
        } catch (error) {
          stats.errors.push({
            firebase_id: doc.id,
            error: error.message,
          });
          console.error(`❌ Erreur pour le signalement Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH signalements: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH signalements:', error);
      throw {
        code: 'SYNC_ERROR',
        message: error.message || 'Erreur lors de la synchronisation Firebase → PostgreSQL',
        status: 500,
      };
    }
  },

  /**
   * PULL: Synchronise les signalements de PostgreSQL vers Firebase
   */
  async pullSignalementsToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };

      // Récupérer tous les signalements depuis PostgreSQL
      const signalements = await Signalement.findAll({
        include: [
          {
            model: Utilisateur,
            as: 'utilisateur',
          },
          {
            model: Point,
            as: 'point',
          },
          {
            model: SignalementStatut,
            as: 'statut',
          },
        ],
      });

      stats.total = signalements.length;
      console.log(`🔄 PULL: ${stats.total} signalements trouvés dans PostgreSQL`);

      for (const signalement of signalements) {
        try {
          const postgresId = signalement.id_signalements;

          // Vérifier si un mapping existe déjà
          const existingMapping = await FirebaseMapping.findOne({
            where: {
              entity_type: 'signalement',
              postgres_id: postgresId,
            },
          });

          // Récupérer le Firebase ID de l'utilisateur
          let utilisateurFirebaseId = null;
          if (signalement.utilisateur_id) {
            const userMapping = await FirebaseMapping.findOne({
              where: {
                entity_type: 'utilisateur',
                postgres_id: signalement.utilisateur_id,
              },
            });
            utilisateurFirebaseId = userMapping?.firebase_id;
          }

          // Préparer les données pour Firebase
          const firebaseData = {
            description: signalement.description,
            utilisateur_firebase_id: utilisateurFirebaseId,
            utilisateur_email: signalement.utilisateur?.email,
            point_id: signalement.point_id,
            point_coordinates: signalement.point ? {
              latitude: signalement.point.xy?.coordinates?.[1],
              longitude: signalement.point.xy?.coordinates?.[0],
            } : null,
            statut_id: signalement.signalement_statut_id,
            statut_libelle: signalement.statut?.libelle,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            // UPDATE: Le document existe déjà dans Firebase
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('signalements').doc(firebaseId).update(firebaseData);

            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Signalement mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            // INSERT: Nouveau document dans Firebase
            const docRef = await firebaseDB.collection('signalements').add(firebaseData);
            const firebaseId = docRef.id;

            // Créer le mapping
            await FirebaseMapping.create({
              entity_type: 'signalement',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });

            stats.inserted++;
            console.log(`✅ Nouveau signalement créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({
            postgres_id: signalement.id_signalements,
            error: error.message,
          });
          console.error(`❌ Erreur pour le signalement PG ${signalement.id_signalements}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL signalements: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL signalements:', error);
      throw {
        code: 'SYNC_ERROR',
        message: error.message || 'Erreur lors de la synchronisation PostgreSQL → Firebase',
        status: 500,
      };
    }
  },

  /**
   * PUSH: Synchronise les villes de Firebase vers PostgreSQL
   */
  async pushVillesToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseVilles = await firebaseDB.collection('villes').get();
      stats.total = firebaseVilles.docs.length;
      console.log(`🔄 PUSH: ${stats.total} villes trouvées dans Firebase`);

      for (const doc of firebaseVilles.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'ville', firebase_id: firebaseId },
          });

          if (existingMapping) {
            const ville = await Ville.findByPk(existingMapping.postgres_id);
            if (ville) {
              await ville.update({
                nom: firebaseData.nom,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Ville ${firebaseData.nom} mise à jour (PG ID: ${ville.id_villes})`);
            }
          } else {
            const newVille = await Ville.create({
              nom: firebaseData.nom,
            });
            await FirebaseMapping.create({
              entity_type: 'ville',
              postgres_id: newVille.id_villes,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouvelle ville ${firebaseData.nom} créée (PG ID: ${newVille.id_villes})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour la ville Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH villes: ${stats.inserted} créées, ${stats.updated} mises à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH villes:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les villes de PostgreSQL vers Firebase
   */
  async pullVillesToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const villes = await Ville.findAll();
      stats.total = villes.length;
      console.log(`🔄 PULL: ${stats.total} villes trouvées dans PostgreSQL`);

      for (const ville of villes) {
        try {
          const postgresId = ville.id_villes;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'ville', postgres_id: postgresId },
          });

          const firebaseData = {
            nom: ville.nom,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('villes').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Ville ${ville.nom} mise à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('villes').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'ville',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouvelle ville ${ville.nom} créée dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: ville.id_villes, error: error.message });
          console.error(`❌ Erreur pour la ville PG ${ville.id_villes}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL villes: ${stats.inserted} créées, ${stats.updated} mises à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL villes:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PUSH: Synchronise les profils de Firebase vers PostgreSQL
   */
  async pushProfilsToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseProfils = await firebaseDB.collection('profils').get();
      stats.total = firebaseProfils.docs.length;
      console.log(`🔄 PUSH: ${stats.total} profils trouvés dans Firebase`);

      for (const doc of firebaseProfils.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'profil', firebase_id: firebaseId },
          });

          if (existingMapping) {
            const profil = await Profil.findByPk(existingMapping.postgres_id);
            if (profil) {
              await profil.update({
                libelle: firebaseData.libelle,
                descri: firebaseData.descri,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Profil ${firebaseData.libelle} mis à jour (PG ID: ${profil.id_profils})`);
            }
          } else {
            const newProfil = await Profil.create({
              libelle: firebaseData.libelle,
              descri: firebaseData.descri,
            });
            await FirebaseMapping.create({
              entity_type: 'profil',
              postgres_id: newProfil.id_profils,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau profil ${firebaseData.libelle} créé (PG ID: ${newProfil.id_profils})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour le profil Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH profils: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH profils:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les profils de PostgreSQL vers Firebase
   */
  async pullProfilsToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const profils = await Profil.findAll();
      stats.total = profils.length;
      console.log(`🔄 PULL: ${stats.total} profils trouvés dans PostgreSQL`);

      for (const profil of profils) {
        try {
          const postgresId = profil.id_profils;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'profil', postgres_id: postgresId },
          });

          const firebaseData = {
            libelle: profil.libelle,
            descri: profil.descri,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('profils').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Profil ${profil.libelle} mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('profils').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'profil',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau profil ${profil.libelle} créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: profil.id_profils, error: error.message });
          console.error(`❌ Erreur pour le profil PG ${profil.id_profils}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL profils: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL profils:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PUSH: Synchronise les entreprises de Firebase vers PostgreSQL
   */
  async pushEntreprisesToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseEntreprises = await firebaseDB.collection('entreprises').get();
      stats.total = firebaseEntreprises.docs.length;
      console.log(`🔄 PUSH: ${stats.total} entreprises trouvées dans Firebase`);

      for (const doc of firebaseEntreprises.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'entreprise', firebase_id: firebaseId },
          });

          if (existingMapping) {
            const entreprise = await Entreprise.findByPk(existingMapping.postgres_id);
            if (entreprise) {
              await entreprise.update({
                nom: firebaseData.nom,
                adresse: firebaseData.adresse,
                telephone: firebaseData.telephone,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Entreprise ${firebaseData.nom} mise à jour (PG ID: ${entreprise.id_entreprises})`);
            }
          } else {
            const newEntreprise = await Entreprise.create({
              nom: firebaseData.nom,
              adresse: firebaseData.adresse,
              telephone: firebaseData.telephone,
            });
            await FirebaseMapping.create({
              entity_type: 'entreprise',
              postgres_id: newEntreprise.id_entreprises,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouvelle entreprise ${firebaseData.nom} créée (PG ID: ${newEntreprise.id_entreprises})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour l'entreprise Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH entreprises: ${stats.inserted} créées, ${stats.updated} mises à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH entreprises:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les entreprises de PostgreSQL vers Firebase
   */
  async pullEntreprisesToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const entreprises = await Entreprise.findAll();
      stats.total = entreprises.length;
      console.log(`🔄 PULL: ${stats.total} entreprises trouvées dans PostgreSQL`);

      for (const entreprise of entreprises) {
        try {
          const postgresId = entreprise.id_entreprises;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'entreprise', postgres_id: postgresId },
          });

          const firebaseData = {
            nom: entreprise.nom,
            adresse: entreprise.adresse,
            telephone: entreprise.telephone,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('entreprises').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Entreprise ${entreprise.nom} mise à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('entreprises').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'entreprise',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouvelle entreprise ${entreprise.nom} créée dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: entreprise.id_entreprises, error: error.message });
          console.error(`❌ Erreur pour l'entreprise PG ${entreprise.id_entreprises}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL entreprises: ${stats.inserted} créées, ${stats.updated} mises à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL entreprises:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PUSH: Synchronise les statuts de signalement de Firebase vers PostgreSQL
   */
  async pushSignalementStatutsToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseStatuts = await firebaseDB.collection('signalement_statuts').get();
      stats.total = firebaseStatuts.docs.length;
      console.log(`🔄 PUSH: ${stats.total} statuts de signalement trouvés dans Firebase`);

      for (const doc of firebaseStatuts.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'signalement_statut', firebase_id: firebaseId },
          });

          if (existingMapping) {
            const statut = await SignalementStatut.findByPk(existingMapping.postgres_id);
            if (statut) {
              await statut.update({
                libelle: firebaseData.libelle,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Statut signalement ${firebaseData.libelle} mis à jour (PG ID: ${statut.id_signalement_statuts})`);
            }
          } else {
            const newStatut = await SignalementStatut.create({
              libelle: firebaseData.libelle,
            });
            await FirebaseMapping.create({
              entity_type: 'signalement_statut',
              postgres_id: newStatut.id_signalement_statuts,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau statut signalement ${firebaseData.libelle} créé (PG ID: ${newStatut.id_signalement_statuts})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour le statut signalement Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH statuts signalement: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH statuts signalement:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les statuts de signalement de PostgreSQL vers Firebase
   */
  async pullSignalementStatutsToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const statuts = await SignalementStatut.findAll();
      stats.total = statuts.length;
      console.log(`🔄 PULL: ${stats.total} statuts de signalement trouvés dans PostgreSQL`);

      for (const statut of statuts) {
        try {
          const postgresId = statut.id_signalement_statuts;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'signalement_statut', postgres_id: postgresId },
          });

          const firebaseData = {
            libelle: statut.libelle,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('signalement_statuts').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Statut signalement ${statut.libelle} mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('signalement_statuts').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'signalement_statut',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau statut signalement ${statut.libelle} créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: statut.id_signalement_statuts, error: error.message });
          console.error(`❌ Erreur pour le statut signalement PG ${statut.id_signalement_statuts}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL statuts signalement: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL statuts signalement:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PUSH: Synchronise les statuts de problème de Firebase vers PostgreSQL
   */
  async pushProblemeStatutsToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseStatuts = await firebaseDB.collection('probleme_statuts').get();
      stats.total = firebaseStatuts.docs.length;
      console.log(`🔄 PUSH: ${stats.total} statuts de problème trouvés dans Firebase`);

      for (const doc of firebaseStatuts.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'probleme_statut', firebase_id: firebaseId },
          });

          if (existingMapping) {
            const statut = await ProblemeStatut.findByPk(existingMapping.postgres_id);
            if (statut) {
              await statut.update({
                libelle: firebaseData.libelle,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Statut problème ${firebaseData.libelle} mis à jour (PG ID: ${statut.id_probleme_statuts})`);
            }
          } else {
            const newStatut = await ProblemeStatut.create({
              libelle: firebaseData.libelle,
            });
            await FirebaseMapping.create({
              entity_type: 'probleme_statut',
              postgres_id: newStatut.id_probleme_statuts,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau statut problème ${firebaseData.libelle} créé (PG ID: ${newStatut.id_probleme_statuts})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour le statut problème Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH statuts problème: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH statuts problème:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les statuts de problème de PostgreSQL vers Firebase
   */
  async pullProblemeStatutsToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const statuts = await ProblemeStatut.findAll();
      stats.total = statuts.length;
      console.log(`🔄 PULL: ${stats.total} statuts de problème trouvés dans PostgreSQL`);

      for (const statut of statuts) {
        try {
          const postgresId = statut.id_probleme_statuts;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'probleme_statut', postgres_id: postgresId },
          });

          const firebaseData = {
            libelle: statut.libelle,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('probleme_statuts').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Statut problème ${statut.libelle} mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('probleme_statuts').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'probleme_statut',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau statut problème ${statut.libelle} créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: statut.id_probleme_statuts, error: error.message });
          console.error(`❌ Erreur pour le statut problème PG ${statut.id_probleme_statuts}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL statuts problème: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL statuts problème:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PUSH: Synchronise les statuts d'utilisateur de Firebase vers PostgreSQL
   */
  async pushStatutsUtilisateurToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseStatuts = await firebaseDB.collection('statuts_utilisateur').get();
      stats.total = firebaseStatuts.docs.length;
      console.log(`🔄 PUSH: ${stats.total} statuts d'utilisateur trouvés dans Firebase`);

      for (const doc of firebaseStatuts.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'statut', firebase_id: firebaseId },
          });

          if (existingMapping) {
            const statut = await Statut.findByPk(existingMapping.postgres_id);
            if (statut) {
              await statut.update({
                libelle: firebaseData.libelle,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Statut utilisateur ${firebaseData.libelle} mis à jour (PG ID: ${statut.id_statuts})`);
            }
          } else {
            const newStatut = await Statut.create({
              libelle: firebaseData.libelle,
            });
            await FirebaseMapping.create({
              entity_type: 'statut',
              postgres_id: newStatut.id_statuts,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau statut utilisateur ${firebaseData.libelle} créé (PG ID: ${newStatut.id_statuts})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour le statut utilisateur Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH statuts utilisateur: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH statuts utilisateur:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les statuts d'utilisateur de PostgreSQL vers Firebase
   */
  async pullStatutsUtilisateurToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const statuts = await Statut.findAll();
      stats.total = statuts.length;
      console.log(`🔄 PULL: ${stats.total} statuts d'utilisateur trouvés dans PostgreSQL`);

      for (const statut of statuts) {
        try {
          const postgresId = statut.id_statuts;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'statut', postgres_id: postgresId },
          });

          const firebaseData = {
            libelle: statut.libelle,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('statuts_utilisateur').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Statut utilisateur ${statut.libelle} mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('statuts_utilisateur').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'statut',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau statut utilisateur ${statut.libelle} créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: statut.id_statuts, error: error.message });
          console.error(`❌ Erreur pour le statut utilisateur PG ${statut.id_statuts}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL statuts utilisateur: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL statuts utilisateur:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PUSH: Synchronise les problèmes de Firebase vers PostgreSQL
   */
  async pushProblemesToPostgres() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const firebaseProblemes = await firebaseDB.collection('problemes').get();
      stats.total = firebaseProblemes.docs.length;
      console.log(`🔄 PUSH: ${stats.total} problèmes trouvés dans Firebase`);

      for (const doc of firebaseProblemes.docs) {
        try {
          const firebaseData = doc.data();
          const firebaseId = doc.id;

          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'probleme', firebase_id: firebaseId },
          });

          // Récupérer les IDs PostgreSQL depuis les mappings
          let entrepriseId = null;
          if (firebaseData.entreprise_firebase_id) {
            const entrepriseMapping = await FirebaseMapping.findOne({
              where: { entity_type: 'entreprise', firebase_id: firebaseData.entreprise_firebase_id },
            });
            entrepriseId = entrepriseMapping?.postgres_id;
          }

          let signalementId = null;
          if (firebaseData.signalement_firebase_id) {
            const signalementMapping = await FirebaseMapping.findOne({
              where: { entity_type: 'signalement', firebase_id: firebaseData.signalement_firebase_id },
            });
            signalementId = signalementMapping?.postgres_id;
          }

          let problemeStatutId = null;
          if (firebaseData.statut_firebase_id) {
            const statutMapping = await FirebaseMapping.findOne({
              where: { entity_type: 'probleme_statut', firebase_id: firebaseData.statut_firebase_id },
            });
            problemeStatutId = statutMapping?.postgres_id;
          }

          if (existingMapping) {
            const probleme = await Probleme.findByPk(existingMapping.postgres_id);
            if (probleme) {
              await probleme.update({
                surface: firebaseData.surface,
                budget: firebaseData.budget,
                entreprise_id: entrepriseId,
                signalement_id: signalementId,
                probleme_statut_id: problemeStatutId,
              });
              await existingMapping.update({ updated_at: new Date() });
              stats.updated++;
              console.log(`✅ Problème mis à jour (PG ID: ${probleme.id_problemes})`);
            }
          } else {
            const newProbleme = await Probleme.create({
              surface: firebaseData.surface,
              budget: firebaseData.budget,
              entreprise_id: entrepriseId,
              signalement_id: signalementId,
              probleme_statut_id: problemeStatutId,
            });
            await FirebaseMapping.create({
              entity_type: 'probleme',
              postgres_id: newProbleme.id_problemes,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau problème créé (PG ID: ${newProbleme.id_problemes})`);
          }
        } catch (error) {
          stats.errors.push({ firebase_id: doc.id, error: error.message });
          console.error(`❌ Erreur pour le problème Firebase ${doc.id}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PUSH problèmes: ${stats.inserted} créés, ${stats.updated} mis à jour`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PUSH problèmes:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * PULL: Synchronise les problèmes de PostgreSQL vers Firebase
   */
  async pullProblemesToFirebase() {
    try {
      const stats = { inserted: 0, updated: 0, errors: [], total: 0 };
      const problemes = await Probleme.findAll({
        include: [
          { model: Entreprise, as: 'entreprise' },
          { model: Signalement, as: 'signalement' },
          { model: ProblemeStatut, as: 'statut' },
        ],
      });
      stats.total = problemes.length;
      console.log(`🔄 PULL: ${stats.total} problèmes trouvés dans PostgreSQL`);

      for (const probleme of problemes) {
        try {
          const postgresId = probleme.id_problemes;
          const existingMapping = await FirebaseMapping.findOne({
            where: { entity_type: 'probleme', postgres_id: postgresId },
          });

          // Récupérer les Firebase IDs depuis les mappings
          let entrepriseFirebaseId = null;
          if (probleme.entreprise_id) {
            const entrepriseMapping = await FirebaseMapping.findOne({
              where: { entity_type: 'entreprise', postgres_id: probleme.entreprise_id },
            });
            entrepriseFirebaseId = entrepriseMapping?.firebase_id;
          }

          let signalementFirebaseId = null;
          if (probleme.signalement_id) {
            const signalementMapping = await FirebaseMapping.findOne({
              where: { entity_type: 'signalement', postgres_id: probleme.signalement_id },
            });
            signalementFirebaseId = signalementMapping?.firebase_id;
          }

          let statutFirebaseId = null;
          if (probleme.probleme_statut_id) {
            const statutMapping = await FirebaseMapping.findOne({
              where: { entity_type: 'probleme_statut', postgres_id: probleme.probleme_statut_id },
            });
            statutFirebaseId = statutMapping?.firebase_id;
          }

          const firebaseData = {
            surface: probleme.surface,
            budget: probleme.budget,
            entreprise_firebase_id: entrepriseFirebaseId,
            entreprise_nom: probleme.entreprise?.nom,
            signalement_firebase_id: signalementFirebaseId,
            statut_firebase_id: statutFirebaseId,
            statut_libelle: probleme.statut?.libelle,
            synced_at: new Date().toISOString(),
          };

          if (existingMapping) {
            const firebaseId = existingMapping.firebase_id;
            await firebaseDB.collection('problemes').doc(firebaseId).update(firebaseData);
            await existingMapping.update({ updated_at: new Date() });
            stats.updated++;
            console.log(`✅ Problème mis à jour dans Firebase (Firebase ID: ${firebaseId})`);
          } else {
            const docRef = await firebaseDB.collection('problemes').add(firebaseData);
            const firebaseId = docRef.id;
            await FirebaseMapping.create({
              entity_type: 'probleme',
              postgres_id: postgresId,
              firebase_id: firebaseId,
            });
            stats.inserted++;
            console.log(`✅ Nouveau problème créé dans Firebase (Firebase ID: ${firebaseId})`);
          }
        } catch (error) {
          stats.errors.push({ postgres_id: probleme.id_problemes, error: error.message });
          console.error(`❌ Erreur pour le problème PG ${probleme.id_problemes}:`, error.message);
        }
      }

      return {
        success: true,
        message: `PULL problèmes: ${stats.inserted} créés, ${stats.updated} mis à jour dans Firebase`,
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur PULL problèmes:', error);
      throw { code: 'SYNC_ERROR', message: error.message, status: 500 };
    }
  },

  /**
   * Synchronisation complète dans les deux sens pour TOUTES les tables
   */
  async syncAll() {
    try {
      const results = {
        villes: { push: null, pull: null },
        profils: { push: null, pull: null },
        statuts_utilisateur: { push: null, pull: null },
        utilisateurs: { push: null, pull: null },
        entreprises: { push: null, pull: null },
        signalement_statuts: { push: null, pull: null },
        signalements: { push: null, pull: null },
        probleme_statuts: { push: null, pull: null },
        problemes: { push: null, pull: null },
      };

      // Ordre important : sync des tables de référence d'abord
      
      // 1. Villes (table de référence sans dépendance)
      console.log('\n🔄 === VILLES ===');
      results.villes.push = await this.pushVillesToPostgres();
      results.villes.pull = await this.pullVillesToFirebase();

      // 2. Profils (table de référence sans dépendance)
      console.log('\n🔄 === PROFILS ===');
      results.profils.push = await this.pushProfilsToPostgres();
      results.profils.pull = await this.pullProfilsToFirebase();

      // 3. Statuts utilisateur (table de référence sans dépendance)
      console.log('\n🔄 === STATUTS UTILISATEUR ===');
      results.statuts_utilisateur.push = await this.pushStatutsUtilisateurToPostgres();
      results.statuts_utilisateur.pull = await this.pullStatutsUtilisateurToFirebase();

      // 4. Utilisateurs (dépend de profils et statuts)
      console.log('\n🔄 === UTILISATEURS ===');
      results.utilisateurs.push = await this.pushUtilisateursToPostgres();
      results.utilisateurs.pull = await this.pullUtilisateursToFirebase();

      // 5. Entreprises (table de référence sans dépendance)
      console.log('\n🔄 === ENTREPRISES ===');
      results.entreprises.push = await this.pushEntreprisesToPostgres();
      results.entreprises.pull = await this.pullEntreprisesToFirebase();

      // 6. Statuts de signalement (table de référence sans dépendance)
      console.log('\n🔄 === STATUTS SIGNALEMENT ===');
      results.signalement_statuts.push = await this.pushSignalementStatutsToPostgres();
      results.signalement_statuts.pull = await this.pullSignalementStatutsToFirebase();

      // 7. Signalements (dépend de utilisateurs et statuts signalement)
      console.log('\n🔄 === SIGNALEMENTS ===');
      results.signalements.push = await this.pushSignalementsToPostgres();
      results.signalements.pull = await this.pullSignalementsToFirebase();

      // 8. Statuts de problème (table de référence sans dépendance)
      console.log('\n🔄 === STATUTS PROBLÈME ===');
      results.probleme_statuts.push = await this.pushProblemeStatutsToPostgres();
      results.probleme_statuts.pull = await this.pullProblemeStatutsToFirebase();

      // 9. Problèmes (dépend de entreprises, signalements, statuts problème)
      console.log('\n🔄 === PROBLÈMES ===');
      results.problemes.push = await this.pushProblemesToPostgres();
      results.problemes.pull = await this.pullProblemesToFirebase();

      console.log('\n✅ === SYNCHRONISATION COMPLÈTE TERMINÉE ===\n');

      return {
        success: true,
        message: 'Synchronisation complète de toutes les tables réussie',
        results,
      };
    } catch (error) {
      console.error('❌ Erreur synchronisation complète:', error);
      throw {
        code: 'SYNC_ERROR',
        message: error.message || 'Erreur lors de la synchronisation complète',
        status: 500,
      };
    }
  },

  /**
   * Obtenir le statut de la synchronisation pour TOUTES les tables
   */
  async getSyncStatus() {
    try {
      // Fonction helper pour compter les mappings et totaux
      const getEntityStatus = async (entityType, PostgresModel, countField) => {
        const mapped = await FirebaseMapping.count({ where: { entity_type: entityType } });
        const total = await PostgresModel.count();
        return {
          total_postgres: total,
          synchronises: mapped,
          non_synchronises: total - mapped,
        };
      };

      const status = {
        villes: await getEntityStatus('ville', Ville, 'id_villes'),
        profils: await getEntityStatus('profil', Profil, 'id_profils'),
        statuts_utilisateur: await getEntityStatus('statut', Statut, 'id_statuts'),
        utilisateurs: await getEntityStatus('utilisateur', Utilisateur, 'id_utilisateurs'),
        entreprises: await getEntityStatus('entreprise', Entreprise, 'id_entreprises'),
        signalement_statuts: await getEntityStatus('signalement_statut', SignalementStatut, 'id_signalement_statuts'),
        signalements: await getEntityStatus('signalement', Signalement, 'id_signalements'),
        probleme_statuts: await getEntityStatus('probleme_statut', ProblemeStatut, 'id_probleme_statuts'),
        problemes: await getEntityStatus('probleme', Probleme, 'id_problemes'),
      };

      // Dernière synchronisation
      const lastSync = await FirebaseMapping.findOne({
        order: [['updated_at', 'DESC']],
      });

      status.derniere_synchronisation = lastSync?.updated_at || null;

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error('❌ Erreur statut sync:', error);
      throw {
        code: 'SYNC_ERROR',
        message: error.message || 'Erreur lors de la récupération du statut',
        status: 500,
      };
    }
  },
};

module.exports = syncService;
