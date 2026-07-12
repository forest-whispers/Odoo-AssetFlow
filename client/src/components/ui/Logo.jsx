import React from "react"
import { Box } from "lucide-react"

export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 font-extrabold text-lg select-none text-foreground ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Box className="h-5 w-5" />
      </div>
      <span>
        Asset<span className="text-primary">Flow</span>
      </span>
    </div>
  )
}
