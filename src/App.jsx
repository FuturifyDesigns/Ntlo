import { useState, useCallback } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import SplashScreen from './components/layout/SplashScreen'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import MobileNav from './components/layout/MobileNav'
import AccessibilityMenu from './components/layout/AccessibilityMenu'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import Universities from './pages/Universities'
import UniversityPage from './pages/UniversityPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import CheckEmail from './pages/CheckEmail'
import StudentDashboard from './pages/StudentDashboard'
import LandlordDashboard from './pages/LandlordDashboard'
import CreateListing from './pages/CreateListing'
import EditListing from './pages/EditListing'
import NotFound from './pages/NotFound'
import Pricing from './pages/Pricing'
import GrainOverlay from './components/ui/Motion'
import { useLocale } from './context/LocaleContext'
import { useTranslation } from './hooks/useTranslation'

function AppRoutes() {
  const location = useLocation()
  const { prefs } = useLocale()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={prefs.reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefs.reduceMotion ? false : { opacity: 0 }}
        transition={{ duration: prefs.reduceMotion ? 0 : 0.25 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Browse />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/universities/:slug" element={<UniversityPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/landlord" element={<ProtectedRoute role="landlord"><LandlordDashboard /></ProtectedRoute>} />
          <Route path="/landlord/listings/new" element={<ProtectedRoute role="landlord"><CreateListing /></ProtectedRoute>} />
          <Route path="/landlord/listings/:id/edit" element={<ProtectedRoute role="landlord"><EditListing /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppShell() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('ntlo_splash_seen'))
  const { t } = useTranslation()

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('ntlo_splash_seen', '1')
    setShowSplash(false)
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">{t('a11y.skipToContent')}</a>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && <GrainOverlay />}
      <div className={`flex min-h-screen flex-col pb-16 transition-opacity duration-500 md:pb-0 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        <Navbar />
        <main id="main-content" className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
        <MobileNav />
        <AccessibilityMenu />
      </div>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <LocaleProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LocaleProvider>
    </HashRouter>
  )
}
