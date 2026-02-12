import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { SermonNoteForm } from './SermonNoteForm'
import { SermonNotesList } from './SermonNotesList'
import { Button } from '../ui/Button'
import { Plus, List, X } from 'lucide-react'
import { SermonNote } from '../../types'

export const SermonNotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingNote, setEditingNote] = useState<SermonNote | null>(null)

  const handleNoteSaved = () => {
    // Switch to list view and refresh
    setActiveTab('list')
    setRefreshKey(prev => prev + 1)
    setEditingNote(null) // Clear editing note
    
    // Also call the global refresh function
    if ((window as any).refreshSermonNotes) {
      (window as any).refreshSermonNotes()
    }
  }

  const handleEditNote = (note: SermonNote) => {
    setEditingNote(note)
    setActiveTab('form')
  }

  return (
    <div className="space-y-8" data-tour="sermon-notes">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <X className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
          Sermon Notes
        </h1>
        <p className="text-green-200 text-base md:text-lg px-4">
          Record and review your spiritual insights and teachings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
               <button
                 onClick={(e) => {
                   e.preventDefault()
                   e.stopPropagation()
                   console.log('FORM BUTTON CLICKED!', activeTab)
                   setEditingNote(null) // Clear any editing note to ensure new note
                   setActiveTab('form')
                 }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'form' 
              ? 'bg-amber-500 text-white hover:bg-amber-600' 
              : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
          }`}
          style={{ pointerEvents: 'auto', zIndex: 10 }}
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('LIST BUTTON CLICKED!', activeTab)
            setActiveTab('list')
          }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'list' 
              ? 'bg-amber-500 text-white hover:bg-amber-600' 
              : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
          }`}
          style={{ pointerEvents: 'auto', zIndex: 10 }}
        >
          <List className="w-4 h-4" />
          View Notes
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'form' ? (
          <SermonNoteForm 
            key={editingNote ? `edit-${editingNote.id}` : 'new-note'}
            onSuccess={handleNoteSaved} 
            isNewNote={!editingNote}
            editingNoteId={editingNote?.id}
            initialData={editingNote ? {
              date: editingNote.date.split('T')[0], // Convert to YYYY-MM-DD format
              churchName: editingNote.churchName,
              sermonTitle: editingNote.sermonTitle,
              speakerName: editingNote.speakerName,
              biblePassage: editingNote.biblePassage,
              notes: editingNote.notes
            } : undefined}
          />
        ) : (
          <SermonNotesList key={refreshKey} onEditNote={handleEditNote} />
        )}
      </motion.div>
    </div>
  )
}