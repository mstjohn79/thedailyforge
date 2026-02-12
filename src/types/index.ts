// Core User Types
export interface User {
    id: string
    email: string
    name: string
    display_name: string
    role: 'user' | 'admin'
    is_admin: boolean
    createdAt: Date
    created_at: Date
    lastLoginAt?: Date
  }
  
  // Emotion Types for Check-In
  export type EmotionType = 'sad' | 'angry' | 'scared' | 'happy' | 'excited' | 'tender'
  
  // Check-In Data Structure
  export interface CheckInData {
    emotions: EmotionType[]
    feeling: string
  }
  
  // SOAP Bible Study Structure
  export interface SOAPData {
    scripture: string
    observation: string
    application: string
    prayer: string
    thoughts?: string
  }
  
  // Goal Management
  export interface Goal {
    id: string
    text: string
    description?: string
    category: 'spiritual' | 'personal' | 'outreach' | 'health' | 'work'
    completed: boolean
    priority: 'low' | 'medium' | 'high'
    createdAt?: Date
  }
  
  export interface GoalsByType {
    daily: Goal[]
    weekly: Goal[]
    monthly: Goal[]
  }
  
  // Leadership Rating Structure
  export interface LeadershipRating {
    wisdom: number
    courage: number
    patience: number
    integrity: number
  }
  
  // Reading Plan Structure
  export interface ReadingPlan {
    planId: string
    planName: string
    currentDay: number
    totalDays: number
    startDate: string
    completedDays: number[]
    bibleId?: string
  }
  
  export interface LeadershipTrait {
    key: string
    rating: number
    notes?: string
  }
  
  // Daily Entry Complete Structure
  export interface DailyEntry {
    id: string
    userId: string
    user_id: string
    date: string
    dateKey: string
    date_key: string
    
    // Main content sections
    checkIn?: CheckInData
    gratitude: string[]
    soap: SOAPData
    goals: GoalsByType
    
    // Additional tracking
    dailyIntention?: string
    growthQuestion?: string
    leadershipRating?: LeadershipRating
    leadershipTraits?: LeadershipTrait[]
    deletedGoalIds?: string[]
    readingPlan?: ReadingPlan
    data_content?: any
    
    // Status
    completed: boolean
    
    // Timestamps
    createdAt: Date
    created_at: Date
    updatedAt: Date
    updated_at: Date
  }
  
  // Raw data structure as stored in database
  export interface DayData {
    checkIn?: CheckInData
    gratitude: string[]
    soap: SOAPData
    goals: GoalsByType
    dailyIntention?: string
    growthQuestion?: string
    leadershipRating?: LeadershipRating
    readingPlan?: ReadingPlan
    deletedGoalIds?: string[]
    [key: string]: any
  }
  
  // Analytics and Progress
  export interface Analytics {
    totalEntries: number
    currentStreak: number
    longestStreak: number
    completionRate: number
    averageEmotion: string
    topGoals: Goal[]
  }
  
  export interface ProgressStats {
    totalDays: number
    completedDays: number
    completionRate: number
    currentStreak: number
    longestStreak: number
    averageGoalsCompleted: number
  }
  
  // Store State Interfaces
  export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
  
  export interface DailyState {
  entries: DailyEntry[]
  currentEntry: DailyEntry | null
  goals: GoalsByType
  isLoading: boolean
  error: string | null
}
  
  export interface AppState {
    currentDate: Date
    currentView: 'landing' | 'daily'
    theme: 'light' | 'dark'
    isLoading: boolean
  }
  
  // API Response Types
  export interface DatabaseResponse<T = any> {
    success: boolean
    data?: T
    error?: string
  }
  
  export interface UserResponse extends DatabaseResponse {
    data?: User
  }
  
  export interface DayDataResponse extends DatabaseResponse {
    data?: DayData
  }
  
  // Form Types
  export interface LoginFormData {
    email: string
    password: string
  }
  
  export interface CreateUserFormData {
    email: string
    displayName: string
    password: string
    isAdmin: boolean
  }
  
  // Component Props Types
  export interface DailyEntryViewProps {
    user: User
    dayData: DayData
    onUpdateDayData: (data: DayData) => void
    onSave?: () => void
  }
  
  export interface GoalSectionProps {
    goalType: 'daily' | 'weekly' | 'monthly'
    goals: Goal[]
    onUpdateGoals: (goals: Goal[]) => void
    onSave?: () => void
  }
  
  export interface CheckInSectionProps {
    checkIn: CheckInData
    onUpdate: (checkIn: CheckInData) => void
  }
  
  export interface SOAPSectionProps {
    soap: SOAPData
    onUpdate: (soap: SOAPData) => void
  }
  
  export interface GratitudeSectionProps {
    gratitude: string[]
    onUpdate: (gratitude: string[]) => void
  }
  
  // Database Types
  export interface DatabaseUser {
    id: string
    email: string
    display_name: string
    password_hash: string
    is_admin: boolean
    created_at: string
    updated_at: string
  }
  
  export interface DatabaseEntry {
    id: number
    date_key: string
    user_id: string
    data_content: DayData
    created_at: string
    updated_at: string
  }
  
  // Prayer Request Types
  export interface PrayerRequest {
    id: string
    userId: string
    title: string
    description: string
    personName?: string
    category: 'health' | 'family' | 'work' | 'spiritual' | 'other'
    status: 'active' | 'answered' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    createdAt: Date
    updatedAt: Date
    answeredAt?: Date
    praiseReport?: string
  }
  
  export interface PrayerRequestFormData {
    title: string
    description: string
    personName: string
    category: string
    priority: string
  }
  
  export interface PrayerRequestStats {
    total: number
    active: number
    answered: number
    closed: number
    byCategory: { [key: string]: number }
    byPriority: { [key: string]: number }
  }
  
  // Prayer Store State
  export interface PrayerState {
    requests: PrayerRequest[]
    isLoading: boolean
    error: string | null
    stats: PrayerRequestStats | null
  }
  
  // Utility Types
  export type ViewType = 'landing' | 'daily'
  export type GoalType = 'daily' | 'weekly' | 'monthly'
  export type CategoryType = 'spiritual' | 'personal' | 'outreach' | 'health' | 'work'
  export type PrayerCategoryType = 'health' | 'family' | 'work' | 'spiritual' | 'other'
  export type PrayerStatusType = 'active' | 'answered' | 'closed'
  export type PrayerPriorityType = 'low' | 'medium' | 'high' | 'urgent'
  
  // SMS Notification Types
  export interface SMSSettings {
    phoneNumber: string | null
    smsNotificationsEnabled: boolean
    notificationTime: string
    timezone: string
    notificationFrequency: string
    lastNotificationSent: string | null
  }
  
  export interface NotificationLog {
    id: number
    phoneNumber: string
    messageContent: string
    messageType: string
    status: string
    twilioSid: string | null
    errorMessage: string | null
    sentAt: Date
  }
  
  export interface SMSResponse {
    success: boolean
    message?: string
    error?: string
    sid?: string
  }

  // Sermon Notes Types
  export interface SermonNote {
    id: string
    userId: string
    date: string
    churchName: string
    sermonTitle: string
    speakerName: string
    biblePassage: string
    notes: string
    createdAt: Date
    updatedAt: Date
  }

  export interface SermonNoteFormData {
    churchName: string
    sermonTitle: string
    speakerName: string
    biblePassage: string
    notes: string
    selectedVerses?: FetchedVerse[]
  }

  export interface SermonNoteStats {
    totalNotes: number
    uniqueChurches: string[]
    uniqueSpeakers: string[]
    totalWords: number
    averageWordsPerNote: number
    mostFrequentSpeakers: { speaker: string; count: number }[]
    mostFrequentChurches: { church: string; count: number }[]
  }

  // Sermon Notes Store State
  export interface SermonNotesState {
    notes: SermonNote[]
    isLoading: boolean
    error: string | null
    stats: SermonNoteStats | null
    churches: string[]
    speakers: string[]
  }

  // Bible Verse Selector Types
  export interface BibleBook {
    id: string
    name: string
    testament: 'old' | 'new'
    chapters: number
  }

  export interface VerseSelection {
    book: string
    chapter: number
    verseStart: number
    verseEnd: number
  }

  export interface FetchedVerse {
    reference: string
    content: string
    verseId: string
  }