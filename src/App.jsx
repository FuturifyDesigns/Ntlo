import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { UniversitiesProvider } from './context/UniversitiesContext'
import { LocaleProvider } from './context/LocaleContext'
import { WelcomeReturnProvider } from './context/WelcomeReturnContext'
import { CookieConsentProvider } from './context/CookieConsentContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
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
import CompleteProfile from './pages/CompleteProfile'
import OAuthSetupRoute from './components/layout/OAuthSetupRoute'
import StudentDashboard from './pages/StudentDashboard'
import LandlordDashboard from './pages/LandlordDashboard'
import CreateListing from './pages/CreateListing'
import EditListing from './pages/EditListing'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/AdminDashboard'
import LandlordVerify from './pages/LandlordVerify'
import Pricing from './pages/Pricing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import GrainOverlay from './components/ui/Motion'
import CookieConsentBanner from './components/layout/CookieConsentBanner'
import CookieFeedbackToast from './components/layout/CookieFeedbackToast'
import CookiePreferencesModal from './components/layout/CookiePreferencesModal'
import ExitIntentModal from './components/layout/ExitIntentModal'
import AnalyticsTracker from './components/layout/AnalyticsTracker'
import GoogleMapsProvider from './components/maps/GoogleMapsProvider'
import { useLocale } from './context/LocaleContext'
import { useTranslation } from './hooks/useTranslation'

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo(0, 0)
  // Some mobile browsers track scroll on the documentElement/body separately.
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0
}

function AppRoutes() {
  const location = useLocation()
  const { prefs } = useLocale()
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/complete-profile', '/check-email'].includes(location.pathname)
  const isDashboardRoute = location.pathname === '/student' || location.pathname === '/landlord' || location.pathname.startsWith('/landlord/') || location.pathname === '/admin'
  const transition = isAuthRoute || isDashboardRoute
    ? { duration: prefs.reduceMotion ? 0 : 0.15, ease: 'easeOut' }
    : { duration: prefs.reduceMotion ? 0 : 0.22, ease: 'easeInOut' }

  // With animations off there's no exit phase, so reset scroll on path change.
  useEffect(() => {
    if (prefs.reduceMotion) scrollToTop()
  }, [location.pathname, prefs.reduceMotion])

  return (
    <AnimatePresence mode="wait" onExitComplete={scrollToTop}>
      <motion.div
        key={location.pathname}
        initial={prefs.reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefs.reduceMotion ? false : { opacity: 0 }}
        transition={transition}
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
          <Route path="/complete-profile" element={<OAuthSetupRoute><CompleteProfile /></OAuthSetupRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/landlord/verify" element={<ProtectedRoute role="landlord"><LandlordVerify /></ProtectedRoute>} />
          <Route path="/landlord" element={<ProtectedRoute role="landlord" requireLandlordVerified><LandlordDashboard /></ProtectedRoute>} />
          <Route path="/landlord/listings/new" element={<ProtectedRoute role="landlord" requireLandlordVerified><CreateListing /></ProtectedRoute>} />
          <Route path="/landlord/listings/:id/edit" element={<ProtectedRoute role="landlord" requireLandlordVerified><EditListing /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppShell() {
  const { t } = useTranslation()

  return (
    <>
      <a href="#main-content" className="skip-link">{t('a11y.skipToContent')}</a>
      <GrainOverlay />
      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Navbar />
        <main id="main-content" className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
        <MobileNav />
        <AccessibilityMenu />
        <CookieConsentBanner />
        <CookiePreferencesModal />
        <CookieFeedbackToast />
        <ExitIntentModal />
        <AnalyticsTracker />
      </div>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <LocaleProvider>
        <AuthProvider>
          <UniversitiesProvider>
            <GoogleMapsProvider>
              <CookieConsentProvider>
                <WelcomeReturnProvider>
                  <AppShell />
                </WelcomeReturnProvider>
              </CookieConsentProvider>
            </GoogleMapsProvider>
          </UniversitiesProvider>
        </AuthProvider>
      </LocaleProvider>
    </HashRouter>
  )
}
