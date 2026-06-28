import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
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
import LandlordBilling from './pages/LandlordBilling'
import Pricing from './pages/Pricing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Guidelines from './pages/Guidelines'
import PingPromo from './pages/PingPromo'
import GrainOverlay from './components/ui/Motion'
import CookieConsentBanner from './components/layout/CookieConsentBanner'
import CookieFeedbackToast from './components/layout/CookieFeedbackToast'
import CookiePreferencesModal from './components/layout/CookiePreferencesModal'
import ExitIntentModal from './components/layout/ExitIntentModal'
import AnalyticsTracker from './components/layout/AnalyticsTracker'
import UrgentNotificationLayer from './components/layout/UrgentNotificationLayer'
import BanEnforcementLayer from './components/ban/BanEnforcementLayer'
import NotificationSoundLayer from './components/layout/NotificationSoundLayer'
import NotificationSoundUnlockBanner from './components/layout/NotificationSoundUnlockBanner'
import PingGalaxyOverlay from './components/ping/PingGalaxyOverlay'
import { PingTransitionProvider } from './context/PingTransitionContext'
import GoogleMapsProvider from './components/maps/GoogleMapsProvider'
import { SavedListingsProvider } from './context/SavedListingsContext'
import { OnboardingProvider } from './context/OnboardingContext'
import WelcomeGuestModal from './components/onboarding/WelcomeGuestModal'
import OnboardingContinueBanner from './components/onboarding/OnboardingContinueBanner'
import { useLocale } from './context/LocaleContext'
import { useTranslation } from './hooks/useTranslation'

const TAB_ROUTES = new Set(['/', '/listings', '/universities', '/student', '/landlord'])

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0
}

function AppRoutes() {
  const location = useLocation()
  const { prefs } = useLocale()
  const isTabRoute = TAB_ROUTES.has(location.pathname)
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/complete-profile', '/check-email'].includes(location.pathname)
  const isDashboardRoute = location.pathname === '/student' || location.pathname === '/landlord' || location.pathname.startsWith('/landlord/') || location.pathname === '/admin'
  const isPingRoute = location.pathname === '/ping'
  const transition = isAuthRoute || isDashboardRoute
    ? { duration: prefs.reduceMotion ? 0 : 0.18, ease: [0.25, 0.1, 0.25, 1] }
    : { duration: prefs.reduceMotion ? 0 : 0.22, ease: [0.25, 0.1, 0.25, 1] }

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    scrollToTop()
    // Mobile browsers may restore scroll after paint — reset again on next frames.
    const raf = requestAnimationFrame(() => {
      scrollToTop()
      requestAnimationFrame(scrollToTop)
    })
    return () => cancelAnimationFrame(raf)
  }, [location.pathname, location.key])

  const routes = (
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
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/ping" element={<PingPromo />} />
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/landlord/verify" element={<ProtectedRoute role="landlord"><LandlordVerify /></ProtectedRoute>} />
          <Route path="/landlord" element={<ProtectedRoute role="landlord"><LandlordDashboard /></ProtectedRoute>} />
          <Route path="/landlord/billing" element={<ProtectedRoute role="landlord"><LandlordBilling /></ProtectedRoute>} />
          <Route path="/landlord/listings/new" element={<ProtectedRoute role="landlord"><CreateListing /></ProtectedRoute>} />
          <Route path="/landlord/listings/:id/edit" element={<ProtectedRoute role="landlord"><EditListing /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
    </Routes>
  )

  // Main nav tabs swap instantly — no blank fade between Home, Browse, Saved, etc.
  if (isTabRoute || prefs.reduceMotion || isPingRoute) {
    return routes
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={transition}
      >
        {routes}
      </motion.div>
    </AnimatePresence>
  )
}

function AppShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const isPingRoute = location.pathname === '/ping'

  return (
    <>
      <a href="#main-content" className="skip-link">{t('a11y.skipToContent')}</a>
      {!isPingRoute && <GrainOverlay />}
      <div className={`flex min-h-screen flex-col ${isPingRoute ? '' : 'pb-16 md:pb-0'}`}>
        <Navbar />
        <OnboardingContinueBanner />
        <main id="main-content" className="flex-1">
          <AppRoutes />
        </main>
        {!isPingRoute && <Footer />}
        {!isPingRoute && <MobileNav />}
        <AccessibilityMenu />
        <CookieConsentBanner />
        <CookiePreferencesModal />
        <CookieFeedbackToast />
        <UrgentNotificationLayer />
        <BanEnforcementLayer />
        <NotificationSoundLayer />
        <NotificationSoundUnlockBanner />
        <PingGalaxyOverlay />
        <ExitIntentModal />
        <WelcomeGuestModal />
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
          <NotificationsProvider>
          <SavedListingsProvider>
          <UniversitiesProvider>
            <GoogleMapsProvider>
              <CookieConsentProvider>
                <WelcomeReturnProvider>
                  <PingTransitionProvider>
                    <OnboardingProvider>
                      <AppShell />
                    </OnboardingProvider>
                  </PingTransitionProvider>
                </WelcomeReturnProvider>
              </CookieConsentProvider>
            </GoogleMapsProvider>
          </UniversitiesProvider>
          </SavedListingsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </LocaleProvider>
    </HashRouter>
  )
}
