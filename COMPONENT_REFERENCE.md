# Component Reference Guide
## Quick Reference for The Daily Forge Modern App

### 🎯 **RECOMMENDATION: Copy & Modify Approach**

**For your new app, I strongly recommend:**
1. **Copy the entire `daily-forge` folder**
2. **Rename it to your new app name**
3. **Tell me what to change for your specific app**

**Why this is better:**
- ✅ **Faster** - No refactoring time
- ✅ **Safer** - No risk of breaking existing code
- ✅ **Cleaner** - Start with proven architecture
- ✅ **Easier for me** - I won't mess up existing functionality

---

## 📁 **COMPONENT BREAKDOWN**

### **UI Components** (`src/components/ui/`)
| Component | Purpose | Props |
|-----------|---------|-------|
| `Button.tsx` | Styled button with variants | `variant`, `size`, `disabled`, `loading` |
| `Card.tsx` | Container with padding/shadow | `padding`, `className` |
| `Input.tsx` | Form input field | `type`, `placeholder`, `value`, `onChange` |
| `Textarea.tsx` | Multi-line text input | `rows`, `placeholder`, `value`, `onChange` |
| `LoadingSpinner.tsx` | Loading indicator | `size`, `className` |

### **Layout Components** (`src/components/layout/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Header.tsx` | Global navigation | Auth state, role-based menus, responsive |

### **Authentication** (`src/components/auth/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `LoginForm.tsx` | User login | Email/password, validation, error handling |
| `Index.ts` | Barrel export | Re-exports auth components |

### **Daily Entry System** (`src/components/daily/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `DailyEntry.tsx` | **MAIN FORM** | Complete daily entry, auto-save, URL navigation |
| `CheckInSection.tsx` | Emotions/feelings | Checkbox emotions, text feeling, auto-save on change/blur |
| `SOAPSection.tsx` | Bible study | Scripture, observation, application, prayer, auto-save on change/blur |
| `GraditudeSection.tsx` | Gratitude list | Add/remove gratitude items, auto-save on change/blur |
| `BibleIntegration.tsx` | Bible integration | ESV/NIV selection, devotional tracks |
| `ReadingPlanProgress.tsx` | Reading plan tracking | Progress display, day navigation, completion tracking |

### **Sermon Notes System** (`src/components/sermon/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `SermonNotesPage.tsx` | **MAIN CONTAINER** | Tab navigation, form/list switching, edit state management |
| `SermonNoteForm.tsx` | Create/Edit form | Auto-save (debounced + immediate), upsert logic, validation |
| `SermonNotesList.tsx` | List/Search view | Search, filter, sort, statistics, edit/delete actions |

### **Dashboard** (`src/components/dashboard/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Dashboard.tsx` | Main dashboard | Metrics, navigation, goal summaries |
| `ProgressAnalytics.tsx` | Analytics page | Charts, insights, spiritual growth tracking |

### **Admin** (`src/components/admin/`)
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `AdminPanel.tsx` | User management | Create/delete users, admin functions |
| `ProtectedAdminRoute.tsx` | Route protection | Admin-only access, redirect logic |

---

## 🗄️ **STATE MANAGEMENT**

### **Zustand Stores** (`src/stores/`)
| Store | Purpose | Key Methods |
|-------|---------|-------------|
| `authStore.ts` | Authentication | `login()`, `logout()`, `checkAuth()`, `getAuthHeaders()` |
| `dailyStore.ts` | Daily entries | `loadEntries()`, `saveEntry()`, `loadEntryByDate()`, `updateEntry()` |
| `sermonNotesStore.ts` | Sermon notes | `loadNotes()`, `createNote()`, `updateNote()`, `deleteNote()` |
| `appStore.ts` | App state | `setCurrentDate()`, `setLoading()` |

---

## 🎣 **CUSTOM HOOKS**

### **Data Hooks** (`src/hooks/`)
| Hook | Purpose | Returns |
|------|---------|---------|
| `useDayData.ts` | Daily entry management | `dayData`, `updateScripture()`, `updateGoals()`, etc. |

---

## 🗃️ **DATA LAYER**

### **Services** (`src/lib/`)
| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `database.ts` | API communication | `saveDailyEntry()`, `authenticateUser()`, `createUser()` |
| `bibleService.ts` | Bible API integration | `getVerse()`, `getReadingPlans()`, `getTodaysDevotion()` |
| `utils.ts` | Utility functions | Date formatting, data validation |
| `constants.ts` | App constants | API endpoints, default values |

### **Configuration** (`src/config/`)
| File | Purpose |
|------|---------|
| `api.ts` | API endpoint configuration |

---

## 📊 **TYPE DEFINITIONS**

### **Core Types** (`src/types/index.ts`)
```typescript
// User management
interface User { id, email, name, is_admin, created_at }

// Daily entry data
interface DailyEntry { id, user_id, date, soap, gratitude, goals, dailyIntention, leadershipRating, checkIn }

// SOAP study
interface SOAPData { scripture, observation, application, prayer }

// Goals system
interface GoalsByType { daily: string[], weekly: string[], monthly: string[] }

// Leadership tracking
interface LeadershipRating { wisdom, courage, patience, integrity }

// Check-in system
interface CheckInData { emotions: string[], feeling: string }

// Bible integration
interface BibleVerse { id, text, reference, version }
interface ReadingPlan { id, name, description, duration, titles, themes, verses }

// Sermon notes
interface SermonNote { id, userId, date, churchName, sermonTitle, speakerName, biblePassage, notes, createdAt, updatedAt }
interface SermonNoteFormData { churchName, sermonTitle, speakerName, biblePassage, notes }
interface SermonNoteStats { totalNotes, uniqueChurches, uniqueSpeakers }
```

---

## 🚀 **BACKEND API**

### **Server Structure** (`server/`)
| File | Purpose |
|------|---------|
| `index.js` | Main server, API routes, database connection |
| `package.json` | Backend dependencies |

### **API Endpoints**
```
Authentication:
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/verify

Daily Entries:
GET    /api/entries
GET    /api/entries/:date
POST   /api/entries
DELETE /api/entries/:id

Sermon Notes:
GET    /api/sermon-notes
GET    /api/sermon-notes/:id
POST   /api/sermon-notes
PUT    /api/sermon-notes/:id
DELETE /api/sermon-notes/:id
GET    /api/sermon-notes/churches
GET    /api/sermon-notes/speakers
GET    /api/sermon-notes/stats

Admin:
GET    /api/admin/users
POST   /api/admin/users
DELETE /api/admin/users/:id
```

---

## 🎨 **STYLING SYSTEM**

### **Tailwind Configuration**
- **Colors**: Blue primary, semantic colors
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Components**: Card-based, rounded corners, shadows
- **Animations**: Framer Motion transitions

### **Design Patterns**
- **Mobile-first** responsive design
- **Card-based** layouts
- **Consistent spacing** and typography
- **Loading states** for all async operations
- **Error handling** with user-friendly messages

---

## 🔧 **KEY FEATURES**

### **Auto-Save System**
- **Debounced saving** (100ms delay for most components, 1000ms for sermon notes)
- **Immediate save on blur** for critical fields
- **Real-time data synchronization** across all components
- **Optimistic UI updates** with error handling
- **Upsert logic** (POST for new, PUT for existing records)
- **Save guards** to prevent multiple simultaneous saves
- **Event-driven architecture** using custom events for auto-save triggers

### **Auto-Save Implementation Patterns**

**1. Daily Entry Sections (CheckIn, SOAP, Gratitude)**:
```typescript
// Immediate save on blur
const handleInputBlur = (field, value) => {
  onUpdate({ ...data, [field]: value })
  window.dispatchEvent(new CustomEvent('triggerSave'))
}

// Debounced save on change
const handleInputChange = (field, value) => {
  onUpdate({ ...data, [field]: value })
  // 100ms debounce handled by parent component
}
```

**2. Sermon Notes Form**:
```typescript
// Debounced auto-save on input change (1000ms)
const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
  
  const timeout = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
  }, 1000)
  
  setAutoSaveTimeout(timeout)
}

// Immediate auto-save on blur
const handleInputBlur = (field) => {
  window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
}
```

**3. Save Guards Pattern**:
```typescript
const [isSaving, setIsSaving] = useState(false)

const autoSaveToAPI = async (data) => {
  if (isSaving) return // Prevent multiple simultaneous saves
  
  setIsSaving(true)
  try {
    // API call logic
  } finally {
    setIsSaving(false)
  }
}
```

### **Navigation System**
- URL-based date navigation (`/daily/2025-01-15`)
- Auto-scroll to sections (`/daily#goals`)
- Session storage for scroll state
- Protected routes with authentication

### **Bible Integration**
- API.Bible integration
- ESV and NIV versions
- Custom devotional tracks
- HTML content cleaning
- Verse selection and display

### **Analytics System**
- Real-time data calculations
- Multiple chart types
- Spiritual growth tracking
- Insights and recommendations
- Goal completion analysis

---

## 📋 **FOR YOUR NEW APP**

### **What You'll Need to Change:**

#### **1. Branding & Content**
- App name and title
- Color scheme and styling
- Scripture verses and messaging
- Logo and favicon

#### **2. Data Models**
- Modify `DailyEntry` interface for your data
- Update database schema
- Adjust API endpoints
- Change form fields and validation

#### **3. Features**
- Add/remove components as needed
- Modify dashboard metrics
- Update analytics calculations
- Customize admin functions

#### **4. Integration**
- Replace Bible integration with your APIs
- Update authentication requirements
- Modify user roles and permissions
- Change deployment configuration

### **What Stays the Same:**
- ✅ Component architecture
- ✅ State management system
- ✅ Auto-save functionality
- ✅ Navigation system
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ TypeScript setup
- ✅ Build system

---

## 🚀 **QUICK START FOR NEW APP**

1. **Copy** `daily-forge` folder
2. **Rename** to your app name
3. **Update** `package.json` name and description
4. **Tell me** what specific features you want
5. **I'll modify** the components and data models
6. **You'll have** a working app in hours, not days!

---

This architecture is battle-tested, scalable, and ready for production. The copy-and-modify approach will save you weeks of development time and ensure you start with a solid foundation.
