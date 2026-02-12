import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  X, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Circle,
  RotateCcw,
  Plus
} from 'lucide-react'
import { Button } from '../ui/Button'
import { ReadingPlan } from '../../types'

interface ReadingPlanProgressProps {
  readingPlan: ReadingPlan & { bibleId?: string }
  onLoadTodaysDevotion: (planId: string, targetDay?: number, bibleId?: string) => void
  onAdvanceToNextDay: () => void
  onGoToPreviousDay: () => void
  onClosePlan: () => void
  onStartNewPlan: () => void
  onRestartPlan: () => void
  onSaveProgress: () => void
}

export const ReadingPlanProgress: React.FC<ReadingPlanProgressProps> = ({
  readingPlan,
  onLoadTodaysDevotion,
  onAdvanceToNextDay,
  onGoToPreviousDay,
  onClosePlan,
  onStartNewPlan,
  onRestartPlan,
  onSaveProgress
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const progressPercentage = (readingPlan.completedDays.length / readingPlan.totalDays) * 100
  const daysRemaining = readingPlan.totalDays - readingPlan.completedDays.length

  const renderDayGrid = () => {
    const days = []
    for (let i = 1; i <= readingPlan.totalDays; i++) {
      const isCompleted = readingPlan.completedDays.includes(i)
      const isCurrent = i === readingPlan.currentDay
      const isPast = i < readingPlan.currentDay && !isCompleted
      const isFuture = i > readingPlan.currentDay

      let dayClass = "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 "
      
      if (isCompleted) {
        dayClass += "bg-green-500 border-green-500 text-white"
      } else if (isCurrent) {
        dayClass += "bg-blue-500 border-blue-500 text-white"
      } else if (isPast) {
        dayClass += "bg-gray-300 border-gray-300 text-gray-600"
      } else {
        dayClass += "bg-gray-700 border-gray-600 text-gray-400"
      }

      days.push(
        <div key={i} className={dayClass}>
          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i}
        </div>
      )
    }

    return days
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4"
        style={{position: 'relative', zIndex: 1, pointerEvents: 'auto'}}
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-white truncate">{readingPlan.planName}</h3>
            <p className="text-sm text-gray-400">
              Started {new Date(readingPlan.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white p-2"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClosePlan}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{readingPlan.completedDays.length}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{daysRemaining}</div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{readingPlan.totalDays}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-4" style={{position: 'relative', zIndex: 9999, pointerEvents: 'auto'}}>
        {/* Load current day's devotion - Full width on mobile */}
        <Button
          size="sm"
          onClick={() => onLoadTodaysDevotion(readingPlan.planId, readingPlan.currentDay, readingPlan.bibleId)}
          className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white"
          style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
        >
          Load Day {readingPlan.currentDay} Devotion
        </Button>
        
        {/* Navigation buttons - Responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2">
          {readingPlan.currentDay > 1 && (
            <Button
              size="sm"
              onClick={() => onGoToPreviousDay()}
              className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-500 text-white"
              style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">← Previous</span>
            </Button>
          )}
          
          {readingPlan.currentDay < readingPlan.totalDays && (
            <Button
              size="sm"
              onClick={() => onAdvanceToNextDay()}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white"
              style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
            >
              <span className="hidden sm:inline">Next Day</span>
              <span className="sm:hidden">Next Day →</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
        
        {/* Secondary actions - Responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            size="sm"
            onClick={() => onRestartPlan()}
            variant="outline"
            className="flex-1 sm:flex-none text-slate-300 hover:bg-slate-700"
            style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart
          </Button>
          <Button
            size="sm"
            onClick={() => onStartNewPlan()}
            variant="outline"
            className="flex-1 sm:flex-none text-slate-300 hover:bg-slate-700"
            style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Expandable Day Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Daily Progress</h4>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 overflow-x-auto">
                {renderDayGrid()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
  )
}
