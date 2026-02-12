import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bibleService } from '../../lib/bibleService'
import { BibleBook, FetchedVerse } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { BookOpen, Search, Copy, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react'

interface BibleVerseSelectorProps {
  onVersesSelected: (verses: FetchedVerse[]) => void
}

export const BibleVerseSelector: React.FC<BibleVerseSelectorProps> = ({
  onVersesSelected
}) => {
  const [books, setBooks] = useState<BibleBook[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState<string>('GEN')
  const [selectedVersion, setSelectedVersion] = useState<string>('de4e12af7f28f599-02') // ESV
  const [selectedChapter, setSelectedChapter] = useState<number | ''>('')
  const [selectedVerseStart, setSelectedVerseStart] = useState<number | ''>('')
  const [selectedVerseEnd, setSelectedVerseEnd] = useState<number | ''>('')
  const [availableChapters, setAvailableChapters] = useState<{ chapter: number; verseCount: number }[]>([])
  const [availableVerses, setAvailableVerses] = useState<{ verse: number }[]>([])
  const [fetchedVerses, setFetchedVerses] = useState<FetchedVerse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchParams, setLastFetchParams] = useState<{
    book: string
    chapter: number
    verseStart: number
    verseEnd: number
    version: string
  } | null>(null)

  // Load books and versions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [booksData, versionsData] = await Promise.all([
          bibleService.getBibleBooks(),
          bibleService.getBibleVersions()
        ])
        setBooks(booksData)
        setVersions(versionsData)
        
        // Restore persisted verses from localStorage
        const savedVerses = localStorage.getItem('sermon-notes-fetched-verses')
        const savedParams = localStorage.getItem('sermon-notes-fetch-params')
        
        if (savedVerses && savedParams) {
          try {
            const verses = JSON.parse(savedVerses)
            const params = JSON.parse(savedParams)
            setFetchedVerses(verses)
            setLastFetchParams(params)
            setIsExpanded(true)
            console.log('Restored verses from localStorage:', verses)
          } catch (error) {
            console.error('Error parsing saved verses:', error)
            // Clear invalid data
            localStorage.removeItem('sermon-notes-fetched-verses')
            localStorage.removeItem('sermon-notes-fetch-params')
          }
        }
      } catch (error) {
        console.error('Error loading Bible data:', error)
        setError('Failed to load Bible books')
      }
    }
    loadData()
  }, [])

  // Load chapters when book changes
  useEffect(() => {
    if (selectedBook && books.length > 0) {
      const loadChapters = async () => {
        try {
          const chapters = await bibleService.getBookChapters(selectedBook, selectedVersion)
          setAvailableChapters(chapters)
          setSelectedChapter('')
          setSelectedVerseStart('')
          setSelectedVerseEnd('')
          setAvailableVerses([])
        } catch (error) {
          console.error('Error loading chapters:', error)
        }
      }
      loadChapters()
    }
  }, [selectedBook, selectedVersion, books])

  // Load verses when chapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter && availableChapters.length > 0) {
      const loadVerses = async () => {
        try {
          const verses = await bibleService.getChapterVerses(selectedBook, selectedChapter, selectedVersion)
          setAvailableVerses(verses)
          setSelectedVerseStart('')
          setSelectedVerseEnd('')
        } catch (error) {
          console.error('Error loading verses:', error)
        }
      }
      loadVerses()
    }
  }, [selectedBook, selectedChapter, selectedVersion, availableChapters])

  const handleFetchVerses = async () => {
    if (!selectedBook || selectedChapter === '' || selectedVerseStart === '' || selectedVerseEnd === '') {
      setError('Please fill in all fields')
      return
    }

    const startVerse = Number(selectedVerseStart)
    const endVerse = Number(selectedVerseEnd)
    const chapterNum = Number(selectedChapter)

    if (startVerse > endVerse) {
      setError('Start verse must be less than or equal to end verse')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const verses = await bibleService.getVerseRange(
        selectedVersion,
        selectedBook,
        chapterNum,
        startVerse,
        endVerse
      )

      if (verses.length === 0) {
        setError('No verses found for the selected range')
        return
      }

      // Save to localStorage for persistence
      const fetchParams = {
        book: selectedBook,
        chapter: chapterNum,
        verseStart: startVerse,
        verseEnd: endVerse,
        version: selectedVersion
      }
      
      localStorage.setItem('sermon-notes-fetched-verses', JSON.stringify(verses))
      localStorage.setItem('sermon-notes-fetch-params', JSON.stringify(fetchParams))
      
      setFetchedVerses(verses)
      setLastFetchParams(fetchParams)
      onVersesSelected(verses)
      setIsExpanded(true)
      
      console.log('Saved verses to localStorage:', verses)
    } catch (error) {
      console.error('Error fetching verses:', error)
      setError('Failed to fetch verses. Please check your selection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyVerses = async () => {
    if (fetchedVerses.length === 0) return

    const text = fetchedVerses.map(v => `${v.reference}: ${v.content}`).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy verses:', error)
    }
  }


  const handleClearVerses = () => {
    setFetchedVerses([])
    setLastFetchParams(null)
    setIsExpanded(false)
    localStorage.removeItem('sermon-notes-fetched-verses')
    localStorage.removeItem('sermon-notes-fetch-params')
    console.log('Cleared verses from localStorage')
  }

  const handleClearSelection = () => {
    setSelectedBook('GEN')
    setSelectedChapter('')
    setSelectedVerseStart('')
    setSelectedVerseEnd('')
    setAvailableChapters([])
    setAvailableVerses([])
    setError(null)
    console.log('Cleared verse selection')
  }

  // Get books in canonical Bible order
  const getBibleBooksInOrder = () => {
    const canonicalOrder = [
      // Old Testament (39 books)
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
      // New Testament (27 books)
      'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
    ]
    
    return canonicalOrder
      .map(bookId => books.find(book => book.id === bookId))
      .filter(book => book !== undefined)
  }

  const selectedBookData = books.find(b => b.id === selectedBook)
  const maxChapter = selectedBookData?.chapters || 1

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Select Bible Verses
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Bible Version */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Bible Version</label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 cursor-pointer"
          >
            {versions.map(version => (
              <option key={version.id} value={version.id}>
                {version.name} ({version.abbreviation})
              </option>
            ))}
          </select>
        </div>

        {/* Book, Chapter, and Verse Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Book Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Book</label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 cursor-pointer"
            >
              <optgroup label="Old Testament">
                {getBibleBooksInOrder()
                  .filter(book => book.testament === 'old')
                  .map(book => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="New Testament">
                {getBibleBooksInOrder()
                  .filter(book => book.testament === 'new')
                  .map(book => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Chapter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Chapter</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 cursor-pointer"
            >
              <option value="">Select Chapter</option>
              {availableChapters.map((ch) => (
                <option key={ch.chapter} value={ch.chapter}>
                  Chapter {ch.chapter} ({ch.verseCount} verses)
                </option>
              ))}
            </select>
          </div>

          {/* Start Verse */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Start Verse</label>
            <select
              value={selectedVerseStart}
              onChange={(e) => setSelectedVerseStart(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 cursor-pointer"
            >
              <option value="">Select Start Verse</option>
              {availableVerses.map((verse) => (
                <option key={verse.verse} value={verse.verse}>
                  Verse {verse.verse}
                </option>
              ))}
            </select>
          </div>

          {/* End Verse */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">End Verse</label>
            <select
              value={selectedVerseEnd}
              onChange={(e) => setSelectedVerseEnd(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 cursor-pointer"
            >
              <option value="">Select End Verse</option>
              {availableVerses
                .filter(verse => !selectedVerseStart || verse.verse >= selectedVerseStart)
                .map((verse) => (
                  <option key={verse.verse} value={verse.verse}>
                    Verse {verse.verse}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Fetch and Clear Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleFetchVerses}
            disabled={isLoading || !selectedBook || selectedChapter === '' || selectedVerseStart === '' || selectedVerseEnd === ''}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Fetch Verses
              </>
            )}
          </Button>
          
          <Button
            onClick={handleClearSelection}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Clear Selection
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      {/* Fetched Verses Display */}
      <AnimatePresence>
        {isExpanded && fetchedVerses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-4"
          >
            <div className="bg-slate-900/50 border-2 border-amber-500/30 rounded-xl backdrop-blur-sm p-4 md:p-6">
              {/* Verse Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h5 className="text-amber-400 font-semibold text-sm md:text-base">
                    {fetchedVerses[0]?.reference}
                    {fetchedVerses.length > 1 && ` - ${fetchedVerses[fetchedVerses.length - 1]?.reference.split(':')[1]}`}
                  </h5>
                  {lastFetchParams && (
                    <p className="text-xs text-slate-400 mt-1">
                      Last fetched: {books.find(b => b.id === lastFetchParams.book)?.name} {lastFetchParams.chapter}:{lastFetchParams.verseStart}-{lastFetchParams.verseEnd}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={handleCopyVerses}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                  <button
                    onClick={handleClearVerses}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-all duration-200 flex items-center gap-1"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Verse Content */}
              <div className="space-y-3">
                {fetchedVerses.map((verse) => (
                  <div key={verse.verseId} className="text-white leading-relaxed text-base md:text-lg">
                    <span className="text-amber-400 font-semibold text-sm">
                      {verse.reference.split(':')[1]} 
                    </span>
                    <span className="ml-2">{verse.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
