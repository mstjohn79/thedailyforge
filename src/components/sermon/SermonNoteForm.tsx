import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { SermonNoteFormData, FetchedVerse } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { BibleVerseSelector } from './BibleVerseSelector'
import { Church, User, BookOpen, Calendar, FileText, Save } from 'lucide-react'
import { API_BASE_URL } from '../../config/api'

interface SermonNoteFormProps {
  onSuccess?: () => void
  initialData?: Partial<SermonNoteFormData & { date: string }>
  editingNoteId?: string
  isNewNote?: boolean
}

export const SermonNoteForm: React.FC<SermonNoteFormProps> = ({ 
  onSuccess, 
  initialData,
  editingNoteId,
  isNewNote = false
}) => {
  const { user, token } = useAuthStore()

  const [formData, setFormData] = useState<SermonNoteFormData & { date: string }>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    churchName: initialData?.churchName || '',
    sermonTitle: initialData?.sermonTitle || '',
    speakerName: initialData?.speakerName || '',
    biblePassage: initialData?.biblePassage || '',
    notes: initialData?.notes || ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(editingNoteId || null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<number | null>(null)
  // Load existing note for today on mount (only if not creating a new note)
  useEffect(() => {
    if (editingNoteId) {
      setCurrentNoteId(editingNoteId)
    } else if (!isNewNote) {
      loadExistingNote()
    } else {
      // For new notes, reset the form and clear current note ID
      setCurrentNoteId(null)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        churchName: '',
        sermonTitle: '',
        speakerName: '',
        biblePassage: '',
        notes: ''
      })
    }
  }, [token, editingNoteId, isNewNote])

  const loadExistingNote = async () => {
    if (!token) return
    
    try {
      console.log('Sermon Notes: Loading existing note for date:', formData.date)
      const response = await fetch(`${API_BASE_URL}/api/sermon-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Sermon Notes: Loaded notes data:', data)
        
        // Load the most recent note (the one you just saved)
        const noteToLoad = data.notes?.[0] // Most recent note
        
        if (noteToLoad) {
          console.log('Sermon Notes: Found note to load:', noteToLoad)
          setCurrentNoteId(noteToLoad.id)
          setFormData(prev => ({
            ...prev,
            date: noteToLoad.date.split('T')[0], // Convert to YYYY-MM-DD format
            churchName: noteToLoad.churchName || '',
            sermonTitle: noteToLoad.sermonTitle || '',
            speakerName: noteToLoad.speakerName || '',
            biblePassage: noteToLoad.biblePassage || '',
            notes: noteToLoad.notes || ''
          }))
        } else {
          console.log('Sermon Notes: No existing notes found')
          // Reset currentNoteId since we're creating a new note
          setCurrentNoteId(null)
        }
      } else {
        console.error('Sermon Notes: Failed to load notes, status:', response.status)
      }
    } catch (error) {
      console.error('Failed to load existing note:', error)
    }
  }

  const handleInputChange = (field: keyof SermonNoteFormData | 'date', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // If date changed, reload the note for that date
    if (field === 'date') {
      // Use setTimeout to ensure state is updated before loading
      setTimeout(() => {
        loadExistingNote()
      }, 100)
    }
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    // Set new timeout for auto-save with proper debouncing
    const timeout = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
    }, 1000) // Increased to 1 second to prevent multiple saves
    
    setAutoSaveTimeout(timeout)
  }

  // Auto-save function - using upsert logic
  const autoSaveToAPI = async (noteData: any) => {
    if (!user?.id || !token) {
      console.log('Sermon Notes: No user or token for auto-save')
      return
    }
    
    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.log('Sermon Notes: Already saving, skipping auto-save')
      return
    }
    
    try {
      console.log('Sermon Notes: Auto-saving to API:', noteData)
      console.log('Sermon Notes: Current note ID:', currentNoteId)
      
      // Use PUT if we have a current note ID, otherwise POST
      const method = currentNoteId ? 'PUT' : 'POST'
      const url = currentNoteId ? `${API_BASE_URL}/api/sermon-notes/${currentNoteId}` : `${API_BASE_URL}/api/sermon-notes`
      
      console.log('Sermon Notes: Using method:', method, 'URL:', url)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      })
      
      console.log('Sermon Notes: Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Sermon Notes: Response error:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Sermon Notes: Auto-save successful:', data)
      
      // Store the note ID for future updates
      if (data.note && data.note.id && !currentNoteId) {
        console.log('Sermon Notes: Setting current note ID to:', data.note.id)
        setCurrentNoteId(data.note.id)
      }
      
    } catch (error) {
      console.error('Sermon Notes: Auto-save error:', error)
    }
  }

  // Handle auto-save - following SOAP Section pattern exactly
  useEffect(() => {
    const handleAutoSave = async () => {
      // Save whenever there's any content, like SOAP section does
      console.log('Sermon Notes: Auto-save triggered, formData:', formData)
      if (formData.churchName || formData.sermonTitle || formData.speakerName || formData.biblePassage || formData.notes) {
        console.log('Sermon Notes: Content detected, proceeding with auto-save')
        if (!isSaving) {
          setIsSaving(true)
          try {
            await autoSaveToAPI(formData)
          } catch (error) {
            console.error('Sermon Notes: Auto-save error:', error)
          } finally {
            setIsSaving(false)
          }
        }
      } else {
        console.log('Sermon Notes: No content detected, skipping auto-save')
      }
    }

    window.addEventListener('triggerSermonNoteSave', handleAutoSave)
    return () => {
      window.removeEventListener('triggerSermonNoteSave', handleAutoSave)
    // Clear any pending auto-save timeout
    if (autoSaveTimeout) {
      window.clearTimeout(autoSaveTimeout)
    }
    }
  }, [formData, user, token, isSaving, autoSaveTimeout])

  // Handle input blur - following SOAP Section pattern exactly
  const handleInputBlur = (_field: keyof SermonNoteFormData | 'date') => {
    // Trigger auto-save using the same pattern as SOAP Section
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
    }, 100)
  }

  // Handle verses selected from BibleVerseSelector
  const handleVersesSelected = (verses: FetchedVerse[]) => {
    if (verses.length === 0) return
    
    // Create a formatted reference from the first and last verses
    const firstVerse = verses[0]
    const lastVerse = verses[verses.length - 1]
    
    let reference = firstVerse.reference
    if (verses.length > 1) {
      // Extract just the verse numbers for range
      const firstVerseNum = firstVerse.reference.split(':')[1]
      const lastVerseNum = lastVerse.reference.split(':')[1]
      reference = `${firstVerse.reference.split(':')[0]}:${firstVerseNum}-${lastVerseNum}`
    }
    
    // Update the biblePassage field with the formatted reference
    setFormData(prev => ({
      ...prev,
      biblePassage: reference
    }))
    
    // Store verse metadata for searchability
    setFormData(prev => ({
      ...prev,
      selectedVerses: verses
    }))
    
    console.log('Verses selected and stored:', verses)
    console.log('Bible passage updated to:', reference)
  }


  const handleSaveEntry = async () => {
    if (!user?.id || !token) return
    
    setIsSaving(true)
    try {
      // Final save
      await autoSaveToAPI(formData)
      
      // Reset form for new entry
      setFormData({
        date: new Date().toISOString().split('T')[0],
        churchName: '',
        sermonTitle: '',
        speakerName: '',
        biblePassage: '',
        notes: ''
      })
      setCurrentNoteId(null)
      
      // Trigger refresh of the list
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (error) {
      console.error('Failed to save sermon note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <FileText className="w-8 h-8 text-amber-400" />
          Sermon Notes
        </h3>
        <p className="text-green-200 text-lg">
          Take notes during church and reference them later
        </p>
        <div className="mt-2 text-sm text-green-300">
          "Let the word of Christ dwell in you richly" - Colossians 3:16
        </div>
      </div>

      <div className="space-y-6">
        {/* Date and Church */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Date
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              onBlur={() => handleInputBlur('date')}
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white flex items-center gap-2">
              <Church className="w-4 h-4 text-slate-400" />
              Church Name
            </label>
            <Input
              type="text"
              value={formData.churchName}
              onChange={(e) => handleInputChange('churchName', e.target.value)}
              onBlur={() => handleInputBlur('churchName')}
              placeholder="Enter church name..."
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>

        {/* Sermon Title and Speaker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Sermon Title
            </label>
            <Input
              type="text"
              value={formData.sermonTitle}
              onChange={(e) => handleInputChange('sermonTitle', e.target.value)}
              onBlur={() => handleInputBlur('sermonTitle')}
              placeholder="Enter sermon title..."
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Speaker Name
            </label>
            <Input
              type="text"
              value={formData.speakerName}
              onChange={(e) => handleInputChange('speakerName', e.target.value)}
              onBlur={() => handleInputBlur('speakerName')}
              placeholder="Enter speaker name..."
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>

        {/* Bible Verse Selector - Replaces Bible Passage input */}
        <BibleVerseSelector
          onVersesSelected={handleVersesSelected}
        />

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Notes
            {isSaving && (
              <span className="text-xs text-green-400 ml-2">Auto-saving...</span>
            )}
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            onBlur={() => handleInputBlur('notes')}
            placeholder="Take notes during the sermon..."
            className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-y min-h-[300px] max-h-[600px] overflow-y-auto leading-relaxed text-base md:text-lg"
            rows={12}
          />
        </div>

        {/* Save Entry Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSaveEntry}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Entry'}
          </Button>
        </div>
      </div>
    </div>
  )
}