const { Utilisateur, UtilisateurStatut, Statut, Signalement, SignalementStatut, Point, Profil, FirebaseMapping } = require('../models');

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
   * Synchronisation complète dans les deux sens
   */
  async syncAll() {
    try {
      const results = {
        utilisateurs: {
          push: null,
          pull: null,
        },
        signalements: {
          push: null,
          pull: null,
        },
      };

      // 1. PUSH utilisateurs (Firebase → PostgreSQL)
      console.log('\n🔄 === PUSH UTILISATEURS (Firebase → PostgreSQL) ===');
      results.utilisateurs.push = await this.pushUtilisateursToPostgres();

      // 2. PULL utilisateurs (PostgreSQL → Firebase)
      console.log('\n🔄 === PULL UTILISATEURS (PostgreSQL → Firebase) ===');
      results.utilisateurs.pull = await this.pullUtilisateursToFirebase();

      // 3. PUSH signalements (Firebase → PostgreSQL)
      console.log('\n🔄 === PUSH SIGNALEMENTS (Firebase → PostgreSQL) ===');
      results.signalements.push = await this.pushSignalementsToPostgres();

      // 4. PULL signalements (PostgreSQL → Firebase)
      console.log('\n🔄 === PULL SIGNALEMENTS (PostgreSQL → Firebase) ===');
      results.signalements.pull = await this.pullSignalementsToFirebase();

      console.log('\n✅ === SYNCHRONISATION COMPLÈTE TERMINÉE ===\n');

      return {
        success: true,
        message: 'Synchronisation complète réussie',
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
   * Obtenir le statut de la synchronisation
   */
  async getSyncStatus() {
    try {
      // Compter les mappings par type d'entité
      const utilisateursMapped = await FirebaseMapping.count({
        where: { entity_type: 'utilisateur' },
      });

      const signalementsMapped = await FirebaseMapping.count({
        where: { entity_type: 'signalement' },
      });

      // Compter les totaux dans PostgreSQL
      const totalUtilisateurs = await Utilisateur.count();
      const totalSignalements = await Signalement.count();

      // Dernière synchronisation
      const lastSync = await FirebaseMapping.findOne({
        order: [['updated_at', 'DESC']],
      });

      return {
        success: true,
        status: {
          utilisateurs: {
            total_postgres: totalUtilisateurs,
            synchronises: utilisateursMapped,
            non_synchronises: totalUtilisateurs - utilisateursMapped,
          },
          signalements: {
            total_postgres: totalSignalements,
            synchronises: signalementsMapped,
            non_synchronises: totalSignalements - signalementsMapped,
          },
          derniere_synchronisation: lastSync?.updated_at || null,
        },
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
