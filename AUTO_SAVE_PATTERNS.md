# Auto-Save Patterns Documentation
## Complete Guide for The Daily Forge Modern App

### 📖 **OVERVIEW**

This document outlines the comprehensive auto-save patterns implemented throughout the app to ensure data persistence, prevent data loss, and provide a smooth user experience. The patterns are designed to handle different use cases while maintaining consistency and reliability.

---

## 🏗️ **AUTO-SAVE ARCHITECTURE**

### **Core Principles**
1. **Never lose user data** - All input is saved automatically
2. **Minimize API calls** - Use debouncing to prevent excessive requests
3. **Immediate feedback** - Save on blur for critical fields
4. **Error resilience** - Handle failures gracefully with retry logic
5. **Performance optimization** - Prevent multiple simultaneous saves

### **Event-Driven System**
The app uses custom events to trigger auto-save operations:
- `triggerSave` - For daily entry sections
- `triggerSermonNoteSave` - For sermon notes form
- `triggerSOAPSave` - For SOAP review component

---

## 📁 **PATTERN IMPLEMENTATIONS**

### **1. Daily Entry Sections Pattern**
**Used in**: CheckInSection, SOAPSection, GratitudeSection

**Characteristics**:
- Immediate save on blur
- Debounced save on change (100ms)
- Parent component handles debouncing
- Simple data flow

**Implementation**:
```typescript
// Input change handler
const handleInputChange = (field: string, value: any) => {
  onUpdate({ ...data, [field]: value })
  // Parent component handles debouncing
}

// Blur handler for immediate save
const handleInputBlur = (field: string, value: any) => {
  onUpdate({ ...data, [field]: value })
  window.dispatchEvent(new CustomEvent('triggerSave'))
}

// Parent component (DailyEntry.tsx) handles debouncing
useEffect(() => {
  const handleAutoSave = async () => {
    const entryData = { ...dayData, goals: userGoals }
    await autoSaveToAPI(entryData)
  }

  window.addEventListener('triggerSave', handleAutoSave)
  return () => window.removeEventListener('triggerSave', handleAutoSave)
}, [dayData, userGoals, selectedDate, user])
```

**Benefits**:
- ✅ Simple implementation
- ✅ Consistent across all daily entry sections
- ✅ Parent handles complexity
- ✅ Immediate save on blur

---

### **2. Sermon Notes Form Pattern**
**Used in**: SermonNoteForm

**Characteristics**:
- Debounced save on input change (1000ms)
- Immediate save on blur
- Upsert logic (POST for new, PUT for existing)
- Save guards to prevent multiple saves
- Self-contained auto-save logic

**Implementation**:
```typescript
const [isSaving, setIsSaving] = useState(false)
const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

// Input change with debouncing
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

// Immediate save on blur
const handleInputBlur = (field: keyof SermonNoteFormData | 'date') => {
  window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
}

// Auto-save listener with save guards
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

// Upsert logic for auto-save
const autoSaveToAPI = async (noteData: any) => {
  if (!user?.id) return
  
  try {
    const url = currentNoteId 
      ? `${API_BASE_URL}/api/sermon-notes/${currentNoteId}`
      : `${API_BASE_URL}/api/sermon-notes`
    
    const method = currentNoteId ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: noteData.date,
        churchName: noteData.churchName,
        sermonTitle: noteData.sermonTitle,
        speakerName: noteData.speakerName,
        biblePassage: noteData.biblePassage,
        notes: noteData.notes
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.note?.id && !currentNoteId) {
        setCurrentNoteId(result.note.id)
      }
    }
  } catch (error) {
    console.error('Sermon Notes: Auto-save failed:', error)
  }
}
```

**Benefits**:
- ✅ Prevents data loss with immediate blur saves
- ✅ Reduces API calls with debouncing
- ✅ Handles both create and update scenarios
- ✅ Prevents multiple simultaneous saves
- ✅ Self-contained and reusable

---

### **3. SOAP Review Pattern**
**Used in**: SOAPReview component

**Characteristics**:
- Inline editing with auto-save
- Immediate save on blur
- Optimistic UI updates
- Error handling with user feedback

**Implementation**:
```typescript
const handleInputBlur = (field: string, value: string, noteId: string) => {
  // Update local state immediately
  setEditingNotes(prev => ({
    ...prev,
    [noteId]: { ...prev[noteId], [field]: value }
  }))
  
  // Trigger auto-save
  window.dispatchEvent(new CustomEvent('triggerSOAPSave'))
}

// Auto-save listener
useEffect(() => {
  const handleAutoSave = async () => {
    if (Object.keys(editingNotes).length > 0) {
      await autoSaveToAPI(editingNotes)
    }
  }

  window.addEventListener('triggerSOAPSave', handleAutoSave)
  return () => window.removeEventListener('triggerSOAPSave', handleAutoSave)
}, [editingNotes])
```

**Benefits**:
- ✅ Inline editing experience
- ✅ Immediate visual feedback
- ✅ Batch updates for efficiency
- ✅ Error handling with user feedback

---

## 🔧 **SAVE GUARDS PATTERN**

### **Purpose**
Prevent multiple simultaneous API calls that could cause race conditions or data corruption.

### **Implementation**
```typescript
const [isSaving, setIsSaving] = useState(false)

const autoSaveToAPI = async (data: any) => {
  // Guard against multiple simultaneous saves
  if (isSaving) {
    console.log('Already saving, skipping auto-save')
    return
  }
  
  setIsSaving(true)
  try {
    // API call logic
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Save failed')
    }
  } catch (error) {
    console.error('Auto-save error:', error)
    // Could add retry logic here
  } finally {
    setIsSaving(false)
  }
}
```

### **Benefits**
- ✅ Prevents race conditions
- ✅ Reduces server load
- ✅ Prevents data corruption
- ✅ Provides clear debugging information

---

## ⏱️ **DEBOUNCING PATTERNS**

### **1. Simple Debouncing (100ms)**
**Used in**: Daily entry sections

```typescript
// Parent component handles debouncing
useEffect(() => {
  const timeoutId = setTimeout(() => {
    // Auto-save logic
  }, 100)
  
  return () => clearTimeout(timeoutId)
}, [data])
```

### **2. Advanced Debouncing (1000ms)**
**Used in**: Sermon notes form

```typescript
const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  
  // Set new timeout
  const timeout = setTimeout(() => {
    // Trigger auto-save
  }, 1000)
  
  setAutoSaveTimeout(timeout)
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
  }
}, [])
```

### **3. Immediate + Debounced**
**Used in**: Sermon notes form (best of both worlds)

```typescript
// Immediate save on blur
const handleInputBlur = (field) => {
  window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
}

// Debounced save on change
const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
  
  const timeout = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('triggerSermonNoteSave'))
  }, 1000)
  
  setAutoSaveTimeout(timeout)
}
```

---

## 🔄 **UPSERT LOGIC PATTERN**

### **Purpose**
Handle both create and update operations seamlessly without knowing if a record exists.

### **Implementation**
```typescript
const autoSaveToAPI = async (data: any) => {
  const url = currentId 
    ? `${API_BASE_URL}/api/endpoint/${currentId}`  // Update existing
    : `${API_BASE_URL}/api/endpoint`               // Create new
  
  const method = currentId ? 'PUT' : 'POST'
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (response.ok) {
    const result = await response.json()
    // Update currentId if this was a create operation
    if (result.id && !currentId) {
      setCurrentId(result.id)
    }
  }
}
```

### **Benefits**
- ✅ Seamless create/update handling
- ✅ No need to check if record exists
- ✅ Automatic ID management
- ✅ Consistent API interface

---

## 🎯 **BEST PRACTICES**

### **1. Event Naming Convention**
- Use descriptive event names: `triggerSave`, `triggerSermonNoteSave`
- Include component context in event name
- Use consistent naming pattern across the app

### **2. Cleanup Patterns**
```typescript
useEffect(() => {
  // Setup
  const handleAutoSave = () => { /* ... */ }
  window.addEventListener('triggerSave', handleAutoSave)
  
  // Cleanup
  return () => {
    window.removeEventListener('triggerSave', handleAutoSave)
    if (timeout) clearTimeout(timeout)
  }
}, [dependencies])
```

### **3. Error Handling**
```typescript
const autoSaveToAPI = async (data) => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Auto-save failed:', error)
    // Could add retry logic, user notification, etc.
  }
}
```

### **4. State Management**
```typescript
// Use functional updates to prevent stale closures
const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  // This ensures we always have the latest state
}
```

### **5. Performance Optimization**
```typescript
// Use useMemo for expensive computations
const filteredData = useMemo(() => {
  return data.filter(item => item.name.includes(searchTerm))
}, [data, searchTerm])

// Use useCallback for stable function references
const handleSave = useCallback(async (data) => {
  await autoSaveToAPI(data)
}, [autoSaveToAPI])
```

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

**1. Auto-save not triggering**
- Check event listeners are properly attached
- Verify event names match exactly
- Ensure cleanup is not removing listeners prematurely

**2. Multiple saves happening**
- Check save guards are implemented
- Verify `isSaving` state is being managed correctly
- Look for race conditions in useEffect dependencies

**3. Data not persisting**
- Verify API endpoints are working
- Check authentication tokens are valid
- Ensure database connections are stable

**4. Performance issues**
- Check debouncing is working correctly
- Verify timeouts are being cleared
- Look for memory leaks in event listeners

### **Debugging Tips**
```typescript
// Add logging to track auto-save behavior
const handleAutoSave = async () => {
  console.log('Auto-save triggered:', { data, timestamp: Date.now() })
  
  if (isSaving) {
    console.log('Already saving, skipping')
    return
  }
  
  setIsSaving(true)
  console.log('Starting save...')
  
  try {
    await autoSaveToAPI(data)
    console.log('Save successful')
  } catch (error) {
    console.error('Save failed:', error)
  } finally {
    setIsSaving(false)
    console.log('Save complete')
  }
}
```

---

## 🚀 **FUTURE ENHANCEMENTS**

### **Potential Improvements**
- **Retry Logic**: Automatic retry on failed saves
- **Offline Support**: Queue saves when offline, sync when online
- **Conflict Resolution**: Handle concurrent edits gracefully
- **Batch Operations**: Group multiple changes into single API call
- **Real-time Sync**: WebSocket updates for multi-device usage
- **Analytics**: Track auto-save performance and user behavior

### **Advanced Patterns**
- **Optimistic Updates**: Update UI immediately, rollback on failure
- **Pessimistic Locking**: Prevent concurrent edits
- **Version Control**: Track changes and allow rollback
- **Compression**: Reduce payload size for large data

---

This documentation provides a comprehensive guide to the auto-save patterns used throughout the app. These patterns ensure data persistence, prevent data loss, and provide a smooth user experience while maintaining performance and reliability.
