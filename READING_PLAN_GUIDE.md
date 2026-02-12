# Complete Reading Plan Implementation Guide

## API Credentials & Configuration

### API.Bible Credentials
```javascript
// API Key for API.Bible
const API_KEY = '580329b134bf13e4305a57695080195b'

// Base URL
const BASE_URL = 'https://api.scripture.api.bible/v1'

// Default Bible IDs
const ESV_BIBLE_ID = 'de4e12af7f28f599-02'
const NIV_BIBLE_ID = '65eec8e0b60e656b-01'
```

### Database Connection
```javascript
// Neon PostgreSQL Connection String
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## Core Files

### 1. Bible Service (`src/lib/bibleService.ts`)
```typescript
// Bible Service for integrating with API.Bible
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
    this.apiKey = apiKey || '580329b134bf13e4305a57695080195b';
  }

  async getBibleVersions(): Promise<BibleVersion[]> {
    return [
      { id: 'de4e12af7f28f599-02', name: 'English Standard Version', language: 'English', abbreviation: 'ESV' },
      { id: '65eec8e0b60e656b-01', name: 'New International Version', language: 'English', abbreviation: 'NIV' }
    ];
  }

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

  async getReadingPlans(): Promise<ReadingPlan[]> {
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
        duration: 66,
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

  async getTodaysDevotion(planId: string, bibleId?: string, day?: number): Promise<DevotionDay | null> {
    const now = new Date();
    const timeBasedIndex = day !== undefined ? (day - 1) : Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    
    // Get the full reading plans to access all verses
    const allPlans = await this.getReadingPlans();
    const plan = allPlans.find(p => p.id === planId);
    
    if (!plan || !plan.verses || !plan.titles || !plan.themes) return null;

    const dayIndex = timeBasedIndex % plan.verses.length;
    const verseId = plan.verses[dayIndex];
    
    // Use the selected Bible version or default to ESV
    const selectedBibleId = bibleId || this.defaultBibleId;
    const verse = await this.getVerse(selectedBibleId, verseId);
    if (!verse) return null;

    return {
      date: now.toISOString().split('T')[0],
      verses: [verse],
      title: plan.titles[dayIndex],
      content: plan.themes[dayIndex]
    };
  }

  private cleanHtmlContent(htmlContent: string): string {
    if (!htmlContent) return '';
    
    let cleaned = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/\d+\s*/g, '')
      .replace(/\.([A-Z])/g, '. $1')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.length < 10) {
      return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    
    return cleaned;
  }
}

export const bibleService = new BibleService();
```

### 2. Reading Plan Progress Component (`src/components/daily/ReadingPlanProgress.tsx`)
```typescript

    return {
      date: now.toISOString().split('T')[0],
      verses: [verse],
      title: plan.titles[dayIndex],
      content: plan.themes[dayIndex]
    };
  }

  private cleanHtmlContent(htmlContent: string): string {
    if (!htmlContent) return '';
    
    let cleaned = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/\d+\s*/g, '')
      .replace(/\.([A-Z])/g, '. $1')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.length < 10) {
      return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    
    return cleaned;
  }
}

export const bibleService = new BibleService();
```

### 2. Reading Plan Progress Component (`src/components/daily/ReadingPlanProgress.tsx`)
```typescript
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  X, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Circle,
  RotateCcw,
  Plus
} from 'lucide-react'
import { Button } from '../ui/Button'
import { ReadingPlan } from '../../types'

interface ReadingPlanProgressProps {
  readingPlan: ReadingPlan & { bibleId?: string }
  onLoadTodaysDevotion: (planId: string, targetDay?: number, bibleId?: string) => void
  onAdvanceToNextDay: () => void
  onGoToPreviousDay: () => void
  onClosePlan: () => void
  onStartNewPlan: () => void
  onRestartPlan: () => void
  onSaveProgress: () => void
}

export const ReadingPlanProgress: React.FC<ReadingPlanProgressProps> = ({
  readingPlan,
  onLoadTodaysDevotion,
  onAdvanceToNextDay,
  onGoToPreviousDay,
  onClosePlan,
  onStartNewPlan,
  onRestartPlan,
  onSaveProgress
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const progressPercentage = (readingPlan.completedDays.length / readingPlan.totalDays) * 100
  const daysRemaining = readingPlan.totalDays - readingPlan.completedDays.length

  const renderDayGrid = () => {
    const days = []
    for (let i = 1; i <= readingPlan.totalDays; i++) {
      const isCompleted = readingPlan.completedDays.includes(i)
      const isCurrent = i === readingPlan.currentDay
      const isPast = i < readingPlan.currentDay && !isCompleted
      const isFuture = i > readingPlan.currentDay

      let dayClass = "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 "
      
      if (isCompleted) {
        dayClass += "bg-green-500 border-green-500 text-white"
      } else if (isCurrent) {
        dayClass += "bg-blue-500 border-blue-500 text-white"
      } else if (isPast) {
        dayClass += "bg-gray-300 border-gray-300 text-gray-600"
      } else {
        dayClass += "bg-gray-700 border-gray-600 text-gray-400"
      }

      days.push(
        <div key={i} className={dayClass}>
          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i}
        </div>
      )
    }

    return days
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4"
        style={{position: 'relative', zIndex: 1, pointerEvents: 'auto'}}
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-white truncate">{readingPlan.planName}</h3>
            <p className="text-sm text-gray-400">
              Started {new Date(readingPlan.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white p-2"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClosePlan}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{readingPlan.completedDays.length}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{daysRemaining}</div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{readingPlan.totalDays}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-4" style={{position: 'relative', zIndex: 9999, pointerEvents: 'auto'}}>
        <Button
          size="sm"
          onClick={() => onLoadTodaysDevotion(readingPlan.planId, readingPlan.currentDay, readingPlan.bibleId)}
          className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white"
          style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
        >
          Load Day {readingPlan.currentDay} Devotion
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {readingPlan.currentDay > 1 && (
            <Button
              size="sm"
              onClick={() => onGoToPreviousDay()}
              className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-500 text-white"
              style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">← Previous</span>
            </Button>
          )}
          
          {readingPlan.currentDay < readingPlan.totalDays && (
            <Button
              size="sm"
              onClick={() => onAdvanceToNextDay()}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white"
              style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
            >
              <span className="hidden sm:inline">Next Day</span>
              <span className="sm:hidden">Next Day →</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            size="sm"
            onClick={() => onRestartPlan()}
            variant="outline"
            className="flex-1 sm:flex-none text-slate-300 hover:bg-slate-700"
            style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart
          </Button>
          <Button
            size="sm"
            onClick={() => onStartNewPlan()}
            variant="outline"
            className="flex-1 sm:flex-none text-slate-300 hover:bg-slate-700"
            style={{position: 'relative', zIndex: 10000, pointerEvents: 'auto'}}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Expandable Day Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Daily Progress</h4>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 overflow-x-auto">
                {renderDayGrid()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
  )
}
```

### 3. Types (`src/types/index.ts`)
```typescript
export interface ReadingPlan {
  planId: string
  planName: string
  currentDay: number
  totalDays: number
  startDate: string
  completedDays: number[]
  bibleId?: string
}
```

### 4. Database Schema
```sql
-- Reading Plans Table
CREATE TABLE IF NOT EXISTS reading_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date_key VARCHAR(10) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 1,
  total_days INTEGER NOT NULL,
  start_date VARCHAR(10) NOT NULL,
  completed_days INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, plan_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reading_plans_user_plan 
ON reading_plans(user_id, plan_id);
```

### 5. Package Dependencies

#### Frontend (`package.json`)
```json
{
  "dependencies": {
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.292.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.7"
  }
}
```

#### Backend (`server/package.json`)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  }
}
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install framer-motion lucide-react zustand
   cd server && npm install express cors bcryptjs jsonwebtoken pg dotenv
   ```

2. **Set Environment Variables**
   ```bash
   # .env file
   NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=your-secret-key-change-in-production
   ```

3. **Create Database Tables**
   ```bash
   node server/setup_reading_plans_table.cjs
   ```

4. **Start Development Servers**
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd server && npm run dev
   ```

## Key Features

- **4 Pre-built Reading Plans**: Warrior Psalms, Leadership Proverbs, Courage & Conquest, Strength in Isaiah
- **API.Bible Integration**: Real scripture data with ESV and NIV support
- **Progress Tracking**: Visual progress bars and day completion tracking
- **Responsive Design**: Works on mobile and desktop
- **Database Persistence**: Reading plan progress saved to PostgreSQL
- **Interactive UI**: Expandable day grid, navigation controls, plan management

## API Endpoints

- `GET /api/entries/:date` - Get daily entry with reading plan
- `POST /api/entries` - Save daily entry with reading plan
- `GET /api/health` - Database health check

This complete implementation provides everything needed to recreate the reading plan functionality in another Cursor window.
