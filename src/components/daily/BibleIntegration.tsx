// Bible Integration Component for SOAP Study
// This demonstrates how we can integrate scripture selection with SOAP study

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { bibleService, BibleVersion, BibleVerse } from '../../lib/bibleService';
import { BookOpen, Target, Calendar, Play, ChevronRight, Users, User } from 'lucide-react';
import { dbManager } from '../../lib/database';
import { getDayOfYear, formatReadingDisplay, McheyneDay } from '../../data/mcheyneReadingPlan';


interface BibleIntegrationProps {
  onVerseSelect: (verse: BibleVerse) => void;
  selectedVerse?: BibleVerse;
  onStartReadingPlan?: (plan: any, bibleId?: string) => void;
  currentReadingPlan?: {
    planId: string
    planName: string
    currentDay: number
    totalDays: number
    startDate: string
    completedDays: number[]
  };
}

export const BibleIntegration: React.FC<BibleIntegrationProps> = ({ 
  onVerseSelect, 
  // These props are kept for API compatibility but not used in M'Cheyne mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedVerse: _selectedVerse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStartReadingPlan: _onStartReadingPlan,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentReadingPlan: _currentReadingPlan
}) => {

  // Tab toggle state
  const [activeMode, setActiveMode] = useState<'verse' | 'plan'>('plan');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Verse selector state
  const [bibleVersions, setBibleVersions] = useState<BibleVersion[]>([]);
  const [selectedBible, setSelectedBible] = useState<string>('esv');
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState('GEN');
  const [selectedChapter, setSelectedChapter] = useState<number | ''>('');
  const [selectedVerseStart, setSelectedVerseStart] = useState<number | ''>('');
  const [selectedVerseEnd, setSelectedVerseEnd] = useState<number | ''>('');
  const [availableChapters, setAvailableChapters] = useState<{ chapter: number; verseCount: number }[]>([]);
  const [availableVerses, setAvailableVerses] = useState<{ verse: number }[]>([]);
  const [fetchedVerses, setFetchedVerses] = useState<BibleVerse[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  // M'Cheyne plan state
  const [mcheyneStartMode, setMcheyneStartMode] = useState<'day1' | 'calendar' | null>(null);
  const [mcheyneCurrentDay, setMcheyneCurrentDay] = useState(1);
  const [mcheyneReadings, setMcheyneReadings] = useState<McheyneDay | null>(null);
  const [selectedReading, setSelectedReading] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<BibleVerse[]>([]);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // Database manager instance (singleton)

  useEffect(() => {
    loadBibleVersions();
    loadUserSettings();
    loadBibleBooks();
  }, []);

  // Load chapters when book changes
  useEffect(() => {
    if (selectedBook && books.length > 0) {
      const loadChapters = async () => {
        try {
          const chapters = await bibleService.getBookChapters(selectedBook, selectedBible);
          setAvailableChapters(chapters);
          setSelectedChapter('');
          setSelectedVerseStart('');
          setSelectedVerseEnd('');
          setAvailableVerses([]);
        } catch (error) {
          console.error('Error loading chapters:', error);
        }
      };
      loadChapters();
    }
  }, [selectedBook, selectedBible, books]);

  // Load verses when chapter changes
  useEffect(() => {
    if (selectedBook && selectedChapter && availableChapters.length > 0) {
      const loadVerses = async () => {
        try {
          const verses = await bibleService.getChapterVerses(selectedBook, selectedChapter, selectedBible);
          setAvailableVerses(verses);
          setSelectedVerseStart('');
          setSelectedVerseEnd('');
        } catch (error) {
          console.error('Error loading verses:', error);
        }
      };
      loadVerses();
    }
  }, [selectedBook, selectedChapter, selectedBible, availableChapters]);

  // Load user's preferred mode from database
  const loadUserSettings = async () => {
    try {
      const response = await dbManager.getUserSettings();
      if (response.success && response.settings.soapScriptureMode) {
        setActiveMode(response.settings.soapScriptureMode);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Save mode preference to database
  const handleModeChange = async (mode: 'verse' | 'plan') => {
    setActiveMode(mode);
    try {
      await dbManager.updateUserSettings({ soapScriptureMode: mode });
    } catch (error) {
      console.error('Failed to save mode preference:', error);
    }
  };

  const loadBibleVersions = async () => {
    const versions = await bibleService.getBibleVersions();
    setBibleVersions(versions);
  };

  const loadBibleBooks = async () => {
    try {
      const booksData = await bibleService.getBibleBooks();
      setBooks(booksData);
    } catch (error) {
      console.error('Error loading Bible books:', error);
    }
  };

  // Verse selector functions
  const handleFetchVerses = async () => {
    if (!selectedBook || !selectedChapter || !selectedVerseStart) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoadingVerses(true);
    try {
      const verses = await bibleService.getVerseRange(
        selectedBible,
        selectedBook,
        Number(selectedChapter),
        Number(selectedVerseStart),
        Number(selectedVerseEnd || selectedVerseStart)
      );
      // Map to BibleVerse format
      setFetchedVerses(verses.map(v => ({
        id: v.verseId || '',
        reference: v.reference,
        content: v.content,
        copyright: 'Bible',
        verseId: v.verseId
      })));
    } catch (error) {
      console.error('Error fetching verses:', error);
      alert('Failed to fetch verses. Please try again.');
    } finally {
      setIsLoadingVerses(false);
    }
  };

  const handleInsertVerse = (verses: BibleVerse[]) => {
    const firstVerse = verses[0];
    const lastVerse = verses[verses.length - 1];
    
    // Create proper reference for verse range
    let reference = firstVerse.reference;
    if (verses.length > 1) {
      // Extract verse numbers from references
      const firstVerseNum = firstVerse.reference.split(':')[1];
      const lastVerseNum = lastVerse.reference.split(':')[1];
      const bookChapter = firstVerse.reference.split(':')[0];
      reference = `${bookChapter}:${firstVerseNum}-${lastVerseNum}`;
    }
    
    const content = verses.map(v => `${v.reference.split(':')[1]} ${v.content}`).join('\n\n');
    onVerseSelect({
      id: 'selected',
      reference: reference,
      content: content,
      copyright: 'Bible'
    });
  };

  const handleClearVerseSelection = () => {
    // Clear the fetched verses
    setFetchedVerses([]);
    // Reset all form fields to default state
    setSelectedBook('GEN');
    setSelectedChapter('');
    setSelectedVerseStart('');
    setSelectedVerseEnd('');
    setAvailableChapters([]);
    setAvailableVerses([]);
    // Clear the selected verse in parent component
    onVerseSelect({
      id: '',
      reference: '',
      content: '',
      copyright: ''
    });
  };

  // Verse Selector Component
  const VerseSelector = () => (
    <div className="space-y-4">
      {/* Bible Version Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Bible Version
        </label>
        <select
          value={selectedBible}
          onChange={(e) => setSelectedBible(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
        >
          {bibleVersions.map(version => (
            <option key={version.id} value={version.id}>
              {version.name}
            </option>
          ))}
        </select>
      </div>

      {/* Book/Chapter/Verse Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Book</label>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
          >
            {books.map(book => (
              <option key={book.id} value={book.id}>{book.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Chapter</label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(parseInt(e.target.value) || '')}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
            disabled={!availableChapters.length}
          >
            <option value="">Select Chapter</option>
            {availableChapters.map(chapter => (
              <option key={chapter.chapter} value={chapter.chapter}>
                Chapter {chapter.chapter} ({chapter.verseCount} verses)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Verse Start</label>
          <select
            value={selectedVerseStart}
            onChange={(e) => setSelectedVerseStart(parseInt(e.target.value) || '')}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
            disabled={!availableVerses.length}
          >
            <option value="">Select Start</option>
            {availableVerses.map(verse => (
              <option key={verse.verse} value={verse.verse}>Verse {verse.verse}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Verse End</label>
          <select
            value={selectedVerseEnd}
            onChange={(e) => setSelectedVerseEnd(parseInt(e.target.value) || '')}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
            disabled={!availableVerses.length}
          >
            <option value="">Select End</option>
            {availableVerses.map(verse => (
              <option key={verse.verse} value={verse.verse}>Verse {verse.verse}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fetch Button */}
      <Button 
        onClick={handleFetchVerses} 
        disabled={isLoadingVerses || !selectedBook || !selectedChapter || !selectedVerseStart}
        className="w-full"
      >
        {isLoadingVerses ? 'Loading...' : 'Fetch Verses'}
      </Button>

      {/* Display Fetched Verses */}
      {fetchedVerses.length > 0 && (
        <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white">
              {(() => {
                const firstVerse = fetchedVerses[0];
                const lastVerse = fetchedVerses[fetchedVerses.length - 1];
                
                if (fetchedVerses.length === 1) {
                  return firstVerse.reference;
                } else {
                  // Create verse range reference
                  const firstVerseNum = firstVerse.reference.split(':')[1];
                  const lastVerseNum = lastVerse.reference.split(':')[1];
                  const bookChapter = firstVerse.reference.split(':')[0];
                  return `${bookChapter}:${firstVerseNum}-${lastVerseNum}`;
                }
              })()}
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearVerseSelection}
              className="text-slate-400 border-slate-500 hover:bg-slate-600 hover:text-white"
            >
              Clear
            </Button>
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
          <Button 
            onClick={() => handleInsertVerse(fetchedVerses)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Insert into Scripture
          </Button>
        </div>
      )}
    </div>
  );

  // Reading Plan Selector Component - M'Cheyne One-Year Bible Reading Plan
  const ReadingPlanSelector = () => {
    // Function to load chapter content
    const loadChapterContent = async (reading: string) => {
      setLoadingChapter(true);
      setSelectedReading(reading);
      try {
        // Parse reading like "GEN.1" to get book and chapter
        const [bookId, chapterStr] = reading.split('.');
        const chapter = parseInt(chapterStr);
        
        // Get all verses for this chapter
        const verses = await bibleService.getChapterContent(selectedBible, bookId, chapter);
        setChapterContent(verses);
      } catch (error) {
        console.error('Error loading chapter:', error);
        setChapterContent([]);
      } finally {
        setLoadingChapter(false);
      }
    };

    // Handle start mode selection
    const handleStartMode = (mode: 'day1' | 'calendar') => {
      setMcheyneStartMode(mode);
      let day = 1;
      if (mode === 'calendar') {
        day = getDayOfYear();
      }
      setMcheyneCurrentDay(day);
      const readings = bibleService.getMcheyneReadings(day);
      setMcheyneReadings(readings);
    };

    // Navigate days
    const navigateDay = (direction: 'prev' | 'next') => {
      let newDay = mcheyneCurrentDay;
      if (direction === 'prev' && mcheyneCurrentDay > 1) {
        newDay = mcheyneCurrentDay - 1;
      } else if (direction === 'next' && mcheyneCurrentDay < 365) {
        newDay = mcheyneCurrentDay + 1;
      }
      setMcheyneCurrentDay(newDay);
      const readings = bibleService.getMcheyneReadings(newDay);
      setMcheyneReadings(readings);
      setSelectedReading(null);
      setChapterContent([]);
    };

    // Insert chapter for SOAP study
    const handleInsertChapter = () => {
      if (chapterContent.length === 0) return;
      
      const firstVerse = chapterContent[0];
      const bookChapter = firstVerse.reference.split(':')[0];
      
      const content = chapterContent.map(v => `${v.reference.split(':')[1]} ${v.content}`).join('\n\n');
      onVerseSelect({
        id: 'selected',
        reference: bookChapter,
        content: content,
        copyright: 'Bible'
      });
    };

    // If no start mode selected, show the initial selection screen
    if (!mcheyneStartMode) {
      return (
        <div className="space-y-6">
          {/* Bible Version Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Bible Version
            </label>
            <select
              value={selectedBible}
              onChange={(e) => setSelectedBible(e.target.value)}
              className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {bibleVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name} ({version.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* M'Cheyne Plan Header */}
          <div className="text-center py-4">
            <h3 className="text-xl font-bold text-white mb-2">M'Cheyne One-Year Bible Reading Plan</h3>
            <p className="text-slate-300 text-sm">
              Robert Murray M'Cheyne's classic plan: Read the NT & Psalms twice, OT once per year.
            </p>
            <p className="text-slate-400 text-xs mt-1">4 daily readings - 2 for family, 2 for private devotion</p>
          </div>

          {/* Start Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartMode('day1')}
              className="p-6 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-green-500 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Play className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="font-semibold text-white">Start from Day 1</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Begin the reading plan from the beginning. Perfect for starting fresh or restarting the plan.
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStartMode('calendar')}
              className="p-6 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-green-500 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white">Sync with Calendar</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Jump to today's reading (Day {getDayOfYear()} of the year). Stay in sync with others following this plan.
              </p>
            </motion.button>
          </div>
        </div>
      );
    }

    // Show the daily readings view
    return (
      <div className="space-y-4">
        {/* Header with Day Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setMcheyneStartMode(null);
              setMcheyneReadings(null);
              setSelectedReading(null);
              setChapterContent([]);
            }}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
          >
            ← Back to options
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDay('prev')}
              disabled={mcheyneCurrentDay <= 1}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="px-4 py-2 bg-slate-700 rounded-lg text-white font-medium">
              Day {mcheyneCurrentDay} of 365
            </span>
            <button
              onClick={() => navigateDay('next')}
              disabled={mcheyneCurrentDay >= 365}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>

        {/* Bible Version Toggle */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Version:</span>
          <select
            value={selectedBible}
            onChange={(e) => setSelectedBible(e.target.value)}
            className="px-2 py-1 bg-slate-700 text-white border border-slate-600 rounded text-sm"
          >
            {bibleVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.abbreviation}
              </option>
            ))}
          </select>
        </div>

        {/* Reading Cards */}
        {mcheyneReadings && (
          <div className="space-y-3">
            {/* Family Readings */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Family Readings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={() => loadChapterContent(mcheyneReadings.readings.family1)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedReading === mcheyneReadings.readings.family1
                      ? 'bg-green-600/20 border-green-500 text-white'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatReadingDisplay(mcheyneReadings.readings.family1)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
                <button
                  onClick={() => loadChapterContent(mcheyneReadings.readings.family2)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedReading === mcheyneReadings.readings.family2
                      ? 'bg-green-600/20 border-green-500 text-white'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatReadingDisplay(mcheyneReadings.readings.family2)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>

            {/* Private Readings */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Private Readings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={() => loadChapterContent(mcheyneReadings.readings.private1)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedReading === mcheyneReadings.readings.private1
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatReadingDisplay(mcheyneReadings.readings.private1)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
                <button
                  onClick={() => loadChapterContent(mcheyneReadings.readings.private2)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedReading === mcheyneReadings.readings.private2
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatReadingDisplay(mcheyneReadings.readings.private2)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Content Display */}
        {loadingChapter && (
          <div className="p-8 text-center text-slate-400">
            Loading chapter...
          </div>
        )}

        {selectedReading && chapterContent.length > 0 && !loadingChapter && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-white text-lg">
                {formatReadingDisplay(selectedReading)}
              </h4>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedReading(null);
                  setChapterContent([]);
                }}
                variant="outline"
                className="text-slate-400 border-slate-500"
              >
                Close
              </Button>
            </div>
            
            {/* Scrollable Chapter Content */}
            <div className="max-h-80 overflow-y-auto space-y-2 mb-4 pr-2">
              {chapterContent.map((verse) => (
                <div key={verse.verseId} className="text-white leading-relaxed">
                  <span className="text-amber-400 font-semibold text-sm">
                    {verse.reference.split(':')[1]}
                  </span>
                  <span className="ml-2">{verse.content}</span>
                </div>
              ))}
            </div>

            {/* Insert Button */}
            <Button
              onClick={handleInsertChapter}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Use for SOAP Study
            </Button>
          </motion.div>
        )}
      </div>
    );
  };

  if (isLoadingSettings) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-400">
          Loading...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Tab Toggle */}
      <div className="flex border-b border-slate-600 mb-6">
        <button
          onClick={() => handleModeChange('verse')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            activeMode === 'verse'
              ? 'text-white bg-slate-700 border-b-2 border-green-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Verse Selector
        </button>
        <button
          onClick={() => handleModeChange('plan')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            activeMode === 'plan'
              ? 'text-white bg-slate-700 border-b-2 border-green-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Target className="w-4 h-4" />
          Reading Plan
        </button>
      </div>

      {/* Content Area */}
      {activeMode === 'verse' ? (
        <VerseSelector />
      ) : (
        <ReadingPlanSelector />
      )}
    </Card>
  );
};