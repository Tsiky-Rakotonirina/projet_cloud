export interface Problem {
  id: string;
  surface: number;
  budget: number;
  entrepriseId: string;
  signalementId: string;
  statutId: string;
  signalement?: Signalement;
  entreprise?: Entreprise;
  statut?: ProblemeStatut;
  historiques: Array<{
    date: string;
    surface: number;
    budget: number;
    utilisateurId: string;
    statutId: string;
  }>;
}

export interface Entreprise {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
}

export interface ProblemeStatut {
  id: string;
  libelle: string;
  descri: string;
  pourcentage: number;
}

export interface Signalement {
  id: string;
  description: string;
  utilisateurId: string;
  statutId: string;
  point: {
    lat: number;
    lng: number;
    villeId: string;
  };
  createdAt: string;
  historiques: Array<{
    date: string;
    utilisateurId: string;
    statutId: string;
  }>;
}