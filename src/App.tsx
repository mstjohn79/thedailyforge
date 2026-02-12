
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Dashboard } from './components/dashboard/Dashboard'
import { DailyEntry } from './components/daily/DailyEntry'
import { SOAPReview } from './components/review/SOAPReview'
import { SermonNotesPage } from './components/sermon/SermonNotesPage'
import { PrayerRequestsList } from './components/prayer/PrayerRequestsList'
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute'
import { ProgressAnalytics } from './components/dashboard/ProgressAnalytics'
import { LoginForm } from './components/auth/LoginForm'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SettingsPage } from './components/settings/SettingsPage'
import { LandingPage } from './components/landing/LandingPage'
import { useAuthStore } from './stores/authStore'
import { dbManager } from './lib/database'
import { OnboardingTour, OnboardingTrigger } from './components/onboarding'
import './App.css'

// Component to handle scroll to top on route changes
function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    // Scroll to top immediately when route changes
    window.scrollTo(0, 0)
  }, [location])

  return null
}

function App() {
  const { initialize } = useAuthStore()

  // Initialize auth state on app load
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Router>
      <ScrollToTop />
      <OnboardingTrigger />
      {/* Updated theme - slate/dark green - force deployment */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 relative overflow-hidden">
        
        {/* Mountain silhouette background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-green-700 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-green-600 to-transparent transform translate-x-32"></div>
          <div className="absolute bottom-0 right-0 w-full h-56 bg-gradient-to-t from-green-700 to-transparent transform -translate-x-32"></div>
        </div>
        <OnboardingTour>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/dashboard" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <Dashboard />
                </main>
                <Footer />
              </>
            } />
            <Route path="/daily" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <DailyEntry />
                </main>
                <Footer />
              </>
            } />
            <Route path="/review" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <SOAPReview />
                </main>
                <Footer />
              </>
            } />
            <Route path="/sermon-notes" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <SermonNotesPage />
                </main>
                <Footer />
              </>
            } />
            <Route path="/prayer" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <PrayerRequestsList />
                </main>
                <Footer />
              </>
            } />
            <Route path="/admin" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <ProtectedAdminRoute dbManager={dbManager} />
                </main>
                <Footer />
              </>
            } />
            <Route path="/analytics" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <ProgressAnalytics />
                </main>
                <Footer />
              </>
            } />
            <Route path="/settings" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8 pt-24 min-h-screen">
                  <SettingsPage />
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </OnboardingTour>
      </div>
    </Router>
  )
}

export default App
