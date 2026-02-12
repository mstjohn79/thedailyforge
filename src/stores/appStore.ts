import { create } from 'zustand'
import { AppState, ViewType } from '@/types'

interface AppStore extends AppState {
  // State setters
  setCurrentDate: (date: Date) => void
  setCurrentView: (view: ViewType) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean) => void
  
  // Complex state operations
  setCurrentViewWithPersistence: (view: ViewType) => void
  navigateToDate: (date: Date) => void
  toggleTheme: () => void
  
  // Utilities
  formatDateKey: (date?: Date) => string
  parseDate: (dateKey: string) => Date
  isToday: (date: Date) => boolean
  isSameDay: (date1: Date, date2: Date) => boolean
}

// Utility functions
const formatDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDate = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const isToday = (date: Date): boolean => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentDate: new Date(),
  currentView: 'landing', // Default to landing page
  theme: 'light',
  isLoading: false,

  // Basic setters
  setCurrentDate: (date) => {
    set({ currentDate: date })
    console.log('📅 [AppStore] Date changed to:', formatDateKey(date))
  },

  setCurrentView: (view) => {
    set({ currentView: view })
    console.log('🎯 [AppStore] View changed to:', view)
  },

  setTheme: (theme) => {
    set({ theme })
    // Persist theme preference
    localStorage.setItem('dailyDavid_theme', theme)
    console.log('🎨 [AppStore] Theme changed to:', theme)
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  // Complex operations
  setCurrentViewWithPersistence: (view) => {
    set({ currentView: view })
    
    // Persist view preference
    try {
      localStorage.setItem('dailyDavid_currentView', view)
      console.log('💾 [AppStore] View persisted to localStorage:', view)
    } catch (error) {
      console.error('❌ [AppStore] Failed to persist view:', error)
    }
    
    console.log('🎯 [AppStore] View changed with persistence to:', view)
  },

  navigateToDate: (date) => {
    set({ 
      currentDate: date,
      currentView: 'daily' // Automatically switch to daily view when navigating to a date
    })
    
    console.log('🗓️ [AppStore] Navigated to date:', formatDateKey(date))
  },

  toggleTheme: () => {
    const currentTheme = get().theme
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    
    set({ theme: newTheme })
    localStorage.setItem('dailyDavid_theme', newTheme)
    
    console.log('🎨 [AppStore] Theme toggled from', currentTheme, 'to', newTheme)
  },

  // Utility functions
  formatDateKey,
  parseDate,
  isToday,
  isSameDay
}))

// Helper hooks for specific parts of state
export const useCurrentDate = () => useAppStore(state => state.currentDate)
export const useCurrentView = () => useAppStore(state => state.currentView)
export const useTheme = () => useAppStore(state => state.theme)
export const useAppLoading = () => useAppStore(state => state.isLoading)

// Helper for current date as formatted string
export const useCurrentDateKey = () => {
  const currentDate = useCurrentDate()
  return formatDateKey(currentDate)
}

// Initialize app store from localStorage
export const initializeAppStore = () => {
  try {
    // Load theme preference
    const savedTheme = localStorage.getItem('dailyDavid_theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      useAppStore.getState().setTheme(savedTheme)
    }
    
    // Load view preference
    const savedView = localStorage.getItem('dailyDavid_currentView')
    if (savedView === 'landing' || savedView === 'daily') {
      useAppStore.getState().setCurrentView(savedView)
    }
    
    console.log('✅ [AppStore] Initialized from localStorage')
  } catch (error) {
    console.error('❌ [AppStore] Failed to initialize from localStorage:', error)
  }
}

// Export utility functions for use outside of components
export { formatDateKey, parseDate, isToday, isSameDay }