import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { usePrayerStore } from '../../stores/prayerStore'
import { PrayerRequest } from '../../types'
import { 
  X, 
  Sword, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Edit3,
  Trash2,
  MessageSquare
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

interface PrayerRequestDetailProps {
  request: PrayerRequest
  onClose: () => void
  onUpdate: () => void
}

export const PrayerRequestDetail: React.FC<PrayerRequestDetailProps> = ({
  request,
  onClose,
  onUpdate
}) => {
  const { updateRequest, addPraiseReport, deleteRequest, isLoading } = usePrayerStore()
  const [showPraiseForm, setShowPraiseForm] = useState(false)
  const [praiseReport, setPraiseReport] = useState('')
  const [isSubmittingPraise, setIsSubmittingPraise] = useState(false)

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Active' }
      case 'answered':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/20', label: 'Answered' }
      case 'closed':
        return { icon: X, color: 'text-gray-400', bg: 'bg-gray-400/20', label: 'Closed' }
      default:
        return { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Active' }
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRequest(request.id, { status: newStatus as any })
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAddPraiseReport = async () => {
    if (!praiseReport.trim()) return

    try {
      setIsSubmittingPraise(true)
      await addPraiseReport(request.id, praiseReport)
      setPraiseReport('')
      setShowPraiseForm(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding praise report:', error)
    } finally {
      setIsSubmittingPraise(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this prayer request?')) {
      try {
        await deleteRequest(request.id)
        onClose()
      } catch (error) {
        console.error('Error deleting request:', error)
      }
    }
  }

  const statusInfo = getStatusInfo(request.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Sword className="w-6 h-6 text-slate-400" />
            <h2 className="text-xl font-bold text-white">Prayer Request Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold text-white">{request.title}</h3>
            <div className="flex gap-2">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span>{statusInfo.label}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(request.priority)}`}>
                <span className="capitalize">{request.priority}</span>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {request.personName && (
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-medium">For:</span>
                <span>{request.personName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="font-medium">Created:</span>
              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Tag className="w-5 h-5 text-slate-400" />
              <span className="font-medium">Category:</span>
              <span className="capitalize">{request.category}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-300 whitespace-pre-wrap">{request.description}</p>
            </div>
          </div>

          {/* Praise Report */}
          {request.praiseReport && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Praise Report
              </h4>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-200 whitespace-pre-wrap">{request.praiseReport}</p>
                {request.answeredAt && (
                  <p className="text-green-300 text-sm mt-2">
                    Answered on {new Date(request.answeredAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Praise Report Form */}
          {!request.praiseReport && request.status === 'active' && (
            <div>
              {!showPraiseForm ? (
                <Button
                  onClick={() => setShowPraiseForm(true)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Praise Report
                </Button>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Add Praise Report</h4>
                  <Textarea
                    value={praiseReport}
                    onChange={(e) => setPraiseReport(e.target.value)}
                    placeholder="Share how God answered this prayer..."
                    rows={4}
                    className="w-full"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddPraiseReport}
                      disabled={isSubmittingPraise || !praiseReport.trim()}
                    >
                      {isSubmittingPraise ? 'Adding...' : 'Add Praise Report'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPraiseForm(false)
                        setPraiseReport('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Actions */}
          {request.status === 'active' && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Status Actions</h4>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('answered')}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Answered
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('closed')}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close Request
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
