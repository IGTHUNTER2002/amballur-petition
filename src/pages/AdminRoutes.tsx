import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { PageSpinner } from '../components/ui'

const AdminDashboardPage = lazy(() => import('./AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))
const AdminExportPage = lazy(() => import('./AdminExportPage').then((module) => ({ default: module.AdminExportPage })))
const AdminLoginPage = lazy(() => import('./AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })))
const AdminSettingsPage = lazy(() => import('./AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })))
const AdminSignaturesPage = lazy(() => import('./AdminSignaturesPage').then((module) => ({ default: module.AdminSignaturesPage })))

export function AdminRoutes() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="signatures" element={<AdminSignaturesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="exports" element={<AdminExportPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
