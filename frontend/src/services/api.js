import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('massgs_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!(config.data instanceof FormData)) {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export const authApi = {
  requestOtp: (data) => apiClient.post('/auth/otp/request', data),
  verifyOtp: (data) => apiClient.post('/auth/otp/verify', data),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getProfile: () => apiClient.get('/auth/profile'),
};

export const farmerApi = {
  createListing: (data) => apiClient.post('/farmer/produce', data),
  getListings: (params) => apiClient.get('/farmer/produce', { params }),
  getListingById: (id) => apiClient.get(`/farmer/produce/${id}`),
};

export const buyerApi = {
  createDemand: (data) => apiClient.post('/buyer/demands', data),
  getActiveDemands: (params) => apiClient.get('/buyer/demands', { params }),
  getBuyerDemands: (buyerId) => apiClient.get(`/buyer/demands/buyer/${buyerId}`),
  getRecommendationsForListing: (listingId) => apiClient.get(`/buyer/recommendations/listing/${listingId}`),
};

export const marketplaceApi = {
  createOffer: (data) => apiClient.post('/marketplace/offers', data),
  respondToOffer: (offerId, action, counterPrice) =>
    apiClient.post(`/marketplace/offers/${offerId}/respond`, null, { params: { action, counterPrice } }),
  getFarmerOffers: (farmerId) => apiClient.get(`/marketplace/offers/farmer/${farmerId}`),
  getBuyerOffers: (buyerId) => apiClient.get(`/marketplace/offers/buyer/${buyerId}`),

  acceptAgreement: (agreementId) => apiClient.post(`/marketplace/agreements/${agreementId}/accept`),
  getFarmerAgreements: (farmerId) => apiClient.get(`/marketplace/agreements/farmer/${farmerId}`),
  getBuyerAgreements: (buyerId) => apiClient.get(`/marketplace/agreements/buyer/${buyerId}`),

  updateTransactionStatus: (transactionId, status) =>
    apiClient.post(`/marketplace/transactions/${transactionId}/status`, null, { params: { status } }),
  getFarmerTransactions: (farmerId) => apiClient.get(`/marketplace/transactions/farmer/${farmerId}`),
  getBuyerTransactions: (buyerId) => apiClient.get(`/marketplace/transactions/buyer/${buyerId}`),

  submitFeedback: (data) => apiClient.post('/marketplace/feedback', data),
  getUserTrustProfile: (userId) => apiClient.get(`/marketplace/trust/${userId}`),

  reportProblem: (data) => apiClient.post('/marketplace/disputes', data),
  resolveDispute: (disputeId, resolutionNotes, status) =>
    apiClient.post(`/marketplace/disputes/${disputeId}/resolve`, null, { params: { resolutionNotes, status } }),
};

export const marketApi = {
  getPrices: (crop, state) => apiClient.get('/markets/prices', { params: { crop, state } }),
  compareMarkets: (cropName) => apiClient.get('/markets/compare', { params: { cropName } }),
  getApDistricts: () => apiClient.get('/markets/ap-districts'),
  getMandis: (district) => apiClient.get('/markets/mandis', { params: { district } }),
  getCrops: () => apiClient.get('/markets/crops'),
  getLatestRates: (district, mandiName) => apiClient.get('/markets/latest-rates', { params: { district, mandiName } }),
  getLastUpdateStatus: () => apiClient.get('/markets/last-update-status'),
  searchCrops: (query) => apiClient.get('/markets/crops/search', { params: { query } }),
};

export const locationApi = {
  search: (query) => apiClient.get('/locations/search', { params: { query } }),
  getDistricts: (state) => apiClient.get('/locations/districts', { params: { state } }),
  getMandals: (district) => apiClient.get('/locations/mandals', { params: { district } }),
  getVillages: (mandal) => apiClient.get('/locations/villages', { params: { mandal } }),
};

export const searchApi = {
  unified: (query) => apiClient.get('/search/unified', { params: { query } }),
};

export const mediaApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/media/upload', formData);
  },
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
