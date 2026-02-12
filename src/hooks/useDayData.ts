import { useState, useEffect, useRef, useCallback } from 'react'
import { DayData, Goal, GoalsByType, CheckInData, SOAPData } from '@/types'
import { DatabaseManager } from '@/lib/database'
import { clearReadingPlanFromLocalStorage, getLocalStorageDataWithoutReadingPlan } from '@/lib/readingPlanUtils'

// Default empty data structure
const createEmptyDayData = (): DayData => ({
  checkIn: {
    emotions: [],
    feeling: ''
  },
  gratitude: ['', '', ''],
  soap: {
    scripture: '',
    observation: '',
    application: '',
    prayer: '',
    thoughts: ''
  },
  goals: {
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
  }
})

interface UseDayDataReturn {
  dayData: DayData
  setDayData: (data: DayData | ((prev: DayData) => DayData)) => void
  isLoading: boolean
  error: string | null
  hasData: boolean
  manualSave: () => Promise<void>
  
  // Specific updaters for different sections
  updateCheckIn: (checkIn: CheckInData) => void
  updateGratitude: (gratitude: string[]) => void
  updateSOAP: (soap: SOAPData) => void
  updateGoals: (goalType: keyof GoalsByType, goals: Goal[]) => void
  updateDailyIntention: (intention: string) => void
  updateGrowthQuestion: (question: string) => void
}

export const useDayData = (dateKey: string, userId: string | null): UseDayDataReturn => {
  const [dayData, setDayDataState] = useState<DayData>(createEmptyDayData())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)
  
  const dbManager = useRef(new DatabaseManager())
  const lastSaveData = useRef<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoad = useRef(true)

  // Auto-save function with debouncing
  const saveToDatabase = useCallback(async (data: DayData) => {
    if (!userId || !dateKey) return

    try {
      // Check if data actually changed
      const dataString = JSON.stringify(data)
      if (dataString === lastSaveData.current) {
        console.log('🔄 [useDayData] No changes detected, skipping save')
        return
      }

      console.log('💾 [useDayData] Saving to database...', { dateKey, userId })
      
      const success = await dbManager.current.saveDayData(userId, dateKey, data)
      
      if (success) {
        lastSaveData.current = dataString
        console.log('✅ [useDayData] Data saved successfully')
        
        // Also save to localStorage as backup (excluding reading plan to prevent stale data)
        const localStorageKey = `dailyDavid_dayData_${userId}`
        try {
          const existingData = localStorage.getItem(localStorageKey)
          const parsedData = existingData ? JSON.parse(existingData) : {}
          
          // Remove reading plan from data before backing up to localStorage
          const { readingPlan, ...dataWithoutReadingPlan } = data
          parsedData[dateKey] = dataWithoutReadingPlan
          
          localStorage.setItem(localStorageKey, JSON.stringify(parsedData))
          console.log('💾 [useDayData] Data backed up to localStorage (reading plan excluded)')
        } catch (localError) {
          console.error('⚠️ [useDayData] Failed to backup to localStorage:', localError)
        }
      } else {
        console.error('❌ [useDayData] Failed to save to database')
      }
    } catch (error) {
      console.error('❌ [useDayData] Save error:', error)
      setError('Failed to save data')
    }
  }, [userId, dateKey])

  // Debounced save function
  const debouncedSave = useCallback((data: DayData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(data)
    }, 2000) // 2 second debounce
  }, [saveToDatabase])

  // Enhanced setDayData that auto-saves
  const setDayData = useCallback((data: DayData | ((prev: DayData) => DayData)) => {
    setDayDataState(prevData => {
      const newData = typeof data === 'function' ? data(prevData) : data
      
      // Only auto-save if this isn't the initial load
      if (!isInitialLoad.current) {
        console.log('🔄 [useDayData] Data updated, triggering save')
        debouncedSave(newData)
      }
      
      return newData
    })
  }, [debouncedSave])

  // Manual save function for immediate saves
  const manualSave = useCallback(async () => {
    await saveToDatabase(dayData)
  }, [saveToDatabase, dayData])

  // Load data from database
  const loadData = useCallback(async () => {
    if (!userId || !dateKey) {
      console.log('🔍 [useDayData] No userId or dateKey, using empty data')
      setDayDataState(createEmptyDayData())
      setHasData(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Clear caches on mobile devices to ensure fresh data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
          console.log('🧹 [useDayData] Cleared browser caches for fresh data')
        } catch (cacheError) {
          console.log('⚠️ [useDayData] Could not clear caches:', cacheError)
        }
      }

      console.log('🔍 [useDayData] Loading data for:', { dateKey, userId })
      console.log('📱 [useDayData] User agent:', navigator.userAgent)
      console.log('📱 [useDayData] Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

      // First try database
      const data = await dbManager.current.loadDayData(dateKey, userId)
      
      if (data && Object.keys(data).length > 0) {
        // Check if data has meaningful content
        const hasRealData = 
          (data.gratitude && data.gratitude.some(item => item.trim() !== '')) ||
          (data.soap && (data.soap.scripture?.trim() || data.soap.observation?.trim() || data.soap.application?.trim() || data.soap.prayer?.trim())) ||
          (data.checkIn && (data.checkIn.feeling?.trim() || data.checkIn.emotions?.length > 0)) ||
          (data.goals && (data.goals.daily?.length > 0 || data.goals.weekly?.length > 0 || data.goals.monthly?.length > 0)) ||
          (data.dailyIntention?.trim()) ||
          (data.growthQuestion?.trim()) ||
          (data.readingPlan && data.readingPlan.planId)

        if (hasRealData) {
          // Merge with defaults to ensure all properties exist
          const mergedData = {
            ...createEmptyDayData(),
            ...data
          }
          
          isInitialLoad.current = true
          setDayDataState(mergedData)
          lastSaveData.current = JSON.stringify(mergedData)
          setHasData(true)
          console.log('✅ [useDayData] Real data loaded from database')
          return
        }
      }

      // If no data for current date but we have a reading plan in database, load it
      // This ensures reading plan progress is always current, not cached
      if (!data || !data.readingPlan) {
        console.log('🔍 [useDayData] No reading plan for current date, checking database for latest reading plan...')
        try {
          const latestReadingPlan = await dbManager.current.getLatestReadingPlanProgress(userId)
          
          if (latestReadingPlan) {
            console.log('🔥 [useDayData] Found latest reading plan from database:', latestReadingPlan.planName, 'currentDay:', latestReadingPlan.currentDay)
            
            // Create data with the latest reading plan
            const mergedData = {
              ...createEmptyDayData(),
              ...data,
              readingPlan: latestReadingPlan
            }
            
            isInitialLoad.current = true
            setDayDataState(mergedData)
            lastSaveData.current = JSON.stringify(mergedData)
            setHasData(true)
            console.log('✅ [useDayData] Data loaded with latest reading plan from database')
            return
          }
        } catch (error) {
          console.error('⚠️ [useDayData] Error fetching latest reading plan:', error)
        }
      }

      // Fallback to localStorage for non-reading-plan data only
      console.log('💾 [useDayData] Checking localStorage fallback for non-reading-plan data...')
      
      const localDataWithoutReadingPlan = getLocalStorageDataWithoutReadingPlan(userId, dateKey)
      
      if (localDataWithoutReadingPlan) {
        const mergedData = {
          ...createEmptyDayData(),
          ...localDataWithoutReadingPlan
          // Note: readingPlan is intentionally excluded to prevent stale data
        }
        
        isInitialLoad.current = true
        setDayDataState(mergedData)
        setHasData(true)
        console.log('🔄 [useDayData] Non-reading-plan data loaded from localStorage fallback')
        return
      }

      // No data found, use empty
      console.log('📝 [useDayData] No existing data found, using empty data')
      isInitialLoad.current = true
      setDayDataState(createEmptyDayData())
      setHasData(false)

    } catch (error) {
      console.error('❌ [useDayData] Error loading data:', error)
      setError('Failed to load data')
      isInitialLoad.current = true
      setDayDataState(createEmptyDayData())
      setHasData(false)
    } finally {
      setIsLoading(false)
      // Reset initial load flag after a brief delay
      setTimeout(() => {
        isInitialLoad.current = false
      }, 100)
    }
  }, [userId, dateKey])

  // Load data when dateKey or userId changes
  useEffect(() => {
    // Clear any stale reading plan data from localStorage on initialization
    if (userId) {
      clearReadingPlanFromLocalStorage(userId)
    }
    loadData()
  }, [loadData, userId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Specific update functions for different sections
  const updateCheckIn = useCallback((checkIn: CheckInData) => {
    setDayData(prev => ({ ...prev, checkIn }))
  }, [setDayData])

  const updateGratitude = useCallback((gratitude: string[]) => {
    setDayData(prev => ({ ...prev, gratitude }))
  }, [setDayData])

  const updateSOAP = useCallback((soap: SOAPData) => {
    setDayData(prev => ({ ...prev, soap }))
  }, [setDayData])

  const updateGoals = useCallback((goalType: keyof GoalsByType, goals: Goal[]) => {
    setDayData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goalType]: goals
      }
    }))
  }, [setDayData])

  const updateDailyIntention = useCallback((intention: string) => {
    setDayData(prev => ({ ...prev, dailyIntention: intention }))
  }, [setDayData])

  const updateGrowthQuestion = useCallback((question: string) => {
    setDayData(prev => ({ ...prev, growthQuestion: question }))
  }, [setDayData])

  return {
    dayData,
    setDayData,
    isLoading,
    error,
    hasData,
    manualSave,
    updateCheckIn,
    updateGratitude,
    updateSOAP,
    updateGoals,
    updateDailyIntention,
    updateGrowthQuestion
  }
}