import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { authApi } from "../features/auth/api/authApi"
import { setAuth, clearAuth } from "../store/authSlice"

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const { isInitialized } = useSelector((state) => state.auth)

  useEffect(() => {
    async function initializeAuth() {
      try {
        const profileRes = await authApi.getProfile()
        if (profileRes?.success && profileRes?.data) {
          dispatch(setAuth(profileRes.data))
        } else {
          dispatch(clearAuth())
        }
      } catch (err) {
        dispatch(clearAuth())
      }
    }

    initializeAuth()
  }, [dispatch])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Initializing session...</p>
        </div>
      </div>
    )
  }

  return children
}