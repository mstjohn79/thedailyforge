import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, BarChart3, Settings, LogOut, Mountain, TrendingUp, Menu, X, BookMarked, Sword, User, FileText } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/Button'
import { TakeTourButton } from '../onboarding'

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/daily', label: 'Daily Entry', icon: BookOpen },
    { path: '/review', label: 'SOAP Review', icon: BookMarked },
    { path: '/sermon-notes', label: 'Sermon Notes', icon: FileText },
    { path: '/prayer', label: 'Prayer Requests', icon: Sword },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/settings', label: 'Settings', icon: User },
    { path: '/admin', label: 'Admin', icon: Settings, adminOnly: true }
  ]

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => !item.adminOnly || user?.is_admin)

  const handleLogout = () => {
    logout()
  }

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 min-w-0 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mountain className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Daily Forge</span>
          </Link>

          {/* Navigation - Desktop (shows icons + labels) */}
          {isAuthenticated && (
            <nav className="hidden xl:flex items-center space-x-1 2xl:space-x-2 flex-1 justify-center max-w-5xl mx-2 2xl:mx-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 2xl:space-x-2 px-2 2xl:px-3 py-1.5 2xl:py-2 rounded-lg text-xs 2xl:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-green-200 hover:text-white hover:bg-green-700/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Navigation - Laptop/Medium screens (shows icons only) */}
          {isAuthenticated && (
            <nav className="hidden md:flex xl:hidden items-center space-x-0.5 lg:space-x-1 flex-1 justify-center max-w-sm lg:max-w-md mx-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-green-200 hover:text-white hover:bg-green-700/50'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-green-200 hover:text-white hover:bg-green-700/50 rounded-lg transition-colors flex-shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <span className="text-xs sm:text-sm text-green-200 hidden md:block truncate max-w-24 lg:max-w-32">
                  Welcome, {user?.name}
                </span>
                <TakeTourButton variant="icon" size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 md:px-3"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:block text-xs sm:text-sm">Logout</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm" className="px-2 sm:px-3 md:px-4 text-xs sm:text-sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isAuthenticated && isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-lg"
        >
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <nav className="flex flex-col space-y-1 sm:space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-green-200 hover:text-white hover:bg-green-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
              
              {/* Tour Button in Mobile Menu */}
              <div className="pt-2 border-t border-slate-700">
                <TakeTourButton variant="button" size="sm" className="w-full justify-center" />
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}