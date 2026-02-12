import { create } from 'zustand'
import { PrayerState, PrayerRequest, PrayerRequestFormData, PrayerRequestStats } from '../types'
import { dbManager } from '../lib/database'
import { useAuthStore } from './authStore'

interface PrayerStore extends PrayerState {
  // Actions
  loadRequests: () => Promise<void>
  createRequest: (data: PrayerRequestFormData) => Promise<void>
  updateRequest: (id: string, updates: Partial<PrayerRequest>) => Promise<void>
  deleteRequest: (id: string) => Promise<void>
  addPraiseReport: (id: string, praiseReport: string) => Promise<void>
  loadStats: () => Promise<void>
  clearError: () => void
  clearUserData: () => void
}

export const usePrayerStore = create<PrayerStore>((set, get) => ({
  // Initial state
  requests: [],
  isLoading: false,
  error: null,
  stats: null,

  // Load all prayer requests for current user
  loadRequests: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const requests = await dbManager.getPrayerRequests(user.id)
      
      set({ 
        requests,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load prayer requests',
        isLoading: false 
      })
    }
  },

  // Create new prayer request
  createRequest: async (data) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const newRequest = await dbManager.createPrayerRequest(user.id, data)
      
      set(state => ({
        requests: [newRequest, ...state.requests],
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create prayer request',
        isLoading: false 
      })
    }
  },

  // Update existing prayer request
  updateRequest: async (id, updates) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const updatedRequest = await dbManager.updatePrayerRequest(user.id, id, updates)
      
      set(state => ({
        requests: state.requests.map(request => 
          request.id === id ? updatedRequest : request
        ),
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update prayer request',
        isLoading: false 
      })
    }
  },

  // Delete prayer request
  deleteRequest: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const success = await dbManager.deletePrayerRequest(user.id, id)
      
      if (success) {
        set(state => ({
          requests: state.requests.filter(request => request.id !== id),
          isLoading: false
        }))
      } else {
        set({ 
          error: 'Failed to delete prayer request',
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete prayer request',
        isLoading: false 
      })
    }
  },

  // Add praise report to prayer request
  addPraiseReport: async (id, praiseReport) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const updatedRequest = await dbManager.addPraiseReport(user.id, id, praiseReport)
      
      set(state => ({
        requests: state.requests.map(request => 
          request.id === id ? updatedRequest : request
        ),
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add praise report',
        isLoading: false 
      })
    }
  },

  // Load prayer request statistics
  loadStats: async () => {
    try {
      const user = useAuthStore.getState().user
      if (!user) {
        set({ stats: null })
        return
      }

      const stats = await dbManager.getPrayerRequestStats(user.id)
      
      set({ stats })
    } catch (error) {
      console.error('Failed to load prayer stats:', error)
      set({ stats: null })
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null })
  },

  // Clear user data (on logout)
  clearUserData: () => {
    set({ 
      requests: [],
      stats: null,
      error: null,
      isLoading: false
    })
  }
}))

