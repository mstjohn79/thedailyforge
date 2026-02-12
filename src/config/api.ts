// API Configuration for different environments
const getApiUrl = () => {
  // For local development with IP address, use the backend server IP
  if (typeof window !== 'undefined' && window.location.hostname === '192.168.0.91') {
    return 'http://192.168.0.91:3001'
  }
  
  // For localhost development, use localhost backend
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001'
  }
  
  // For production (Vercel), use the current domain
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Fallback for SSR (production)
  return 'https://thedailyforge.vercel.app'
}

export const API_BASE_URL = getApiUrl()

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
  },
  entries: `${API_BASE_URL}/api/entries`,
  users: `${API_BASE_URL}/api/admin/users`,
}
