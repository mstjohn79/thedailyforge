import React, { useState } from 'react'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Settings, Play, RotateCcw, SkipForward } from 'lucide-react'

export const OnboardingDevTools: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const {
    isFirstTime,
    isActive,
    currentStep,
    totalSteps,
    completedSteps,
    skipOnboarding,
    startTour,
    resetOnboarding,
    skipTour,
    setCurrentStep
  } = useOnboardingStore()

  const [isExpanded, setIsExpanded] = useState(false)

  // Only show in development mode and for authenticated users
  if (process.env.NODE_ENV === 'production' || !isAuthenticated) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-slate-800 border-slate-600 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">Onboarding Dev Tools</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {/* Status */}
            <div className="text-xs text-slate-300 space-y-1">
              <div>First Time: {isFirstTime ? 'Yes' : 'No'}</div>
              <div>Active: {isActive ? 'Yes' : 'No'}</div>
              <div>Step: {currentStep}/{totalSteps}</div>
              <div>Completed: {completedSteps.length}</div>
              <div>Skipped: {skipOnboarding ? 'Yes' : 'No'}</div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                size="sm"
                onClick={startTour}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isActive}
              >
                <Play className="w-3 h-3 mr-1" />
                Start Tour
              </Button>

              <Button
                size="sm"
                onClick={resetOnboarding}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset Onboarding
              </Button>

              <Button
                size="sm"
                onClick={skipTour}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={!isActive}
              >
                <SkipForward className="w-3 h-3 mr-1" />
                Skip Tour
              </Button>

              {/* Step Navigation */}
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  1
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  2
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  3
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  4
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-400 border-t border-slate-700 pt-2">
              <p>• Use "Reset Onboarding" to test first-time user experience</p>
              <p>• Use step numbers to jump to specific tour steps</p>
              <p>• Only visible in development mode</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
