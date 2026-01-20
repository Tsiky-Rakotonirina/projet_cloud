import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Instance axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Intercepteur de requête pour ajouter le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Méthode générique pour appeler l'API
 * @param {string} endpoint - Le endpoint de l'API
 * @param {string} method - La méthode HTTP (GET, POST, PUT, DELETE)
 * @param {object} data - Les données à envoyer (pour POST, PUT)
 * @param {object} params - Les paramètres de query (pour GET)
 * @returns {Promise} - Les données de la réponse
 */
export const callApi = async (endpoint, method = 'GET', data = null, params = null) => {
  try {
    const config = {
      method,
      url: endpoint,
      ...(data && { data }),
      ...(params && { params })
    };

    const response = await apiClient.request(config);
    return response.data;
  } catch (error) {
    console.error(`Erreur API [${method} ${endpoint}]:`, error);
    throw error;
  }
};

export default apiClient;
