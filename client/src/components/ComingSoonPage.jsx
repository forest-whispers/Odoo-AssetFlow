import React from "react"
import { Box } from "lucide-react"

export default function ComingSoonPage({ title = "Feature" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Box className="h-6 w-6 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        {title} Under Construction
      </h2>
      <p className="text-sm text-muted-foreground max-w-md">
        This module is scheduled for implementation in the next pass. The backend APIs have already been wired and verified for integration.
      </p>
    </div>
  )
}
