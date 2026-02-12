# Component Development Runbook

This runbook provides a step-by-step guide for adding new components to The Daily Forge application, following the established patterns and architecture.

## 🏗️ Architecture Overview

The Daily Forge follows a **multitenant, full-stack architecture** with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Neon PostgreSQL
- **State Management**: Zustand
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS

## 📋 Development Process

### Step 1: Planning & Architecture Design

Before writing any code, map out the complete system:

1. **Define the data model**
   - What data needs to be stored?
   - What are the relationships?
   - What fields are required vs optional?

2. **Design the database schema**
   - Create table with proper indexes
   - Include multitenant support (user_id foreign key)
   - Add timestamps and audit fields

3. **Plan the API endpoints**
   - CRUD operations (GET, POST, PUT, DELETE)
   - Authentication requirements
   - Data validation rules

4. **Design the frontend components**
   - List view with filtering/search
   - Create/edit forms
   - Detail views
   - Navigation integration

### Step 2: Database Setup

#### 2.1 Create Database Table

Create a setup script in `server/setup_[component_name]_table.cjs`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'your-connection-string',
  ssl: { rejectUnauthorized: false }
});

async function setupTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up [component_name] table...');
    
    // Create table with multitenant support
    await client.query(`
      CREATE TABLE IF NOT EXISTS [table_name] (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        -- Add your fields here
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_[table_name]_user_id 
      ON [table_name](user_id)
    `);
    
    // Create update trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    await client.query(`
      CREATE TRIGGER update_[table_name]_updated_at
      BEFORE UPDATE ON [table_name]
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('✅ [component_name] table setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up table:', error);
    throw error;
  } finally {
    client.release();
  }
}

setupTable()
  .then(() => {
    console.log('✅ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
```

#### 2.2 Run Database Setup

```bash
cd server && node setup_[component_name]_table.cjs
```

### Step 3: TypeScript Types

Add types to `src/types/index.ts`:

```typescript
// [Component] Types
export interface [ComponentName] {
  id: string
  userId: string
  title: string
  description: string
  status: 'active' | 'inactive' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface [ComponentName]FormData {
  title: string
  description: string
  status: string
}

export interface [ComponentName]Stats {
  total: number
  active: number
  completed: number
}

// Store State
export interface [ComponentName]State {
  items: [ComponentName][]
  isLoading: boolean
  error: string | null
  stats: [ComponentName]Stats | null
}
```

### Step 4: API Endpoints

Add endpoints to `server/index.js`:

```javascript
// ============================================================================
// [COMPONENT_NAME] ENDPOINTS
// ============================================================================

// Get all items for authenticated user
app.get('/api/[component-name]', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    
    const result = await client.query(`
      SELECT * FROM [table_name] 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId])
    
    const items = result.rows.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
    
    res.json({ success: true, items })
  } catch (error) {
    console.error('Get [component-name] error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch items' })
  } finally {
    client.release()
  }
})

// Create new item
app.post('/api/[component-name]', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { title, description, status } = req.body
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and description are required' 
      })
    }
    
    const result = await client.query(`
      INSERT INTO [table_name] (user_id, title, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, title, description, status || 'active'])
    
    const newItem = {
      id: result.rows[0].id.toString(),
      userId: result.rows[0].user_id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      status: result.rows[0].status,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at)
    }
    
    res.status(201).json({ success: true, item: newItem })
  } catch (error) {
    console.error('Create [component-name] error:', error)
    res.status(500).json({ success: false, error: 'Failed to create item' })
  } finally {
    client.release()
  }
})

// Update item
app.put('/api/[component-name]/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const itemId = req.params.id
    const { title, description, status } = req.body
    
    // Verify ownership
    const ownershipCheck = await client.query(
      'SELECT user_id FROM [table_name] WHERE id = $1',
      [itemId]
    )
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' })
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    
    // Build update query dynamically
    const updates = []
    const values = []
    let paramCount = 1
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(title)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(description)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(status)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No updates provided' })
    }
    
    values.push(itemId)
    
    const result = await client.query(`
      UPDATE [table_name] 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values)
    
    const updatedItem = {
      id: result.rows[0].id.toString(),
      userId: result.rows[0].user_id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      status: result.rows[0].status,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at)
    }
    
    res.json({ success: true, item: updatedItem })
  } catch (error) {
    console.error('Update [component-name] error:', error)
    res.status(500).json({ success: false, error: 'Failed to update item' })
  } finally {
    client.release()
  }
})

// Delete item
app.delete('/api/[component-name]/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const itemId = req.params.id
    
    // Verify ownership
    const ownershipCheck = await client.query(
      'SELECT user_id FROM [table_name] WHERE id = $1',
      [itemId]
    )
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' })
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    
    await client.query('DELETE FROM [table_name] WHERE id = $1', [itemId])
    
    res.json({ success: true, message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete [component-name] error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete item' })
  } finally {
    client.release()
  }
})
```

### Step 5: Database Manager Methods

Add methods to `src/lib/database.ts`:

```typescript
// ============================================================================
// [COMPONENT_NAME] METHODS
// ============================================================================

async get[ComponentName]s(userId: string): Promise<any[]> {
  try {
    console.log('API: Getting [component-name]s for user:', userId)
    const response = await fetch(`${API_BASE_URL}/api/[component-name]`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('API: [Component-name]s result:', data.items)
    
    return data.items || []
  } catch (error) {
    console.error('API: Error getting [component-name]s:', error)
    return []
  }
}

async create[ComponentName](userId: string, data: any): Promise<any> {
  try {
    console.log('API: Creating [component-name]:', data)
    
    const response = await fetch(`${API_BASE_URL}/api/[component-name]`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('API: Created [component-name]:', result.item)
    
    return result.item
  } catch (error) {
    console.error('API: Error creating [component-name]:', error)
    throw error
  }
}

async update[ComponentName](userId: string, id: string, updates: any): Promise<any> {
  try {
    console.log('API: Updating [component-name]:', id, updates)
    
    const response = await fetch(`${API_BASE_URL}/api/[component-name]/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('API: Updated [component-name]:', result.item)
    
    return result.item
  } catch (error) {
    console.error('API: Error updating [component-name]:', error)
    throw error
  }
}

async delete[ComponentName](userId: string, id: string): Promise<boolean> {
  try {
    console.log('API: Deleting [component-name]:', id)
    
    const response = await fetch(`${API_BASE_URL}/api/[component-name]/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('API: Deleted [component-name]:', result.message)
    
    return result.success
  } catch (error) {
    console.error('API: Error deleting [component-name]:', error)
    return false
  }
}
```

### Step 6: Zustand Store

Create `src/stores/[componentName]Store.ts`:

```typescript
import { create } from 'zustand'
import { [ComponentName]State, [ComponentName], [ComponentName]FormData } from '../types'
import { dbManager } from '../lib/database'
import { useAuthStore } from './authStore'

interface [ComponentName]Store extends [ComponentName]State {
  // Actions
  loadItems: () => Promise<void>
  createItem: (data: [ComponentName]FormData) => Promise<void>
  updateItem: (id: string, updates: Partial<[ComponentName]>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  clearError: () => void
  clearUserData: () => void
}

export const use[ComponentName]Store = create<[ComponentName]Store>((set, get) => ({
  // Initial state
  items: [],
  isLoading: false,
  error: null,
  stats: null,

  // Load all items for current user
  loadItems: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const items = await dbManager.get[ComponentName]s(user.id)
      
      set({ 
        items,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load items',
        isLoading: false 
      })
    }
  },

  // Create new item
  createItem: async (data) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const newItem = await dbManager.create[ComponentName](user.id, data)
      
      set(state => ({
        items: [newItem, ...state.items],
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create item',
        isLoading: false 
      })
    }
  },

  // Update existing item
  updateItem: async (id, updates) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const updatedItem = await dbManager.update[ComponentName](user.id, id, updates)
      
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? updatedItem : item
        ),
        isLoading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update item',
        isLoading: false 
      })
    }
  },

  // Delete item
  deleteItem: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) {
        set({ isLoading: false, error: 'User not authenticated' })
        return
      }

      const success = await dbManager.delete[ComponentName](user.id, id)
      
      if (success) {
        set(state => ({
          items: state.items.filter(item => item.id !== id),
          isLoading: false
        }))
      } else {
        set({ 
          error: 'Failed to delete item',
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete item',
        isLoading: false 
      })
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null })
  },

  // Clear user data (on logout)
  clearUserData: () => {
    set({ 
      items: [],
      stats: null,
      error: null,
      isLoading: false
    })
  }
}))
```

### Step 7: React Components

#### 7.1 Main List Component

Create `src/components/[componentName]/[ComponentName]List.tsx`:

```typescript
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { use[ComponentName]Store } from '../../stores/[componentName]Store'
import { useAuthStore } from '../../stores/authStore'
import { [ComponentName] } from '../../types'
import { 
  [Icon], 
  Plus, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  Eye
} from 'lucide-react'
import { Button } from '../ui/Button'
import { [ComponentName]Form } from './[ComponentName]Form'
import { [ComponentName]Detail } from './[ComponentName]Detail'

export const [ComponentName]List: React.FC = () => {
  const { items, loadItems, deleteItem, isLoading, error } = use[ComponentName]Store()
  const { isAuthenticated } = useAuthStore()
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<[ComponentName] | null>(null)
  const [viewingItem, setViewingItem] = useState<[ComponentName] | null>(null)

  // Load items on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadItems()
    }
  }, [isAuthenticated, loadItems])

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [items, searchTerm])

  // Handle delete item
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading items...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <[Icon] className="w-10 h-10 text-[color]-400" />
            [Component Name]
          </h1>
          <p className="text-green-200 text-lg">
            Manage your [component description]
          </p>
        </div>

        {/* Search and Add */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <[Icon] className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No items found</h3>
              <p className="text-slate-500">
                {searchTerm ? 'Try adjusting your search' : 'Start by adding your first item'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-300 mb-3">
                      {item.description}
                    </p>
                    <div className="text-sm text-slate-400">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingItem(item)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Modals */}
        {showForm && (
          <[ComponentName]Form
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              loadItems()
            }}
          />
        )}

        {editingItem && (
          <[ComponentName]Form
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSuccess={() => {
              setEditingItem(null)
              loadItems()
            }}
          />
        )}

        {viewingItem && (
          <[ComponentName]Detail
            item={viewingItem}
            onClose={() => setViewingItem(null)}
            onUpdate={() => loadItems()}
          />
        )}
      </div>
    </div>
  )
}
```

#### 7.2 Form Component

Create `src/components/[componentName]/[ComponentName]Form.tsx`:

```typescript
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { use[ComponentName]Store } from '../../stores/[componentName]Store'
import { [ComponentName], [ComponentName]FormData } from '../../types'
import { X, [Icon] } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

interface [ComponentName]FormProps {
  item?: [ComponentName]
  onClose: () => void
  onSuccess: () => void
}

export const [ComponentName]Form: React.FC<[ComponentName]FormProps> = ({
  item,
  onClose,
  onSuccess
}) => {
  const { createItem, updateItem, isLoading, error } = use[ComponentName]Store()
  
  const [formData, setFormData] = useState<[ComponentName]FormData>({
    title: '',
    description: '',
    status: 'active'
  })

  // Initialize form with existing item data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        status: item.status
      })
    }
  }, [item])

  const handleInputChange = (field: keyof [ComponentName]FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return
    }

    try {
      if (item) {
        // Update existing item
        await updateItem(item.id, formData)
      } else {
        // Create new item
        await createItem(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <[Icon] className="w-6 h-6 text-[color]-400" />
            <h2 className="text-xl font-bold text-white">
              {item ? 'Edit Item' : 'Add Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a title"
              required
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter a description..."
              rows={4}
              required
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
            >
              {isLoading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
```

#### 7.3 Detail Component

Create `src/components/[componentName]/[ComponentName]Detail.tsx`:

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { use[ComponentName]Store } from '../../stores/[componentName]Store'
import { [ComponentName] } from '../../types'
import { X, [Icon], Calendar, Edit3, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'

interface [ComponentName]DetailProps {
  item: [ComponentName]
  onClose: () => void
  onUpdate: () => void
}

export const [ComponentName]Detail: React.FC<[ComponentName]DetailProps> = ({
  item,
  onClose,
  onUpdate
}) => {
  const { deleteItem, isLoading } = use[ComponentName]Store()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(item.id)
        onClose()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <[Icon] className="w-6 h-6 text-[color]-400" />
            <h2 className="text-xl font-bold text-white">Item Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
          </div>

          {/* Meta Information */}
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="font-medium">Created:</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-300 whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

#### 7.4 Index File

Create `src/components/[componentName]/index.ts`:

```typescript
export { [ComponentName]List } from './[ComponentName]List'
export { [ComponentName]Form } from './[ComponentName]Form'
export { [ComponentName]Detail } from './[ComponentName]Detail'
```

### Step 8: Navigation Integration

#### 8.1 Update Header

Add to `src/components/layout/Header.tsx`:

```typescript
// Add import
import { [Icon] } from 'lucide-react'

// Add to navigation items
const allNavItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/daily', label: 'Daily Entry', icon: BookOpen },
  { path: '/review', label: 'SOAP Review', icon: BookMarked },
  { path: '/[component-name]', label: '[Component Name]', icon: [Icon] },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/admin', label: 'Admin', icon: Settings, adminOnly: true }
]
```

#### 8.2 Update App Routes

Add to `src/App.tsx`:

```typescript
// Add import
import { [ComponentName]List } from './components/[componentName]/[ComponentName]List'

// Add route
<Route path="/[component-name]" element={<[ComponentName]List />} />
```

### Step 9: Testing

#### 9.1 Create Test Script

Create `server/test_[component_name].cjs`:

```javascript
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'your-connection-string',
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function test[ComponentName]() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing [Component Name] System...\n');
    
    // 1. Get demo user
    console.log('1️⃣ Getting demo user...');
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['demo@dailydavid.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Demo user found: ${user.display_name} (${user.id})`);
    
    // 2. Create JWT token
    console.log('\n2️⃣ Creating JWT token...');
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        isAdmin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ JWT token created');
    
    // 3. Test creating an item
    console.log('\n3️⃣ Testing item creation...');
    const itemData = {
      title: 'Test Item',
      description: 'This is a test item to verify the system is working correctly.',
      status: 'active'
    };
    
    const insertResult = await client.query(`
      INSERT INTO [table_name] (user_id, title, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      user.id,
      itemData.title,
      itemData.description,
      itemData.status
    ]);
    
    const newItem = insertResult.rows[0];
    console.log(`✅ Item created with ID: ${newItem.id}`);
    console.log(`   Title: ${newItem.title}`);
    console.log(`   Status: ${newItem.status}`);
    
    // 4. Test reading items
    console.log('\n4️⃣ Testing item retrieval...');
    const readResult = await client.query(`
      SELECT * FROM [table_name] 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user.id]);
    
    console.log(`✅ Found ${readResult.rows.length} item(s) for user`);
    readResult.rows.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.status})`);
    });
    
    // 5. Test updating item
    console.log('\n5️⃣ Testing item update...');
    const updateResult = await client.query(`
      UPDATE [table_name] 
      SET status = 'completed'
      WHERE id = $1
      RETURNING *
    `, [newItem.id]);
    
    const updatedItem = updateResult.rows[0];
    console.log(`✅ Item updated:`);
    console.log(`   Status: ${updatedItem.status}`);
    
    // 6. Test API endpoints
    console.log('\n6️⃣ Testing API endpoints...');
    console.log('Testing GET /api/[component-name]...');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      const { stdout } = await execAsync(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/[component-name]`);
      const response = JSON.parse(stdout);
      console.log(`✅ API GET request successful: ${response.items.length} items returned`);
    } catch (error) {
      console.log('❌ API GET request failed:', error.message);
    }
    
    // 7. Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    await client.query('DELETE FROM [table_name] WHERE id = $1', [newItem.id]);
    console.log('✅ Test item deleted');
    
    console.log('\n🎉 [Component Name] System Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
  }
}

// Run the test
test[ComponentName]()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
```

#### 9.2 Run Tests

```bash
# Test database operations
cd server && node test_[component_name].cjs

# Test frontend
# Navigate to http://localhost:3008/[component-name]
```

### Step 10: Git Workflow

#### 10.1 Commit Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add [component name] system

- Create [table_name] table in Neon database with multitenant support
- Add TypeScript types for [component name] and related interfaces
- Create comprehensive API endpoints for CRUD operations
- Add database manager methods for [component name] operations
- Create Zustand store for [component name] state management
- Include user authentication and data isolation
- Add React components for list, form, and detail views
- Integrate with navigation and routing
- Include comprehensive testing and validation"

# Push to repository
git push origin main
```

## 🔧 Best Practices

### Security
- ✅ Always verify user ownership before database operations
- ✅ Use JWT tokens for authentication
- ✅ Validate input data on both frontend and backend
- ✅ Use parameterized queries to prevent SQL injection

### Performance
- ✅ Create database indexes for frequently queried fields
- ✅ Use pagination for large datasets
- ✅ Implement proper error handling
- ✅ Use React.memo for expensive components

### User Experience
- ✅ Provide loading states and error messages
- ✅ Use consistent styling with existing components
- ✅ Implement search and filtering capabilities
- ✅ Add confirmation dialogs for destructive actions

### Code Quality
- ✅ Follow TypeScript best practices
- ✅ Use consistent naming conventions
- ✅ Add proper error handling
- ✅ Include comprehensive testing

## 📝 Checklist

Before deploying a new component:

- [ ] Database table created with proper indexes
- [ ] TypeScript types defined
- [ ] API endpoints implemented with authentication
- [ ] Database manager methods added
- [ ] Zustand store created
- [ ] React components built (List, Form, Detail)
- [ ] Navigation integration completed
- [ ] Testing script created and passed
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design verified
- [ ] Git commit with descriptive message
- [ ] Code reviewed and tested locally

## 🚀 Deployment

After completing all steps:

1. **Test locally** - Verify all functionality works
2. **Commit changes** - Use descriptive commit messages
3. **Push to git** - Deploy to Vercel automatically
4. **Monitor** - Check logs and user feedback
5. **Iterate** - Make improvements based on usage

---

This runbook provides a comprehensive guide for adding new components to The Daily Forge application. Follow these steps to ensure consistency, security, and maintainability across all new features.

