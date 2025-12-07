import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Network API
export const networkApi = {
  getNetworkInfo: () => api.get('/network-info'),
}

// Plugins API
export const pluginsApi = {
  getAll: () => api.get('/plugins'),
  getById: (id) => api.get(`/plugins/${id}`),
  run: (id, params = {}) => api.post(`/plugins/${id}/run`, params),
  runPlugin: (id, params = {}) => api.post('/run-plugin', { id, params }),
}

// Plugin Manager API
export const pluginManagerApi = {
  listInstalled: () => api.get('/plugins/manage/list'),
  getDetails: (id) => api.get(`/plugins/manage/details/${id}`),
  listAvailable: () => api.get('/plugins/manage/available'),
  refreshCatalog: () => api.post('/plugins/manage/refresh-catalog'),
  install: (repository) => api.post('/plugins/manage/install', { repository }),
  bulkInstall: (repositories) => api.post('/plugins/manage/bulk-install', { repositories }),
  update: (id) => api.post(`/plugins/manage/update/${id}`),
  uninstall: (id) => api.post(`/plugins/manage/uninstall/${id}`),
  updateAll: () => api.post('/plugins/manage/update-all'),
  sync: () => api.post('/plugins/manage/sync'),
}

export default api
