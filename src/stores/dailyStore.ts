import { create } from 'zustand'
import { DailyState, DailyEntry, Goal } from '../types'
import { formatDateKey } from '../lib/utils'
import { dbManager } from '../lib/database'

interface DailyStore extends DailyState {
  createEntry: (entry: Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEntry: (id: string, updates: Partial<DailyEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  getEntryByDate: (date: Date) => DailyEntry | null
  setCurrentEntry: (entry: DailyEntry | null) => void
  updateGoals: (type: 'daily' | 'weekly' | 'monthly', goals: Goal[]) => Promise<void>
  clearError: () => void
  loadEntries: () => Promise<void>
  loadEntryByDate: (date: string) => Promise<DailyEntry | null>
}

export const useDailyStore = create<DailyStore>((set, get) => ({
  entries: [],
  currentEntry: null,
  goals: {
    daily: [],
    weekly: [],
    monthly: []
  },
  isLoading: false,
  error: null,

  createEntry: async (entryData) => {
    try {
      set({ isLoading: true, error: null })
      
      const result = await dbManager.createDailyEntry(entryData)
      
      if (result.success && result.data) {
        const newEntry: DailyEntry = {
          ...result.data,
          id: result.data.id || Date.now().toString(),
          createdAt: new Date(result.data.created_at || result.data.createdAt),
          updatedAt: new Date(result.data.updated_at || result.data.updatedAt)
        }
        
        set(state => ({
          entries: [...state.entries, newEntry],
          currentEntry: newEntry,
          isLoading: false
        }))
      } else {
        throw new Error(result.error || 'Failed to create entry')
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create entry',
        isLoading: false 
      })
    }
  },

  updateEntry: async (id, updates) => {
    try {
      set({ isLoading: true, error: null })
      
      const result = await dbManager.updateDailyEntryWrapper(id, updates)
      
      if (result.success && result.data) {
        const updatedEntry: DailyEntry = {
          ...result.data,
          id: result.data.id || id,
          createdAt: new Date(result.data.created_at || result.data.createdAt),
          updatedAt: new Date(result.data.updated_at || result.data.updatedAt)
        }
        
        set(state => ({
          entries: state.entries.map(entry => 
            entry.id === id ? updatedEntry : entry
          ),
          currentEntry: state.currentEntry?.id === id ? updatedEntry : state.currentEntry,
          isLoading: false
        }))
      } else {
        throw new Error(result.error || 'Failed to update entry')
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update entry',
        isLoading: false 
      })
    }
  },

  deleteEntry: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      // Note: The backend doesn't have a delete endpoint yet, so we'll just remove from local state
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete entry',
        isLoading: false 
      })
    }
  },

  getEntryByDate: (date) => {
    const dateKey = formatDateKey(date)
    return get().entries.find(entry => entry.date === dateKey) || null
  },

  setCurrentEntry: (entry) => {
    set({ currentEntry: entry })
  },

  updateGoals: async (type, goals) => {
    try {
      set({ isLoading: true, error: null })
      
      const result = await dbManager.updateGoals(type, goals)
      
      if (result.success && result.data) {
        set(state => ({
          goals: {
            ...state.goals,
            [type]: goals
          },
          isLoading: false
        }))
      } else {
        throw new Error(result.error || 'Failed to update goals')
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update goals',
        isLoading: false 
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  loadEntries: async () => {
    try {
      console.log('Store: Loading all entries')
      set({ isLoading: true, error: null })
      
      const result = await dbManager.getDailyEntries()
      console.log('Store: All entries result:', result)
      console.log('Store: Number of entries found:', result.length)
      
      // Log each entry's date for debugging
      result.forEach((entry, index) => {
        console.log(`Store: Entry ${index + 1}:`, {
          id: entry.id,
          date: entry.date,
          dateKey: entry.dateKey,
          date_key: entry.date_key,
          created_at: entry.created_at,
          updated_at: entry.updated_at
        })
      })
      
      if (result && result.length > 0) {
        const formattedEntries: DailyEntry[] = result.map((entry: any) => {
          // Parse goals properly
          let parsedGoals = entry.goals
          if (typeof parsedGoals === 'string') {
            try {
              parsedGoals = JSON.parse(parsedGoals)
            } catch (e) {
              console.error('Store: Failed to parse goals string:', e)
              parsedGoals = { daily: [], weekly: [], monthly: [] }
            }
          }
          
          // Ensure goals have the right structure
          if (!parsedGoals || typeof parsedGoals !== 'object') {
            parsedGoals = { daily: [], weekly: [], monthly: [] }
          }
          
          // Extract data from data_content field (JSONB)
          const dataContent = entry.data_content || {}
          
          // Debug: Log if this entry has data_content
          if (entry.data_content) {
            console.log('🔍 Store: Entry has data_content:', entry.id, 'date:', entry.date, dataContent)
            console.log('🔍 Store: SOAP data in data_content:', dataContent.soap)
            console.log('🔍 Store: Thoughts in data_content.soap:', dataContent.soap?.thoughts)
            console.log('🔍 Store: Full SOAP object keys:', dataContent.soap ? Object.keys(dataContent.soap) : 'no soap object')
            if (dataContent.soap?.thoughts) {
              console.log('🔍 Store: FOUND THOUGHTS!', entry.id, dataContent.soap.thoughts)
            }
          }
          
          
          return {
            id: entry.id?.toString() || Date.now().toString(),
            userId: entry.user_id,
            user_id: entry.user_id,
            date: entry.date,
            dateKey: entry.date,
            date_key: entry.date,
            checkIn: dataContent.checkIn || entry.checkIn || { emotions: [], feeling: '' },
            gratitude: Array.isArray(dataContent.gratitude) ? dataContent.gratitude : 
                      Array.isArray(entry.gratitude) ? entry.gratitude : 
                      (dataContent.gratitude ? [dataContent.gratitude] : 
                       entry.gratitude ? [entry.gratitude] : []),
            soap: {
              scripture: dataContent.soap?.scripture || entry.scripture || '',
              observation: dataContent.soap?.observation || entry.observation || '',
              application: dataContent.soap?.application || entry.application || '',
              prayer: dataContent.soap?.prayer || entry.prayer || '',
              thoughts: (() => {
                const thoughts = dataContent.soap?.thoughts || entry.thoughts || ''
                console.log('🔍 Store: Processing thoughts for entry', entry.id, ':', {
                  'dataContent.soap?.thoughts': dataContent.soap?.thoughts,
                  'entry.thoughts': entry.thoughts,
                  'final thoughts': thoughts
                })
                return thoughts
              })()
            },
            goals: parsedGoals,
            dailyIntention: dataContent.dailyIntention || entry.dailyIntention || '',
            growthQuestion: dataContent.growthQuestion || entry.growthQuestion || '',
            leadershipRating: dataContent.leadershipRating || entry.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
            deletedGoalIds: dataContent.deletedGoalIds || entry.deletedGoalIds || [],
            completed: dataContent.completed || entry.completed || false,
            readingPlan: dataContent.readingPlan || entry.readingPlan,
            createdAt: new Date(entry.created_at),
            created_at: new Date(entry.created_at),
            updatedAt: new Date(entry.updated_at),
            updated_at: new Date(entry.updated_at)
          }
        })
        
        console.log('Store: Formatted entries with goals:', formattedEntries.map(e => ({
          date: e.date,
          goalsCount: {
            daily: e.goals?.daily?.length || 0,
            weekly: e.goals?.weekly?.length || 0,
            monthly: e.goals?.monthly?.length || 0
          }
        })))
        
        set({ 
          entries: formattedEntries,
          isLoading: false 
        })
      } else {
        set({ 
          entries: [],
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load entries',
        isLoading: false 
      })
    }
  },

  loadEntryByDate: async (date: string) => {
    try {
      console.log('Store: Loading entry for date:', date)
      set({ isLoading: true, error: null })
      
      const result = await dbManager.getDailyEntry(date)
      console.log('Store: Database result:', result)
      
      if (result) {
        console.log('Store: Found entry data:', result)
        
        // Parse goals properly
        let parsedGoals = result.goals
        if (typeof parsedGoals === 'string') {
          try {
            parsedGoals = JSON.parse(parsedGoals)
          } catch (e) {
            console.error('Store: Failed to parse goals string in loadEntryByDate:', e)
            parsedGoals = { daily: [], weekly: [], monthly: [] }
          }
        }
        
        // Ensure goals have the right structure
        if (!parsedGoals || typeof parsedGoals !== 'object') {
          parsedGoals = { daily: [], weekly: [], monthly: [] }
        }
        
        console.log('Store: Parsed goals:', parsedGoals)
        
        // Extract data from data_content field (JSONB) or individual columns
        const dataContent = result.data_content || {}
        console.log('Store: Data content:', dataContent)
        console.log('Store: Data content type:', typeof dataContent)
        console.log('Store: Data content keys:', Object.keys(dataContent))
        console.log('Store: Raw result:', result)
        console.log('Store: Available fields in result:', Object.keys(result))
        console.log('Store: result.deletedGoalIds:', result.deletedGoalIds)
      console.log('Store: _debug_content:', result._debug_content)
      console.log('Store: _debug_content.deletedGoalIds:', result._debug_content?.deletedGoalIds)
        console.log('Store: dataContent.deletedGoalIds:', dataContent.deletedGoalIds)
        
        // DEBUG: Check gratitude data
        console.log('Store: result.gratitude field:', result.gratitude)
        console.log('Store: result.gratitude type:', typeof result.gratitude)
        console.log('Store: result.gratitude isArray:', Array.isArray(result.gratitude))
        console.log('Store: dataContent.gratitude field:', dataContent.gratitude)
        console.log('Store: dataContent.gratitude type:', typeof dataContent.gratitude)
        console.log('Store: dataContent.gratitude isArray:', Array.isArray(dataContent.gratitude))
        
        // DEBUG: Check if checkIn data is in individual columns
        console.log('Store: result.checkIn field:', result.checkIn)
        console.log('Store: result.checkIn type:', typeof result.checkIn)
        console.log('Store: result.checkIn keys:', result.checkIn ? Object.keys(result.checkIn) : 'null')
        console.log('Store: result.checkIn.emotions:', result.checkIn?.emotions)
        console.log('Store: result.checkIn.feeling:', result.checkIn?.feeling)
        console.log('Store: result.emotions field:', result.emotions)
        console.log('Store: result.feeling field:', result.feeling)
        
        // DEBUG: Check if checkIn data is in data_content
        console.log('Store: dataContent.checkIn:', dataContent.checkIn)
        console.log('Store: dataContent.emotions:', dataContent.emotions)
        console.log('Store: dataContent.feeling:', dataContent.feeling)
        
        // Parse checkIn from individual columns first, then data_content as fallback
        let checkInData = result.checkIn || dataContent.checkIn || { emotions: [], feeling: '' }
        if (typeof checkInData === 'string') {
          try {
            checkInData = JSON.parse(checkInData)
          } catch (e) {
            console.error('Store: Failed to parse checkIn string:', e)
            checkInData = { emotions: [], feeling: '' }
          }
        }
        
        // Ensure checkInData has the proper structure
        if (!checkInData || typeof checkInData !== 'object') {
          checkInData = { emotions: [], feeling: '' }
        }
        
        // Ensure emotions is an array
        if (!Array.isArray(checkInData.emotions)) {
          checkInData.emotions = []
        }
        
        // Ensure feeling is a string
        if (typeof checkInData.feeling !== 'string') {
          checkInData.feeling = ''
        }
        
        // Parse leadershipRating from data_content only (individual columns don't exist for leadershipRating)
        let leadershipRatingData = dataContent.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 }
        if (typeof leadershipRatingData === 'string') {
          try {
            leadershipRatingData = JSON.parse(leadershipRatingData)
          } catch (e) {
            console.error('Store: Failed to parse leadershipRating string:', e)
            leadershipRatingData = { wisdom: 0, courage: 0, patience: 0, integrity: 0 }
          }
        }
        
        console.log('Store: Parsed checkInData:', checkInData)
        console.log('Store: Parsed leadershipRatingData:', leadershipRatingData)
        console.log('Store: Final checkInData structure:', {
          emotions: checkInData.emotions,
          emotionsType: typeof checkInData.emotions,
          emotionsIsArray: Array.isArray(checkInData.emotions),
          feeling: checkInData.feeling,
          feelingType: typeof checkInData.feeling
        })
        
        // DEBUG: Log the exact checkIn data being set
        console.log('Store: Setting checkIn data in formatted entry:', checkInData)
        console.log('Store: checkInData.emotions specifically:', checkInData.emotions)
        console.log('Store: checkInData.emotions length:', checkInData.emotions?.length)
        console.log('Store: checkInData.emotions contents:', JSON.stringify(checkInData.emotions))
        
        // Parse reading plan data
        let readingPlanData = dataContent.readingPlan || result.readingPlan
        if (typeof readingPlanData === 'string') {
          try {
            readingPlanData = JSON.parse(readingPlanData)
          } catch (e) {
            console.error('Store: Failed to parse readingPlan string:', e)
            readingPlanData = null
          }
        }
        
        console.log('Store: Parsed readingPlan data:', readingPlanData)
        
        const formattedEntry: DailyEntry = {
          id: result.id?.toString() || Date.now().toString(),
          userId: result.user_id,
          user_id: result.user_id,
          date: result.date,
          dateKey: result.date,
          date_key: result.date,
          checkIn: checkInData,
          gratitude: (() => {
            // Check data_content first
            if (Array.isArray(dataContent.gratitude) && dataContent.gratitude.length > 0) {
              return dataContent.gratitude
            }
            // Check individual column
            if (Array.isArray(result.gratitude) && result.gratitude.length > 0) {
              return result.gratitude
            }
            // If single string, convert to array
            if (dataContent.gratitude && typeof dataContent.gratitude === 'string') {
              return [dataContent.gratitude]
            }
            if (result.gratitude && typeof result.gratitude === 'string') {
              return [result.gratitude]
            }
            // Default to 3 empty strings for the gratitude boxes
            return ['', '', '']
          })(),
          soap: {
            scripture: dataContent.soap?.scripture || '',
            observation: dataContent.soap?.observation || '',
            application: dataContent.soap?.application || '',
            prayer: dataContent.soap?.prayer || '',
            thoughts: dataContent.soap?.thoughts || ''
          },
          goals: parsedGoals,
          dailyIntention: result.dailyIntention || dataContent.dailyIntention || '',
          growthQuestion: dataContent.growthQuestion || result.growthQuestion || '',
          leadershipRating: leadershipRatingData,
          readingPlan: readingPlanData,
          deletedGoalIds: dataContent.deletedGoalIds || result.deletedGoalIds || [],
          completed: dataContent.completed || result.completed || false,
          createdAt: new Date(result.created_at),
          created_at: new Date(result.created_at),
          updatedAt: new Date(result.updated_at),
          updated_at: new Date(result.updated_at)
        }
        
        console.log('Store: Setting formatted entry:', formattedEntry)
        console.log('Store: Setting isLoading to false')
        set({ 
          currentEntry: formattedEntry,
          isLoading: false 
        })
        return formattedEntry
      } else {
        console.log('Store: No entry found for date:', date)
        // No entry found for this date
        console.log('Store: Setting isLoading to false (no entry found)')
        set({ 
          currentEntry: null,
          isLoading: false 
        })
        return null
      }
    } catch (error) {
      console.error('Store: Error loading entry:', error)
      console.log('Store: Setting isLoading to false (error)')
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load entry',
        isLoading: false 
      })
      return null
    }
  }
}))
