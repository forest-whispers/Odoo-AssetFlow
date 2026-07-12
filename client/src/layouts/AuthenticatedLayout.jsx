import { useState, useEffect } from "react"
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "../providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderTree,
  Package,
  RefreshCw,
  Calendar,
  Wrench,
  ClipboardCheck,
  TrendingUp,
  History,
  LogOut,
  Loader2,
  Menu,
  X,
  Sun,
  Moon,
  SettingsIcon,
  Bell
} from "lucide-react"
import { authApi } from "../features/auth/api/authApi"
import { clearAuth } from "../store/authSlice"
import { toast } from "sonner"
import Logo from "@/components/ui/Logo"
import { useNotificationsUnreadCountQuery } from "../features/notifications/hooks/useNotifications"

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "asset_manager", "department_head", "employee"] },
  { label: "Organization setup", path: "/organization-setup", icon: SettingsIcon, roles: ["admin"] },
  { label: "Assets", path: "/assets", icon: Package, roles: ["admin", "asset_manager", "department_head", "employee"] },
  { label: "Allocation & Transfer", path: "/allocations", icon: RefreshCw, roles: ["admin", "asset_manager", "department_head"] },
  { label: "Resource Booking", path: "/resource-booking", icon: Calendar, roles: ["admin", "asset_manager", "department_head", "employee"] },
  { label: "Maintenance", path: "/maintenance", icon: Wrench, roles: ["admin", "asset_manager", "department_head", "employee"] },
  { label: "Audit", path: "/asset-audits", icon: ClipboardCheck, roles: ["admin", "asset_manager", "department_head"] },
  { label: "Reports", path: "/analytics", icon: TrendingUp, roles: ["admin", "asset_manager", "department_head"] },
  { label: "Activity Logs", path: "/audit-logs", icon: History, roles: ["admin", "asset_manager"] },
  { label: "Notifications", path: "/notifications", icon: Bell, roles: ["admin", "asset_manager", "department_head", "employee"] }
]

export default function AuthenticatedLayout() {
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { data: unreadData } = useNotificationsUnreadCountQuery()
  const unreadCount = unreadData?.data?.count || 0

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#user-profile-menu")) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      window.addEventListener("click", handleClickOutside)
    }
    return () => window.removeEventListener("click", handleClickOutside)
  }, [dropdownOpen])

  // Close dropdown on navigation
  useEffect(() => {
    setDropdownOpen(false)
  }, [location.pathname])

  const { user } = useSelector((state) => state.auth)
  const currentRole = user?.role || "employee"
  const userName = user?.name || "User"
  
  // Format role label nicely
  const formattedRole = currentRole
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  // Filter items matching the user's role
  const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(currentRole))

  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      dispatch(clearAuth())
      toast.success("Successfully logged out")
      navigate("/login", { replace: true })
    },
    onError: (error) => {
      queryClient.clear()
      dispatch(clearAuth())
      const errMsg = error.response?.data?.message || "Session cleared"
      toast.success(`Logged out: ${errMsg}`)
      navigate("/login", { replace: true })
    },
  })

  const linkClass = (itemPath) => {
    const isActive =
      location.pathname === itemPath ||
      (itemPath !== "/" && location.pathname.startsWith(itemPath + "/"))
    return `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
      isActive
        ? "bg-primary text-primary-foreground shadow-xs scale-[1.01]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    }`
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 h-full border-r bg-card flex flex-col transform transition-transform duration-300 md:translate-x-0 md:relative shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-6 border-b flex items-center justify-between shrink-0">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Nav content */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
            {filteredNavItems.map((item, idx) => {
              const ItemIcon = item.icon
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={linkClass(item.path)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <ItemIcon className="h-4.5 w-4.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto font-extrabold text-[9px] h-4.5 min-w-4.5 rounded-full px-1.5 flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom logout section */}
          <div className="p-4 border-t border-border/10 bg-muted/5 space-y-2 shrink-0">
            <Button
              variant="outline"
              className="w-full justify-start text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive border-border/15 rounded-xl transition-all duration-300 cursor-pointer h-9"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
              ) : (
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-bold text-sm text-foreground hidden sm:block">
              AssetFlow Enterprise Resource Portal
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              className="cursor-pointer h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-yellow-500" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-primary" />
              )}
            </Button>

            {/* User Profile Avatar Dropdown */}
            <div id="user-profile-menu" className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-extrabold text-primary shadow-xs select-none hover:bg-primary/25 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                title={userName}
              >
                {userInitials}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-card border rounded-2xl shadow-lg py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 flex items-center gap-3 border-b pb-2.5 mb-1.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary select-none">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-foreground truncate">
                        {userName}
                      </h4>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 block tracking-wider">
                        {formattedRole}
                      </span>
                    </div>
                  </div>

                  <div className="px-1.5 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        logoutMutation.mutate()
                      }}
                      disabled={logoutMutation.isPending}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
                    >
                      {logoutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      ) : (
                        <LogOut className="h-4 w-4 shrink-0" />
                      )}
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
