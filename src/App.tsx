import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { PetitionProvider } from './context/PetitionContext'
import { PublicLayout } from './pages/PublicLayout'
import { PageSpinner } from './components/ui'

const AdminRoutes = lazy(() => import('./pages/AdminRoutes').then((module) => ({ default: module.AdminRoutes })))
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage').then((module) => ({ default: module.ConfirmationPage })))
const PetitionLandingPage = lazy(() => import('./pages/PetitionLandingPage').then((module) => ({ default: module.PetitionLandingPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })))
const ResidentDetailsPage = lazy(() => import('./pages/ResidentDetailsPage').then((module) => ({ default: module.ResidentDetailsPage })))
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((module) => ({ default: module.ReviewPage })))
const SignaturePage = lazy(() => import('./pages/SignaturePage').then((module) => ({ default: module.SignaturePage })))

function RouteLoader({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>
}

function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-sm font-bold text-emerald-800">404</p><h1 className="mt-2 text-3xl font-black text-slate-950">This page is not available.</h1><a className="mt-5 inline-block font-bold text-emerald-800" href="/">Return to the petition</a></div></main>
}

function App() {
  return (
    <LanguageProvider>
      <PetitionProvider>
        <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<RouteLoader><PetitionLandingPage /></RouteLoader>} />
              <Route path="/sign" element={<RouteLoader><ResidentDetailsPage /></RouteLoader>} />
              <Route path="/sign/signature" element={<RouteLoader><SignaturePage /></RouteLoader>} />
              <Route path="/sign/review" element={<RouteLoader><ReviewPage /></RouteLoader>} />
              <Route path="/sign/confirmation" element={<RouteLoader><ConfirmationPage /></RouteLoader>} />
              <Route path="/privacy" element={<RouteLoader><PrivacyPage /></RouteLoader>} />
            </Route>
            <Route path="/admin/*" element={<RouteLoader><AdminRoutes /></RouteLoader>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </PetitionProvider>
    </LanguageProvider>
  )
}

export default App
