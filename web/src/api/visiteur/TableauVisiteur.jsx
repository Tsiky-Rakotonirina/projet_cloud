import { callApi } from '@util/api';

// Données par défaut pour l'affichage
const defaultData = [
  { id: 1, zone: 'Analamanga', nbPoints: 45, surface: 12500, avancement: 68, budget: 2500000000 },
  { id: 2, zone: 'Vakinankaratra', nbPoints: 32, surface: 8200, avancement: 45, budget: 1800000000 },
  { id: 3, zone: 'Itasy', nbPoints: 18, surface: 4500, avancement: 82, budget: 950000000 },
  { id: 4, zone: 'Bongolava', nbPoints: 12, surface: 3100, avancement: 30, budget: 620000000 },
];

const defaultTotals = {
  nbPoints: 107,
  totalSurface: 28300,
  avancement: 56,
  totalBudget: 5870000000
};

const defaultDashboard = {
  totalVisiteurs: 1250,
  nouveaux: 48,
  actifs: 892,
  visites: 3420,
  trendVisiteurs: '+12%',
  trendNouveaux: '+5%',
  trendActifs: '+8%',
  trendVisites: '+15%'
};

/**
 * API pour gérer les tableaux visiteurs
 */
export const tableauVisiteurApi = {
  /**
   * Récupérer tous les tableaux visiteurs
   */
  getAll: async () => {
    try {
      const data = await callApi('/api/tableaux-visiteurs', 'GET');
      return Array.isArray(data) ? data : defaultData;
    } catch (error) {
      console.warn('API Tableau visiteurs indisponible, données de démonstration utilisées');
      return defaultData;
    }
  },

  /**
   * Récupérer un tableau visiteur par ID
   */
  getById: async (id) => {
    try {
      return await callApi(`/api/tableaux-visiteurs/${id}`, 'GET');
    } catch (error) {
      return defaultData.find(d => d.id === id) || null;
    }
  },

  /**
   * Récupérer les statistiques (totaux uniquement)
   */
  getStats: async (visiteurId) => {
    try {
      const totals = await callApi(`/api/tableaux-visiteurs/stats${visiteurId ? '/' + visiteurId : ''}`, 'GET');
      return totals || defaultTotals;
    } catch (error) {
      console.warn('API Stats indisponible, données de démonstration utilisées');
      return defaultTotals;
    }
  },

  /**
   * Récupérer les données du tableau de bord
   */
  getDashboard: async (params) => {
    try {
      const data = await callApi('/api/tableaux-visiteurs/dashboard', 'GET', null, params);
      return data || defaultDashboard;
    } catch (error) {
      console.warn('API Dashboard indisponible, données de démonstration utilisées');
      return defaultDashboard;
    }
  },

  /**
   * Exporter les données en CSV
   */
  exportCSV: async (params) => {
    return await callApi('/api/tableaux-visiteurs/export', 'GET', null, params);
  },

  /**
   * Filtrer les tableaux par période
   */
  filterByPeriod: async (startDate, endDate) => {
    try {
      const data = await callApi('/api/tableaux-visiteurs/filter', 'GET', null, {
        startDate,
        endDate
      });
      return Array.isArray(data) ? data : defaultData;
    } catch (error) {
      return defaultData;
    }
  }
};

export default tableauVisiteurApi;
