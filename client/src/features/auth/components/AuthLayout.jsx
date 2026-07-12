import { Box } from "lucide-react"

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-background text-foreground transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center mb-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <Box className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-6 border border-border/60 shadow-xs sm:rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}
