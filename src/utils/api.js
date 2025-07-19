import axios from 'axios'

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    refreshToken: () => apiClient.post('/auth/refresh'),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password })
  },

  // User endpoints
  users: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data) => apiClient.put('/users/profile', data),
    getUsers: () => apiClient.get('/users'),
    createUser: (userData) => apiClient.post('/users', userData),
    updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
    deleteUser: (id) => apiClient.delete(`/users/${id}`)
  },

  // Chat endpoints
  chat: {
    getConversations: () => apiClient.get('/chat/conversations'),
    getConversation: (id) => apiClient.get(`/chat/conversations/${id}`),
    sendMessage: (conversationId, message) => 
      apiClient.post(`/chat/conversations/${conversationId}/messages`, { message }),
    createConversation: (agentId) => 
      apiClient.post('/chat/conversations', { agentId })
  },

  // Subscription endpoints
  subscription: {
    getCurrent: () => apiClient.get('/subscription'),
    updatePlan: (planId) => apiClient.put('/subscription/plan', { planId }),
    cancelSubscription: () => apiClient.delete('/subscription'),
    getInvoices: () => apiClient.get('/subscription/invoices')
  }
}

export default apiClient