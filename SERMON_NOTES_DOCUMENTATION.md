# Sermon Notes Module Documentation
## Complete Guide for The Daily Forge Modern App

### 📖 **OVERVIEW**

The Sermon Notes module allows users to record and manage spiritual insights from church services, sermons, and teachings. It provides a comprehensive system for capturing sermon details, taking notes, and reviewing past teachings with search and filtering capabilities.

---

## 🏗️ **ARCHITECTURE**

### **Component Structure**
```
src/components/sermon/
├── index.ts                 # Barrel exports
├── SermonNotesPage.tsx      # Main page with tab navigation
├── SermonNoteForm.tsx       # Form for creating/editing notes
└── SermonNotesList.tsx      # List view with search/filter
```

### **Data Flow**
```
SermonNotesPage (Container)
├── SermonNoteForm (Create/Edit)
└── SermonNotesList (View/Search)
    └── Individual Note Cards
```

---

## 📁 **COMPONENT BREAKDOWN**

### **SermonNotesPage.tsx** - Main Container
**Purpose**: Tab-based interface switching between form and list views

**Key Features**:
- Tab navigation (New Note / View Notes)
- State management for editing notes
- Form reset logic for new vs. edit modes
- Motion animations for smooth transitions

**Props**: None (self-contained)

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<'form' | 'list'>('form')
const [refreshKey, setRefreshKey] = useState(0)
const [editingNote, setEditingNote] = useState<SermonNote | null>(null)
```

**Key Methods**:
- `handleNoteSaved()` - Switches to list view after save
- `handleEditNote(note)` - Switches to form view with note data

---

### **SermonNoteForm.tsx** - Form Component
**Purpose**: Create new sermon notes or edit existing ones

**Key Features**:
- Auto-save on input change (1 second debounced)
- Auto-save on blur (immediate)
- Upsert logic (POST for new, PUT for existing)
- Form validation and error handling
- Date-based note loading

**Props**:
```typescript
interface SermonNoteFormProps {
  onSuccess?: () => void
  initialData?: Partial<SermonNoteFormData & { date: string }>
  editingNoteId?: string
  isNewNote?: boolean
}
```

**State Management**:
```typescript
const [formData, setFormData] = useState<SermonNoteFormData & { date: string }>({
  date: new Date().toISOString().split('T')[0],
  churchName: '',
  sermonTitle: '',
  speakerName: '',
  biblePassage: '',
  notes: ''
})
const [isSaving, setIsSaving] = useState(false)
const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
```

**Key Methods**:
- `handleInputChange(field, value)` - Updates form data and triggers auto-save
- `handleInputBlur(field)` - Immediate auto-save on field exit
- `autoSaveToAPI(data)` - Saves data to backend with upsert logic
- `loadExistingNote()` - Loads most recent note for current date
- `handleSaveEntry()` - Final save and navigation

**Auto-Save Pattern**:
```typescript
// Debounced auto-save on input change
const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  
  // Set new timeout for auto-save
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

---

### **SermonNotesList.tsx** - List Component
**Purpose**: Display, search, and manage sermon notes

**Key Features**:
- Search functionality (title, speaker, church, notes)
- Sort by date, church, or speaker
- Statistics display (total notes, unique churches, unique speakers)
- Edit and delete actions
- Responsive grid layout

**Props**:
```typescript
interface SermonNotesListProps {
  onEditNote?: (note: SermonNote) => void
}
```

**State Management**:
```typescript
const [notes, setNotes] = useState<SermonNote[]>([])
const [isLoading, setIsLoading] = useState(false)
const [searchTerm, setSearchTerm] = useState('')
const [sortBy, setSortBy] = useState<'date' | 'church' | 'speaker'>('date')
```

**Key Methods**:
- `loadNotes()` - Fetches all notes from API
- `handleDeleteNote(id)` - Deletes note and updates list
- `filteredNotes` - Computed property for search/sort results

**Search & Filter Logic**:
```typescript
const filteredNotes = useMemo(() => {
  let filtered = notes
  
  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(note =>
      note.sermonTitle.toLowerCase().includes(term) ||
      note.speakerName.toLowerCase().includes(term) ||
      note.churchName.toLowerCase().includes(term) ||
      note.notes.toLowerCase().includes(term)
    )
  }
  
  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date': return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'church': return a.churchName.localeCompare(b.churchName)
      case 'speaker': return a.speakerName.localeCompare(b.speakerName)
      default: return 0
    }
  })
  
  return filtered
}, [notes, searchTerm, sortBy])
```

---

## 🗄️ **DATA MODELS**

### **SermonNote Interface**
```typescript
interface SermonNote {
  id: string
  userId: string
  date: string
  churchName: string
  sermonTitle: string
  speakerName: string
  biblePassage: string
  notes: string
  createdAt: string
  updatedAt: string
}
```

### **SermonNoteFormData Interface**
```typescript
interface SermonNoteFormData {
  churchName: string
  sermonTitle: string
  speakerName: string
  biblePassage: string
  notes: string
}
```

### **SermonNoteStats Interface**
```typescript
interface SermonNoteStats {
  totalNotes: number
  uniqueChurches: number
  uniqueSpeakers: number
}
```

---

## 🚀 **API ENDPOINTS**

### **Sermon Notes API** (`/api/sermon-notes`)
```
GET    /api/sermon-notes           # Get all notes for user
GET    /api/sermon-notes/:id       # Get specific note
POST   /api/sermon-notes           # Create new note
PUT    /api/sermon-notes/:id       # Update existing note
DELETE /api/sermon-notes/:id       # Delete note
GET    /api/sermon-notes/churches  # Get unique churches
GET    /api/sermon-notes/speakers  # Get unique speakers
GET    /api/sermon-notes/stats     # Get statistics
GET    /api/sermon-notes/check-table # Check if table exists
```

### **Request/Response Examples**

**Create/Update Note**:
```typescript
// POST /api/sermon-notes
{
  "date": "2025-01-15",
  "churchName": "Grace Community Church",
  "sermonTitle": "Walking in Faith",
  "speakerName": "Pastor John Smith",
  "biblePassage": "Hebrews 11:1-6",
  "notes": "Faith is the assurance of things hoped for..."
}

// Response
{
  "success": true,
  "note": {
    "id": "uuid",
    "userId": "user-uuid",
    "date": "2025-01-15",
    "churchName": "Grace Community Church",
    "sermonTitle": "Walking in Faith",
    "speakerName": "Pastor John Smith",
    "biblePassage": "Hebrews 11:1-6",
    "notes": "Faith is the assurance of things hoped for...",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Get All Notes**:
```typescript
// GET /api/sermon-notes
// Response
{
  "success": true,
  "notes": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "date": "2025-01-15",
      "churchName": "Grace Community Church",
      "sermonTitle": "Walking in Faith",
      "speakerName": "Pastor John Smith",
      "biblePassage": "Hebrews 11:1-6",
      "notes": "Faith is the assurance of things hoped for...",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🗃️ **DATABASE SCHEMA**

### **sermon_notes Table**
```sql
CREATE TABLE sermon_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  church_name TEXT NOT NULL,
  sermon_title TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  bible_passage TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, sermon_title, speaker_name)
);

-- Indexes for performance
CREATE INDEX idx_sermon_notes_user_id ON sermon_notes(user_id);
CREATE INDEX idx_sermon_notes_date ON sermon_notes(date);
CREATE INDEX idx_sermon_notes_church ON sermon_notes(church_name);
CREATE INDEX idx_sermon_notes_speaker ON sermon_notes(speaker_name);
```

---

## 🔄 **AUTO-SAVE SYSTEM**

### **Implementation Pattern**
The sermon notes use a sophisticated auto-save system that prevents data loss and provides a smooth user experience:

**1. Debounced Auto-Save on Input Change**:
- 1-second delay after user stops typing
- Prevents excessive API calls
- Clears previous timeout on new input

**2. Immediate Auto-Save on Blur**:
- Saves immediately when user leaves a field
- Ensures data is saved even if user navigates away quickly

**3. Upsert Logic**:
- POST for new notes (when `currentNoteId` is null)
- PUT for existing notes (when `currentNoteId` exists)
- Prevents duplicate entries

**4. Save Guards**:
- `isSaving` state prevents multiple simultaneous saves
- Error handling with user feedback
- Optimistic UI updates

### **Auto-Save Code Pattern**
```typescript
// Input change handler with debouncing
const handleInputChange = (field: keyof SermonNoteFormData | 'date', value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  
  // Set new timeout for auto-save
  const timeout = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
  }, 1000)
  
  setAutoSaveTimeout(timeout)
}

// Blur handler for immediate save
const handleInputBlur = (field: keyof SermonNoteFormData | 'date') => {
  window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
}

// Auto-save listener
useEffect(() => {
  const handleAutoSave = async () => {
    if (formData.churchName || formData.sermonTitle || formData.speakerName || 
        formData.biblePassage || formData.notes) {
      if (!isSaving) {
        setIsSaving(true)
        try {
          await autoSaveToAPI(formData)
        } catch (error) {
          console.error('Sermon Notes: Auto-save error:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }
  }

  window.addEventListener('triggerSermonNoteSave', handleAutoSave)
  return () => {
    window.removeEventListener('triggerSermonNoteSave', handleAutoSave)
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
  }
}, [formData, user, token, isSaving, autoSaveTimeout])
```

---

## 🎨 **STYLING & UI PATTERNS**

### **Design System**
- **Dark Theme**: Slate-800/900 backgrounds with amber accents
- **Card-based Layout**: Rounded corners, subtle shadows, backdrop blur
- **Responsive Grid**: Mobile-first design with breakpoint adjustments
- **Consistent Spacing**: 4px base unit with Tailwind spacing scale
- **Motion Animations**: Framer Motion for smooth transitions

### **Component Styling Patterns**
```typescript
// Form input styling
className="w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg bg-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors duration-200"

// Card styling
className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700"

// Button variants
className="bg-amber-500 text-white hover:bg-amber-600" // Primary
className="bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600" // Secondary
```

---

## 🔧 **KEY FEATURES**

### **1. Multi-Tenant Architecture**
- All data is scoped by `user_id`
- Users only see their own sermon notes
- Secure API endpoints with authentication

### **2. Search & Filter System**
- Full-text search across all fields
- Sort by date, church, or speaker
- Real-time filtering with useMemo optimization
- Clear filters functionality

### **3. Statistics Dashboard**
- Total sermon notes count
- Unique churches visited
- Unique speakers heard
- Real-time updates based on filtered results

### **4. Form Management**
- Auto-save prevents data loss
- Form reset for new notes
- Pre-fill for editing existing notes
- Validation and error handling

### **5. Responsive Design**
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface
- Consistent across all screen sizes

---

## 🚀 **INTEGRATION WITH MAIN APP**

### **Navigation Integration**
Added to main app navigation in `Header.tsx`:
```typescript
// Navigation item
{
  name: 'Sermon Notes',
  href: '/sermon-notes',
  icon: FileText,
  current: pathname === '/sermon-notes'
}
```

### **Routing Integration**
Added to `App.tsx`:
```typescript
<Route path="/sermon-notes" element={<SermonNotesPage />} />
```

### **Type Integration**
Added to `src/types/index.ts`:
```typescript
// Sermon Notes types
export interface SermonNote { ... }
export interface SermonNoteFormData { ... }
export interface SermonNoteStats { ... }
export interface SermonNotesState { ... }
```

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues & Solutions**

**1. Auto-save not working**:
- Check if `isSaving` guard is preventing saves
- Verify `autoSaveTimeout` is being cleared properly
- Ensure event listeners are properly attached

**2. Data not persisting**:
- Verify API endpoints are working
- Check authentication token is valid
- Ensure database table exists and is accessible

**3. Form not resetting for new notes**:
- Check `isNewNote` prop is being passed correctly
- Verify `key` prop on SermonNoteForm is changing
- Ensure `setEditingNote(null)` is called

**4. Search not working**:
- Check `filteredNotes` useMemo dependencies
- Verify search term is being updated correctly
- Ensure case-insensitive comparison

---

## 📈 **PERFORMANCE CONSIDERATIONS**

### **Optimizations Implemented**
- **Debounced Auto-save**: Prevents excessive API calls
- **useMemo for Filtering**: Prevents unnecessary re-computations
- **Lazy Loading**: Components only render when needed
- **Database Indexes**: Optimized queries for search and sorting
- **Efficient State Updates**: Minimal re-renders with proper state management

### **Memory Management**
- Cleanup timeouts on component unmount
- Remove event listeners on cleanup
- Proper dependency arrays in useEffect hooks

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Potential Features**
- **Tags System**: Categorize notes by topics or themes
- **Audio Recording**: Attach audio clips to notes
- **Photo Upload**: Add images from church services
- **Sharing**: Share notes with other users
- **Export Options**: PDF, Word, or other formats
- **Advanced Search**: Filter by date ranges, tags, or content
- **Analytics**: Track spiritual growth through sermon themes
- **Reminders**: Set reminders for follow-up actions

### **Technical Improvements**
- **Offline Support**: Cache notes for offline access
- **Real-time Sync**: WebSocket updates for multi-device usage
- **Advanced Filtering**: Multiple filter combinations
- **Bulk Operations**: Select and delete multiple notes
- **Import/Export**: Backup and restore functionality

---

This documentation provides a complete reference for understanding, maintaining, and extending the Sermon Notes module. The auto-save system, multi-tenant architecture, and responsive design make it a robust and user-friendly feature for spiritual growth tracking.
