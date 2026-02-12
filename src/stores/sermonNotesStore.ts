import { create } from 'zustand'
import { SermonNotesState, SermonNote, SermonNoteFormData, SermonNoteStats } from '../types'
import { useAuthStore } from './authStore'
import { API_BASE_URL } from '../config/api'

interface SermonNotesStore extends SermonNotesState {
  // Actions
  loadNotes: () => Promise<void>
  createNote: (data: SermonNoteFormData & { date: string }) => Promise<void>
  updateNote: (id: string, updates: Partial<SermonNote>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  loadStats: () => Promise<void>
  loadChurches: () => Promise<void>
  loadSpeakers: () => Promise<void>
  clearError: () => void
  clearUserData: () => void
}

export const useSermonNotesStore = create<SermonNotesStore>((set, get) => ({
  // Initial state
  notes: [],
  isLoading: false,
  error: null,
  stats: null,
  churches: [],
  speakers: [],

  // Load all sermon notes for current user
  loadNotes: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      set({ 
        notes: data.notes || [],
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load sermon notes',
        isLoading: false 
      })
    }
  },

  // Create new sermon note
  createNote: async (data) => {
    try {
      set({ isLoading: true, error: null })
      
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      set(state => ({
        notes: [result.note, ...state.notes],
        isLoading: false
      }))

      // Refresh churches and speakers lists
      get().loadChurches()
      get().loadSpeakers()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create sermon note',
        isLoading: false 
      })
    }
  },

  // Update existing sermon note
  updateNote: async (id, updates) => {
    try {
      set({ isLoading: true, error: null })
      
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      set(state => ({
        notes: state.notes.map(note => 
          note.id === id ? result.note : note
        ),
        isLoading: false
      }))

      // Refresh churches and speakers lists if relevant fields were updated
      if (updates.churchName || updates.speakerName) {
        get().loadChurches()
        get().loadSpeakers()
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update sermon note',
        isLoading: false 
      })
    }
  },

  // Delete sermon note
  deleteNote: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      set(state => ({
        notes: state.notes.filter(note => note.id !== id),
        isLoading: false
      }))

      // Refresh stats and lists
      get().loadStats()
      get().loadChurches()
      get().loadSpeakers()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete sermon note',
        isLoading: false 
      })
    }
  },

  // Load sermon notes statistics
  loadStats: async () => {
    try {
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ stats: null })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      set({ stats: data.stats })
    } catch (error) {
      console.error('Failed to load sermon notes stats:', error)
      set({ stats: null })
    }
  },

  // Load unique churches for current user
  loadChurches: async () => {
    try {
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ churches: [] })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes/churches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      set({ churches: data.churches || [] })
    } catch (error) {
      console.error('Failed to load churches:', error)
      set({ churches: [] })
    }
  },

  // Load unique speakers for current user
  loadSpeakers: async () => {
    try {
      const { token } = useAuthStore.getState()
      if (!token) {
        set({ speakers: [] })
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/sermon-notes/speakers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      set({ speakers: data.speakers || [] })
    } catch (error) {
      console.error('Failed to load speakers:', error)
      set({ speakers: [] })
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null })
  },

  // Clear user data (on logout)
  clearUserData: () => {
    set({ 
      notes: [],
      stats: null,
      churches: [],
      speakers: [],
      error: null,
      isLoading: false
    })
  }
}))