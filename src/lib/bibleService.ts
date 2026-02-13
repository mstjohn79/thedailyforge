// Bible Service for retrieving scripture from our Neon PostgreSQL database
// ESV and NLT translations are stored locally for fast, reliable access

import { BibleBook, FetchedVerse } from '../types'
import { MCHEYNE_PLAN, getMcheyneDay, getDayOfYear, formatReadingDisplay, McheyneDay } from '../data/mcheyneReadingPlan'

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  abbreviation: string;
}

export interface BibleVerse {
  id: string;
  reference: string;
  content: string;
  copyright: string;
  verseId?: string;
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  titles?: string[];
  themes?: string[];
  verses?: string[];
}

export interface DevotionDay {
  date: string;
  verses: BibleVerse[];
  title: string;
  content: string;
}

// Book name mapping for display
const BOOK_NAME_MAP: Record<string, string> = {
  'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy',
  'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra',
  'NEH': 'Nehemiah', 'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms', 'PRO': 'Proverbs',
  'ECC': 'Ecclesiastes', 'SNG': 'Song of Solomon', 'ISA': 'Isaiah', 'JER': 'Jeremiah', 'LAM': 'Lamentations',
  'EZK': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea', 'JOL': 'Joel', 'AMO': 'Amos',
  'OBA': 'Obadiah', 'JON': 'Jonah', 'MIC': 'Micah', 'NAH': 'Nahum', 'HAB': 'Habakkuk',
  'ZEP': 'Zephaniah', 'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
  'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John', 'ACT': 'Acts',
  'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', 'GAL': 'Galatians', 'EPH': 'Ephesians',
  'PHP': 'Philippians', 'COL': 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy',
  '2TI': '2 Timothy', 'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James',
  '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  'JUD': 'Jude', 'REV': 'Revelation'
};

class BibleService {
  private defaultTranslation = 'esv'; // Default to ESV

  constructor() {
    // Verses are stored in our Neon PostgreSQL database - no external API needed
  }

  // Get available Bible versions - ESV and NLT
  async getBibleVersions(): Promise<BibleVersion[]> {
    return [
      { id: 'esv', name: 'English Standard Version', language: 'English', abbreviation: 'ESV' },
      { id: 'nlt', name: 'New Living Translation', language: 'English', abbreviation: 'NLT' }
    ];
  }

  // Get all Bible books with metadata from database
  async getBibleBooks(bibleId?: string): Promise<BibleBook[]> {
    try {
      const response = await fetch(`/api/bible/books${bibleId ? `?bibleId=${bibleId}` : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch Bible books')
      }
      const data = await response.json()
      return data.books || []
    } catch (error) {
      console.error('Error fetching Bible books from database:', error)
      // Fallback to static data if database is not available
      return this.getStaticBibleBooks()
    }
  }

  // Static fallback data
  private getStaticBibleBooks(): BibleBook[] {
    return [
      // Old Testament (39 books)
      { id: 'GEN', name: 'Genesis', testament: 'old', chapters: 50 },
      { id: 'EXO', name: 'Exodus', testament: 'old', chapters: 40 },
      { id: 'LEV', name: 'Leviticus', testament: 'old', chapters: 27 },
      { id: 'NUM', name: 'Numbers', testament: 'old', chapters: 36 },
      { id: 'DEU', name: 'Deuteronomy', testament: 'old', chapters: 34 },
      { id: 'JOS', name: 'Joshua', testament: 'old', chapters: 24 },
      { id: 'JDG', name: 'Judges', testament: 'old', chapters: 21 },
      { id: 'RUT', name: 'Ruth', testament: 'old', chapters: 4 },
      { id: '1SA', name: '1 Samuel', testament: 'old', chapters: 31 },
      { id: '2SA', name: '2 Samuel', testament: 'old', chapters: 24 },
      { id: '1KI', name: '1 Kings', testament: 'old', chapters: 22 },
      { id: '2KI', name: '2 Kings', testament: 'old', chapters: 25 },
      { id: '1CH', name: '1 Chronicles', testament: 'old', chapters: 29 },
      { id: '2CH', name: '2 Chronicles', testament: 'old', chapters: 36 },
      { id: 'EZR', name: 'Ezra', testament: 'old', chapters: 10 },
      { id: 'NEH', name: 'Nehemiah', testament: 'old', chapters: 13 },
      { id: 'EST', name: 'Esther', testament: 'old', chapters: 10 },
      { id: 'JOB', name: 'Job', testament: 'old', chapters: 42 },
      { id: 'PSA', name: 'Psalms', testament: 'old', chapters: 150 },
      { id: 'PRO', name: 'Proverbs', testament: 'old', chapters: 31 },
      { id: 'ECC', name: 'Ecclesiastes', testament: 'old', chapters: 12 },
      { id: 'SNG', name: 'Song of Solomon', testament: 'old', chapters: 8 },
      { id: 'ISA', name: 'Isaiah', testament: 'old', chapters: 66 },
      { id: 'JER', name: 'Jeremiah', testament: 'old', chapters: 52 },
      { id: 'LAM', name: 'Lamentations', testament: 'old', chapters: 5 },
      { id: 'EZK', name: 'Ezekiel', testament: 'old', chapters: 48 },
      { id: 'DAN', name: 'Daniel', testament: 'old', chapters: 12 },
      { id: 'HOS', name: 'Hosea', testament: 'old', chapters: 14 },
      { id: 'JOL', name: 'Joel', testament: 'old', chapters: 3 },
      { id: 'AMO', name: 'Amos', testament: 'old', chapters: 9 },
      { id: 'OBA', name: 'Obadiah', testament: 'old', chapters: 1 },
      { id: 'JON', name: 'Jonah', testament: 'old', chapters: 4 },
      { id: 'MIC', name: 'Micah', testament: 'old', chapters: 7 },
      { id: 'NAH', name: 'Nahum', testament: 'old', chapters: 3 },
      { id: 'HAB', name: 'Habakkuk', testament: 'old', chapters: 3 },
      { id: 'ZEP', name: 'Zephaniah', testament: 'old', chapters: 3 },
      { id: 'HAG', name: 'Haggai', testament: 'old', chapters: 2 },
      { id: 'ZEC', name: 'Zechariah', testament: 'old', chapters: 14 },
      { id: 'MAL', name: 'Malachi', testament: 'old', chapters: 4 },
      
      // New Testament (27 books)
      { id: 'MAT', name: 'Matthew', testament: 'new', chapters: 28 },
      { id: 'MRK', name: 'Mark', testament: 'new', chapters: 16 },
      { id: 'LUK', name: 'Luke', testament: 'new', chapters: 24 },
      { id: 'JHN', name: 'John', testament: 'new', chapters: 21 },
      { id: 'ACT', name: 'Acts', testament: 'new', chapters: 28 },
      { id: 'ROM', name: 'Romans', testament: 'new', chapters: 16 },
      { id: '1CO', name: '1 Corinthians', testament: 'new', chapters: 16 },
      { id: '2CO', name: '2 Corinthians', testament: 'new', chapters: 13 },
      { id: 'GAL', name: 'Galatians', testament: 'new', chapters: 6 },
      { id: 'EPH', name: 'Ephesians', testament: 'new', chapters: 6 },
      { id: 'PHP', name: 'Philippians', testament: 'new', chapters: 4 },
      { id: 'COL', name: 'Colossians', testament: 'new', chapters: 4 },
      { id: '1TH', name: '1 Thessalonians', testament: 'new', chapters: 5 },
      { id: '2TH', name: '2 Thessalonians', testament: 'new', chapters: 3 },
      { id: '1TI', name: '1 Timothy', testament: 'new', chapters: 6 },
      { id: '2TI', name: '2 Timothy', testament: 'new', chapters: 4 },
      { id: 'TIT', name: 'Titus', testament: 'new', chapters: 3 },
      { id: 'PHM', name: 'Philemon', testament: 'new', chapters: 1 },
      { id: 'HEB', name: 'Hebrews', testament: 'new', chapters: 13 },
      { id: 'JAS', name: 'James', testament: 'new', chapters: 5 },
      { id: '1PE', name: '1 Peter', testament: 'new', chapters: 5 },
      { id: '2PE', name: '2 Peter', testament: 'new', chapters: 3 },
      { id: '1JN', name: '1 John', testament: 'new', chapters: 5 },
      { id: '2JN', name: '2 John', testament: 'new', chapters: 1 },
      { id: '3JN', name: '3 John', testament: 'new', chapters: 1 },
      { id: 'JUD', name: 'Jude', testament: 'new', chapters: 1 },
      { id: 'REV', name: 'Revelation', testament: 'new', chapters: 22 }
    ]
  }

  // Parse verse ID format (e.g., "PSA.18.1" or "PSA.18.1-PSA.18.3")
  private parseVerseId(verseId: string): { bookId: string; chapter: number; startVerse: number; endVerse: number } | null {
    // Handle range format like "PSA.18.1-PSA.18.3"
    if (verseId.includes('-')) {
      const [start, end] = verseId.split('-');
      const startParts = start.split('.');
      const endParts = end.split('.');
      if (startParts.length >= 3 && endParts.length >= 3) {
        return {
          bookId: startParts[0],
          chapter: parseInt(startParts[1]),
          startVerse: parseInt(startParts[2]),
          endVerse: parseInt(endParts[2])
        };
      }
    }
    
    // Handle single verse format like "PSA.18.1"
    const parts = verseId.split('.');
    if (parts.length >= 3) {
      return {
        bookId: parts[0],
        chapter: parseInt(parts[1]),
        startVerse: parseInt(parts[2]),
        endVerse: parseInt(parts[2])
      };
    }
    
    return null;
  }

  // Get a specific verse or verse range from our database
  async getVerse(translation: string, verseId: string): Promise<BibleVerse | null> {
    try {
      const parsed = this.parseVerseId(verseId);
      if (!parsed) {
        console.error('Invalid verse ID format:', verseId);
        return null;
      }

      const { bookId, chapter, startVerse, endVerse } = parsed;
      
      // Use the translation ID directly (esv or nlt)
      const translationParam = translation === 'esv' || translation === 'nlt' ? translation : this.defaultTranslation;
      
      // Fetch from our database API
      const params = new URLSearchParams({
        translation: translationParam,
        bookId,
        chapter: chapter.toString(),
        startVerse: startVerse.toString(),
        endVerse: endVerse.toString()
      });
      
      const response = await fetch(`/api/bible/verses?${params}`);
      
      if (!response.ok) {
        console.error('Database API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || data.verses.length === 0) {
        return null;
      }

      return {
        id: verseId,
        reference: data.combinedReference,
        content: data.combinedContent,
        copyright: data.copyright
      };
    } catch (error) {
      console.error('Error fetching verse from database:', error);
      return null;
    }
  }

  // Search for verses (can be implemented with database full-text search)
  async searchVerses(translation: string, query: string): Promise<BibleVerse[]> {
    // TODO: Implement full-text search in database
    console.log('Search not yet implemented:', query);
    return [];
  }

  // Get reading plans - M'Cheyne One-Year Bible Reading Plan
  async getReadingPlans(): Promise<ReadingPlan[]> {
    return [
      {
        id: 'mcheyne',
        name: "M'Cheyne One-Year Plan",
        description: "Robert Murray M'Cheyne's classic plan: Read the NT & Psalms twice, OT once per year. 4 daily readings.",
        duration: 365
      }
    ];
  }

  // Get M'Cheyne readings for a specific day
  getMcheyneReadings(day: number): McheyneDay | null {
    return getMcheyneDay(day);
  }

  // Get today's M'Cheyne readings based on calendar
  getTodaysMcheyneReadings(): McheyneDay {
    const dayOfYear = getDayOfYear();
    return MCHEYNE_PLAN[dayOfYear - 1] || MCHEYNE_PLAN[0];
  }

  // Get current day of year
  getCurrentDayOfYear(): number {
    return getDayOfYear();
  }

  // Format a reading for display
  formatReading(reading: string): string {
    return formatReadingDisplay(reading);
  }

  // Get today's devotion from a custom reading plan
  async getTodaysDevotion(planId: string, translation?: string, day?: number): Promise<DevotionDay | null> {
    const now = new Date();
    
    // Get the full reading plans to access all verses
    const allPlans = await this.getReadingPlans();
    const plan = allPlans.find(p => p.id === planId);
    
    if (!plan || !plan.verses || !plan.titles || !plan.themes) return null;

    // Use the provided day (currentDay from reading plan progress) or default to 1
    // day is 1-based, so we need to convert to 0-based index
    const dayIndex = day !== undefined ? (day - 1) : 0;
    
    // Ensure we don't go beyond the available verses
    const safeDayIndex = Math.min(dayIndex, plan.verses.length - 1);
    const verseId = plan.verses[safeDayIndex];
    
    // Use the selected translation or default to ESV
    const selectedTranslation = translation || this.defaultTranslation;
    const verse = await this.getVerse(selectedTranslation, verseId);
    if (!verse) return null;

    return {
      date: now.toISOString().split('T')[0],
      verses: [verse],
      title: plan.titles[safeDayIndex],
      content: plan.themes[safeDayIndex]
    };
  }



  // Get a range of verses from our database
  async getVerseRange(translation: string, bookId: string, chapter: number, startVerse: number, endVerse: number): Promise<FetchedVerse[]> {
    try {
      // Use the translation ID directly (esv or nlt)
      const translationParam = translation === 'esv' || translation === 'nlt' ? translation : this.defaultTranslation;
      
      // Fetch from our database API
      const params = new URLSearchParams({
        translation: translationParam,
        bookId,
        chapter: chapter.toString(),
        startVerse: startVerse.toString(),
        endVerse: endVerse.toString()
      });
      
      const response = await fetch(`/api/bible/verses?${params}`);
      
      if (!response.ok) {
        console.error('Database API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      
      if (!data.success || data.verses.length === 0) {
        return [];
      }

      return data.verses;
    } catch (error) {
      console.error('Error fetching verse range:', error);
      return [];
    }
  }

  // Get all verses for a chapter (for M'Cheyne reading plan)
  async getChapterContent(translation: string, bookId: string, chapter: number): Promise<BibleVerse[]> {
    try {
      const translationParam = translation === 'esv' || translation === 'nlt' ? translation : this.defaultTranslation;
      
      const params = new URLSearchParams({
        translation: translationParam,
        bookId,
        chapter: chapter.toString()
      });
      
      const response = await fetch(`/api/bible/chapter?${params}`);
      
      if (!response.ok) {
        console.error('Chapter API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      
      if (!data.success || !data.verses) {
        return [];
      }

      // Map to BibleVerse format
      const bookName = BOOK_NAME_MAP[bookId] || bookId;
      return data.verses.map((v: any) => ({
        id: v.verse_id || `${bookId}.${chapter}.${v.verse}`,
        reference: `${bookName} ${chapter}:${v.verse}`,
        content: v.text,
        copyright: translationParam.toUpperCase(),
        verseId: v.verse_id || `${bookId}.${chapter}.${v.verse}`
      }));
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      return [];
    }
  }

  // Format verse ID for API.Bible (e.g., "GEN.1.1")
  formatVerseId(bookId: string, chapter: number, verse: number): string {
    return `${bookId}.${chapter}.${verse}`;
  }

  // Get book by ID
  async getBookById(bookId: string): Promise<BibleBook | null> {
    const books = await this.getBibleBooks();
    return books.find(book => book.id === bookId) || null;
  }

  // Get chapters for a specific book
  async getBookChapters(bookId: string, bibleId?: string): Promise<{ chapter: number; verseCount: number }[]> {
    try {
      const response = await fetch(`/api/bible/books/${bookId}/chapters${bibleId ? `?bibleId=${bibleId}` : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch book chapters')
      }
      const data = await response.json()
      return data.chapters || []
    } catch (error) {
      console.error('Error fetching book chapters:', error)
      return []
    }
  }

  // Get verses for a specific chapter
  async getChapterVerses(bookId: string, chapter: number, bibleId?: string): Promise<{ verse: number }[]> {
    try {
      const response = await fetch(`/api/bible/books/${bookId}/chapters/${chapter}/verses${bibleId ? `?bibleId=${bibleId}` : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch chapter verses')
      }
      const data = await response.json()
      return data.verses || []
    } catch (error) {
      console.error('Error fetching chapter verses:', error)
      return []
    }
  }
}

export const bibleService = new BibleService();
