import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { auth } from "@/services/firebase/firebase";
import { db } from "@/services/firebase/firebase";
import type { Problem, Entreprise, ProblemeStatut, Signalement, SignalementImage } from "@/types/entities";
import { prepareImagesForFirestore, type UploadedImage } from "@/services/imageService";

// Cache pour les données statiques
let cachedEntreprises: Map<string, Entreprise> | null = null;
let cachedProblemeStatuts: Map<string, ProblemeStatut> | null = null;
let cachedSignalementStatuts: Map<string, { libelle: string; descri: string }> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Charger toutes les données de référence en parallèle
const loadReferenceData = async () => {
  const now = Date.now();
  if (cachedEntreprises && cachedProblemeStatuts && cachedSignalementStatuts && (now - cacheTimestamp) < CACHE_DURATION) {
    return { entreprises: cachedEntreprises, problemeStatuts: cachedProblemeStatuts, signalementStatuts: cachedSignalementStatuts };
  }

  const [entrepriseDocs, problemeStatutDocs, signalementStatutDocs] = await Promise.all([
    getDocs(collection(db, "entreprises")),
    getDocs(collection(db, "probleme_statuts")),
    getDocs(collection(db, "signalement_statuts"))
  ]);

  cachedEntreprises = new Map();
  entrepriseDocs.docs.forEach(doc => {
    cachedEntreprises!.set(doc.id, { id: doc.id, ...doc.data() as Omit<Entreprise, 'id'> });
  });

  cachedProblemeStatuts = new Map();
  problemeStatutDocs.docs.forEach(doc => {
    cachedProblemeStatuts!.set(doc.id, { id: doc.id, ...doc.data() as Omit<ProblemeStatut, 'id'> });
  });

  cachedSignalementStatuts = new Map();
  signalementStatutDocs.docs.forEach(doc => {
    const data = doc.data();
    cachedSignalementStatuts!.set(doc.id, { libelle: data.libelle, descri: data.descri });
  });

  cacheTimestamp = now;
  console.log(`📦 Cache chargé: ${cachedEntreprises.size} entreprises, ${cachedProblemeStatuts.size} statuts problème, ${cachedSignalementStatuts.size} statuts signalement`);
  
  return { entreprises: cachedEntreprises, problemeStatuts: cachedProblemeStatuts, signalementStatuts: cachedSignalementStatuts };
};

// Récupérer tous les problèmes avec leurs signalements, entreprises et statuts associés - OPTIMISÉ
export const getAllProblems = async (): Promise<Problem[]> => {
  try {
    // Charger données de référence + problèmes + signalements EN PARALLÈLE
    const [refData, problemDocs, signalementDocs] = await Promise.all([
      loadReferenceData(),
      getDocs(collection(db, "problemes")),
      getDocs(collection(db, "signalements"))
    ]);

    const { entreprises, problemeStatuts } = refData;

    // Créer une map des signalements pour lookup O(1)
    const signalementsMap = new Map<string, Signalement>();
    signalementDocs.docs.forEach(doc => {
      signalementsMap.set(doc.id, { id: doc.id, ...doc.data() as Omit<Signalement, 'id'> });
    });

    // Traiter les problèmes
    const problems: Problem[] = problemDocs.docs.map(doc => {
      const problemData = doc.data() as Omit<Problem, 'id'>;
      
      // Lookup signalement (O(1))
      const signalement = problemData.signalementId ? signalementsMap.get(problemData.signalementId) : undefined;
      
      // Lookup entreprise (O(1))
      const entreprise = problemData.entrepriseId ? entreprises.get(problemData.entrepriseId) : undefined;
      
      // Déterminer le dernier statut depuis l'historique
      const historiques = problemData.historiques || [];
      const sortedHistoriques = [...historiques].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestStatutId = sortedHistoriques.length > 0 ? sortedHistoriques[0].statutId : problemData.statutId;
      
      // Lookup statut (O(1))
      const statut = latestStatutId ? problemeStatuts.get(latestStatutId) : undefined;

      return {
        id: doc.id,
        ...problemData,
        signalement,
        entreprise,
        statut
      };
    });

    console.log(`✅ ${problems.length} problèmes récupérés (optimisé)`);
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

// Récupérer les signalements de l'utilisateur connecté avec le dernier statut de l'historique - OPTIMISÉ
export const getMySignalements = async (): Promise<Signalement[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return [];
    }

    // Charger cache et signalements en parallèle
    const [refData, signalementDocs] = await Promise.all([
      loadReferenceData(),
      getDocs(query(collection(db, "signalements"), where("utilisateurId", "==", user.uid)))
    ]);

    const { signalementStatuts } = refData;

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

      // Résoudre le statut depuis le cache (O(1))
      let statut = undefined;
      if (latestStatutId) {
        const statutData = signalementStatuts.get(latestStatutId);
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






