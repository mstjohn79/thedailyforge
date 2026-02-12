/**
 * Reading Plan Utilities
 * 
 * This module provides utilities to ensure reading plan data consistency
 * across devices and prevent localStorage caching issues.
 */

/**
 * Clear reading plan data from localStorage to prevent stale data
 * This should be called when the app starts to ensure fresh data
 */
export const clearReadingPlanFromLocalStorage = (userId: string | number): void => {
  try {
    const localStorageKey = `dailyDavid_dayData_${userId}`
    const localData = localStorage.getItem(localStorageKey)
    
    if (localData) {
      const parsedData = JSON.parse(localData)
      let hasChanges = false
      
      // Remove reading plan data from all dates
      Object.keys(parsedData).forEach(dateKey => {
        if (parsedData[dateKey] && parsedData[dateKey].readingPlan) {
          delete parsedData[dateKey].readingPlan
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        localStorage.setItem(localStorageKey, JSON.stringify(parsedData))
        console.log('🧹 [ReadingPlanUtils] Cleared reading plan data from localStorage')
      }
    }
  } catch (error) {
    console.error('⚠️ [ReadingPlanUtils] Error clearing reading plan from localStorage:', error)
  }
}

/**
 * Validate that reading plan data is not stale
 * This can be used to detect if localStorage contains outdated reading plan data
 */
export const validateReadingPlanFreshness = (readingPlan: any, maxAgeHours: number = 24): boolean => {
  if (!readingPlan || !readingPlan.startDate) {
    return true // No reading plan to validate
  }
  
  try {
    const startDate = new Date(readingPlan.startDate)
    const now = new Date()
    const ageHours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    
    // If the reading plan is older than maxAgeHours, it might be stale
    if (ageHours > maxAgeHours) {
      console.warn('⚠️ [ReadingPlanUtils] Reading plan data might be stale (age:', ageHours.toFixed(1), 'hours)')
      return false
    }
    
    return true
  } catch (error) {
    console.error('⚠️ [ReadingPlanUtils] Error validating reading plan freshness:', error)
    return false
  }
}

/**
 * Get reading plan data from localStorage without the risk of stale data
 * This function excludes reading plan data to force fresh database lookup
 */
export const getLocalStorageDataWithoutReadingPlan = (userId: string | number, dateKey: string): any => {
  try {
    const localStorageKey = `dailyDavid_dayData_${userId}`
    const localData = localStorage.getItem(localStorageKey)
    
    if (localData) {
      const parsedData = JSON.parse(localData)
      const dateData = parsedData[dateKey]
      
      if (dateData) {
        // Remove reading plan to prevent stale data
        const { readingPlan, ...dataWithoutReadingPlan } = dateData
        return dataWithoutReadingPlan
      }
    }
    
    return null
  } catch (error) {
    console.error('⚠️ [ReadingPlanUtils] Error getting localStorage data without reading plan:', error)
    return null
  }
}
