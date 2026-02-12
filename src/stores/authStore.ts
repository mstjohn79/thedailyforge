import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_BASE_URL } from '../config/api'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
  is_admin: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>
  signup: (displayName: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  forceRefresh: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })
          
          // First attempt with cache-busting
          let response = await fetch(`${API_BASE_URL}/api/auth/login?t=${Date.now()}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
            body: JSON.stringify({ email, password }),
          })

          // If first attempt fails, try again with different cache-busting strategy
          if (!response.ok) {
            console.log('🔄 First login attempt failed, retrying with fresh cache-busting...')
            
            // Clear any cached data and try again
            if ('caches' in window) {
              const cacheNames = await caches.keys()
              await Promise.all(cacheNames.map(name => caches.delete(name)))
            }
            
            // Second attempt with different timestamp and headers
            response = await fetch(`${API_BASE_URL}/api/auth/login?t=${Date.now()}&retry=1`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'If-Modified-Since': '0',
                'If-None-Match': '*',
              },
              body: JSON.stringify({ email, password }),
            })
          }

          const data = await response.json()

          if (data.success && data.user && data.token) {
            set({
              user: {
                ...data.user,
                name: data.user.display_name || data.user.name
              },
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            // Force a small delay to ensure auth state is set before components try to load data
            setTimeout(() => {
              console.log('🔐 Auth: Login successful, triggering data refresh')
              // Dispatch a custom event to notify components that login is complete
              window.dispatchEvent(new CustomEvent('auth-login-success'))
            }, 100)
            
            return true
          } else {
            set({
              error: data.error || 'Login failed',
              isLoading: false
            })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          })
          return false
        }
      },

      signup: async (displayName: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ displayName, email, password }),
          })

          const data = await response.json()

          if (data.success && data.user && data.token) {
            set({
              user: {
                ...data.user,
                name: data.user.display_name || data.user.name
              },
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            // Force a small delay to ensure auth state is set before components try to load data
            setTimeout(() => {
              console.log('🔐 Auth: Signup successful, triggering data refresh')
              // Dispatch a custom event to notify components that signup is complete
              window.dispatchEvent(new CustomEvent('auth-login-success'))
            }, 100)
            
            return true
          } else {
            set({
              error: data.error || 'Signup failed',
              isLoading: false
            })
            return false
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Signup failed',
            isLoading: false
          })
          return false
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      clearError: () => {
        set({ error: null })
      },

      // Force refresh - clears all cached auth data and forces fresh login
      forceRefresh: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        })
        // Clear localStorage as well
        localStorage.removeItem('auth-storage')
        sessionStorage.clear()
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      initialize: async () => {
        const { token } = get()
        if (token) {
          try {
            // Verify token is still valid by making a test request with cache-busting
            const timestamp = Date.now()
            const response = await fetch(`${API_BASE_URL}/api/auth/verify?t=${timestamp}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              set({
                user: {
                  ...data.user,
                  name: data.user.display_name || data.user.name
                },
                isAuthenticated: true
              })
            } else {
              // Token is invalid, clear it
              set({
                user: null,
                token: null,
                isAuthenticated: false
              })
            }
          } catch (error) {
            // Token verification failed, clear it
            set({
              user: null,
              token: null,
              isAuthenticated: false
            })
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const state = useAuthStore.getState()
  const token = state.token
  console.log('getAuthHeaders: Auth state:', {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: token ? `${token.substring(0, 10)}...` : null,
    tokenLength: token ? token.length : 0
  })
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}