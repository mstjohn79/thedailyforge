// Bible Service for integrating with API.Bible
// This will handle scripture retrieval and integration with SOAP study

import { BibleBook, FetchedVerse } from '../types'

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

class BibleService {
  private apiKey: string;
  private baseUrl = 'https://api.scripture.api.bible/v1';
  private defaultBibleId = 'de4e12af7f28f599-02'; // ESV Bible ID

  constructor(apiKey?: string) {
    // API.Bible API key for The Daily David app
    this.apiKey = apiKey || '580329b134bf13e4305a57695080195b';
  }

  // Get available Bible versions
  async getBibleVersions(): Promise<BibleVersion[]> {
    // Return only ESV and NIV for now
    return [
      { id: 'de4e12af7f28f599-02', name: 'English Standard Version', language: 'English', abbreviation: 'ESV' },
      { id: '65eec8e0b60e656b-01', name: 'New International Version', language: 'English', abbreviation: 'NIV' }
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

  // Get a specific verse
  async getVerse(bibleId: string, verseId: string): Promise<BibleVerse | null> {
    if (!this.apiKey) {
      console.warn('No API key provided. Please get an API key from API.Bible to use real scripture data.');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/bibles/${bibleId}/verses/${verseId}`, {
        headers: { 'api-key': this.apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          id: data.data.id,
          reference: data.data.reference,
          content: this.cleanHtmlContent(data.data.content),
          copyright: data.data.copyright || 'Bible'
        };
      } else {
        console.error('API.Bible error:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching verse from API.Bible:', error);
      return null;
    }
  }

  // Search for verses
  async searchVerses(bibleId: string, query: string): Promise<BibleVerse[]> {
    if (!this.apiKey) {
      console.warn('No API key provided. Please get an API key from API.Bible to search scripture.');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`, {
        headers: { 'api-key': this.apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.verses?.map((verse: any) => ({
          id: verse.id,
          reference: verse.reference,
          content: this.cleanHtmlContent(verse.content),
          copyright: verse.copyright || 'Bible'
        })) || [];
      } else {
        console.error('API.Bible search error:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  // Get reading plans (Note: API.Bible doesn't provide reading plans)
  // This would need to be custom content or integration with other services
  async getReadingPlans(): Promise<ReadingPlan[]> {
    // API.Bible doesn't provide reading plans - this would be custom content
    // We can create our own manly devotional tracks using their scripture API
    return [
      {
        id: 'warrior-psalms',
        name: 'Warrior Psalms',
        description: '30 days of Psalms focused on strength, courage, and leadership',
        duration: 30,
        titles: [
          'The Warrior\'s Strength', 'Courage in Battle', 'Stand Strong', 'God Our Fortress', 'Divine Protection',
          'Victory Through Faith', 'The Lord is My Rock', 'Fearless in Battle', 'God\'s Right Hand', 'Mighty Warrior',
          'Strength in Weakness', 'Unshakeable Faith', 'Divine Shield', 'Conquering Spirit', 'God\'s Army',
          'Battle Cry', 'Victory Song', 'Divine Justice', 'Unstoppable Force', 'God\'s Champion',
          'Rising Above', 'Divine Power', 'Unbreakable Bond', 'God\'s Victory', 'Eternal Strength',
          'Spiritual Warfare', 'Divine Authority', 'Unconquerable Spirit', 'God\'s Might', 'Final Victory'
        ],
        themes: [
          'Finding strength in God during spiritual battles', 'Courage to face life\'s challenges with faith', 'Standing firm in your convictions', 'Trusting God as your ultimate refuge', 'Resting in God\'s protection and care',
          'Victory comes through faith, not strength', 'God as your unshakeable foundation', 'Facing fears with divine courage', 'God\'s power working through you', 'Being God\'s instrument of justice',
          'Finding power in humility and dependence', 'Faith that moves mountains', 'God\'s protection in every storm', 'The spirit of a conqueror', 'Being part of God\'s eternal army',
          'Raising your voice for truth', 'Celebrating God\'s victories', 'Seeking divine justice in the world', 'Unstoppable when aligned with God', 'Being God\'s chosen champion',
          'Rising above circumstances', 'Accessing God\'s unlimited power', 'Unbreakable connection with the divine', 'God\'s ultimate victory over evil', 'Drawing from eternal strength',
          'Engaging in spiritual battles', 'Operating in divine authority', 'Spirit that cannot be defeated', 'Experiencing God\'s mighty power', 'The final victory that awaits'
        ],
        verses: [
          'PSA.18.1-PSA.18.3', 'PSA.27.1-PSA.27.3', 'PSA.31.24', 'PSA.46.1-PSA.46.3', 'PSA.91.1-PSA.91.4',
          'PSA.20.7', 'PSA.18.2', 'PSA.23.4', 'PSA.16.8', 'PSA.144.1',
          'PSA.73.26', 'PSA.37.5', 'PSA.3.3', 'PSA.18.39', 'PSA.68.17',
          'PSA.47.1', 'PSA.98.1', 'PSA.7.11', 'PSA.18.32', 'PSA.89.19',
          'PSA.30.1', 'PSA.62.11', 'PSA.63.8', 'PSA.21.1', 'PSA.29.11',
          'PSA.144.1', 'PSA.29.4', 'PSA.18.37', 'PSA.68.35', 'PSA.21.13'
        ]
      },
      {
        id: 'leadership-proverbs',
        name: 'Leadership Proverbs',
        description: 'Daily wisdom from Proverbs for godly leadership',
        duration: 31,
        titles: [
          'Divine Planning', 'Iron Sharpens Iron', 'Vision & Leadership', 'Speak Up for Justice', 'Diligent Work',
          'Wise Counsel', 'Patient Leadership', 'Righteous Judgment', 'Humble Service', 'Integrity First',
          'Disciplined Life', 'Generous Heart', 'Peaceful Resolution', 'Honest Communication', 'Faithful Stewardship',
          'Mentoring Others', 'Courageous Decisions', 'Servant Leadership', 'Wise Investments', 'Righteous Anger',
          'Team Building', 'Conflict Resolution', 'Long-term Thinking', 'Character Development', 'Spiritual Growth',
          'Leading by Example', 'Building Trust', 'Making Sacrifices', 'Seeking Wisdom', 'Finishing Strong', 'Legacy Building'
        ],
        themes: [
          'Planning your path while trusting God\'s direction', 'The importance of godly friendships and accountability', 'Leading with vision and purpose', 'Using your voice to defend the vulnerable', 'The value of hard work and diligence',
          'Seeking wise counsel before making decisions', 'Leading with patience and understanding', 'Making fair and just decisions', 'Leading through humble service', 'Maintaining integrity in all situations',
          'Living a disciplined and ordered life', 'Leading with generosity and compassion', 'Resolving conflicts peacefully', 'Communicating with honesty and clarity', 'Managing resources faithfully',
          'Investing in the next generation', 'Making difficult decisions with courage', 'Leading by serving others', 'Making wise investments in people and resources', 'Channeling anger into righteous action',
          'Building strong, unified teams', 'Resolving conflicts with wisdom', 'Thinking beyond immediate results', 'Developing character in yourself and others', 'Prioritizing spiritual growth',
          'Leading through your actions, not just words', 'Building trust through consistency', 'Making personal sacrifices for the team', 'Continuously seeking divine wisdom', 'Finishing what you start', 'Building a lasting legacy'
        ],
        verses: [
          'PRO.16.9', 'PRO.27.17', 'PRO.29.18', 'PRO.31.8-PRO.31.9', 'PRO.14.23',
          'PRO.11.14', 'PRO.15.18', 'PRO.21.3', 'PRO.27.18', 'PRO.10.9',
          'PRO.25.28', 'PRO.11.25', 'PRO.15.1', 'PRO.12.22', 'PRO.27.23',
          'PRO.22.6', 'PRO.28.1', 'PRO.27.2', 'PRO.13.11', 'PRO.15.1',
          'PRO.15.22', 'PRO.16.7', 'PRO.19.21', 'PRO.22.1', 'PRO.9.10',
          'PRO.20.7', 'PRO.3.5', 'PRO.17.17', 'PRO.2.6', 'PRO.16.3', 'PRO.13.22'
        ]
      },
      {
        id: 'courage-joshua',
        name: 'Courage & Conquest',
        description: 'Study Joshua and Judges for lessons in courage and faith',
        duration: 24,
        titles: [
          'Be Strong and Courageous', 'Crossing the Jordan', 'The Battle of Jericho', 'Standing Firm', 'Victory Through Faith',
          'Spy Mission', 'Rahab\'s Faith', 'Memorial Stones', 'Circumcision at Gilgal', 'Commander\'s Sword',
          'Achan\'s Sin', 'Ai Defeat', 'Ai Victory', 'Altar on Mount Ebal', 'Reading the Law',
          'Gibeon\'s Deception', 'Sun Stands Still', 'Southern Campaign', 'Northern Campaign', 'Land Division',
          'Cities of Refuge', 'Levitical Cities', 'Eastern Tribes Return', 'Joshua\'s Farewell'
        ],
        themes: [
          'God\'s command to be strong and courageous', 'Trusting God to lead you through impossible situations', 'Following God\'s unconventional battle plans', 'Standing firm when others fall away', 'Victory comes through faith, not strength',
          'Gathering intelligence and preparing for battle', 'Faith that transcends background and circumstances', 'Remembering God\'s faithfulness in the past', 'Renewing your commitment to God', 'Recognizing God\'s authority in your life',
          'The consequences of disobedience and hidden sin', 'Learning from failure and defeat', 'Victory through obedience and strategy', 'Worship and commitment to God\'s law', 'The importance of knowing God\'s word',
          'Dealing with deception and making wise alliances', 'God\'s miraculous intervention in impossible situations', 'Systematic conquest of obstacles', 'Completing the work God has given you', 'Fair distribution of blessings and responsibilities',
          'Providing safety and refuge for others', 'Supporting those who serve God', 'Keeping your promises and commitments', 'Leaving a legacy of faithfulness'
        ],
        verses: [
          'JOS.1.9', 'JOS.3.15-JOS.3.17', 'JOS.6.20', 'JOS.24.15', 'JOS.21.45',
          'JOS.2.1', 'JOS.2.11', 'JOS.4.7', 'JOS.5.9', 'JOS.5.14',
          'JOS.7.11', 'JOS.7.5', 'JOS.8.1', 'JOS.8.30', 'JOS.8.34',
          'JOS.9.14', 'JOS.10.13', 'JOS.10.40', 'JOS.11.23', 'JOS.14.2',
          'JOS.20.2', 'JOS.21.2', 'JOS.22.4', 'JOS.24.15'
        ]
      },
      {
        id: 'strength-isaiah',
        name: 'Strength in Isaiah',
        description: 'Isaiah\'s messages of strength and hope for men',
        duration: 29,
        titles: [
          'Wings Like Eagles', 'The Lord is My Strength', 'Fear Not', 'God\'s Power', 'Everlasting Strength',
          'Holy One of Israel', 'Prince of Peace', 'Wonderful Counselor', 'Mighty God', 'Everlasting Father',
          'Light in Darkness', 'Refuge in Storm', 'Healer of Broken Hearts', 'Restorer of Hope', 'Comforter in Sorrow',
          'Righteous Judge', 'King of Kings', 'Lord of Hosts', 'Alpha and Omega', 'Beginning and End',
          'Shepherd of Souls', 'Bread of Life', 'Living Water', 'Way, Truth, Life', 'Resurrection Power',
          'Grace Abounding', 'Mercy Enduring', 'Love Unfailing', 'Victory Assured'
        ],
        themes: [
          'Soaring above life\'s challenges with God\'s strength', 'Finding strength in the Lord when you feel weak', 'Overcoming fear through God\'s presence', 'Experiencing God\'s mighty power in your life', 'Drawing from God\'s inexhaustible strength',
          'Recognizing God\'s holiness and majesty', 'Finding peace in the midst of chaos', 'Seeking divine wisdom and guidance', 'Trusting in God\'s unlimited power', 'Resting in God\'s eternal fatherhood',
          'Finding illumination in dark times', 'Taking shelter in God during life\'s storms', 'Experiencing God\'s healing touch', 'Finding renewed hope in God\'s promises', 'Receiving comfort in times of grief',
          'Trusting in God\'s perfect justice', 'Acknowledging God\'s supreme authority', 'Relying on God\'s military might', 'Understanding God\'s eternal nature', 'Recognizing God\'s complete sovereignty',
          'Following God\'s gentle guidance', 'Finding sustenance in God\'s word', 'Drinking from God\'s living water', 'Following God\'s path of truth', 'Experiencing God\'s resurrection power',
          'Receiving God\'s abundant grace', 'Trusting in God\'s enduring mercy', 'Resting in God\'s unfailing love', 'Confident in God\'s ultimate victory'
        ],
        verses: [
          'ISA.40.31', 'ISA.12.2', 'ISA.41.10', 'ISA.40.29', 'ISA.26.4',
          'ISA.1.4', 'ISA.9.6', 'ISA.9.6', 'ISA.9.6', 'ISA.9.6',
          'ISA.9.2', 'ISA.25.4', 'ISA.61.1', 'ISA.40.1', 'ISA.51.12',
          'ISA.33.22', 'ISA.6.5', 'ISA.6.3', 'ISA.44.6', 'ISA.48.12',
          'ISA.40.11', 'ISA.55.1', 'ISA.55.1', 'ISA.35.8', 'ISA.26.19',
          'ISA.55.7', 'ISA.54.8', 'ISA.54.10', 'ISA.25.8'
        ]
      }
    ];
  }

  // Get today's devotion from a custom reading plan
  async getTodaysDevotion(planId: string, bibleId?: string, day?: number): Promise<DevotionDay | null> {
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
    
    // Use the selected Bible version or default to ESV
    const selectedBibleId = bibleId || this.defaultBibleId;
    const verse = await this.getVerse(selectedBibleId, verseId);
    if (!verse) return null;

    return {
      date: now.toISOString().split('T')[0],
      verses: [verse],
      title: plan.titles[safeDayIndex],
      content: plan.themes[safeDayIndex]
    };
  }



  // Get a range of verses
  async getVerseRange(bibleId: string, bookId: string, chapter: number, startVerse: number, endVerse: number): Promise<FetchedVerse[]> {
    if (!this.apiKey) {
      console.warn('No API key provided. Please get an API key from API.Bible to fetch verses.');
      return [];
    }

    try {
      const verses: FetchedVerse[] = [];
      
      // Fetch each verse individually to get proper formatting
      for (let verseNum = startVerse; verseNum <= endVerse; verseNum++) {
        const verseId = this.formatVerseId(bookId, chapter, verseNum);
        const verse = await this.getVerse(bibleId, verseId);
        
        if (verse) {
          verses.push({
            reference: verse.reference,
            content: verse.content,
            verseId: verse.id
          });
        }
      }
      
      return verses;
    } catch (error) {
      console.error('Error fetching verse range:', error);
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

  // Clean HTML content from API.Bible response
  private cleanHtmlContent(htmlContent: string): string {
    if (!htmlContent) return '';
    
    // Remove HTML tags and clean up the content
    let cleaned = htmlContent
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up verse numbers and formatting
      .replace(/\d+\s*/g, '')
      // Add spaces between sentences/verses
      .replace(/\.([A-Z])/g, '. $1')
      // Remove extra whitespace and normalize
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the content is too short or empty, return the original
    if (cleaned.length < 10) {
      return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    
    return cleaned;
  }
}

export const bibleService = new BibleService();
