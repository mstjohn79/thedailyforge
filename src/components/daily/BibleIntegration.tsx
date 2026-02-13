// Bible Integration Component for SOAP Study
// This demonstrates how we can integrate scripture selection with SOAP study

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { bibleService, BibleVersion, BibleVerse, ReadingPlan } from '../../lib/bibleService';
import { BookOpen, Target, Zap } from 'lucide-react';
import { dbManager } from '../../lib/database';


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
  selectedVerse,
  onStartReadingPlan,
  currentReadingPlan
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

  // Reading plan state
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Database manager instance (singleton)

  useEffect(() => {
    loadBibleVersions();
    loadReadingPlans();
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

  const loadReadingPlans = async () => {
    const plans = await bibleService.getReadingPlans();
    setReadingPlans(plans);
  };

  const handleVerseSelect = (verse: BibleVerse) => {
    console.log('Selecting verse:', verse);
    onVerseSelect(verse);
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
        parseInt(selectedChapter),
        parseInt(selectedVerseStart),
        parseInt(selectedVerseEnd || selectedVerseStart)
      );
      setFetchedVerses(verses);
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

  // Reading Plan Selector Component (existing logic)
  const ReadingPlanSelector = () => (
    <div className="space-y-4">
      {/* Bible Version Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Bible Version
        </label>
        <select
          value={selectedBible}
          onChange={(e) => setSelectedBible(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {bibleVersions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.name} ({version.abbreviation})
            </option>
          ))}
        </select>
      </div>

      {/* Reading Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="space-y-3">
          <h4 className="font-medium text-white">Manly Devotional Tracks:</h4>
          {readingPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 border border-slate-600/50 rounded-lg bg-slate-700/50 hover:border-slate-500 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h5 className="font-medium text-white">{plan.name}</h5>
                    <span className="px-2 py-1 bg-slate-600 text-slate-200 text-xs rounded-full w-fit">
                      {plan.duration} days
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{plan.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-slate-400" /> Scripture-based</span>
                    <span className="flex items-center gap-1"><Target className="w-4 h-4 text-slate-400" /> Manly themes</span>
                    <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-slate-400" /> Strength & courage</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:ml-4">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🔥 Choose Plan button clicked for plan:', plan.id, 'with Bible version:', selectedBible)
                      onStartReadingPlan && onStartReadingPlan(plan, selectedBible)
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-white"
                  >
                    Choose Plan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedPlan(plan)
                    }}
                  >
                    View Plan
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Selected Verse Display */}
      {selectedVerse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-blue-900">Selected for SOAP Study:</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log('Clearing selection');
                onVerseSelect({
                  id: '',
                  reference: '',
                  content: '',
                  copyright: ''
                });
              }}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium text-blue-800">{selectedVerse.reference}</p>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {bibleVersions.find(v => v.id === selectedBible)?.abbreviation || 'Bible'}
            </span>
          </div>
          <p className="text-blue-700 italic mt-2">"{selectedVerse.content}"</p>
          <p className="text-xs text-blue-600 mt-2">{selectedVerse.copyright}</p>
        </motion.div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{selectedPlan.title}</h3>
                <button
                  onClick={() => {
                    console.log('🔥 Modal close button clicked')
                    setSelectedPlan(null)
                  }}
                  className="text-green-400 hover:text-green-300 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <p className="text-green-200 mb-4">{selectedPlan.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Plan Overview:</h4>
                <p className="text-sm text-green-200">
                  This {selectedPlan.title?.toLowerCase() || 'devotional'} plan includes {selectedPlan.verses?.length || 0} carefully selected verses
                  that will guide you through {selectedPlan.description?.toLowerCase() || 'spiritual growth'}.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Daily Themes:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPlan.titles?.length > 0 ? selectedPlan.titles.map((title: string, index: number) => (
                    <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-white text-sm">Day {index + 1}: {title}</h5>
                          {selectedPlan.themes?.[index] && (
                            <p className="text-xs text-green-300 mt-1">{selectedPlan.themes[index]}</p>
                          )}
                        </div>
                        <span className="text-xs text-green-400 ml-2">Day {index + 1}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-green-400 text-sm p-4 text-center">Plan details are being loaded...</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedPlan(null)
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    try {
                      setLoadingPlan(selectedPlan.id);
                      const devotion = await bibleService.getTodaysDevotion(selectedPlan.id, selectedBible);
                      if (devotion) {
                        onVerseSelect(devotion.verses[0]);
                        setSelectedPlan(null);
                      }
                    } catch (error) {
                      console.error('Error loading today\'s devotion:', error);
                    } finally {
                      setLoadingPlan(null);
                    }
                  }}
                  disabled={loadingPlan === selectedPlan.id}
                >
                  {loadingPlan === selectedPlan.id ? 'Loading...' : 'Get Today\'s Devotion'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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