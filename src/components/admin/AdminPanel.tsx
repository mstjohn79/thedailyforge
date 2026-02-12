import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Trash2, Settings } from 'lucide-react'

import { useAuthStore } from '../../stores/authStore'
import { DatabaseManager } from '../../lib/database'
import { User } from '../../types'
import { Button, Card } from '../ui'

interface AdminPanelProps {
  dbManager: DatabaseManager
}

export function AdminPanel({ dbManager }: AdminPanelProps) {
  const { user, logout } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    displayName: '',
    password: '',
    isAdmin: false
  })

  // Load users on mount
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await dbManager.getAllUsers()
      if (response.success && response.data) {
        // Convert DatabaseUser to User type
        const convertedUsers: User[] = response.data.map(dbUser => ({
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.display_name,
          display_name: dbUser.display_name,
          role: dbUser.is_admin ? 'admin' : 'user',
          is_admin: dbUser.is_admin,
          createdAt: new Date(dbUser.created_at),
          created_at: new Date(dbUser.created_at),
          lastLoginAt: undefined
        }))
        setUsers(convertedUsers)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUserForm.email || !newUserForm.displayName || !newUserForm.password) {
      alert('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      
      const response = await dbManager.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        displayName: newUserForm.displayName,
        isAdmin: newUserForm.isAdmin
      })
      
      if (response.success && response.data) {
        // Convert the created user to User type
        const newUser: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.display_name,
          display_name: response.data.display_name,
          role: response.data.is_admin ? 'admin' : 'user',
          is_admin: response.data.is_admin,
          createdAt: new Date(response.data.created_at),
          created_at: new Date(response.data.created_at),
          lastLoginAt: undefined
        }
        
        setUsers(prev => [newUser, ...prev])
        setNewUserForm({ email: '', displayName: '', password: '', isAdmin: false })
        
        alert(`✅ User created successfully!\n\nEmail: ${newUser.email}\nDisplay Name: ${newUser.display_name}`)
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      alert(`❌ Failed to create user: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await dbManager.deleteUser(userId)
      
      if (response.success && response.data) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        alert(`✅ User "${userName}" deleted successfully`)
      } else {
        throw new Error(response.error || 'Delete operation failed')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert(`❌ Failed to delete user: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-green-400" />
              Admin Panel
            </h1>
            <p className="text-slate-300 mt-2">
              Manage users and system settings for The Daily David
            </p>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300">
              Logged in as: <span className="font-semibold text-white">{user?.email}</span>
            </div>
                            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Add User Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                Add New User
              </h2>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-3 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-700/60 text-white placeholder-slate-400"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.displayName}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-3 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-700/60 text-white placeholder-slate-400"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-3 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-700/60 text-white placeholder-slate-400"
                    placeholder="Enter password"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newUserForm.isAdmin}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-medium text-slate-300">
                    Admin User
                  </label>
                </div>
                
                <Button 
                  type="submit" 
                  loading={loading}
                  className="w-full"
                >
                  Add User
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  Users ({users.length})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsers}
                  loading={loading}
                >
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No users found. Add a user to get started.
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-700"
                    >
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {user.display_name}
                          {user.is_admin && (
                            <span className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded-full border border-green-600/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-300">{user.email}</div>
                        <div className="text-xs text-slate-400">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.display_name)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-600/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-300">Version:</span> <span className="text-white">Daily David Modern v2.0</span>
              </div>
              <div>
                <span className="font-medium text-slate-300">Database:</span> <span className="text-white">Neon PostgreSQL</span>
              </div>
              <div>
                <span className="font-medium text-slate-300">Total Users:</span> <span className="text-white">{users.length}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}