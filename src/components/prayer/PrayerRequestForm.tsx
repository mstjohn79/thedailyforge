import React, { useState, useEffect } from 'react'
import { usePrayerStore } from '../../stores/prayerStore'
import { PrayerRequest, PrayerCategoryType, PrayerStatusType, PrayerPriorityType } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { X, Save, AlertCircle } from 'lucide-react'

interface PrayerRequestFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<PrayerRequest>
  isEditing?: boolean
}

export const PrayerRequestForm: React.FC<PrayerRequestFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { createRequest, updateRequest, isLoading } = usePrayerStore()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as PrayerCategoryType,
    priority: 'medium' as PrayerPriorityType,
    status: 'active' as PrayerStatusType,
    targetDate: '',
    notes: ''
  })
  
  const [error, setError] = useState('')

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'personal',
        priority: initialData.priority || 'medium',
        status: initialData.status || 'active',
        targetDate: initialData.targetDate || '',
        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    try {
      if (isEditing && initialData?.id) {
        await updateRequest(initialData.id, formData)
      } else {
        await createRequest(formData)
      }
      
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prayer request')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          {isEditing ? 'Edit Prayer Request' : 'New Prayer Request'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 text-red-300 border border-red-700 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Title *
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter prayer request title"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Description *
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your prayer request"
            rows={4}
            required
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="personal">Personal</option>
              <option value="family">Family</option>
              <option value="health">Health</option>
              <option value="work">Work</option>
              <option value="ministry">Ministry</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="active">Active</option>
              <option value="answered">Answered</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Target Date (Optional)
          </label>
          <Input
            type="date"
            value={formData.targetDate}
            onChange={(e) => handleInputChange('targetDate', e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Notes (Optional)
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes or updates"
            rows={3}
            className="w-full"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : (isEditing ? 'Update Request' : 'Create Request')}
          </Button>
          
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="px-6 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
