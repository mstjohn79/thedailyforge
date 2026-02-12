import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { usePrayerStore } from '../../stores/prayerStore'
import { useAuthStore } from '../../stores/authStore'
import { PrayerRequest, PrayerCategoryType, PrayerStatusType, PrayerPriorityType } from '../../types'
import { 
  Sword, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  Tag,
  Eye
} from 'lucide-react'
import { Button } from '../ui/Button'
import { PrayerRequestForm } from './PrayerRequestForm'
import { PrayerRequestDetail } from './PrayerRequestDetail'

export const PrayerRequestsList: React.FC = () => {
  const { requests, loadRequests, deleteRequest, isLoading, error } = usePrayerStore()
  const { isAuthenticated } = useAuthStore()
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategoryType | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<PrayerStatusType | 'all'>('all')
  const [selectedPriority, setSelectedPriority] = useState<PrayerPriorityType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingRequest, setEditingRequest] = useState<PrayerRequest | null>(null)
  const [viewingRequest, setViewingRequest] = useState<PrayerRequest | null>(null)

  // Load requests on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadRequests()
    }
  }, [isAuthenticated, loadRequests])

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    let filtered = requests

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term) ||
        (request.personName && request.personName.toLowerCase().includes(term))
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(request => request.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus)
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(request => request.priority === selectedPriority)
    }

    return filtered
  }, [requests, searchTerm, selectedCategory, selectedStatus, selectedPriority])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(requests.map(r => r.category))
    return Array.from(cats).sort()
  }, [requests])

  // Handle delete request
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prayer request?')) {
      await deleteRequest(id)
    }
  }

  // Get status icon and color
  const getStatusInfo = (status: PrayerStatusType) => {
    switch (status) {
      case 'active':
        return { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/20' }
      case 'answered':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/20' }
      case 'closed':
        return { icon: X, color: 'text-gray-400', bg: 'bg-gray-400/20' }
      default:
        return { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/20' }
    }
  }

  // Get priority color
  const getPriorityColor = (priority: PrayerPriorityType) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-400/20'
      case 'high':
        return 'text-orange-400 bg-orange-400/20'
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/20'
      case 'low':
        return 'text-green-400 bg-green-400/20'
      default:
        return 'text-yellow-400 bg-yellow-400/20'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading prayer requests...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sword className="w-10 h-10 text-slate-400" />
            Prayer Requests
          </h1>
          <p className="text-green-200 text-lg">
            Track and manage your prayer requests
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700 mb-8" data-tour="prayer-requests">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search prayer requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PrayerCategoryType | 'all')}
                className="w-full px-2 py-2 text-sm bg-slate-700/60 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PrayerStatusType | 'all')}
                className="w-full px-2 py-2 text-sm bg-slate-700/60 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="answered">Answered</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as PrayerPriorityType | 'all')}
                className="w-full px-2 py-2 text-sm bg-slate-700/60 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Add New Button */}
            <div className="flex items-center">
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 w-full"
              >
                <Plus className="w-4 h-4" />
                Add Request
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Prayer Requests List */}
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Sword className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No prayer requests found</h3>
              <p className="text-slate-500">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first prayer request'
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status)
              const StatusIcon = statusInfo.icon
              
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {request.title}
                      </h3>
                      <p className="text-slate-300 mb-3">
                        {request.description}
                      </p>
                      
                      {/* Meta Information */}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        {request.personName && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{request.personName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          <span className="capitalize">{request.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status and Priority Badges */}
                    <div className="flex flex-col gap-2 ml-4">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize">{request.status}</span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs text-center ${getPriorityColor(request.priority)}`}>
                        <span className="capitalize">{request.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRequest(request)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRequest(request)}
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(request.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Prayer Request Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PrayerRequestForm
                onSuccess={() => {
                  setShowForm(false)
                  loadRequests()
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        {/* Edit Prayer Request Modal */}
        {editingRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PrayerRequestForm
                initialData={editingRequest}
                isEditing={true}
                onSuccess={() => {
                  setEditingRequest(null)
                  loadRequests()
                }}
                onCancel={() => setEditingRequest(null)}
              />
            </div>
          </div>
        )}

        {/* View Prayer Request Modal */}
        {viewingRequest && (
          <PrayerRequestDetail
            request={viewingRequest}
            onClose={() => setViewingRequest(null)}
            onUpdate={() => loadRequests()}
          />
        )}
      </div>
    </div>
  )
}
