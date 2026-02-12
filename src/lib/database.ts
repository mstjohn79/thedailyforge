import { getAuthHeaders } from '../stores/authStore'
import { API_BASE_URL } from '../config/api'

// Database connection configuration - using API calls instead of direct connection

export interface DailyEntry {
  id?: number
  user_id: number
  date: string
  scripture: string
  observation: string
  application: string
  prayer: string
  gratitude: string
  goals: string
  deletedGoalIds?: string[]
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface UserGoals {
  id?: number
  user_id: number
  goals: string
  created_at?: string
  updated_at?: string
}

class DatabaseManager {
  private static instance: DatabaseManager

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  async getDailyEntry(date: string, userId?: number): Promise<DailyEntry | null> {
    try {
      console.log('API: Getting daily entry for date:', date, 'user:', userId)
      const authHeaders = getAuthHeaders()
      console.log('API: Auth headers:', authHeaders)
      console.log('API: Token exists:', !!authHeaders.Authorization)
      const response = await fetch(`${API_BASE_URL}/api/entries/${date}?t=${Date.now()}`, {
        headers: {
          ...authHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('API: Daily entry result:', data.entry)
      
      // Transform the API response to match our interface
      if (data.entry && data.entry.data_content) {
        // data_content is already a JavaScript object, not a JSON string
        const content = typeof data.entry.data_content === 'string' ? JSON.parse(data.entry.data_content) : data.entry.data_content
        return {
          id: data.entry.id,
          user_id: data.entry.user_id,
          date: data.entry.date_key,
          scripture: content.soap?.scripture || '',
          observation: content.soap?.observation || '',
          application: content.soap?.application || '',
          prayer: content.soap?.prayer || '',
          gratitude: content.gratitude || '',
          goals: content.goals || { daily: [], weekly: [], monthly: [] },
          checkIn: content.checkIn || { emotions: [], feeling: '' },
          dailyIntention: content.dailyIntention || '',
          growthQuestion: content.growthQuestion || '',
          leadershipRating: content.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
          deletedGoalIds: content.deletedGoalIds || [],
          readingPlan: content.readingPlan || undefined,
          soap: content.soap || { scripture: '', observation: '', application: '', prayer: '', thoughts: '' },
          data_content: content,
          created_at: data.entry.created_at,
          updated_at: data.entry.updated_at
        }
      }
      return null
    } catch (error) {
      console.error('API: Error getting daily entry:', error)
      return null
    }
  }

  async saveDailyEntry(entry: Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>): Promise<DailyEntry> {
    try {
      console.log('API: Saving daily entry:', entry)
      
      // Handle different data structures - entry might be the full dayData object
      const soapData = entry.soap || {
        scripture: entry.scripture || '',
        observation: entry.observation || '',
        application: entry.application || '',
        prayer: entry.prayer || '',
        thoughts: entry.thoughts || ''
      }
      
      const requestBody = {
        date: entry.date,
        goals: entry.goals,
        gratitude: entry.gratitude,
        soap: soapData,
        dailyIntention: entry.dailyIntention || '',
        growthQuestion: entry.growthQuestion || '',
        leadershipRating: entry.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
        checkIn: entry.checkIn || { emotions: [], feeling: '' },
        deletedGoalIds: entry.deletedGoalIds || [],
        readingPlan: entry.readingPlan || undefined
      }
      
      console.log('API: Request body for save:', requestBody)
      console.log('API: SOAP data in request body:', JSON.stringify(requestBody.soap, null, 2))
      console.log('API: CheckIn data being saved:', {
        checkIn: entry.checkIn,
        checkInType: typeof entry.checkIn,
        emotions: entry.checkIn?.emotions,
        emotionsType: typeof entry.checkIn?.emotions,
        emotionsIsArray: Array.isArray(entry.checkIn?.emotions),
        feeling: entry.checkIn?.feeling
      })
      
      const response = await fetch(`${API_BASE_URL}/api/entries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('API: Saved daily entry:', data.entry)
      
      // Transform the response back to our interface
      if (data.entry && data.entry.data_content) {
        // data_content is already a JavaScript object, not a JSON string
        const content = typeof data.entry.data_content === 'string' ? JSON.parse(data.entry.data_content) : data.entry.data_content
        
        return {
          id: data.entry.id,
          user_id: data.entry.user_id,
          date: data.entry.date_key,
          scripture: content.soap?.scripture || '',
          observation: content.soap?.observation || '',
          application: content.soap?.application || '',
          prayer: content.soap?.prayer || '',
          gratitude: content.gratitude || '',
          goals: content.goals || { daily: [], weekly: [], monthly: [] },
          checkIn: content.checkIn || { emotions: [], feeling: '' },
          dailyIntention: content.dailyIntention || '',
          growthQuestion: content.growthQuestion || '',
          leadershipRating: content.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
          deletedGoalIds: content.deletedGoalIds || [],
          readingPlan: content.readingPlan || undefined,
          created_at: data.entry.created_at,
          updated_at: data.entry.updated_at
        }
      }
      return data.entry
    } catch (error) {
      console.error('API: Error saving daily entry:', error)
      throw error
    }
  }

  async updateDailyEntry(id: number, entry: Partial<DailyEntry>): Promise<DailyEntry> {
    // For now, just save as a new entry since the API doesn't have update
    return this.saveDailyEntry(entry as Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>)
  }

  async getUserGoals(userId: number = 1): Promise<UserGoals | null> {
    // Return default goals for now since this isn't in the API
    return {
      id: 1,
      user_id: userId,
      goals: 'Set your daily goals here',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  async saveUserGoals(goals: Omit<UserGoals, 'id' | 'created_at' | 'updated_at'>): Promise<UserGoals> {
    // For now, just return the goals since this isn't in the API
    return {
      id: 1,
      user_id: goals.user_id,
      goals: goals.goals,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  async updateUserGoals(id: number, goals: string): Promise<UserGoals> {
    // For now, just return the goals since this isn't in the API
    return {
      id: id,
      user_id: 1,
      goals: goals,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  async loadDayData(date: string, userId: string | number): Promise<any> {
    try {
      console.log('API: Loading day data for date:', date, 'user:', userId)
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
      const entry = await this.getDailyEntry(date, userIdNum)
      
      if (entry) {
        // Get reading plan data from data_content if it exists
        const dataContent = entry.data_content || {}
        const readingPlan = dataContent.readingPlan || null
        
        // Transform the entry to match the expected format
        return {
          checkIn: {
            emotions: [],
            feeling: ''
          },
          gratitude: entry.gratitude ? entry.gratitude.split(', ') : ['', '', ''],
          soap: {
            scripture: entry.scripture || '',
            observation: entry.observation || '',
            application: entry.application || '',
            prayer: entry.prayer || '',
            thoughts: dataContent.soap?.thoughts || ''
          },
          goals: entry.goals ? JSON.parse(entry.goals) : {
            daily: [],
            weekly: [],
            monthly: []
          },
          dailyIntention: '',
          growthQuestion: '',
          leadershipRating: {
            wisdom: 5,
            courage: 5,
            patience: 5,
            integrity: 5
          },
          readingPlan: readingPlan
        }
      }
      return null
    } catch (error) {
      console.error('API: Error loading day data:', error)
      return null
    }
  }

  /**
   * Get the latest reading plan progress for a user from the database
   * This ensures reading plan data is always current and not cached
   */
  async getLatestReadingPlanProgress(userId: string | number): Promise<any> {
    try {
      console.log('API: Getting latest reading plan progress for user:', userId)
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
      
      // Get all entries for the user
      const response = await fetch('/api/entries', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.entries) {
          // Find the most recent reading plan progress
          let latestReadingPlan = null
          let mostRecentDate = null
          
          for (const entry of result.entries) {
            const readingPlan = entry.data_content?.readingPlan
            if (readingPlan && readingPlan.planId) {
              const entryDate = new Date(entry.date_key)
              if (!mostRecentDate || entryDate > mostRecentDate) {
                latestReadingPlan = readingPlan
                mostRecentDate = entryDate
              }
            }
          }
          
          if (latestReadingPlan) {
            console.log('API: Found latest reading plan:', latestReadingPlan.planName, 'currentDay:', latestReadingPlan.currentDay)
            return latestReadingPlan
          }
        }
      }
      
      console.log('API: No reading plan progress found')
      return null
    } catch (error) {
      console.error('API: Error getting latest reading plan progress:', error)
      return null
    }
  }

  async saveDayData(userId: string | number, date: string, data: any): Promise<boolean> {
    try {
      console.log('API: Saving day data for date:', date, 'data:', data, 'user:', userId)
      console.log('API: SOAP data being saved:', JSON.stringify(data.soap, null, 2))
      
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
      
      // Check if entry exists
      const existingEntry = await this.getDailyEntry(date, userIdNum)
      
      if (existingEntry) {
        // Update existing entry by saving with merged data
        const entryData = {
          user_id: userIdNum,
          userId: userIdNum.toString(),
          date,
          dateKey: date,
          date_key: date,
          scripture: data.soap?.scripture || existingEntry.scripture || '',
          observation: data.soap?.observation || existingEntry.observation || '',
          application: data.soap?.application || existingEntry.application || '',
          prayer: data.soap?.prayer || existingEntry.prayer || '',
          gratitude: Array.isArray(data.gratitude) ? data.gratitude : (data.gratitude || []),
          goals: data.goals || { daily: [], weekly: [], monthly: [] },
          checkIn: data.checkIn || existingEntry.checkIn || { emotions: [], feeling: '' },
          dailyIntention: data.dailyIntention || existingEntry.dailyIntention || '',
          growthQuestion: data.growthQuestion || existingEntry.growthQuestion || '',
          leadershipRating: data.leadershipRating || existingEntry.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
          deletedGoalIds: data.deletedGoalIds || existingEntry.deletedGoalIds || [],
          readingPlan: data.readingPlan || existingEntry.readingPlan || undefined,
          soap: data.soap || {
            scripture: existingEntry.scripture || '',
            observation: existingEntry.observation || '',
            application: existingEntry.application || '',
            prayer: existingEntry.prayer || '',
            thoughts: existingEntry.data_content?.soap?.thoughts || ''
          }
        }
        console.log('API: Entry data being saved (update):', JSON.stringify(entryData, null, 2))
        await this.saveDailyEntry(entryData)
      } else {
        // Create new entry
        const entryData = {
          user_id: userIdNum,
          userId: userIdNum.toString(),
          date,
          dateKey: date,
          date_key: date,
          scripture: data.soap?.scripture || '',
          observation: data.soap?.observation || '',
          application: data.soap?.application || '',
          prayer: data.soap?.prayer || '',
          gratitude: Array.isArray(data.gratitude) ? data.gratitude : [],
          goals: data.goals || { daily: [], weekly: [], monthly: [] },
          checkIn: data.checkIn || { emotions: [], feeling: '' },
          dailyIntention: data.dailyIntention || '',
          growthQuestion: data.growthQuestion || '',
          leadershipRating: data.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
          deletedGoalIds: data.deletedGoalIds || [],
          readingPlan: data.readingPlan || undefined,
          soap: data.soap || {
            scripture: '',
            observation: '',
            application: '',
            prayer: '',
            thoughts: ''
          }
        }
        console.log('API: Entry data being saved (create):', JSON.stringify(entryData, null, 2))
        await this.saveDailyEntry(entryData)
      }
      return true
    } catch (error) {
      console.error('API: Error saving day data:', error)
      return false
    }
  }

  async getDailyEntries(userId?: number): Promise<DailyEntry[]> {
    try {
      console.log('API: Getting all daily entries for user:', userId)
      const authHeaders = getAuthHeaders()
      console.log('API: Auth headers for getDailyEntries:', authHeaders)
      console.log('API: Token exists for getDailyEntries:', !!authHeaders.Authorization)
      const response = await fetch(`${API_BASE_URL}/api/entries?t=${Date.now()}`, {
        headers: {
          ...authHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('API: All entries result:', data.entries)
      console.log('API: Number of entries returned:', data.entries?.length || 0)
      
      // Log each entry's date for debugging
      if (data.entries && data.entries.length > 0) {
        data.entries.forEach((entry: any, index: number) => {
          console.log(`API: Entry ${index + 1}:`, {
            id: entry.id,
            date_key: entry.date_key,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          })
        })
      }
      
      console.log('API: First entry data_content:', data.entries[0]?.data_content)
      console.log('API: First entry soap in data_content:', data.entries[0]?.data_content?.soap)
      
      // Find entries with thoughts
      const entriesWithThoughts = data.entries.filter((entry: any) => 
        entry.data_content?.soap?.thoughts && entry.data_content.soap.thoughts.trim()
      )
      console.log('API: Entries with thoughts:', entriesWithThoughts.map((e: any) => ({
        id: e.id,
        date: e.date,
        thoughts: e.data_content.soap.thoughts
      })))
      
      // Transform the API response to match our interface
      return data.entries.map((entry: any) => {
        if (entry.data_content) {
          // data_content is already a JavaScript object, not a JSON string
          const content = typeof entry.data_content === 'string' ? JSON.parse(entry.data_content) : entry.data_content
          return {
            id: entry.id,
            user_id: entry.user_id,
            date: entry.date_key,
            scripture: content.soap?.scripture || '',
            observation: content.soap?.observation || '',
            application: content.soap?.application || '',
            prayer: content.soap?.prayer || '',
            thoughts: content.soap?.thoughts || '',
            gratitude: content.gratitude || '',
            goals: content.goals || { daily: [], weekly: [], monthly: [] },
            checkIn: content.checkIn || { emotions: [], feeling: '' },
            dailyIntention: content.dailyIntention || '',
            growthQuestion: content.growthQuestion || '',
            leadershipRating: content.leadershipRating || { wisdom: 0, courage: 0, patience: 0, integrity: 0 },
            deletedGoalIds: content.deletedGoalIds || [],
          readingPlan: content.readingPlan || undefined,
            // Debug: log the content to see what's in the database
            _debug_content: content,
            created_at: entry.created_at,
            updated_at: entry.updated_at
          }
        }
        return null
      }).filter(Boolean)
    } catch (error) {
      console.error('API: Error getting all entries:', error)
      return []
    }
  }

  async createDailyEntry(entryData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.saveDailyEntry(entryData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create entry' }
    }
  }

  async updateDailyEntryWrapper(id: number, updates: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.updateDailyEntry(id, updates)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update entry' }
    }
  }

  async updateGoals(type: string, goals: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.updateUserGoals(1, goals)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update goals' }
    }
  }

  async getAllUsers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('API: Getting all users')
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: All users result:', data.users)
      
      return { success: true, data: data.users || [] }
    } catch (error) {
      console.error('API: Error getting all users:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get users' }
    }
  }

  async createUser(userData: { email: string; password: string; displayName: string; isAdmin: boolean }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('API: Creating user:', userData.email)
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: User created:', data.user)
      
      return { success: true, data: data.user }
    } catch (error) {
      console.error('API: Error creating user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' }
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('API: Deleting user:', userId)
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: User deleted:', data.user)
      
      return { success: true, data: data.user }
    } catch (error) {
      console.error('API: Error deleting user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('API: Testing connection')
      const response = await fetch(`${API_BASE_URL}/api/health`)
      const isHealthy = response.ok
      console.log('API: Connection test result:', isHealthy)
      return isHealthy
    } catch (error) {
      console.error('API: Connection test failed:', error)
      return false
    }
  }

  // ============================================================================
  // PRAYER REQUESTS METHODS
  // ============================================================================

  async getPrayerRequests(userId: string): Promise<any[]> {
    try {
      console.log('API: Getting prayer requests for user:', userId)
      const response = await fetch(`${API_BASE_URL}/api/prayer-requests`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: Prayer requests result:', data.requests)
      
      return data.requests || []
    } catch (error) {
      console.error('API: Error getting prayer requests:', error)
      return []
    }
  }

  async createPrayerRequest(userId: string, data: any): Promise<any> {
    try {
      console.log('API: Creating prayer request:', data)
      
      const response = await fetch(`${API_BASE_URL}/api/prayer-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API: Created prayer request:', result.request)
      
      return result.request
    } catch (error) {
      console.error('API: Error creating prayer request:', error)
      throw error
    }
  }

  async updatePrayerRequest(userId: string, id: string, updates: any): Promise<any> {
    try {
      console.log('API: Updating prayer request:', id, updates)
      
      const response = await fetch(`${API_BASE_URL}/api/prayer-requests/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API: Updated prayer request:', result.request)
      
      return result.request
    } catch (error) {
      console.error('API: Error updating prayer request:', error)
      throw error
    }
  }

  async deletePrayerRequest(userId: string, id: string): Promise<boolean> {
    try {
      console.log('API: Deleting prayer request:', id)
      
      const response = await fetch(`${API_BASE_URL}/api/prayer-requests/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API: Deleted prayer request:', result.message)
      
      return result.success
    } catch (error) {
      console.error('API: Error deleting prayer request:', error)
      return false
    }
  }

  async addPraiseReport(userId: string, id: string, praiseReport: string): Promise<any> {
    try {
      console.log('API: Adding praise report to prayer request:', id)
      
      const response = await fetch(`${API_BASE_URL}/api/prayer-requests/${id}/praise-report`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ praiseReport })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API: Added praise report:', result.request)
      
      return result.request
    } catch (error) {
      console.error('API: Error adding praise report:', error)
      throw error
    }
  }

  async getPrayerRequestStats(userId: string): Promise<any> {
    try {
      console.log('API: Getting prayer request stats for user:', userId)
      
      const response = await fetch(`${API_BASE_URL}/api/prayer-requests/stats`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: Prayer request stats:', data.stats)
      
      return data.stats
    } catch (error) {
      console.error('API: Error getting prayer request stats:', error)
      return null
    }
  }

  // User Settings API
  async getUserSettings(): Promise<any> {
    try {
      console.log('API: Getting user settings')
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        headers: getAuthHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: User settings result:', data)
      return data
    } catch (error) {
      console.error('API: Error getting user settings:', error)
      throw error
    }
  }

  async updateUserSettings(settings: { soapScriptureMode?: string }): Promise<any> {
    try {
      console.log('API: Updating user settings:', settings)
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API: User settings update result:', data)
      return data
    } catch (error) {
      console.error('API: Error updating user settings:', error)
      throw error
    }
  }
}

// Create singleton instance
const databaseInstance = new DatabaseManager()

// Export the class
export { DatabaseManager as default }

// Export singleton getter
export const getDatabaseManager = (): DatabaseManager => {
  return databaseInstance
}

// FIXED: Direct instance export for compatibility
export const dbManager = databaseInstance