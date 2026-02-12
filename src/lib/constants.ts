export const APP_CONFIG = {
  name: 'The Daily David',
  version: '2.0.0',
  description: 'Modern spiritual growth and discipleship tracking',
}

export const CACHE_DURATION = {
  DAY_DATA: 30 * 1000, // 30 seconds
  ANALYTICS: 60 * 1000, // 1 minute
  USER_DATA: 5 * 60 * 1000, // 5 minutes
}

export const EMOTION_OPTIONS = [
  { key: 'sad', label: 'Sad', color: 'blue' },
  { key: 'angry', label: 'Angry', color: 'red' },
  { key: 'scared', label: 'Scared', color: 'yellow' },
  { key: 'happy', label: 'Happy', color: 'green' },
  { key: 'excited', label: 'Excited', color: 'orange' },
  { key: 'tender', label: 'Tender', color: 'pink' },
] as const

export const GOAL_CATEGORIES = [
  { value: 'spiritual', label: 'Spiritual', color: 'blue' },
  { value: 'personal', label: 'Personal', color: 'green' },
  { value: 'outreach', label: 'Outreach', color: 'purple' },
  { value: 'health', label: 'Health', color: 'amber' },
  { value: 'work', label: 'Work', color: 'gray' },
] as const

export const LEADERSHIP_TRAITS = [
  { key: 'wisdom', label: 'Wisdom', description: 'Making wise decisions' },
  { key: 'courage', label: 'Courage', description: 'Facing challenges boldly' },
  { key: 'patience', label: 'Patience', description: 'Waiting and enduring' },
  { key: 'integrity', label: 'Integrity', description: 'Living with honesty' },
] as const
