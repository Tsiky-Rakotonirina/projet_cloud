import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { auth } from "@/services/firebase/firebase";
import { db } from "@/services/firebase/firebase";
import type { Problem, Entreprise, ProblemeStatut, Signalement, SignalementImage } from "@/types/entities";
import { prepareImagesForFirestore, type UploadedImage } from "@/services/imageService";

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
      let signalement: Signalement | undefined;
      if (signalementId) {
        const signalementRef = collection(db, "signalements");
        const signalementQuery = query(signalementRef, where("__name__", "==", signalementId));
        const signalementDocs = await getDocs(signalementQuery);

        if (!signalementDocs.empty) {
          const signalementDoc = signalementDocs.docs[0];
          signalement = {
            id: signalementDoc.id,
            ...signalementDoc.data() as Omit<Signalement, 'id'>
          };
        }
      }

      // Récupérer l'entreprise associée
      let entreprise: Entreprise | undefined;
      if (entrepriseId) {
        const entrepriseRef = collection(db, "entreprises");
        const entrepriseQuery = query(entrepriseRef, where("__name__", "==", entrepriseId));
        const entrepriseDocs = await getDocs(entrepriseQuery);

        if (!entrepriseDocs.empty) {
          const entrepriseDoc = entrepriseDocs.docs[0];
          entreprise = {
            id: entrepriseDoc.id,
            ...entrepriseDoc.data() as Omit<Entreprise, 'id'>
          };
        }
      }

      // Récupérer le statut du problème basé sur le dernier historique
      const historiques = problemData.historiques || [];
      // Trier par date décroissante et prendre le dernier statut
      const sortedHistoriques = [...historiques].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestStatutId = sortedHistoriques.length > 0 
        ? sortedHistoriques[0].statutId 
        : statutId;

      let statut: ProblemeStatut | undefined;
      if (latestStatutId) {
        const statutRef = collection(db, "probleme_statuts");
        const statutQuery = query(statutRef, where("__name__", "==", latestStatutId));
        const statutDocs = await getDocs(statutQuery);

        if (!statutDocs.empty) {
          const statutDoc = statutDocs.docs[0];
          statut = {
            id: statutDoc.id,
            ...statutDoc.data() as Omit<ProblemeStatut, 'id'>
          };
        }
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
  villeId: string = "villeId",
  images: (File | Blob)[] = []
): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    // Créer le signalement avec le statut par défaut
    const signalementData: any = {
      description,
      utilisateurId: user.uid,
      statutId: "signalementStatutId", // Statut par défaut
      point: {
        lat,
        lng,
        villeId
      },
      images: [],
      createdAt: new Date().toISOString(),
      historiques: [
        {
          date: new Date().toISOString(),
          utilisateurId: user.uid,
          statutId: "signalementStatutId"
        }
      ]
    };

    // Préparer les images en base64 si présentes
    if (images.length > 0) {
      try {
        const preparedImages = await prepareImagesForFirestore(images);
        signalementData.images = preparedImages.map(img => ({
          base64: img.base64,
          name: img.name
        }));
        console.log(`${preparedImages.length} images préparées pour le signalement`);
      } catch (imageError) {
        console.error("Erreur lors de la préparation des images:", imageError);
        // Continuer sans images si erreur
      }
    }

    const signalementRef = collection(db, "signalements");
    const docRef = await addDoc(signalementRef, signalementData);
    
    console.log("Signalement créé avec l'ID :", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création du signalement :", error);
    throw error;
  }
};

// Récupérer les signalements de l'utilisateur connecté avec le dernier statut de l'historique
export const getMySignalements = async (): Promise<Signalement[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    const signalementCollectionRef = collection(db, "signalements");
    const q = query(signalementCollectionRef, where("utilisateurId", "==", user.uid));
    const signalementDocs = await getDocs(q);

    // Récupérer tous les statuts de signalement pour résoudre les libellés
    const statutsRef = collection(db, "signalement_statuts");
    const statutsDocs = await getDocs(statutsRef);
    const statutsMap = new Map<string, { libelle: string; descri: string }>();
    statutsDocs.docs.forEach(doc => {
      const data = doc.data();
      statutsMap.set(doc.id, { libelle: data.libelle, descri: data.descri });
    });

    const signalements: Signalement[] = signalementDocs.docs.map(docItem => {
      const data = docItem.data() as Omit<Signalement, 'id' | 'statut'>;
      
      // Récupérer le dernier statut de l'historique
      const historiques = data.historiques || [];
      const sortedHistoriques = [...historiques].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestStatutId = sortedHistoriques.length > 0 
        ? sortedHistoriques[0].statutId 
        : data.statutId;

      // Résoudre le statut (avec vérification null)
      let statut = undefined;
      if (latestStatutId) {
        const statutData = statutsMap.get(latestStatutId);
        if (statutData) {
          statut = { id: latestStatutId, libelle: statutData.libelle, descri: statutData.descri };
        }
      }

      return {
        id: docItem.id,
        ...data,
        statut
      };
    });

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

// Récupérer un signalement par son ID avec le statut résolu
export const getSignalementById = async (signalementId: string): Promise<Signalement | null> => {
  try {
    const signalementRef = collection(db, "signalements");
    const signalementQuery = query(signalementRef, where("__name__", "==", signalementId));
    const signalementDocs = await getDocs(signalementQuery);

    if (signalementDocs.empty) {
      console.log(`Signalement ${signalementId} non trouvé`);
      return null;
    }

    const docItem = signalementDocs.docs[0];
    const data = docItem.data() as Omit<Signalement, 'id' | 'statut'>;

    // Récupérer les statuts de signalement
    const statutsRef = collection(db, "signalement_statuts");
    const statutsDocs = await getDocs(statutsRef);
    const statutsMap = new Map<string, { libelle: string; descri: string }>();
    statutsDocs.docs.forEach(doc => {
      const statData = doc.data();
      statutsMap.set(doc.id, { libelle: statData.libelle, descri: statData.descri });
    });

    // Récupérer le dernier statut de l'historique
    const historiques = data.historiques || [];
    const sortedHistoriques = [...historiques].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestStatutId = sortedHistoriques.length > 0 
      ? sortedHistoriques[0].statutId 
      : data.statutId;

    // Résoudre le statut
    let statut = undefined;
    if (latestStatutId) {
      const statutData = statutsMap.get(latestStatutId);
      if (statutData) {
        statut = { id: latestStatutId, libelle: statutData.libelle, descri: statutData.descri };
      }
    }

    return {
      id: docItem.id,
      ...data,
      statut
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du signalement :", error);
    return null;
  }
};
