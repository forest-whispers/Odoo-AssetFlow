import { Outlet } from "react-router-dom"
import { useTheme } from "../providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"
import Logo from "@/components/ui/Logo"

export default function PublicLayout() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-md py-3 px-4 md:px-6 flex items-center justify-between shadow-xs">
        <Logo />
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
            className="h-8 w-8 cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center">
        <Outlet />
      </main>
    </div>
  )
}
