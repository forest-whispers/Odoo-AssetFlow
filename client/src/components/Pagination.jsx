import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  label = "items",
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const startRange = (page - 1) * limit + 1
  const endRange = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6 mt-6">
      {/* Range Status Label */}
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{startRange}</span> to{" "}
        <span className="font-semibold text-foreground">{endRange}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> {label}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="h-8 w-8 cursor-pointer disabled:pointer-events-none disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numeric Page List */}
        {pages.map((p) => {
          const isActive = p === page
          return (
            <Button
              key={p}
              variant={isActive ? "default" : "outline"}
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 text-xs font-semibold cursor-pointer ${
                isActive ? "font-bold shadow-xs" : ""
              }`}
            >
              {p}
            </Button>
          )
        })}

        {/* Next Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="h-8 w-8 cursor-pointer disabled:pointer-events-none disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
