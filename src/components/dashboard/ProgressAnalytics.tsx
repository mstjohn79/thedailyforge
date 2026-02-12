import { motion } from 'framer-motion'
import { TrendingUp, Target, Award, Clock, Heart, BarChart3, Lightbulb, Flame, FileText, Trophy, TrendingUp as TrendingUpIcon, Calendar } from 'lucide-react'
import { Card } from '../ui/Card'
import { useDailyStore } from '../../stores/dailyStore'
import { useAuthStore } from '../../stores/authStore'
import { useEffect, useState } from 'react'
import { DailyEntry } from '../../types'
import { PrayerAnalytics } from '../analytics/PrayerAnalytics'

interface AnalyticsData {
  currentStreak: number
  longestStreak: number
  totalEntries: number
  completionRate: number
  goalCompletion: {
    daily: { completed: number, total: number, percentage: number }
    weekly: { completed: number, total: number, percentage: number }
    monthly: { completed: number, total: number, percentage: number }
  }
  categoryBreakdown: Array<{ category: string, count: number, color: string }>
  monthlyProgress: Array<{ month: string, entries: number, goals: number }>
  leadershipScores: {
    wisdom: number
    courage: number
    patience: number
    integrity: number
  }
}

function calculateAnalytics(entries: DailyEntry[]): AnalyticsData {
  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      completionRate: 0,
      goalCompletion: {
        daily: { completed: 0, total: 0, percentage: 0 },
        weekly: { completed: 0, total: 0, percentage: 0 },
        monthly: { completed: 0, total: 0, percentage: 0 }
      },
      categoryBreakdown: [],
      monthlyProgress: [],
      leadershipScores: { wisdom: 0, courage: 0, patience: 0, integrity: 0 }
    }
  }

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(entries)
  
  // Calculate completion rate
  const completionRate = calculateCompletionRate(entries)
  
  // Calculate goal completion
  const goalCompletion = calculateGoalCompletion(entries)
  
  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(entries)
  
  // Calculate monthly progress
  const monthlyProgress = calculateMonthlyProgress(entries)
  
  // Calculate leadership scores
  const leadershipScores = calculateLeadershipScores(entries)

  return {
    currentStreak,
    longestStreak,
    totalEntries: entries.length,
    completionRate,
    goalCompletion,
    categoryBreakdown,
    monthlyProgress,
    leadershipScores
  }
}

function calculateStreaks(entries: DailyEntry[]): { currentStreak: number, longestStreak: number } {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 }

  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if today has an entry
  const todayEntry = sortedEntries.find(entry => {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    return entryDate.getTime() === today.getTime()
  })
  
  // Start counting from today if there's an entry, otherwise start from yesterday
  let currentDate = new Date(today)
  if (!todayEntry) {
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  // Count consecutive days with entries, allowing for gaps up to 1 day
  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].date)
    entryDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) {
      // Exact match - count this entry
      currentStreak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (daysDiff === 1) {
      // Entry is 1 day before current date - count it and continue
      currentStreak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (daysDiff > 1) {
      // Gap of more than 1 day - streak is broken
      break
    }
    // If daysDiff < 0, entry is in the future, skip it
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    
    if (lastDate === null) {
      tempStreak = 1
    } else {
      const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    lastDate = entryDate
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return { currentStreak, longestStreak }
}

function calculateCompletionRate(entries: DailyEntry[]): number {
  if (entries.length === 0) return 0
  
  // Find the earliest entry date
  const earliestEntry = entries.reduce((earliest, entry) => {
    const entryDate = new Date(entry.date)
    return entryDate < earliest ? entryDate : earliest
  }, new Date(entries[0].date))
  
  // Calculate total days from first entry to today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalDays = Math.ceil((today.getTime() - earliestEntry.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // Count unique days with entries
  const uniqueDays = new Set(entries.map(entry => {
    const entryDate = new Date(entry.date)
    entryDate.setHours(0, 0, 0, 0)
    return entryDate.getTime()
  })).size
  
  // Calculate completion rate as percentage
  return Math.round((uniqueDays / totalDays) * 100)
}

function calculateGoalCompletion(entries: DailyEntry[]) {
  let dailyCompleted = 0, dailyTotal = 0
  let weeklyCompleted = 0, weeklyTotal = 0
  let monthlyCompleted = 0, monthlyTotal = 0

  entries.forEach(entry => {
    if (entry.goals) {
      // Daily goals
      if (entry.goals.daily) {
        dailyTotal += entry.goals.daily.length
        dailyCompleted += entry.goals.daily.filter(g => g.completed).length
      }
      
      // Weekly goals
      if (entry.goals.weekly) {
        weeklyTotal += entry.goals.weekly.length
        weeklyCompleted += entry.goals.weekly.filter(g => g.completed).length
      }
      
      // Monthly goals
      if (entry.goals.monthly) {
        monthlyTotal += entry.goals.monthly.length
        monthlyCompleted += entry.goals.monthly.filter(g => g.completed).length
      }
    }
  })

  return {
    daily: {
      completed: dailyCompleted,
      total: dailyTotal,
      percentage: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0
    },
    weekly: {
      completed: weeklyCompleted,
      total: weeklyTotal,
      percentage: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0
    },
    monthly: {
      completed: monthlyCompleted,
      total: monthlyTotal,
      percentage: monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0
    }
  }
}

function calculateCategoryBreakdown(entries: DailyEntry[]) {
  const categoryCount: { [key: string]: number } = {}
  
  entries.forEach(entry => {
    if (entry.goals) {
      const allGoals = [
        ...(entry.goals.daily || []),
        ...(entry.goals.weekly || []),
        ...(entry.goals.monthly || [])
      ]
      
      allGoals.forEach(goal => {
        const category = goal.category || 'Other'
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })
    }
  })

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']
  
  return Object.entries(categoryCount)
    .map(([category, count], index) => ({
      category,
      count,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6) // Top 6 categories
}

function calculateMonthlyProgress(entries: DailyEntry[]) {
  const monthlyData: { [key: string]: { entries: number, goals: number } } = {}
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.date)
    const monthKey = entryDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { entries: 0, goals: 0 }
    }
    
    monthlyData[monthKey].entries++
    
    if (entry.goals) {
      const totalGoals = (entry.goals.daily?.length || 0) + 
                        (entry.goals.weekly?.length || 0) + 
                        (entry.goals.monthly?.length || 0)
      monthlyData[monthKey].goals += totalGoals
    }
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6) // Last 6 months
}

function calculateLeadershipScores(entries: DailyEntry[]) {
  let wisdomSum = 0, courageSum = 0, patienceSum = 0, integritySum = 0
  let count = 0

  entries.forEach(entry => {
    if (entry.leadershipRating) {
      wisdomSum += entry.leadershipRating.wisdom || 0
      courageSum += entry.leadershipRating.courage || 0
      patienceSum += entry.leadershipRating.patience || 0
      integritySum += entry.leadershipRating.integrity || 0
      count++
    }
  })

  if (count === 0) {
    return { wisdom: 0, courage: 0, patience: 0, integrity: 0 }
  }

  return {
    wisdom: Math.round((wisdomSum / count) * 10) / 10,
    courage: Math.round((courageSum / count) * 10) / 10,
    patience: Math.round((patienceSum / count) * 10) / 10,
    integrity: Math.round((integritySum / count) * 10) / 10
  }
}

function calculateDisciplinePercentage(entries: DailyEntry[], discipline: string): number {
  if (entries.length === 0) return 0
  
  let totalDays = entries.length
  let daysWithDiscipline = 0
  
  entries.forEach(entry => {
    let hasDiscipline = false
    
    switch (discipline) {
      case 'soap':
        // Check if SOAP data exists and has content
        hasDiscipline = !!(entry.soap && (
          entry.soap.scripture?.trim() || 
          entry.soap.observation?.trim() || 
          entry.soap.application?.trim() || 
          entry.soap.prayer?.trim()
        ))
        break
      case 'prayer':
        // Check if prayer section has content
        hasDiscipline = !!(entry.soap && entry.soap.prayer?.trim())
        break
      case 'gratitude':
        // Check if gratitude array has meaningful content
        hasDiscipline = !!(entry.gratitude && entry.gratitude.some((item: string) => item?.trim()))
        break
      case 'goals':
        // Check if goals exist and have content
        hasDiscipline = !!(entry.goals && (
          entry.goals.daily?.length > 0 || 
          entry.goals.weekly?.length > 0 || 
          entry.goals.monthly?.length > 0
        ))
        break
    }
    
    if (hasDiscipline) {
      daysWithDiscipline++
    }
  })
  
  return Math.round((daysWithDiscipline / totalDays) * 100)
}

function generateHeatmapDays(entries: DailyEntry[]) {
  const days = []
  const today = new Date()
  
  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dateString = date.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateString)
    
    let intensity = 'none'
    let tooltip = `${date.toLocaleDateString()}: No activity`
    
    if (entry) {
      const activities = [
        !!(entry.soap && (entry.soap.scripture?.trim() || entry.soap.observation?.trim() || entry.soap.application?.trim() || entry.soap.prayer?.trim())),
        !!entry.gratitude,
        !!(entry.goals && (entry.goals.daily?.length > 0 || entry.goals.weekly?.length > 0 || entry.goals.monthly?.length > 0)),
        !!entry.dailyIntention
      ].filter(Boolean).length
      
      if (activities >= 3) {
        intensity = 'high'
        tooltip = `${date.toLocaleDateString()}: High activity (${activities} areas)`
      } else if (activities >= 2) {
        intensity = 'medium'
        tooltip = `${date.toLocaleDateString()}: Medium activity (${activities} areas)`
      } else if (activities >= 1) {
        intensity = 'low'
        tooltip = `${date.toLocaleDateString()}: Low activity (${activities} areas)`
      }
    }
    
    days.push({
      day: `${date.getMonth() + 1}/${date.getDate()}`,
      hasEntry: !!entry,
      intensity,
      tooltip
    })
  }
  
  return days
}

export function ProgressAnalytics() {
  const { entries, loadEntries, isLoading } = useDailyStore()
  const { isAuthenticated } = useAuthStore()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      console.log('📊 Analytics: Loading entries after authentication')
      loadEntries()
    }
  }, [isAuthenticated, loadEntries])

  // Listen for successful login to force refresh data
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log('📊 Analytics: Login success event received, refreshing data')
      if (isAuthenticated) {
        loadEntries()
      }
    }

    window.addEventListener('auth-login-success', handleLoginSuccess)
    return () => window.removeEventListener('auth-login-success', handleLoginSuccess)
  }, [isAuthenticated, loadEntries])

  useEffect(() => {
    console.log('📊 Analytics: Entries changed, recalculating analytics', { 
      entriesLength: entries.length, 
      isLoading 
    })
    
    if (entries.length > 0) {
      const data = calculateAnalytics(entries)
      console.log('📊 Analytics: Calculated analytics data:', data)
      setAnalyticsData(data)
    } else if (!isLoading && isAuthenticated) {
      // Only show zeros if we're not loading and we're authenticated
      console.log('📊 Analytics: No entries found, showing zero analytics')
      const data = calculateAnalytics([])
      setAnalyticsData(data)
    }
  }, [entries, isLoading, isAuthenticated])

  // Mock data fallback - replace with actual data from store/database
  const mockData = {
    currentStreak: 7,
    longestStreak: 23,
    totalEntries: 45,
    completionRate: 78,
    goalCompletion: {
      daily: { completed: 12, total: 15, percentage: 80 },
      weekly: { completed: 8, total: 12, percentage: 67 },
      monthly: { completed: 3, total: 6, percentage: 50 }
    },
    categoryBreakdown: [
      { category: 'Spiritual', count: 18, color: 'bg-blue-500' },
      { category: 'Health', count: 12, color: 'bg-green-500' },
      { category: 'Personal', count: 8, color: 'bg-purple-500' },
      { category: 'Work', count: 5, color: 'bg-orange-500' },
      { category: 'Family', count: 2, color: 'bg-pink-500' }
    ],
    monthlyProgress: [
      { month: 'Jan', entries: 8, goals: 12 },
      { month: 'Feb', entries: 12, goals: 15 },
      { month: 'Mar', entries: 15, goals: 18 },
      { month: 'Apr', entries: 10, goals: 12 }
    ],
    leadershipScores: {
      wisdom: 7.5,
      courage: 8.2,
      patience: 6.8,
      integrity: 9.1
    }
  }

  // Use real data if available, otherwise fallback to mock data
  const data = analyticsData || mockData

  if (isLoading || (isAuthenticated && entries.length === 0 && !analyticsData)) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Progress Analytics</h1>
          <p className="text-xl text-slate-300">"But grow in the grace and knowledge of our Lord and Savior Jesus Christ" - 2 Peter 3:18</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="w-12 h-12 bg-slate-600 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-slate-600 rounded mb-2"></div>
              <div className="h-4 bg-slate-600 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-tour="analytics">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">Progress Analytics</h1>
        <p className="text-xl text-slate-300">"But grow in the grace and knowledge of our Lord and Savior Jesus Christ" - 2 Peter 3:18</p>
      </motion.div>

      {/* Insights & Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-slate-400" />
            Insights & Recommendations
          </h3>
          <p className="text-sm text-slate-300 mb-4 text-center italic">
            "For the Lord gives wisdom; from his mouth come knowledge and understanding" - Proverbs 2:6
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Goal Completion Analysis</h4>
                  <p className="text-sm text-slate-300">
                    {data.goalCompletion.daily.percentage > 70 
                      ? `Excellent daily goal completion at ${data.goalCompletion.daily.percentage}%!`
                      : `Daily goals at ${data.goalCompletion.daily.percentage}% - room for improvement.`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Streak Performance</h4>
                  <p className="text-sm text-slate-300">
                    {data.currentStreak > 0 
                      ? `You're on a ${data.currentStreak}-day streak! Your longest was ${data.longestStreak} days.`
                      : `Start a new streak today! Your longest was ${data.longestStreak} days.`
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Monthly Goal Focus</h4>
                  <p className="text-sm text-slate-300">
                    {data.goalCompletion.monthly.percentage > 60 
                      ? `Great monthly goal completion at ${data.goalCompletion.monthly.percentage}%!`
                      : `Monthly goals at ${data.goalCompletion.monthly.percentage}% - consider breaking them into smaller weekly tasks.`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Leadership Growth</h4>
                  <p className="text-sm text-slate-300">
                    {data.leadershipScores.integrity > 8 
                      ? `Excellent integrity (${data.leadershipScores.integrity})! Focus on ${Object.entries(data.leadershipScores).reduce((lowest, [trait, score]) => score < data.leadershipScores[lowest as keyof typeof data.leadershipScores] ? trait : lowest, 'wisdom')} for balanced growth.`
                      : `Keep working on all leadership traits. Current average: ${((data.leadershipScores.wisdom + data.leadershipScores.courage + data.leadershipScores.patience + data.leadershipScores.integrity) / 4).toFixed(1)}/10`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
              <Flame className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">{data.currentStreak}</h3>
            <p className="text-sm text-slate-300">Current Streak</p>
            <p className="text-xs text-slate-400 mt-1">Keep it up!</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
              <FileText className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">{data.totalEntries}</h3>
            <p className="text-sm text-slate-300">Total Entries</p>
            <p className="text-xs text-slate-400 mt-1">Consistent!</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
              <Trophy className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">{data.longestStreak}</h3>
            <p className="text-sm text-slate-300">Longest Streak</p>
            <p className="text-xs text-slate-400 mt-1">Personal best!</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
              <TrendingUpIcon className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">{data.completionRate}%</h3>
            <p className="text-sm text-slate-300">Overall Progress</p>
            <p className="text-xs text-slate-400 mt-1">Growing!</p>
          </Card>
        </motion.div>
      </div>

      {/* Goal Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-slate-400" />
            Goal Analytics
          </h3>
          
          <div className="space-y-6">
            {/* Goal Completion Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {data.goalCompletion.daily.percentage}%
                </div>
                <div className="text-xs text-slate-300">Daily Goals</div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.goalCompletion.daily.completed}/{data.goalCompletion.daily.total} completed
                </div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {data.goalCompletion.weekly.percentage}%
                </div>
                <div className="text-xs text-slate-300">Weekly Goals</div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.goalCompletion.weekly.completed}/{data.goalCompletion.weekly.total} completed
                </div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {data.goalCompletion.monthly.percentage}%
                </div>
                <div className="text-xs text-slate-300">Monthly Goals</div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.goalCompletion.monthly.completed}/{data.goalCompletion.monthly.total} completed
                </div>
              </div>
            </div>

            {/* Goal Completion Progress Bars */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Goal Completion Progress</h4>
              <div className="space-y-3">
                {Object.entries(data.goalCompletion).map(([type, goalData]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-200 capitalize">{type} Goals</span>
                      <span className="text-slate-300">{goalData.completed}/{goalData.total}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${goalData.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-slate-400">{goalData.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category and Type Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">By Category</h4>
                <div className="space-y-2">
                  {data.categoryBreakdown.map((category) => (
                    <div key={category.category} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                      <span className="flex-1 text-sm text-slate-200">{category.category}</span>
                      <span className="text-sm font-medium text-white">{category.count}</span>
                      <div className="w-16 bg-slate-600 rounded-full h-2">
                        <div
                          className={`${category.color} h-2 rounded-full transition-all duration-500`}
                          style={{ 
                            width: `${data.categoryBreakdown.length > 0 
                              ? (category.count / Math.max(...data.categoryBreakdown.map(c => c.count))) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal Type Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">By Goal Type</h4>
                <div className="space-y-2">
                  {Object.entries(data.goalCompletion).map(([type, goalData]) => {
                    const typeColors = {
                      'daily': 'bg-green-500',
                      'weekly': 'bg-blue-500',
                      'monthly': 'bg-purple-500'
                    }
                    return (
                      <div key={type} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${typeColors[type as keyof typeof typeColors]}`}></div>
                        <span className="flex-1 text-sm text-slate-200 capitalize">{type} Goals</span>
                        <span className="text-sm font-medium text-white">{goalData.total}</span>
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div
                            className={`${typeColors[type as keyof typeof typeColors]} h-2 rounded-full transition-all duration-500`}
                            style={{ 
                              width: `${Math.max(...Object.values(data.goalCompletion).map(g => g.total)) > 0 
                                ? (goalData.total / Math.max(...Object.values(data.goalCompletion).map(g => g.total))) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Goal Insights */}
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-slate-400" />
                Goal Insights
              </h4>
              <div className="text-xs text-slate-300 space-y-1">
                {data.goalCompletion.daily.percentage < 50 && (
                  <div>• Focus on smaller, daily goals to build momentum</div>
                )}
                {data.goalCompletion.weekly.percentage > 70 && (
                  <div>• Great weekly progress! Consider adding monthly challenges</div>
                )}
                {data.goalCompletion.monthly.percentage < 30 && (
                  <div>• Break down monthly goals into weekly milestones</div>
                )}
                {data.goalCompletion.daily.percentage > 80 && (
                  <div>• Excellent daily consistency! Keep up the great work</div>
                )}
                {data.categoryBreakdown.length > 0 && (
                  <div>• Most goals are in {data.categoryBreakdown[0].category.toLowerCase()} - diversify your focus areas</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>


      {/* Spiritual Growth Command Center */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-8"
      >
        {/* Section 1: Prayer Analytics */}
        <PrayerAnalytics />

        {/* Section 2: Spiritual Disciplines Progress Rings */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-slate-400" />
            Spiritual Disciplines Health Check
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(() => {
              // Calculate real discipline percentages from entries
              const soapPercentage = calculateDisciplinePercentage(entries, 'soap')
              const prayerPercentage = calculateDisciplinePercentage(entries, 'prayer')
              const gratitudePercentage = calculateDisciplinePercentage(entries, 'gratitude')
              const goalsPercentage = calculateDisciplinePercentage(entries, 'goals')
              
              return [
                { name: 'SOAP Study', value: soapPercentage, color: 'text-green-500' },
                { name: 'Prayer', value: prayerPercentage, color: 'text-green-500' },
                { name: 'Gratitude', value: gratitudePercentage, color: 'text-green-500' },
                { name: 'Goals', value: goalsPercentage, color: 'text-green-600' }
              ].map((discipline) => (
                <div key={discipline.name} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${discipline.value}, 100`}
                        strokeLinecap="round"
                        className={discipline.color}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{discipline.value}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{discipline.name}</p>
                </div>
              ))
            })()}
          </div>
        </Card>

        {/* Section 3: Habit Consistency Heatmap */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            Last 30 Days Spiritual Activity Heatmap
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={`day-${index}`} className="text-center text-slate-400 font-medium p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateHeatmapDays(entries).map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-sm text-xs flex items-center justify-center font-medium ${
                    day.hasEntry 
                      ? day.intensity === 'high' 
                        ? 'bg-green-600 text-white' 
                        : day.intensity === 'medium'
                        ? 'bg-green-400 text-white'
                        : 'bg-slate-500 text-white'
                      : 'bg-slate-700 text-gray-400'
                  }`}
                  title={day.tooltip}
                >
                  {day.day}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-slate-700 rounded-sm"></div>
                <div className="w-3 h-3 bg-slate-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </Card>

        {/* Section 4: Leadership Growth Tracker */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-400" />
            Leadership Growth Tracker
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(data.leadershipScores).map(([trait, score]) => (
              <div key={`leadership-${trait}`} className="text-center">
                <h4 className="font-medium text-white capitalize mb-2">{trait}</h4>
                <div className="relative">
                  <svg className="w-20 h-20 mx-auto" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray={`${score * 10}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{score}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-2">/ 10</p>
                <div className="mt-2">
                  <span className="text-xs text-slate-300">↗ +0.2</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

    </div>
  )
}
