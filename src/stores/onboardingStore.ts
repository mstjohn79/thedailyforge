import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_BASE_URL } from '../config/api'
import { getAuthHeaders } from './authStore'

interface OnboardingState {
  // Tour state
  isFirstTime: boolean
  currentStep: number
  isActive: boolean
  completedSteps: number[]
  skipOnboarding: boolean
  hasSeenTour: boolean // Track if user has ever seen the tour
  lastUserId: string | null // Track which user this state belongs to
  
  // Tour configuration
  totalSteps: number
  tourSteps: TourStep[]
  
  // Actions
  startTour: () => void
  nextStep: () => void
  previousStep: () => void
  skipTour: () => void
  completeTour: () => void
  resetOnboarding: () => void
  setCurrentStep: (step: number) => void
  restartTour: () => void // Allow users to restart tour anytime
  checkUserChange: (userId: string) => void // Check if user changed and reset if needed
  forceResetForNewUser: (userId: string) => void // Force reset onboarding state for new user
}

interface TourStep {
  id: number
  title: string
  message: string
  action: string
  target: string
  route: string
  highlight?: string
  autoAdvance?: boolean
  delay?: number
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: "Welcome to Daily David!",
    message: "Welcome to Daily David! This is your spiritual growth dashboard. Here you'll see your daily streak, weekly progress, and goal completion.",
    action: "Let's start your first daily entry!",
    target: "[data-tour='dashboard-stats']",
    route: "/dashboard",
    highlight: "stats-grid"
  },
  {
    id: 2,
    title: "Your Daily Entry",
    message: "This is where your daily spiritual journey begins. We'll go through each section from top to bottom to build your daily practice.",
    action: "Let's start with the first section!",
    target: "[data-tour='daily-entry-intro'], .space-y-8",
    route: "/daily",
    highlight: "daily-entry-form"
  },
  {
    id: 3,
    title: "Check In with Yourself",
    message: "Start by checking in with your emotions. Select how you're feeling and write a brief note about your current state.",
    action: "Select an emotion to see how it works!",
    target: "[data-tour='check-in-section'], .bg-slate-800",
    route: "/daily",
    highlight: "check-in-section"
  },
  {
    id: 4,
    title: "Practice Gratitude",
    message: "Cultivate a heart of thankfulness. List 3 things you're grateful for each day to transform your perspective.",
    action: "Add something you're grateful for!",
    target: "[data-tour='gratitude-section']",
    route: "/daily",
    highlight: "gratitude-section"
  },
  {
    id: 5,
    title: "Set Your Goals",
    message: "Set intentional goals to grow as a man of God. Daily goals for immediate actions, weekly for habits, monthly for character growth.",
    action: "Add your first goal!",
    target: "[data-tour='goals-section']",
    route: "/daily",
    highlight: "goals-section"
  },
  {
    id: 6,
    title: "SOAP Bible Study",
    message: "SOAP stands for Scripture, Observation, Application, Prayer. This is the heart of your daily study. Start by selecting a Bible reading plan or entering your own scripture.",
    action: "Try selecting a reading plan!",
    target: "[data-tour='soap-section']",
    route: "/daily",
    highlight: "soap-section"
  },
  {
    id: 7,
    title: "Set Your Daily Intention",
    message: "After studying God's word, set your daily intention - what do you want to focus on today? This helps you live with purpose and direction based on what you've learned.",
    action: "Try writing a daily intention!",
    target: "[data-tour='daily-intention']",
    route: "/daily",
    highlight: "daily-intention-section"
  },
  {
    id: 8,
    title: "Leadership Self-Assessment",
    message: "Rate yourself on key leadership traits: Wisdom, Courage, Patience, and Integrity. This helps you grow in character and self-awareness.",
    action: "Adjust a rating to see how it works!",
    target: "[data-tour='leadership-rating']",
    route: "/daily",
    highlight: "leadership-rating-section"
  },
  {
    id: 9,
    title: "Prayer Requests",
    message: "Manage your prayer list here. Add requests for yourself and others, track answered prayers, and celebrate God's faithfulness.",
    action: "Let's add a prayer request!",
    target: "[data-tour='prayer-requests']",
    route: "/prayer",
    highlight: "prayer-requests-section"
  },
  {
    id: 10,
    title: "Sermon Notes",
    message: "Capture insights from sermons and teachings. Record the speaker, passage, and your key takeaways to review later.",
    action: "Let's see how to add sermon notes!",
    target: "[data-tour='sermon-notes']",
    route: "/sermon-notes",
    highlight: "sermon-notes-section"
  },
  {
    id: 11,
    title: "Track Your Progress",
    message: "Track your spiritual growth over time. See your progress, insights, and celebrate your journey of becoming a man of God.",
    action: "You're all set! Start your daily practice!",
    target: "[data-tour='analytics'], main.container",
    route: "/analytics",
    highlight: "analytics-section"
  },
  {
    id: 12,
    title: "You're Ready!",
    message: "Perfect! You've seen all the main features. Your dashboard is your home base - check your progress, start new entries, and continue growing in faith.",
    action: "Start your first daily entry!",
    target: "[data-tour='dashboard-actions']",
    route: "/dashboard",
    highlight: "dashboard-actions"
  }
]

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      isFirstTime: true,
      currentStep: 1,
      isActive: false,
      completedSteps: [],
      skipOnboarding: false,
      hasSeenTour: false,
      lastUserId: null,
      totalSteps: tourSteps.length,
      tourSteps,

      // Actions
      startTour: () => {
        set({ 
          isActive: true, 
          currentStep: 1,
          completedSteps: []
        })
      },

      nextStep: () => {
        const { currentStep, totalSteps, completedSteps } = get()
        const nextStep = currentStep + 1
        
        if (nextStep <= totalSteps) {
          set({ 
            currentStep: nextStep,
            completedSteps: [...completedSteps, currentStep]
          })
        } else {
          // Tour completed
          get().completeTour()
        }
      },

      previousStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 })
        }
      },

      completeTour: async () => {
        const { lastUserId } = get()
        set({ 
          isActive: false, 
          isFirstTime: false,
          hasSeenTour: true,
          completedSteps: Array.from({ length: tourSteps.length }, (_, i) => i + 1)
        })
        
        // Mark this user as having completed onboarding in database
        if (lastUserId) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/user/complete-onboarding`, {
              method: 'POST',
              headers: getAuthHeaders()
            })
            
            if (response.ok) {
              console.log('🎯 Marked user as having completed onboarding in database:', lastUserId)
            } else {
              console.error('🎯 Failed to mark onboarding as completed:', response.status)
            }
          } catch (error) {
            console.error('🎯 Error marking onboarding as completed:', error)
          }
        }
      },

      skipTour: async () => {
        const { lastUserId } = get()
        set({ 
          isActive: false, 
          skipOnboarding: true,
          isFirstTime: false,
          hasSeenTour: true
        })
        
        // Mark this user as having completed onboarding in database (even if they skipped)
        if (lastUserId) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/user/complete-onboarding`, {
              method: 'POST',
              headers: getAuthHeaders()
            })
            
            if (response.ok) {
              console.log('🎯 Marked user as having completed onboarding (skipped) in database:', lastUserId)
            } else {
              console.error('🎯 Failed to mark onboarding as completed (skipped):', response.status)
            }
          } catch (error) {
            console.error('🎯 Error marking onboarding as completed (skipped):', error)
          }
        }
      },

      restartTour: () => {
        set({ 
          isActive: true,
          currentStep: 1,
          completedSteps: []
        })
      },

      resetOnboarding: () => {
        set({ 
          isFirstTime: true,
          currentStep: 1,
          isActive: false,
          completedSteps: [],
          skipOnboarding: false,
          hasSeenTour: false,
          lastUserId: null
        })
      },

      checkUserChange: async (userId: string) => {
        const { lastUserId, hasSeenTour } = get()
        console.log('🎯 Checking user change', { lastUserId, newUserId: userId, hasSeenTour })
        
        // If user has already seen the tour, don't override their state
        if (hasSeenTour && lastUserId === userId) {
          console.log('🎯 User has already seen tour, keeping existing state')
          return
        }
        
        if (lastUserId !== userId) {
          console.log('🎯 User changed, checking onboarding status from database')
          
          try {
            // Check onboarding status from database
            const response = await fetch(`${API_BASE_URL}/api/user/onboarding-status`, {
              headers: getAuthHeaders()
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log('🎯 Database onboarding status:', data)
              
              if (data.shouldShowOnboarding) {
                // Brand new user - show onboarding
                console.log('🎯 Brand new user detected, will show onboarding')
                set({ 
                  isFirstTime: true,
                  currentStep: 1,
                  isActive: false,
                  completedSteps: [],
                  skipOnboarding: false,
                  hasSeenTour: false,
                  lastUserId: userId
                })
              } else {
                // Existing user or already completed - don't show onboarding
                console.log('🎯 Existing user or completed onboarding, skipping')
                set({ 
                  isFirstTime: false,
                  currentStep: 1,
                  isActive: false,
                  completedSteps: [],
                  skipOnboarding: true,
                  hasSeenTour: true,
                  lastUserId: userId
                })
              }
            } else {
              console.error('🎯 Failed to fetch onboarding status:', response.status)
              // Default to not showing onboarding if API fails
              set({ 
                isFirstTime: false,
                currentStep: 1,
                isActive: false,
                completedSteps: [],
                skipOnboarding: true,
                hasSeenTour: true,
                lastUserId: userId
              })
            }
          } catch (error) {
            console.error('🎯 Error checking onboarding status:', error)
            // Default to not showing onboarding if API fails
            set({ 
              isFirstTime: false,
              currentStep: 1,
              isActive: false,
              completedSteps: [],
              skipOnboarding: true,
              hasSeenTour: true,
              lastUserId: userId
            })
          }
        } else {
          console.log('🎯 Same user, keeping existing onboarding state')
        }
      },

      forceResetForNewUser: (userId: string) => {
        console.log('🎯 Force resetting onboarding state for new user:', userId)
        // Clear localStorage first
        localStorage.removeItem('onboarding-storage')
        // Then reset the state
        set({ 
          isFirstTime: true,
          currentStep: 1,
          isActive: false,
          completedSteps: [],
          skipOnboarding: false,
          hasSeenTour: false,
          lastUserId: userId
        })
      },

      setCurrentStep: (step: number) => {
        set({ currentStep: step })
      }
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({ 
        isFirstTime: state.isFirstTime,
        skipOnboarding: state.skipOnboarding,
        hasSeenTour: state.hasSeenTour,
        completedSteps: state.completedSteps,
        lastUserId: state.lastUserId
      })
    }
  )
)

// Helper function to check if user should see onboarding
export const shouldShowOnboarding = (): boolean => {
  const { isFirstTime, skipOnboarding, isActive } = useOnboardingStore.getState()
  return isFirstTime && !skipOnboarding && !isActive
}

// Helper function to get current tour step
export const getCurrentTourStep = (): TourStep | null => {
  const { currentStep, tourSteps } = useOnboardingStore.getState()
  return tourSteps.find(step => step.id === currentStep) || null
}

// Helper function to check if a specific user has completed onboarding
export const hasUserCompletedOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/onboarding-status`, {
      headers: getAuthHeaders()
    })
    
    if (response.ok) {
      const data = await response.json()
      return !data.shouldShowOnboarding
    }
    
    return false
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}
