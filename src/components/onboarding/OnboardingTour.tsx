import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { useOnboardingStore, getCurrentTourStep } from '../../stores/onboardingStore'
import { Button } from '../ui/Button'

interface OnboardingTourProps {
  children: React.ReactNode
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    setCurrentStep
  } = useOnboardingStore()

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentTourStep = getCurrentTourStep()

  // Smooth transition functions
  const smoothNextStep = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true)
      setIsVisible(false)
      setTimeout(() => {
        nextStep()
        setIsTransitioning(false)
      }, 200)
    } else {
      completeTour()
    }
  }

  const smoothPrevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setIsVisible(false)
      setTimeout(() => {
        previousStep()
        setIsTransitioning(false)
      }, 200)
    }
  }

  // Handle navigation to correct route for each step
  useEffect(() => {
    if (isActive && currentTourStep) {
      const currentPath = location.pathname
      if (currentPath !== currentTourStep.route) {
        navigate(currentTourStep.route)
      }
    }
  }, [isActive, currentStep, currentTourStep, navigate, location.pathname])

  // Add scroll listener to reposition tooltip when user scrolls
  useEffect(() => {
    if (isActive && targetElement) {
      const handleScroll = () => {
        const rect = targetElement.getBoundingClientRect()
        const isMobile = window.innerWidth < 768
        const tooltipHeight = isMobile ? 180 : 200
        const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 20) : 350
        const padding = 10
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        let top, left

        if (isMobile) {
          // Mobile: Position tooltip below element, centered horizontally
          top = rect.bottom + padding
          left = Math.max(padding, (viewportWidth - tooltipWidth) / 2)
          
          if (top + tooltipHeight > viewportHeight - padding) {
            top = rect.top - tooltipHeight - padding
          }
          
          if (top < padding) {
            top = Math.max(padding, (viewportHeight - tooltipHeight) / 2)
          }
        } else {
          // Desktop: Position in top-right corner of the element
          top = rect.top + padding
          left = rect.right - tooltipWidth - padding

          if (left < padding) {
            left = rect.left + padding
          }
          if (top + tooltipHeight > viewportHeight - padding) {
            top = rect.bottom - tooltipHeight - padding
          }
          if (top < padding) {
            top = Math.max(padding, (viewportHeight - tooltipHeight) / 2)
          }
        }

        setTooltipPosition({
          top: Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding)),
          left: Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
        })
      }

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleScroll)
      }
    }
  }, [isActive, targetElement])

  // Position tooltip and highlight target element
  useEffect(() => {
    if (isActive && currentTourStep) {
      console.log('🎯 Onboarding: Looking for target:', currentTourStep.target)
      
      // Handle multiple selectors (fallbacks)
      const selectors = currentTourStep.target.split(', ')
      let target: HTMLElement | null = null
      
      for (const selector of selectors) {
        target = document.querySelector(selector.trim()) as HTMLElement
        if (target) {
          console.log('🎯 Onboarding: Found target with selector:', selector.trim())
          break
        }
      }
      
      console.log('🎯 Onboarding: Target found:', target)
      if (target) {
        setTargetElement(target)
        const rect = target.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

        console.log('🎯 Onboarding: Target rect:', rect)
        console.log('🎯 Onboarding: Window dimensions:', { width: window.innerWidth, height: window.innerHeight })

        // Mobile-responsive tooltip positioning
        const isMobile = window.innerWidth < 768
        const tooltipHeight = isMobile ? 180 : 200
        const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 20) : 350
        const padding = isMobile ? 10 : 10
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        let top, left

        if (isMobile) {
          // Mobile: Position tooltip below element, centered horizontally
          top = rect.bottom + padding
          left = Math.max(padding, (viewportWidth - tooltipWidth) / 2)
          
          // If not enough space below, position above
          if (top + tooltipHeight > viewportHeight - padding) {
            top = rect.top - tooltipHeight - padding
          }
          
          // If still not enough space, center vertically
          if (top < padding) {
            top = Math.max(padding, (viewportHeight - tooltipHeight) / 2)
          }
        } else {
          // Desktop: Position in top-right corner of the element
          top = rect.top + padding
          left = rect.right - tooltipWidth - padding

          // Adjust if tooltip would go off screen
          if (left < padding) {
            left = rect.left + padding
          }
          if (top + tooltipHeight > viewportHeight - padding) {
            top = rect.bottom - tooltipHeight - padding
          }
          if (top < padding) {
            top = Math.max(padding, (viewportHeight - tooltipHeight) / 2)
          }
        }

        const tooltipPosition = {
          top: Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding)),
          left: Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
        }
        
        console.log('🎯 Onboarding: Calculated tooltip position:', tooltipPosition)
        setTooltipPosition(tooltipPosition)

        // Scroll element into view
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        })

        console.log('🎯 Onboarding: Setting tooltip visible to true')
        setIsVisible(true)
      } else {
        console.log('🎯 Onboarding: Target not found, retrying in 1000ms...')
        // If target not found, wait a bit and try again
        setTimeout(() => {
          // Handle multiple selectors (fallbacks) for retry
          const selectors = currentTourStep.target.split(', ')
          let retryTarget: HTMLElement | null = null
          
          for (const selector of selectors) {
            retryTarget = document.querySelector(selector.trim()) as HTMLElement
            if (retryTarget) {
              console.log('🎯 Onboarding: Found retry target with selector:', selector.trim())
              break
            }
          }
          
          console.log('🎯 Onboarding: Retry target found:', retryTarget)
          if (retryTarget) {
            setTargetElement(retryTarget)
            const rect = retryTarget.getBoundingClientRect()
            
            // Use the same mobile-responsive positioning logic
            const isMobile = window.innerWidth < 768
            const tooltipHeight = isMobile ? 180 : 200
            const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 20) : 350
            const padding = 10
            const viewportHeight = window.innerHeight
            const viewportWidth = window.innerWidth

            let top, left

            if (isMobile) {
              // Mobile: Position tooltip below element, centered horizontally
              top = rect.bottom + padding
              left = Math.max(padding, (viewportWidth - tooltipWidth) / 2)
              
              if (top + tooltipHeight > viewportHeight - padding) {
                top = rect.top - tooltipHeight - padding
              }
              
              if (top < padding) {
                top = Math.max(padding, (viewportHeight - tooltipHeight) / 2)
              }
            } else {
              // Desktop: Position in top-right corner of the element
              top = rect.top + padding
              left = rect.right - tooltipWidth - padding

              if (left < padding) {
                left = rect.left + padding
              }
              if (top + tooltipHeight > viewportHeight - padding) {
                top = rect.bottom - tooltipHeight - padding
              }
              if (top < padding) {
                top = Math.max(padding, (viewportHeight - tooltipHeight) / 2)
              }
            }

            setTooltipPosition({
              top: Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding)),
              left: Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
            })
            
            retryTarget.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            })
            
            setIsVisible(true)
          } else {
            console.log('🎯 Onboarding: No target found, showing tooltip in center')
            // Fallback: show tooltip in center of screen
            setTargetElement(null)
            setTooltipPosition({
              top: window.innerHeight / 2 - 100,
              left: window.innerWidth / 2 - 200
            })
            setIsVisible(true)
          }
        }, 1000)
      }
    } else {
      setIsVisible(false)
      setTargetElement(null)
    }
  }, [isActive, currentStep, currentTourStep])

  // Handle step completion
  const handleNext = () => {
    if (currentStep === totalSteps) {
      completeTour()
    } else {
      smoothNextStep()
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    smoothPrevStep()
  }

  // Handle skip
  const handleSkip = () => {
    skipTour()
  }

  if (!isActive || !currentTourStep) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      
      {/* Overlay */}
      <AnimatePresence>
        {isVisible && (
          console.log('🎯 Onboarding: Rendering tooltip overlay, isVisible:', isVisible, 'currentStep:', currentStep) || true) && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] pointer-events-none"
          >
            {/* Dark overlay with spotlight */}
            <div className="absolute inset-0 bg-black/60">
              {targetElement && (
                <div
                  className="absolute bg-transparent border-2 border-green-400 rounded-lg shadow-lg shadow-green-400/50"
                  style={{
                    top: targetElement.getBoundingClientRect().top - 8,
                    left: targetElement.getBoundingClientRect().left - 8,
                    width: targetElement.getBoundingClientRect().width + 16,
                    height: targetElement.getBoundingClientRect().height + 16,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: isTransitioning ? 0 : 1, 
                scale: isTransitioning ? 0.9 : 1,
                y: isTransitioning ? 20 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute z-[10000] pointer-events-auto"
              style={{
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                maxWidth: window.innerWidth < 768 ? '320px' : '400px',
                width: window.innerWidth < 768 ? '320px' : '350px'
              }}
            >
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 md:p-6 shadow-2xl relative">
                {/* Arrow pointing to the element - hide on mobile */}
                {window.innerWidth >= 768 && (
                  <div className="absolute -left-2 top-6 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-slate-800"></div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs md:text-sm">
                        {currentStep}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-white">
                      {currentTourStep.title}
                    </h3>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Step {currentStep} of {totalSteps}</span>
                    <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4 md:mb-6">
                  <p className="text-slate-200 mb-3 text-sm md:text-base leading-relaxed">
                    {currentTourStep.message}
                  </p>
                  <p className="text-green-300 font-medium text-sm md:text-base">
                    {currentTourStep.action}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between space-y-2 md:space-y-0">
                  <div className="flex space-x-2">
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 md:flex-none"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSkip}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 md:flex-none text-xs md:text-sm"
                    >
                      <SkipForward className="w-4 h-4 mr-1" />
                      Skip Tour
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                  >
                    {currentStep === totalSteps ? 'Finish' : 'Next'}
                    {currentStep < totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>

              {/* Arrow pointing to target */}
              {targetElement && (
                <div
                  className="absolute w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-green-500"
                  style={{
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
