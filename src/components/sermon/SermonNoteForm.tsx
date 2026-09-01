import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { SermonNoteFormData, FetchedVerse } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { BibleVerseSelector } from './BibleVerseSelector'
import { Church, User, BookOpen, Calendar, FileText, Save, AlertTriangle } from 'lucide-react'
import { API_BASE_URL } from '../../config/api'

interface SermonNoteFormProps {
  onSuccess?: () => void
  initialData?: Partial<SermonNoteFormData & { date: string }>
  editingNoteId?: string
  isNewNote?: boolean
  /** Set when the user explicitly asked for a blank form, so a recovered draft
   *  is thrown away instead of restored. */
  discardDraft?: boolean
}

export const SermonNoteForm: React.FC<SermonNoteFormProps> = ({ 
  onSuccess, 
  initialData,
  editingNoteId,
  isNewNote = false,
  discardDraft = false
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
  const [saveError, setSaveError] = useState<string | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftNotice, setDraftNotice] = useState(false)

  // Guard against overlapping saves. This is a ref, not state: the previous
  // `isSaving` state was captured per-render, so a manual save fired during an
  // in-flight auto-save could read a stale value, silently no-op, and still
  // let the caller clear the form.
  const savingRef = useRef(false)

  // Local draft key so nothing typed is ever lost to a failed save, an expired
  // session, or a closed tab.
  const draftKey = user?.id ? `sermonNoteDraft_${user.id}` : null

  // True only while the draft slot holds text written by THIS form. Removal is
  // gated on it so one note's form can never delete another note's draft.
  const draftOwnedRef = useRef(false)

  // Serialized form state as of the last confirmed write. The draft exists to
  // hold text the server does not have, so anything matching this is not
  // mirrored — that is what stopped an already-saved note from being restored
  // over a blank new note.
  const savedSnapshotRef = useRef<string | null>(null)

  const clearDraft = () => {
    if (!draftKey) return
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.error('Sermon Notes: Failed to clear draft', error)
    }
    draftOwnedRef.current = false
  }

  const hasContent = (data: typeof formData) =>
    Boolean(
      data.churchName || data.sermonTitle || data.speakerName ||
      data.biblePassage || data.notes
    )
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

  // Restore an unsaved local draft. The draft represents an in-progress writing
  // session, so restoring it also re-adopts the note it belonged to — otherwise
  // text typed after the first auto-save (when the note already has an id) could
  // never be recovered, because the form always opens as a new note.
  useEffect(() => {
    if (!draftKey || draftRestored) return
    setDraftRestored(true)
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw)
      const draftNoteId: string | null = draft?.noteId ?? null
      const draftData = draft?.data
      if (!draftData || !hasContent(draftData)) return
      // Opened against a specific note: only that note's draft may load here.
      // Opened blank: adopt whatever session was left unfinished.
      if (editingNoteId && draftNoteId !== editingNoteId) return
      if (discardDraft) {
        // "New Note" means start over. Dropping the slot here is the escape
        // hatch that was missing — otherwise the draft simply came back.
        clearDraft()
        return
      }
      setFormData(prev => (hasContent(prev) ? prev : { ...prev, ...draftData }))
      // Continue updating the same note rather than creating a duplicate.
      if (draftNoteId) {
        setCurrentNoteId(draftNoteId)
      }
      draftOwnedRef.current = true
      setDraftNotice(true)
    } catch (error) {
      console.error('Sermon Notes: Failed to restore draft', error)
    }
  }, [draftKey, draftRestored, editingNoteId, discardDraft])

  // Mirror in-progress typing to localStorage so a failed save, an expired
  // session, or a closed tab can't take the notes with it. Text the server has
  // already accepted is not a draft, so it is dropped instead of mirrored —
  // otherwise a saved note kept being restored on top of the next new one.
  useEffect(() => {
    if (!draftKey || !draftRestored) return
    try {
      const serialized = JSON.stringify(formData)
      if (hasContent(formData) && serialized !== savedSnapshotRef.current) {
        localStorage.setItem(draftKey, JSON.stringify({ noteId: currentNoteId, data: formData }))
        draftOwnedRef.current = true
      } else if (draftOwnedRef.current) {
        // Emptying the form drops our draft too. Leaving it behind is what made
        // stale text impossible to clear by hand.
        clearDraft()
      }
    } catch (error) {
      console.error('Sermon Notes: Failed to persist draft', error)
    }
  }, [draftKey, draftRestored, formData, currentNoteId])

  const loadExistingNote = async (forDate: string = formData.date) => {
    if (!token) return
    
    try {
      console.log('Sermon Notes: Loading existing note for date:', forDate)
      const response = await fetch(`${API_BASE_URL}/api/sermon-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Sermon Notes: Loaded notes data:', data)
        
        // Match the requested date. This used to take notes[0] — the newest note
        // for any date — which silently pulled unrelated text into the form and
        // pointed subsequent saves at that note's id.
        const noteToLoad = data.notes?.find(
          (note: { date: string }) => note.date?.split('T')[0] === forDate
        )
        
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
    
    // Changing the date deliberately does NOT swap in another note. It used to
    // fetch one and overwrite everything typed so far, which is the other half
    // of the "last note comes back" report.
    
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

  // Auto-save function - using upsert logic.
  // `required` marks the caller as one that will clear the form on return, so a
  // skipped write has to surface as an error rather than as a silent no-op.
  const autoSaveToAPI = async (noteData: any, { required = false } = {}) => {
    if (!user?.id || !token) {
      console.log('Sermon Notes: No user or token for auto-save')
      if (required) {
        throw new Error(
          'You are not signed in, so this note was not saved. Your text is kept ' +
          'here — sign in again, then press Save Entry.'
        )
      }
      return
    }
    
    // Prevent multiple simultaneous saves
    if (savingRef.current) {
      console.log('Sermon Notes: Already saving, skipping auto-save')
      if (required) {
        throw new Error(
          'An auto-save is still finishing, so nothing was written yet. Your ' +
          'text is still here — press Save Entry again in a moment.'
        )
      }
      return
    }

    savingRef.current = true
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

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Your session expired, so this note was not saved. Your text is kept ' +
            'here — sign in again in another tab, then press Save Entry.'
          )
        }

        throw new Error(
          `Save failed (server returned ${response.status}). Your text is still ` +
          `here — press Save Entry to try again.`
        )
      }

      const data = await response.json()
      console.log('Sermon Notes: Auto-save successful:', data)

      // Store the note ID for future updates
      if (data.note && data.note.id && !currentNoteId) {
        console.log('Sermon Notes: Setting current note ID to:', data.note.id)
        setCurrentNoteId(data.note.id)
      }

      // This text is on the server now, so it is no longer an unsaved draft.
      savedSnapshotRef.current = JSON.stringify(noteData)
      clearDraft()

      setSaveError(null)
      setDraftNotice(false)
    } finally {
      savingRef.current = false
    }
  }

  // Handle auto-save - following SOAP Section pattern exactly
  useEffect(() => {
    const handleAutoSave = async () => {
      // Save whenever there's any content, like SOAP section does
      console.log('Sermon Notes: Auto-save triggered, formData:', formData)
      if (formData.churchName || formData.sermonTitle || formData.speakerName || formData.biblePassage || formData.notes) {
        console.log('Sermon Notes: Content detected, proceeding with auto-save')
        if (!savingRef.current) {
          setIsSaving(true)
          try {
            await autoSaveToAPI(formData)
          } catch (error) {
            // Surface it. A silent auto-save failure is what let notes look
            // saved when they weren't.
            console.error('Sermon Notes: Auto-save error:', error)
            setSaveError(
              error instanceof Error ? error.message : 'Auto-save failed'
            )
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

    // An empty form must never be written. It used to create a blank note and
    // then clear the draft slot as if that were a successful save, destroying
    // recovered text that had not made it back onto the form.
    if (!hasContent(formData)) {
      setSaveError('There is nothing to save yet — add your notes first.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      // Final save. This throws if the write did not land — including when it
      // was skipped rather than attempted — which is what keeps the reset below
      // from running on anything but a confirmed write.
      await autoSaveToAPI(formData, { required: true })

      // Only now is the note definitely persisted, so it is safe to clear the
      // form and drop the local draft.
      clearDraft()
      setDraftNotice(false)
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
      // Keep every field exactly as typed and tell the user what happened.
      console.error('Failed to save sermon note:', error)
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Save failed. Your text is still here — press Save Entry to try again.'
      )
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

        {/* Restored-draft notice, so recovered text is never mistaken for the
            form having cached the previous note */}
        {draftNotice && !saveError && (
          <div className="flex items-start gap-3 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-200">
              <p className="font-semibold mb-0.5">Unsaved draft restored</p>
              <p className="text-slate-300/90">
                This text never reached the server on your last visit. Press Save
                Entry to keep it, or use New Note to start over.
              </p>
            </div>
          </div>
        )}

        {/* Save failure notice — nothing is discarded when this is showing */}
        {saveError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 px-4 py-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100">
              <p className="font-semibold mb-0.5">Not saved yet</p>
              <p className="text-amber-200/90">{saveError}</p>
            </div>
          </div>
        )}

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