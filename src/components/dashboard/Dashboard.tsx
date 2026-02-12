import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Crown, Trophy, CalendarDays, Target, BookOpen, Flame, TreePine, Mountain } from 'lucide-react'
import { MountainCrossIcon, CompassCrossIcon, CrossIcon, ShieldIcon } from '../icons/WesternIcons'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { useDailyStore } from '../../stores/dailyStore'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { DailyEntry, Goal } from '../../types'

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { entries, loadEntries, isLoading } = useDailyStore()
  const { isFirstTime } = useOnboardingStore()
  const [stats, setStats] = useState({
    currentStreak: 0,
    thisWeek: 0,
    thisMonth: 0,
    completionRate: 0
  })
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [currentGoals, setCurrentGoals] = useState<{
    daily: Goal[]
    weekly: Goal[]
    monthly: Goal[]
  }>({
    daily: [],
    weekly: [],
    monthly: []
  })

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🏠 Dashboard: Loading entries after authentication')
      loadEntries()
    }
  }, [isAuthenticated, loadEntries])

  // Listen for successful login to force refresh data
  useEffect(() => {
    const handleLoginSuccess = () => {
      console.log('🏠 Dashboard: Login success event received, refreshing data')
      if (isAuthenticated) {
        loadEntries()
      }
    }

    window.addEventListener('auth-login-success', handleLoginSuccess)
    return () => window.removeEventListener('auth-login-success', handleLoginSuccess)
  }, [isAuthenticated, loadEntries])

  useEffect(() => {
    console.log('🏠 Dashboard: Entries changed, recalculating stats', { 
      entriesLength: entries.length, 
      isLoading 
    })
    
    if (entries.length > 0) {
      console.log('🏠 Dashboard: Calculating stats with entries')
      calculateStats()
      extractCurrentGoals()
      setStatsLoaded(true)
    } else if (!isLoading && isAuthenticated) {
      // Only show zeros if we're not loading and we're authenticated
      console.log('🏠 Dashboard: No entries found, showing zero stats')
      setStats({
        currentStreak: 0,
        thisWeek: 0,
        thisMonth: 0,
        completionRate: 0
      })
      setStatsLoaded(true)
    }
  }, [entries, isLoading, isAuthenticated])

  const calculateStats = () => {
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()
    
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear
    }).length

    // Calculate current streak (improved logic)
    const currentStreak = calculateCurrentStreak(entries)
    
    // Calculate this week's progress
    const thisWeek = calculateThisWeekProgress(entries)

    // Calculate completion rate (percentage of days with entries vs total days since first entry)
    const completionRate = calculateCompletionRate(entries)

    setStats({
      currentStreak,
      thisWeek,
      thisMonth: monthEntries,
      completionRate
    })
  }

  const calculateCurrentStreak = (entries: DailyEntry[]) => {
    if (entries.length === 0) return 0
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    let streak = 0
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
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (daysDiff === 1) {
        // Entry is 1 day before current date - count it and continue
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (daysDiff > 1) {
        // Gap of more than 1 day - streak is broken
        break
      }
      // If daysDiff < 0, entry is in the future, skip it
    }
    
    return streak
  }

  const calculateThisWeekProgress = (entries: DailyEntry[]) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start
    startOfWeek.setDate(now.getDate() + daysToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
    endOfWeek.setHours(23, 59, 59, 999)
    
    console.log('Weekly calculation:', {
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
      totalEntries: entries.length,
      today: now.toISOString()
    })
    
    const weekEntries = entries.filter(entry => {
      // Parse the date string properly - handle both YYYY-MM-DD and other formats
      let entryDate: Date
      if (typeof entry.date === 'string') {
        // If it's a string like "2024-09-06", parse it correctly
        if (entry.date.includes('-')) {
          const [year, month, day] = entry.date.split('-').map(Number)
          entryDate = new Date(year, month - 1, day) // month is 0-indexed
        } else {
          entryDate = new Date(entry.date)
        }
      } else {
        entryDate = new Date(entry.date)
      }
      
      // Set time to start of day for accurate comparison
      entryDate.setHours(0, 0, 0, 0)
      
      const isInWeek = entryDate >= startOfWeek && entryDate <= endOfWeek
      
      console.log('Entry check:', {
        originalDate: entry.date,
        parsedDate: entryDate.toISOString(),
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
        isInWeek: isInWeek
      })
      
      return isInWeek
    })
    
    console.log('Week entries count:', weekEntries.length)
    return weekEntries.length
  }

  const calculateCompletionRate = (entries: DailyEntry[]) => {
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

  const extractCurrentGoals = () => {

    if (entries.length > 0) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Calculate time periods - Monday to Sunday week
      const startOfWeek = new Date(today)
      const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start
      startOfWeek.setDate(today.getDate() + daysToMonday)

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      console.log('Time periods:', {
        today: today.toISOString(),
        startOfWeek: startOfWeek.toISOString(),
        startOfMonth: startOfMonth.toISOString()
      })

      // Get today's entry for daily goals
      const todayEntry = entries.find(entry => {
        // Parse the date string properly - handle both YYYY-MM-DD and other formats
        let entryDate: Date
        if (typeof entry.date === 'string') {
          if (entry.date.includes('-')) {
            const [year, month, day] = entry.date.split('-').map(Number)
            entryDate = new Date(year, month - 1, day) // month is 0-indexed
          } else {
            entryDate = new Date(entry.date)
          }
        } else {
          entryDate = new Date(entry.date)
        }
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })

      // Collect ALL deleted goal IDs from ALL entries to properly filter goals
      const allDeletedGoalIds = new Set<string>()
      entries.forEach(entry => {
        if (entry.deletedGoalIds && Array.isArray(entry.deletedGoalIds)) {
          entry.deletedGoalIds.forEach(id => allDeletedGoalIds.add(id))
        }
      })
      
      console.log('Dashboard: All deleted goal IDs:', Array.from(allDeletedGoalIds))

      // Daily goals: from today's entry only, filtered by deleted goals
      const currentDailyGoals: Goal[] = (todayEntry?.goals?.daily || []).filter(goal => {
        const goalId = goal.id
        // Ensure we have a valid ID for filtering
        if (!goalId) {
          console.warn('Daily goal missing ID:', goal)
          return false
        }
        
        // Only use ID for filtering - check both string and number versions
        const isDeleted = allDeletedGoalIds.has(goalId) || 
                         allDeletedGoalIds.has(goalId?.toString())
        return !isDeleted
      })

      // Weekly and Monthly goals: collect from all entries in time period, filtered by deleted goals
      const weeklyGoalMap = new Map<string, Goal>()
      const monthlyGoalMap = new Map<string, Goal>()

      // Sort entries by date (most recent first) to prioritize latest completion status
      const sortedEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      })

      sortedEntries.forEach(entry => {
        if (entry.goals) {
          // Parse the date string properly
          let entryDate: Date
          if (typeof entry.date === 'string') {
            if (entry.date.includes('-')) {
              const [year, month, day] = entry.date.split('-').map(Number)
              entryDate = new Date(year, month - 1, day)
            } else {
              entryDate = new Date(entry.date)
            }
          } else {
            entryDate = new Date(entry.date)
          }
          entryDate.setHours(0, 0, 0, 0)

          const goals = entry.goals

          // Weekly goals: from entries this week, filtered by deleted goals
          if (entryDate >= startOfWeek && Array.isArray(goals.weekly)) {
            goals.weekly.forEach(goal => {
              const goalId = goal.id
              // Ensure we have a valid ID for deduplication
              if (!goalId) {
                console.warn('Weekly goal missing ID:', goal)
                return
              }
              
              // Only use ID for deduplication and filtering - check both string and number versions
              const isDeleted = allDeletedGoalIds.has(goalId) || 
                               allDeletedGoalIds.has(goalId?.toString())
              
              if (!isDeleted) {
                // Use the goal ID as the key, ensuring it's a string
                const key = goalId.toString()
                if (!weeklyGoalMap.has(key)) {
                  weeklyGoalMap.set(key, goal)
                }
              }
            })
          }

          // Monthly goals: from entries this month, filtered by deleted goals
          if (entryDate >= startOfMonth && Array.isArray(goals.monthly)) {
            goals.monthly.forEach(goal => {
              const goalId = goal.id
              // Ensure we have a valid ID for deduplication
              if (!goalId) {
                console.warn('Monthly goal missing ID:', goal)
                return
              }
              
              // Only use ID for deduplication and filtering - check both string and number versions
              const isDeleted = allDeletedGoalIds.has(goalId) || 
                               allDeletedGoalIds.has(goalId?.toString())
              
              if (!isDeleted) {
                // Use the goal ID as the key, ensuring it's a string
                const key = goalId.toString()
                if (!monthlyGoalMap.has(key)) {
                  monthlyGoalMap.set(key, goal)
                }
              }
            })
          }
        }
      })

      const currentWeeklyGoals: Goal[] = Array.from(weeklyGoalMap.values())
      const currentMonthlyGoals: Goal[] = Array.from(monthlyGoalMap.values())


      setCurrentGoals({
        daily: currentDailyGoals,
        weekly: currentWeeklyGoals,
        monthly: currentMonthlyGoals
      })
    } else {
      console.log('Dashboard: No entries found, setting empty goals')
      setCurrentGoals({
        daily: [],
        weekly: [],
        monthly: []
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20 relative z-10">
        <div className="mb-8">
          <Mountain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to The Daily David
        </h1>
        <p className="text-green-200 mb-8 max-w-2xl mx-auto text-lg">
          "I have fought the good fight, I have finished the race, I have kept the faith" - 2 Timothy 4:7
        </p>
        <Link 
          to="/login"
          onClick={() => {
            // Scroll to top when navigating to login
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }, 100)
          }}
        >
          <Button size="lg" className="bg-slate-700 hover:bg-slate-600 text-white">
            Get Started
          </Button>
        </Link>
      </div>
    )
  }

  // Show loading state while data is being fetched
  if (isLoading || (isAuthenticated && entries.length === 0 && !statsLoaded)) {
    return (
      <div className="space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {isFirstTime ? 'Welcome' : 'Welcome back'}, {user?.name}!
          </h1>
          <p className="text-xl text-slate-300">Loading your spiritual journey...</p>
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

  const statsData = [
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      change: stats.currentStreak > 0 ? `Keep it going!` : 'Start your streak',
      icon: Flame,
      color: 'text-slate-600',
      bgColor: 'bg-slate-200'
    },
    {
      title: 'This Week',
      value: `${stats.thisWeek}/7 days`,
      change: stats.thisWeek > 0 ? `${Math.round((stats.thisWeek / 7) * 100)}% complete` : '0% complete',
      icon: CompassCrossIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'This Month',
      value: stats.thisMonth.toString(),
      change: stats.thisMonth > 0 ? `+${Math.floor(Math.random() * 5) + 1}` : '0',
      icon: MountainCrossIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      change: stats.completionRate > 0 ? `${stats.completionRate >= 80 ? 'Excellent!' : stats.completionRate >= 60 ? 'Good progress' : 'Keep going'}` : 'Start your journey',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  const recentEntries = entries.slice(0, 3).map(entry => ({
    id: entry.id,
    date: new Date(entry.date),
    hasGoals: entry.goals && (entry.goals.daily.length > 0 || entry.goals.weekly.length > 0 || entry.goals.monthly.length > 0),
    hasSOAP: entry.soap && entry.soap.scripture && entry.soap.scripture.trim() !== '',
    completed: entry.completed
  }))

  return (
    <div className="space-y-8 relative z-10">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <CrossIcon className="w-8 h-8 text-slate-400 mr-3" />
          <h1 className="text-4xl font-bold text-white">
            {isFirstTime ? 'Welcome' : 'Welcome back'}, {user?.name}!
          </h1>
          <ShieldIcon className="w-8 h-8 text-slate-400 ml-3" />
        </div>
        <p className="text-xl text-green-200">
          "Be watchful, stand firm in the faith, act like men, be strong" - 1 Corinthians 16:13
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard-stats">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-200">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">
                      {!statsLoaded ? (
                        <span className="animate-pulse bg-slate-600 rounded w-12 h-8 inline-block"></span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-sm text-slate-400 font-medium">
                      {!statsLoaded ? (
                        <span className="animate-pulse bg-slate-600 rounded w-20 h-4 inline-block"></span>
                      ) : (
                        stat.change
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-slate-700/50">
                    <Icon className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        data-tour="dashboard-actions"
      >
        <Card className="p-8 bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Start Today's Entry
            </h3>
            <p className="text-green-200 mb-6">
              Begin your daily SOAP study and reflection
            </p>
            <Link 
              to="/daily" 
              onClick={() => {
                // Scroll to top when navigating to daily entry
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 100)
              }}
            >
              <Button size="lg" className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                Create Entry
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-8 bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <TreePine className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              View Progress
            </h3>
            <p className="text-green-200 mb-6">
              Track your spiritual growth and achievements
            </p>
            <Link to="/analytics">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-slate-600 text-green-200 hover:bg-slate-700"
              >
                View Analytics
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <div className="flex items-center mb-4">
            <Mountain className="w-5 h-5 text-slate-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto"></div>
              <p className="text-sm text-slate-300 mt-2">Loading recent activity...</p>
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry, index) => (
                <div key={entry.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${entry.completed ? 'bg-slate-400' : 'bg-slate-500'}`}></div>
                  <span className="text-sm text-green-200">
                    {entry.completed ? 'Completed' : 'Created'} entry for {entry.date.toLocaleDateString()}
                    {entry.hasGoals && ' with goals'}
                    {entry.hasSOAP && ' with SOAP study'}
                  </span>
                  <span className="text-xs text-slate-300 ml-auto">
                    {index === 0 ? 'Today' : index === 1 ? 'Yesterday' : `${index} days ago`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-300">No recent activity yet. Start your first entry!</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Goals Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Daily Goals */}
        <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Daily Goals</h3>
            </div>
            <span className="text-sm text-slate-300">
              {!statsLoaded ? (
                <span className="animate-pulse bg-slate-600 rounded w-16 h-4 inline-block"></span>
              ) : (
                `${currentGoals.daily.filter(g => g.completed).length}/${currentGoals.daily.length} completed`
              )}
            </span>
          </div>
          <div className="space-y-2">
            {!statsLoaded ? (
              // Loading skeleton for goals
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
                  <span className="animate-pulse bg-slate-600 rounded w-24 h-4"></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
                  <span className="animate-pulse bg-slate-600 rounded w-20 h-4"></span>
                </div>
              </>
            ) : (
              <>
                {currentGoals.daily.map((goal, index) => (
                  <div key={`daily-${goal.id}-${index}`} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${goal.completed ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    <span className={`text-sm ${goal.completed ? 'line-through text-slate-300 bg-slate-600/30 px-2 py-1 rounded' : 'text-slate-300'}`}>
                      {goal.text}
                    </span>
                  </div>
                ))}
                {currentGoals.daily.length === 0 && (
                  <div className="text-sm text-slate-400 italic">No daily goals set yet</div>
                )}
              </>
            )}
          </div>
          <Link 
            to="/daily#goals" 
            className="block mt-4 text-sm text-slate-400 hover:text-slate-300 font-medium"
            onClick={() => sessionStorage.setItem('scrollToGoals', 'daily')}
          >
            View all daily goals →
          </Link>
        </Card>

        {/* Weekly Goals */}
        <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Weekly Goals</h3>
            </div>
            <span className="text-sm text-slate-300">
              {currentGoals.weekly.filter(g => g.completed).length}/{currentGoals.weekly.length} completed
            </span>
          </div>
          <div className="space-y-2">
            {currentGoals.weekly.map((goal, index) => (
              <div key={`weekly-${goal.id}-${index}`} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${goal.completed ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                <span className={`text-sm ${goal.completed ? 'line-through text-slate-300 bg-slate-600/30 px-2 py-1 rounded' : 'text-slate-300'}`}>
                  {goal.text}
                </span>
              </div>
            ))}
            {currentGoals.weekly.length === 0 && (
              <div className="text-sm text-slate-400 italic">No weekly goals set yet</div>
            )}
          </div>
          <Link 
            to="/daily#goals" 
            className="block mt-4 text-sm text-slate-400 hover:text-slate-300 font-medium"
            onClick={() => sessionStorage.setItem('scrollToGoals', 'weekly')}
          >
            View all weekly goals →
          </Link>
        </Card>

        {/* Monthly Goals */}
        <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Monthly Goals</h3>
            </div>
            <span className="text-sm text-slate-300">
              {currentGoals.monthly.filter(g => g.completed).length}/{currentGoals.monthly.length} completed
            </span>
          </div>
          <div className="space-y-2">
            {currentGoals.monthly.map((goal, index) => (
              <div key={`monthly-${goal.id}-${index}`} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${goal.completed ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                <span className={`text-sm ${goal.completed ? 'line-through text-slate-300 bg-slate-600/30 px-2 py-1 rounded' : 'text-slate-300'}`}>
                  {goal.text}
                </span>
              </div>
            ))}
            {currentGoals.monthly.length === 0 && (
              <div className="text-sm text-slate-400 italic">No monthly goals set yet</div>
            )}
          </div>
          <Link 
            to="/daily#goals" 
            className="block mt-4 text-sm text-slate-400 hover:text-slate-300 font-medium"
            onClick={() => sessionStorage.setItem('scrollToGoals', 'monthly')}
          >
            View all monthly goals →
          </Link>
        </Card>
      </motion.div>
    </div>
  )
}