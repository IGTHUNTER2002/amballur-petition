import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { AdminDashboardPage } from './AdminDashboardPage'
import { AdminExportPage } from './AdminExportPage'
import { AdminLoginPage } from './AdminLoginPage'
import { AdminSettingsPage } from './AdminSettingsPage'
import { AdminSignaturesPage } from './AdminSignaturesPage'

export function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="signatures" element={<AdminSignaturesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="exports" element={<AdminExportPage />} />
      </Routes>
    </AuthProvider>
  )
}
