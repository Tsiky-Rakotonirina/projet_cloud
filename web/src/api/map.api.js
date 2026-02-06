import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const mapApi = {
  /**
   * Récupérer tous les signalements pour la carte (avec images)
   */
  async getSignalements() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/map/signalements-carte`);
      const signalements = response.data.data || [];
      
      // Transformer les données PostgreSQL en format carte
      return signalements.map(sig => ({
        id: sig.id,
        lat: sig.lat || 0,
        lng: sig.lng || 0,
        name: sig.description || 'Signalement sans description',
        status: sig.statut === 'Nouveau' ? 'Planifie' : 
                sig.statut === 'En cours' ? 'En cours' : 'Termine',
        email: sig.email_utilisateur,
        date: sig.date_signalement,
        images: sig.images || []
      }));
    } catch (error) {
      console.error('Erreur récupération signalements:', error);
      // Retourner des données de démo si l'API échoue
      return [
        { id: 1, lng: 47.5161, lat: -18.8883, name: 'Route RN7 - Km 5', status: 'En cours', images: [] },
        { id: 2, lng: 47.5250, lat: -18.8750, name: 'Carrefour Analakely', status: 'Nouveau', images: [] },
        { id: 3, lng: 47.4950, lat: -18.8950, name: 'Boulevard de l\'Indépendance', status: 'Resolu', images: [] },
        { id: 4, lng: 47.5350, lat: -18.8650, name: 'Route vers Ivato', status: 'En cours', images: [] },
      ];
    }
  }
};
