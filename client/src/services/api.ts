import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getUsers: (params?: any) => api.get('/auth/users', { params }),
  getRoles: () => api.get('/auth/roles'),
  getPermissions: () => api.get('/auth/permissions'),
};

// ===== Content =====
export const contentAPI = {
  // Topics
  getTopics: (params?: any) => api.get('/content/topics', { params }),
  getTopic: (id: string) => api.get(`/content/topics/${id}`),
  createTopic: (data: any) => api.post('/content/topics', data),
  updateTopic: (id: string, data: any) => api.put(`/content/topics/${id}`, data),
  deleteTopic: (id: string) => api.delete(`/content/topics/${id}`),

  // Scripts
  getScripts: (params?: any) => api.get('/content/scripts', { params }),
  getScript: (id: string) => api.get(`/content/scripts/${id}`),
  createScript: (data: any) => api.post('/content/scripts', data),
  updateScript: (id: string, data: any) => api.put(`/content/scripts/${id}`, data),
  deleteScript: (id: string) => api.delete(`/content/scripts/${id}`),

  // Assets
  getAssets: (params?: any) => api.get('/content/assets', { params }),
  createAsset: (data: any) => api.post('/content/assets', data),
  updateAsset: (id: string, data: any) => api.put(`/content/assets/${id}`, data),
  deleteAsset: (id: string) => api.delete(`/content/assets/${id}`),

  // Plans
  getPlans: (params?: any) => api.get('/content/plans', { params }),
  createPlan: (data: any) => api.post('/content/plans', data),
  updatePlan: (id: string, data: any) => api.put(`/content/plans/${id}`, data),
  deletePlan: (id: string) => api.delete(`/content/plans/${id}`),
  publishPlan: (id: string, data?: any) => api.post(`/content/plans/${id}/publish`, data || {}),
};

// ===== Data =====
export const dataAPI = {
  getSources: () => api.get('/data/sources'),
  createSource: (data: any) => api.post('/data/sources', data),
  updateSource: (id: string, data: any) => api.put(`/data/sources/${id}`, data),
  deleteSource: (id: string) => api.delete(`/data/sources/${id}`),

  getDashboards: () => api.get('/data/dashboards'),
  createDashboard: (data: any) => api.post('/data/dashboards', data),

  getMetrics: (params?: any) => api.get('/data/metrics', { params }),
  getDashboardOverview: () => api.get('/data/dashboard-overview'),

  getConversions: (params?: any) => api.get('/data/conversions', { params }),
  createConversion: (data: any) => api.post('/data/conversions', data),

  search: (keyword: string) => api.get('/data/search', { params: { keyword } }),
};

// ===== Collaboration =====
export const collabAPI = {
  getTasks: (params?: any) => api.get('/collab/tasks', { params }),
  createTask: (data: any) => api.post('/collab/tasks', data),
  updateTask: (id: string, data: any) => api.put(`/collab/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/collab/tasks/${id}`),

  getApprovals: (params?: any) => api.get('/collab/approvals', { params }),
  createApproval: (data: any) => api.post('/collab/approvals', data),
  updateApproval: (id: string, data: any) => api.put(`/collab/approvals/${id}`, data),

  getNotifications: (params?: any) => api.get('/collab/notifications', { params }),
  markRead: (id: string) => api.put(`/collab/notifications/${id}/read`),
  markAllRead: () => api.put('/collab/notifications/read-all'),

  getReviews: (params?: any) => api.get('/collab/reviews', { params }),
  createReview: (data: any) => api.post('/collab/reviews', data),
  updateReview: (id: string, data: any) => api.put(`/collab/reviews/${id}`, data),
};

// ===== Strategy =====
export const strategyAPI = {
  getBrandGoals: (params?: any) => api.get('/strategy/brand-goals', { params }),
  createBrandGoal: (data: any) => api.post('/strategy/brand-goals', data),
  updateBrandGoal: (id: string, data: any) => api.put(`/strategy/brand-goals/${id}`, data),
  deleteBrandGoal: (id: string) => api.delete(`/strategy/brand-goals/${id}`),

  getChannels: (params?: any) => api.get('/strategy/channels', { params }),
  createChannel: (data: any) => api.post('/strategy/channels', data),
  updateChannel: (id: string, data: any) => api.put(`/strategy/channels/${id}`, data),

  getColumns: (params?: any) => api.get('/strategy/columns', { params }),
  createColumn: (data: any) => api.post('/strategy/columns', data),
  updateColumn: (id: string, data: any) => api.put(`/strategy/columns/${id}`, data),

  getMonthlyReviews: (params?: any) => api.get('/strategy/monthly-reviews', { params }),
  createMonthlyReview: (data: any) => api.post('/strategy/monthly-reviews', data),
  updateMonthlyReview: (id: string, data: any) => api.put(`/strategy/monthly-reviews/${id}`, data),

  getStrategies: (params?: any) => api.get('/strategy/strategies', { params }),
  createStrategy: (data: any) => api.post('/strategy/strategies', data),
  updateStrategy: (id: string, data: any) => api.put(`/strategy/strategies/${id}`, data),
};

export default api;
