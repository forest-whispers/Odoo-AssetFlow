import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth)

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}