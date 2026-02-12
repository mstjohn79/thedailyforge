import React, { useEffect } from 'react'
import { useOnboardingStore, shouldShowOnboarding } from '../../stores/onboardingStore'
import { useAuthStore } from '../../stores/authStore'

export const OnboardingTrigger: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()
  const { startTour, isFirstTime, checkUserChange } = useOnboardingStore()
  const [hasCheckedUser, setHasCheckedUser] = React.useState(false)

  useEffect(() => {
    console.log('🎯 OnboardingTrigger: Effect triggered', { 
      isAuthenticated, 
      user: user?.name, 
      userId: user?.id,
      isFirstTime,
      shouldShow: shouldShowOnboarding(),
      hasCheckedUser
    })
    
    // Only check user change once per user session
    if (isAuthenticated && user?.id && !hasCheckedUser) {
      console.log('🎯 OnboardingTrigger: Checking if user changed for first time')
      checkUserChange(user.id).catch(error => {
        console.error('🎯 OnboardingTrigger: Error checking user change:', error)
      })
      setHasCheckedUser(true)
    }
    
    // Only trigger onboarding for authenticated users who are first-time
    if (isAuthenticated && user && isFirstTime) {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        const shouldShow = shouldShowOnboarding()
        console.log('🎯 OnboardingTrigger: After delay, shouldShow:', shouldShow)
        
        if (shouldShow) {
          console.log('🎯 Starting onboarding tour for first-time user:', user.name)
          startTour()
        } else {
          console.log('🎯 OnboardingTrigger: Not starting tour - conditions not met')
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user?.id, isFirstTime, startTour, checkUserChange, hasCheckedUser])

  // Reset hasCheckedUser when user changes
  useEffect(() => {
    if (user?.id) {
      setHasCheckedUser(false)
    }
  }, [user?.id])

  // This component doesn't render anything
  return null
}
