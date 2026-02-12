import React, { useState } from 'react'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { Play, HelpCircle } from 'lucide-react'

interface TakeTourButtonProps {
  variant?: 'button' | 'link' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const TakeTourButton: React.FC<TakeTourButtonProps> = ({ 
  variant = 'button', 
  size = 'md',
  className = ''
}) => {
  const { restartTour, hasSeenTour } = useOnboardingStore()
  const [showTooltip, setShowTooltip] = useState(false)

  const handleTakeTour = () => {
    restartTour()
  }

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleTakeTour}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors ${className}`}
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        
        {showTooltip && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg border border-slate-600 whitespace-nowrap z-50">
            <div className="text-center">
              <div className="font-semibold text-green-400 mb-1">
                {hasSeenTour ? "🔄 Take Tour Again" : "🎯 Take Guided Tour"}
              </div>
              <div className="text-xs text-slate-300">
                {hasSeenTour ? "Replay the app walkthrough" : "Learn how to use the app"}
              </div>
            </div>
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-900"></div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleTakeTour}
        className={`text-green-400 hover:text-green-300 underline transition-colors ${className}`}
      >
        {hasSeenTour ? "Take tour again" : "Take the tour"}
      </button>
    )
  }

  // Default button variant
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      onClick={handleTakeTour}
      className={`
        ${sizeClasses[size]}
        bg-green-600 hover:bg-green-700 
        text-white font-medium 
        rounded-lg 
        flex items-center space-x-2
        transition-colors
        ${className}
      `}
    >
      <Play className="w-4 h-4" />
      <span>{hasSeenTour ? "Take Tour Again" : "Take Tour"}</span>
    </button>
  )
}
