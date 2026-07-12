import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Calendar,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  Trash,
  CheckCircle,
  Building,
  Bookmark
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useResourcesQuery,
  useCreateResourceMutation,
  useBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useCompleteBookingMutation
} from "../hooks/useResources"
import Pagination from "@/components/Pagination"

const resourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Resource name must contain at least 2 characters")
    .max(100, "Resource name cannot exceed 100 characters"),
  type: z.enum(["meeting_room", "conference_room", "projector", "vehicle", "equipment", "other"]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  capacity: z.coerce.number().int().positive("Capacity must be positive").optional().or(z.nan()).or(z.null()),
})

const bookingSchema = z.object({
  resource: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a resource"),
  purpose: z
    .string()
    .trim()
    .min(3, "Purpose must contain at least 3 characters")
    .max(500, "Purpose is too long"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true
  return new Date(data.endTime) > new Date(data.startTime)
}, {
  message: "End time must be after the start time",
  path: ["endTime"],
})

const cancelSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
})

export default function ResourcesPage() {
  const { user } = useSelector((state) => state.auth)
  const isManager = ["admin", "asset_manager"].includes(user?.role)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const activeTab = searchParams.get("tab") || "discover" // discover | bookings
  const resourceTypeFilter = searchParams.get("type") || ""
  const bookingStatusFilter = searchParams.get("status") || ""

  // Modals state
  const [createResourceOpen, setCreateResourceOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [conflictError, setConflictError] = useState("")

  // Fetch Resources (discovery tab)
  const resourcesParams = useMemo(() => {
    const params = {}
    if (resourceTypeFilter) params.type = resourceTypeFilter
    return params
  }, [resourceTypeFilter])

  const { data: resourcesData, isLoading: resourcesLoading, refetch: refetchResources } = useResourcesQuery(resourcesParams)
  const resourcesList = resourcesData?.data || []

  // Fetch Bookings (bookings tab)
  const bookingsParams = useMemo(() => {
    const params = { page, limit: 10 }
    if (bookingStatusFilter) params.status = bookingStatusFilter
    // Employees and Dept Heads only see their own bookings (backend enforces this but let's pass it too)
    if (user?.role === "employee" || user?.role === "department_head") {
      params.bookedBy = user.id
    }
    return params
  }, [page, bookingStatusFilter, user])

  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useBookingsQuery(bookingsParams)
  const bookingsList = bookingsData?.data?.bookings || []
  const pagination = bookingsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Mutations
  const createResourceMutation = useCreateResourceMutation()
  const createBookingMutation = useCreateBookingMutation()
  const cancelBookingMutation = useCancelBookingMutation()
  const completeBookingMutation = useCompleteBookingMutation()

  // Forms
  const resourceForm = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: { name: "", type: "meeting_room", description: "", location: "", capacity: 1 },
  })

  const bookingForm = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { resource: "", purpose: "", startTime: "", endTime: "" },
  })

  const cancelForm = useForm({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" },
  })

  // URL Sync
  useEffect(() => {
    const nextParams = {}
    if (activeTab) nextParams.tab = activeTab
    if (activeTab === "bookings") {
      if (page > 1) nextParams.page = String(page)
      if (bookingStatusFilter) nextParams.status = bookingStatusFilter
    } else {
      if (resourceTypeFilter) nextParams.type = resourceTypeFilter
    }
    setSearchParams(nextParams)
  }, [activeTab, page, resourceTypeFilter, bookingStatusFilter])

  const handleTabChange = (tab) => {
    setSearchParams({ tab, page: "1" })
  }

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  const handleResourceTypeChange = (type) => {
    setSearchParams((prev) => {
      prev.set("tab", "discover")
      if (type) prev.set("type", type)
      else prev.delete("type")
      return prev
    })
  }

  const handleBookingStatusChange = (status) => {
    setSearchParams((prev) => {
      prev.set("tab", "bookings")
      prev.set("page", "1")
      if (status) prev.set("status", status)
      else prev.delete("status")
      return prev
    })
  }

  const handleOpenCreateResource = () => {
    resourceForm.reset({ name: "", type: "meeting_room", description: "", location: "", capacity: 1 })
    setCreateResourceOpen(true)
  }

  const handleOpenBookModal = (res) => {
    setSelectedResource(res)
    setConflictError("")
    bookingForm.reset({ resource: res._id, purpose: "", startTime: "", endTime: "" })
    setBookModalOpen(true)
  }

  const handleOpenCancelModal = (booking, event) => {
    event.stopPropagation()
    setSelectedBooking(booking)
    cancelForm.reset({ reason: "" })
    setCancelModalOpen(true)
  }

  const handleCreateResource = (data) => {
    createResourceMutation.mutate(data, {
      onSuccess: () => {
        setCreateResourceOpen(false)
      },
    })
  }

  const handleCreateBooking = (data) => {
    setConflictError("")
    createBookingMutation.mutate(data, {
      onSuccess: (res) => {
        toast.success(res.message || "Resource booked successfully")
        setBookModalOpen(false)
      },
      onError: (err) => {
        // Surface the real backend conflict error message
        const backendMessage = err.response?.data?.message || err.message || "Failed to book resource"
        setConflictError(backendMessage)
        toast.error(backendMessage)
      },
    })
  }

  const handleCancelBooking = (data) => {
    cancelBookingMutation.mutate(
      { id: selectedBooking._id, data },
      {
        onSuccess: () => {
          setCancelModalOpen(false)
        },
      }
    )
  }

  const handleCompleteBooking = (bookingId, event) => {
    event.stopPropagation()
    completeBookingMutation.mutate({ id: bookingId })
  }

  const getResourceTypeLabel = (type) => {
    const types = {
      meeting_room: "Meeting Room",
      conference_room: "Conference Room",
      projector: "Projector",
      vehicle: "Company Vehicle",
      equipment: "Specialist Equipment",
      other: "General Resource"
    }
    return types[type] || type
  }

  const getBookingStatusBadge = (status) => {
    const styles = {
      booked: "bg-emerald-500/10 text-emerald-600 border-emerald-200/35",
      cancelled: "bg-rose-500/10 text-rose-600 border-rose-200/35",
      completed: "bg-blue-500/10 text-blue-600 border-blue-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-bold text-[10px] rounded-md ${styles[status] || ""}`}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Resource Scheduler</h2>
          <p className="text-xs text-muted-foreground">
            Reserve meeting rooms, vehicles, projectors, and shared operational equipment.
          </p>
        </div>
        {isManager && (
          <Button onClick={handleOpenCreateResource} className="cursor-pointer gap-2 h-9 rounded-xl font-bold self-start sm:self-auto text-xs">
            <Plus className="h-4 w-4" /> Create Resource
          </Button>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => handleTabChange("discover")}
          className={`px-4 py-2 font-bold text-xs cursor-pointer border-b-2 -mb-[2px] transition-colors ${
            activeTab === "discover"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Discover Resources
        </button>
        <button
          onClick={() => handleTabChange("bookings")}
          className={`px-4 py-2 font-bold text-xs cursor-pointer border-b-2 -mb-[2px] transition-colors ${
            activeTab === "bookings"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Bookings Log
        </button>
      </div>

      {activeTab === "discover" ? (
        <div className="space-y-6">
          {/* Resource discovery filters */}
          <Card className="border border-border/50 shadow-xs">
            <CardContent className="p-4 flex flex-wrap gap-2 items-center">
              <Label className="text-xs font-bold text-muted-foreground mr-2">Resource Type:</Label>
              {[
                { key: "", label: "All Types" },
                { key: "meeting_room", label: "Meeting Rooms" },
                { key: "conference_room", label: "Conference Rooms" },
                { key: "projector", label: "Projectors" },
                { key: "vehicle", label: "Vehicles" },
                { key: "equipment", label: "Equipment" }
              ].map((t) => (
                <Button
                  key={t.key}
                  variant={resourceTypeFilter === t.key ? "secondary" : "outline"}
                  onClick={() => handleResourceTypeChange(t.key)}
                  className="h-8 text-[11px] font-bold rounded-lg cursor-pointer px-3"
                >
                  {t.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Resources listing */}
          {resourcesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading resource pool...</p>
            </div>
          ) : resourcesList.length === 0 ? (
            <Card className="border border-dashed border-border/40 p-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">No Resources Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                There are no resources registered matching the selected category.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resourcesList.map((res) => (
                <Card key={res._id} className="border border-border/40 hover:border-primary/20 shadow-2xs hover:shadow-xs flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-300">
                  <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5 flex flex-row items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-extrabold text-foreground">{res.name}</CardTitle>
                      <CardDescription className="text-[10px] mt-0.5">{getResourceTypeLabel(res.type)}</CardDescription>
                    </div>
                    {res.capacity && (
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 rounded-md font-bold shrink-0">
                        Cap: {res.capacity}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-5 flex-1 space-y-4 text-xs">
                    {res.location && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Location</span>
                        <p className="font-semibold text-foreground mt-0.5">{res.location}</p>
                      </div>
                    )}
                    {res.description && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Description</span>
                        <p className="text-muted-foreground leading-relaxed mt-0.5 line-clamp-3">{res.description}</p>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-5 pt-0 flex justify-end">
                    <Button onClick={() => handleOpenBookModal(res)} className="h-8 px-4 cursor-pointer text-xs font-bold gap-1 rounded-xl">
                      <Bookmark className="h-3.5 w-3.5" /> Book Resource
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bookings log filters */}
          <Card className="border border-border/50 shadow-xs">
            <CardContent className="p-4 flex flex-wrap gap-2 items-center">
              <Label className="text-xs font-bold text-muted-foreground mr-2">Status:</Label>
              {[
                { key: "", label: "All Bookings" },
                { key: "booked", label: "Confirmed" },
                { key: "completed", label: "Completed" },
                { key: "cancelled", label: "Cancelled" }
              ].map((s) => (
                <Button
                  key={s.key}
                  variant={bookingStatusFilter === s.key ? "secondary" : "outline"}
                  onClick={() => handleBookingStatusChange(s.key)}
                  className="h-8 text-[11px] font-bold rounded-lg cursor-pointer px-3"
                >
                  {s.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Bookings listing table */}
          {bookingsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading bookings log...</p>
            </div>
          ) : bookingsList.length === 0 ? (
            <Card className="border border-dashed border-border/40 p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">No Bookings Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                There are no resource booking records logged matching this status.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                        <th className="p-4">Resource Target</th>
                        <th className="p-4">Reserved By</th>
                        <th className="p-4">Purpose</th>
                        <th className="p-4">Schedule Period</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsList.map((bk) => (
                        <tr key={bk._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150">
                          <td className="p-4">
                            <div className="font-bold text-foreground">{bk.resource?.name || "Deleted Resource"}</div>
                            <div className="text-[10px] text-muted-foreground">{getResourceTypeLabel(bk.resource?.type)}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{bk.bookedBy?.name || "N/A"}</div>
                            <div className="text-[10px] text-muted-foreground">{bk.department?.name || ""}</div>
                          </td>
                          <td className="p-4 max-w-[200px] truncate text-muted-foreground">{bk.purpose}</td>
                          <td className="p-4 text-muted-foreground">
                            <div>{new Date(bk.startTime).toLocaleString()}</div>
                            <div className="text-[10px] text-primary/80 font-medium">to {new Date(bk.endTime).toLocaleString()}</div>
                          </td>
                          <td className="p-4">{getBookingStatusBadge(bk.status)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {bk.status === "booked" && (
                                <>
                                  {isManager && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => handleCompleteBooking(bk._id, e)}
                                      className="h-8 cursor-pointer text-[10px] font-bold rounded-lg"
                                      disabled={completeBookingMutation.isPending}
                                    >
                                      Complete
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => handleOpenCancelModal(bk, e)}
                                    className="h-8 text-[10px] font-bold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={10}
                onPageChange={handlePageChange}
                label="bookings"
              />
            </div>
          )}
        </div>
      )}

      {/* Create Resource Modal */}
      {createResourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Create Shared Resource</h3>
              <Button variant="ghost" size="icon" onClick={() => setCreateResourceOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={resourceForm.handleSubmit(handleCreateResource)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Resource Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Conference Room B"
                  {...resourceForm.register("name")}
                  className={`mt-1 h-9 ${resourceForm.formState.errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                {resourceForm.formState.errors.name && (
                  <p className="text-[10px] text-destructive mt-0.5">{resourceForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Resource Type</Label>
                  <select
                    id="type"
                    {...resourceForm.register("type")}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="meeting_room">Meeting Room</option>
                    <option value="conference_room">Conference Room</option>
                    <option value="projector">Projector</option>
                    <option value="vehicle">Company Vehicle</option>
                    <option value="equipment">Specialist Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity (Optional)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    {...resourceForm.register("capacity")}
                    className="mt-1 h-9"
                  />
                  {resourceForm.formState.errors.capacity && (
                    <p className="text-[10px] text-destructive mt-0.5">{resourceForm.formState.errors.capacity.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="location">Physical Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. 4th Floor Headquarters"
                  {...resourceForm.register("location")}
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="description">Resource Description</Label>
                <textarea
                  id="description"
                  {...resourceForm.register("description")}
                  placeholder="Notes about amenities or special access rules..."
                  className="mt-1 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setCreateResourceOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createResourceMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {createResourceMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Register Resource
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Resource Modal */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Book Resource</h3>
              <Button variant="ghost" size="icon" onClick={() => setBookModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={bookingForm.handleSubmit(handleCreateBooking)} className="p-6 space-y-4">
              <div className="bg-muted/10 p-3 rounded-xl border border-border/20 text-xs">
                <span className="font-bold text-foreground">Resource:</span> {selectedResource?.name}
                {selectedResource?.location && <div className="text-muted-foreground mt-0.5">{selectedResource.location}</div>}
              </div>

              {conflictError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-xs flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <div>
                    <span className="font-bold">Schedule Conflict:</span>
                    <p className="mt-0.5 leading-relaxed font-semibold">{conflictError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Date & Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    {...bookingForm.register("startTime")}
                    className={`mt-1 h-9 ${bookingForm.formState.errors.startTime ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  {bookingForm.formState.errors.startTime && (
                    <p className="text-[10px] text-destructive mt-0.5">{bookingForm.formState.errors.startTime.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endTime">End Date & Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    {...bookingForm.register("endTime")}
                    className={`mt-1 h-9 ${bookingForm.formState.errors.endTime ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  {bookingForm.formState.errors.endTime && (
                    <p className="text-[10px] text-destructive mt-0.5">{bookingForm.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Booking Purpose</Label>
                <textarea
                  id="purpose"
                  {...bookingForm.register("purpose")}
                  placeholder="Explain why this reservation is required..."
                  className="mt-1 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
                {bookingForm.formState.errors.purpose && (
                  <p className="text-[10px] text-destructive mt-0.5">{bookingForm.formState.errors.purpose.message}</p>
                )}
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setBookModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {createBookingMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Reservation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-sm border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Cancel Booking</h3>
              <Button variant="ghost" size="icon" onClick={() => setCancelModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={cancelForm.handleSubmit(handleCancelBooking)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Cancellation (Optional)</Label>
                <textarea
                  id="reason"
                  {...cancelForm.register("reason")}
                  placeholder="Explain why this reservation is cancelled..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setCancelModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Close
                </Button>
                <Button type="submit" disabled={cancelBookingMutation.isPending} className="h-9 cursor-pointer text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/95">
                  {cancelBookingMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Cancel Reservation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
