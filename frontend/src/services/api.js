import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('massgs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
};

export const farmerApi = {
  createListing: (data) => apiClient.post('/farmer/produce', data),
  getListings: (farmerId) => apiClient.get('/farmer/produce', { params: { farmerId } }),
  getListingById: (id) => apiClient.get(`/farmer/produce/${id}`),
};

export const marketApi = {
  getPrices: (crop, state) => apiClient.get('/markets/prices', { params: { crop, state } }),
  compareMarkets: (cropName) => apiClient.get('/markets/compare', { params: { cropName } }),
};

export const recommendationApi = {
  generate: (produceListingId) => apiClient.post('/recommendations', null, { params: { produceListingId } }),
  getById: (id) => apiClient.get(`/recommendations/${id}`),
  getByListingId: (listingId) => apiClient.get(`/recommendations/listing/${listingId}`),
};

export const scenarioApi = {
  simulate: (data) => apiClient.post('/scenarios', data),
};

export const aggregationApi = {
  getOpportunities: (cropName, district) => apiClient.get('/aggregation/opportunities', { params: { cropName, district } }),
};

export const adminApi = {
  getDataMonitoring: () => apiClient.get('/admin/data-monitoring'),
  triggerIngestion: () => apiClient.post('/admin/trigger-ingestion'),
};

export default apiClient;
