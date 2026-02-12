import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePrayerStore } from '../../stores/prayerStore'
import { useAuthStore } from '../../stores/authStore'
import { PrayerRequest, PrayerRequestStats } from '../../types'
import { 
  Sword, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Heart,
  Star
} from 'lucide-react'
import { Card } from '../ui/Card'

interface PrayerAnalyticsData {
  totalRequests: number
  activeRequests: number
  answeredRequests: number
  closedRequests: number
  answeredPercentage: number
  categoryBreakdown: Array<{ category: string, count: number, color: string }>
  priorityBreakdown: Array<{ priority: string, count: number, color: string }>
  monthlyTrends: Array<{ month: string, created: number, answered: number }>
  recentAnswered: PrayerRequest[]
}

function calculatePrayerAnalytics(requests: PrayerRequest[]): PrayerAnalyticsData {
  if (requests.length === 0) {
    return {
      totalRequests: 0,
      activeRequests: 0,
      answeredRequests: 0,
      closedRequests: 0,
      answeredPercentage: 0,
      categoryBreakdown: [],
      priorityBreakdown: [],
      monthlyTrends: [],
      recentAnswered: []
    }
  }

  // Basic counts
  const totalRequests = requests.length
  const activeRequests = requests.filter(r => r.status === 'active').length
  const answeredRequests = requests.filter(r => r.status === 'answered').length
  const closedRequests = requests.filter(r => r.status === 'closed').length
  const answeredPercentage = totalRequests > 0 ? Math.round((answeredRequests / totalRequests) * 100) : 0

  // Category breakdown
  const categoryCount: { [key: string]: number } = {}
  requests.forEach(request => {
    categoryCount[request.category] = (categoryCount[request.category] || 0) + 1
  })

  const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']
  const categoryBreakdown = Object.entries(categoryCount)
    .map(([category, count], index) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
      color: categoryColors[index % categoryColors.length]
    }))
    .sort((a, b) => b.count - a.count)

  // Priority breakdown
  const priorityCount: { [key: string]: number } = {}
  requests.forEach(request => {
    priorityCount[request.priority] = (priorityCount[request.priority] || 0) + 1
  })

  const priorityColors = {
    'urgent': 'bg-red-500',
    'high': 'bg-orange-500',
    'medium': 'bg-yellow-500',
    'low': 'bg-green-500'
  }

  const priorityBreakdown = Object.entries(priorityCount)
    .map(([priority, count]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count,
      color: priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-500'
    }))
    .sort((a, b) => {
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 }
      return priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] - 
             priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder]
    })

  // Monthly trends (last 6 months)
  const monthlyData: { [key: string]: { created: number, answered: number } } = {}
  const now = new Date()
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthlyData[monthKey] = { created: 0, answered: 0 }
  }

  requests.forEach(request => {
    const createdDate = new Date(request.createdAt)
    const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].created++
    }

    if (request.status === 'answered' && request.answeredAt) {
      const answeredDate = new Date(request.answeredAt)
      const answeredMonthKey = answeredDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (monthlyData[answeredMonthKey]) {
        monthlyData[answeredMonthKey].answered++
      }
    }
  })

  const monthlyTrends = Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

  // Recent answered prayers (last 5)
  const recentAnswered = requests
    .filter(r => r.status === 'answered' && r.answeredAt)
    .sort((a, b) => new Date(b.answeredAt!).getTime() - new Date(a.answeredAt!).getTime())
    .slice(0, 5)

  return {
    totalRequests,
    activeRequests,
    answeredRequests,
    closedRequests,
    answeredPercentage,
    categoryBreakdown,
    priorityBreakdown,
    monthlyTrends,
    recentAnswered
  }
}

export function PrayerAnalytics() {
  const { requests, loadRequests, isLoading } = usePrayerStore()
  const { isAuthenticated } = useAuthStore()
  const [analyticsData, setAnalyticsData] = useState<PrayerAnalyticsData | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadRequests()
    }
  }, [isAuthenticated, loadRequests])

  useEffect(() => {
    if (requests.length > 0) {
      const data = calculatePrayerAnalytics(requests)
      setAnalyticsData(data)
    } else if (!isLoading && isAuthenticated) {
      const data = calculatePrayerAnalytics([])
      setAnalyticsData(data)
    }
  }, [requests, isLoading, isAuthenticated])

  if (isLoading || !analyticsData) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-600 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-600 rounded w-full"></div>
            <div className="h-4 bg-slate-600 rounded w-3/4"></div>
            <div className="h-4 bg-slate-600 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Sword className="w-5 h-5 text-slate-400" />
        Prayer Request Analytics
      </h3>
      
      <div className="space-y-6">
        {/* Prayer Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {analyticsData.totalRequests}
            </div>
            <div className="text-xs text-slate-300">Total Requests</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {analyticsData.activeRequests}
            </div>
            <div className="text-xs text-slate-300">Active</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {analyticsData.answeredRequests}
            </div>
            <div className="text-xs text-slate-300">Answered</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {analyticsData.answeredPercentage}%
            </div>
            <div className="text-xs text-slate-300">Answer Rate</div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Prayer Request Trends (Last 6 Months)</h4>
          <div className="h-32 flex items-end space-x-2">
            {analyticsData.monthlyTrends.map((month) => {
              const maxCreated = Math.max(...analyticsData.monthlyTrends.map(m => m.created))
              const maxAnswered = Math.max(...analyticsData.monthlyTrends.map(m => m.answered))
              const maxValue = Math.max(maxCreated, maxAnswered)
              
              const createdHeight = maxValue > 0 ? (month.created / maxValue) * 100 : 0
              const answeredHeight = maxValue > 0 ? (month.answered / maxValue) * 100 : 0
              
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center space-y-1">
                  <div className="w-full bg-slate-700 rounded-t-lg relative h-24 flex flex-col justify-end">
                    {/* Answered prayers (green) */}
                    <div
                      className="w-full bg-gradient-to-t from-green-600 to-green-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${answeredHeight}%` }}
                    ></div>
                    {/* Created prayers (blue) */}
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-500 transition-all duration-500"
                      style={{ height: `${createdHeight}%` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-300">
                      {month.created + month.answered}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{month.month}</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Created</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
          </div>
        </div>

        {/* Category and Priority Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">By Category</h4>
            <div className="space-y-2">
              {analyticsData.categoryBreakdown.map((category) => (
                <div key={category.category} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <span className="flex-1 text-sm text-slate-200">{category.category}</span>
                  <span className="text-sm font-medium text-white">{category.count}</span>
                  <div className="w-16 bg-slate-600 rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${analyticsData.categoryBreakdown.length > 0 
                          ? (category.count / Math.max(...analyticsData.categoryBreakdown.map(c => c.count))) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">By Priority</h4>
            <div className="space-y-2">
              {analyticsData.priorityBreakdown.map((priority) => (
                <div key={priority.priority} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${priority.color}`}></div>
                  <span className="flex-1 text-sm text-slate-200">{priority.priority}</span>
                  <span className="text-sm font-medium text-white">{priority.count}</span>
                  <div className="w-16 bg-slate-600 rounded-full h-2">
                    <div
                      className={`${priority.color} h-2 rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${analyticsData.priorityBreakdown.length > 0 
                          ? (priority.count / Math.max(...analyticsData.priorityBreakdown.map(p => p.count))) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Answered Prayers */}
        {analyticsData.recentAnswered.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Recent Answered Prayers
            </h4>
            <div className="space-y-2">
              {analyticsData.recentAnswered.map((request) => (
                <div key={request.id} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-white">{request.title}</h5>
                      {request.praiseReport && (
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {request.praiseReport}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 ml-2">
                      {request.answeredAt && new Date(request.answeredAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Prayer Insights
          </h4>
          <div className="text-xs text-slate-300 space-y-1">
            {analyticsData.answeredPercentage > 50 && (
              <div>• Great prayer answer rate! God is faithful in your journey</div>
            )}
            {analyticsData.activeRequests > 10 && (
              <div>• You have many active prayers - consider prioritizing by urgency</div>
            )}
            {analyticsData.categoryBreakdown.length > 0 && (
              <div>• Most prayers are in {analyticsData.categoryBreakdown[0].category.toLowerCase()} - keep seeking God in all areas</div>
            )}
            {analyticsData.answeredPercentage < 30 && (
              <div>• Trust in God's timing - some prayers take time to be answered</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}



