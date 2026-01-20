import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/services/firebase/firebase";
import type { Problem, Entreprise, ProblemeStatut, Signalement } from "@/types/entities";

// Récupérer tous les problèmes avec leurs signalements, entreprises et statuts associés
export const getAllProblems = async (): Promise<Problem[]> => {
  try {
    const problemsCollectionRef = collection(db, "problemes");
    const problemDocs = await getDocs(problemsCollectionRef);
    
    const problems: Problem[] = [];

    for (const doc of problemDocs.docs) {
      const problemData = doc.data() as Omit<Problem, 'id'>;
      const signalementId = problemData.signalementId;
      const entrepriseId = problemData.entrepriseId;
      const statutId = problemData.statutId;

      // Récupérer le signalement associé
      const signalementRef = collection(db, "signalements");
      const signalementQuery = query(signalementRef, where("__name__", "==", signalementId));
      const signalementDocs = await getDocs(signalementQuery);

      let signalement: Signalement | undefined;
      if (!signalementDocs.empty) {
        const signalementDoc = signalementDocs.docs[0];
        signalement = {
          id: signalementDoc.id,
          ...signalementDoc.data() as Omit<Signalement, 'id'>
        };
      }

      // Récupérer l'entreprise associée
      const entrepriseRef = collection(db, "entreprises");
      const entrepriseQuery = query(entrepriseRef, where("__name__", "==", entrepriseId));
      const entrepriseDocs = await getDocs(entrepriseQuery);

      let entreprise: Entreprise | undefined;
      if (!entrepriseDocs.empty) {
        const entrepriseDoc = entrepriseDocs.docs[0];
        entreprise = {
          id: entrepriseDoc.id,
          ...entrepriseDoc.data() as Omit<Entreprise, 'id'>
        };
      }

      // Récupérer le statut du problème
      const statutRef = collection(db, "probleme_statuts");
      const statutQuery = query(statutRef, where("__name__", "==", statutId));
      const statutDocs = await getDocs(statutQuery);

      let statut: ProblemeStatut | undefined;
      if (!statutDocs.empty) {
        const statutDoc = statutDocs.docs[0];
        statut = {
          id: statutDoc.id,
          ...statutDoc.data() as Omit<ProblemeStatut, 'id'>
        };
      }

      problems.push({
        id: doc.id,
        ...problemData,
        signalement,
        entreprise,
        statut
      });
    }

    console.log(`${problems.length} problèmes récupérés`);
    return problems;
  } catch (error) {
    console.error("Erreur lors de la récupération des problèmes :", error);
    return [];
  }
};

// Récupérer tous les signalements de la ville d'Antananarivo
export const getSignalementsByCity = async (cityId: string): Promise<Signalement[]> => {
  try {
    const signalementCollectionRef = collection(db, "signalements");
    const signalementDocs = await getDocs(signalementCollectionRef);

    const signalements: Signalement[] = signalementDocs.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Signalement, 'id'>
      }))
      .filter(s => s.point.villeId === cityId);

    console.log(`${signalements.length} signalements trouvés pour la ville ${cityId}`);
    return signalements;
  } catch (error) {
    console.error("Erreur lors de la récupération des signalements :", error);
    return [];
  }
};

// Créer un nouveau signalement
export const createSignalement = async (
  description: string,
  lat: number,
  lng: number,
  villeId: string = "villeId"
): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    // Créer le signalement avec le statut par défaut
    const signalementData = {
      description,
      utilisateurId: user.uid,
      statutId: "signalementStatutId", // Statut par défaut
      point: {
        lat,
        lng,
        villeId
      },
      createdAt: new Date().toISOString(),
      historiques: [
        {
          date: new Date().toISOString(),
          utilisateurId: user.uid,
          statutId: "signalementStatutId"
        }
      ]
    };

    const signalementRef = collection(db, "signalements");
    const docRef = await addDoc(signalementRef, signalementData);
    
    console.log("Signalement créé avec l'ID :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création du signalement :", error);
    throw error;
  }
};

// Récupérer les signalements de l'utilisateur connecté
export const getMySignalements = async (): Promise<Signalement[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const signalementCollectionRef = collection(db, "signalements");
    const q = query(signalementCollectionRef, where("utilisateurId", "==", user.uid));
    const signalementDocs = await getDocs(q);

    const signalements: Signalement[] = signalementDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Signalement, 'id'>
    }));

    console.log(`${signalements.length} signalements trouvés pour l'utilisateur`);
    return signalements;
  } catch (error) {
    console.error("Erreur lors de la récupération des signalements :", error);
    return [];
  }
};

// Récupérer les problèmes liés aux signalements de l'utilisateur connecté
export const getMyProblems = async (): Promise<Problem[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    // D'abord récupérer mes signalements
    const mySignalements = await getMySignalements();
    const mySignalementIds = mySignalements.map(s => s.id);

    if (mySignalementIds.length === 0) {
      return [];
    }

    // Récupérer tous les problèmes et filtrer ceux liés à mes signalements
    const allProblems = await getAllProblems();
    const myProblems = allProblems.filter(p => 
      mySignalementIds.includes(p.signalementId)
    );

    console.log(`${myProblems.length} problèmes trouvés pour l'utilisateur`);
    return myProblems;
  } catch (error) {
    console.error("Erreur lors de la récupération des problèmes :", error);
    return [];
  }
};

