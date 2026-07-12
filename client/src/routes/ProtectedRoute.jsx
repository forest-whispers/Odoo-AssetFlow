import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, isInitialized, user } = useSelector((state) => state.auth)

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = user?.role

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect unauthorized user to their main dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}