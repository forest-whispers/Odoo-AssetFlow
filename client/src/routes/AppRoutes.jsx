import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import PublicLayout from "../layouts/PublicLayout"
import AuthenticatedLayout from "../layouts/AuthenticatedLayout"
import ProtectedRoute from "./ProtectedRoute"
import PublicOnlyRoute from "./PublicOnlyRoute"

// Pages
import LandingPage from "../features/landing/pages/LandingPage"
import LoginPage from "../features/auth/pages/LoginPage"
import RegisterPage from "../features/auth/pages/RegisterPage"
import DashboardPage from "../features/dashboard/pages/DashboardPage"
import AssetsPage from "../features/assets/pages/AssetsPage"
import AllocationsPage from "../features/allocations/pages/AllocationsPage"
import ResourcesPage from "../features/resources/pages/ResourcesPage"
import MaintenancePage from "../features/maintenance/pages/MaintenancePage"
import OrganizationPage from "../features/organization/pages/OrganizationPage"
import AssetAuditPage from "../features/assetAudit/pages/AssetAuditPage"
import AnalyticsPage from "../features/analytics/pages/AnalyticsPage"
import ActivityLogsPage from "../features/activityLogs/pages/ActivityLogsPage"
import NotificationsPage from "../features/notifications/pages/NotificationsPage"

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
        </Route>

        {/* Authenticated routes inside dashboard shell */}
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          {/* Shared dashboard route */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Feature Routes, protected by role-awareness */}
          <Route
            path="/organization-setup"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <OrganizationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head", "employee"]}>
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allocations"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head"]}>
                <AllocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resource-booking"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head", "employee"]}>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head", "employee"]}>
                <MaintenancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/asset-audits"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head"]}>
                <AssetAuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager"]}>
                <ActivityLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["admin", "asset_manager", "department_head", "employee"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback Route */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
              <p className="text-muted-foreground mb-4">The page you are looking for does not exist.</p>
              <Navigate to="/dashboard" replace />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}