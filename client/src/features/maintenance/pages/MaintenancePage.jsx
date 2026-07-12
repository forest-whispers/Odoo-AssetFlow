import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Wrench,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  Check,
  Ban,
  Clock,
  Eye,
  FileText
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useMaintenanceRequestsQuery,
  useCreateMaintenanceMutation,
  useApproveMaintenanceMutation,
  useRejectMaintenanceMutation,
  useResolveMaintenanceMutation,
  useMaintenanceRequestQuery
} from "../hooks/useMaintenance"
import { useAllocationsQuery } from "../../allocations/hooks/useAllocations"
import { useAssetsQuery } from "../../assets/hooks/useAssets"
import Pagination from "@/components/Pagination"

const createRequestSchema = z.object({
  asset: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select an asset"),
  issueType: z.enum(["hardware", "software", "damage", "performance", "preventive", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z
    .string()
    .trim()
    .min(5, "Description must contain at least 5 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
})

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Rejection reason must contain at least 3 characters")
    .max(1000, "Rejection reason is too long"),
})

const resolveSchema = z.object({
  resolutionNotes: z
    .string()
    .trim()
    .min(3, "Resolution notes must contain at least 3 characters")
    .max(2000, "Resolution notes are too long"),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
})

export default function MaintenancePage() {
  const { user } = useSelector((state) => state.auth)
  const isManager = ["admin", "asset_manager"].includes(user?.role)
  const isTriageOperator = ["admin", "asset_manager", "department_head"].includes(user?.role)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const statusFilter = searchParams.get("status") || "pending"
  const priorityFilter = searchParams.get("priority") || ""

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [viewMode, setViewMode] = useState("list")

  // Query params
  const queryParams = useMemo(() => {
    const params = { page, limit: viewMode === "kanban" ? 100 : 10 }
    if (viewMode !== "kanban" && statusFilter) params.status = statusFilter
    if (priorityFilter) params.priority = priorityFilter
    return params
  }, [page, statusFilter, priorityFilter, viewMode])

  // Fetch list of requests
  const { data: listData, isLoading, isError, error, refetch } = useMaintenanceRequestsQuery(queryParams)
  const requestsList = listData?.data?.requests || []
  const pagination = listData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Fetch single request detail when modal is open
  const { data: requestDetailData, isLoading: detailLoading } = useMaintenanceRequestQuery(
    selectedRequest?._id,
    detailModalOpen && !!selectedRequest?._id
  )
  const requestDetail = requestDetailData?.data

  // Fetch assets list for reporting:
  // If employee: fetch their active allocations.
  // If manager: fetch all active/available/allocated assets.
  const employeeAllocationsQuery = useAllocationsQuery(
    { employee: user?.id, status: "active", limit: 100 },
    { enabled: !isManager }
  )
  const allAssetsQuery = useAssetsQuery({ limit: 100 }, { enabled: isManager })

  const reportableAssets = useMemo(() => {
    if (isManager) {
      const list = allAssetsQuery.data?.data?.assets || []
      // Filter out retired or already under maintenance
      return list.filter((a) => a.isActive && a.status !== "retired" && a.status !== "maintenance")
    } else {
      const list = employeeAllocationsQuery.data?.data?.allocations || []
      return list.map((alloc) => alloc.asset).filter(Boolean)
    }
  }, [isManager, allAssetsQuery.data, employeeAllocationsQuery.data])

  // Mutations
  const createMutation = useCreateMaintenanceMutation()
  const approveMutation = useApproveMaintenanceMutation()
  const rejectMutation = useRejectMaintenanceMutation()
  const resolveMutation = useResolveMaintenanceMutation()

  // Forms
  const createForm = useForm({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { asset: "", issueType: "hardware", priority: "medium", description: "" },
  })

  const rejectForm = useForm({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  })

  const resolveForm = useForm({
    resolver: zodResolver(resolveSchema),
    defaultValues: { resolutionNotes: "", condition: "good" },
  })

  // URL State Synch
  useEffect(() => {
    const nextParams = {}
    if (page > 1) nextParams.page = String(page)
    if (statusFilter) nextParams.status = statusFilter
    if (priorityFilter) nextParams.priority = priorityFilter
    setSearchParams(nextParams)
  }, [page, statusFilter, priorityFilter])

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      prev.set("page", "1")
      if (value) {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      return prev
    })
  }

  const handleOpenCreateModal = () => {
    createForm.reset({ asset: "", issueType: "hardware", priority: "medium", description: "" })
    setCreateModalOpen(true)
  }

  const handleOpenDetailsModal = (req) => {
    setSelectedRequest(req)
    setDetailModalOpen(true)
  }

  const handleOpenRejectModal = (req, event) => {
    event.stopPropagation()
    setSelectedRequest(req)
    rejectForm.reset({ reason: "" })
    setRejectModalOpen(true)
  }

  const handleOpenResolveModal = (req, event) => {
    event.stopPropagation()
    setSelectedRequest(req)
    resolveForm.reset({ resolutionNotes: "", condition: req.asset?.condition || "good" })
    setResolveModalOpen(true)
  }

  const handleCreateSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateModalOpen(false)
      },
    })
  }

  const handleApprove = (reqId, event) => {
    event.stopPropagation()
    approveMutation.mutate(reqId)
  }

  const handleRejectSubmit = (data) => {
    rejectMutation.mutate(
      { id: selectedRequest._id, data },
      {
        onSuccess: () => {
          setRejectModalOpen(false)
        },
      }
    )
  }

  const handleResolveSubmit = (data) => {
    // Exact schema matching payload: resolutionNotes and condition
    const payload = { resolutionNotes: data.resolutionNotes }
    if (data.condition) {
      payload.condition = data.condition
    }
    resolveMutation.mutate(
      { id: selectedRequest._id, data: payload },
      {
        onSuccess: () => {
          setResolveModalOpen(false)
        },
      }
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      in_progress: "bg-blue-500/10 text-blue-600 border-blue-200/35",
      resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-200/35",
      rejected: "bg-rose-500/10 text-rose-600 border-rose-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-bold text-[10px] rounded-md ${styles[status] || ""}`}>
        {status?.replace("_", " ")}
      </Badge>
    )
  }

  const getPriorityBadge = (pri) => {
    const styles = {
      low: "bg-neutral-500/10 text-neutral-600 border-neutral-200/35",
      medium: "bg-blue-500/10 text-blue-600 border-blue-200/35",
      high: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      critical: "bg-rose-500/10 text-rose-600 border-rose-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-semibold text-[10px] rounded-md ${styles[pri] || ""}`}>
        {pri}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Maintenance Tickets</h2>
          <p className="text-xs text-muted-foreground">
            Report hardware/software faults, request diagnostics, or review triage actions.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="cursor-pointer gap-2 h-9 rounded-xl font-bold self-start sm:self-auto text-xs">
          <Plus className="h-4 w-4" /> Report Breakdown
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-border/50 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            {viewMode !== "kanban" && (
              <div className="flex gap-2 flex-wrap bg-muted/20 p-1.5 rounded-xl border border-border/10">
                {[
                  { key: "pending", label: "Pending Review" },
                  { key: "in_progress", label: "In Progress" },
                  { key: "resolved", label: "Resolved" },
                  { key: "rejected", label: "Rejected" }
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={statusFilter === tab.key ? "default" : "ghost"}
                    onClick={() => handleFilterChange("status", tab.key)}
                    className="rounded-lg font-bold text-xs h-8 px-4 cursor-pointer"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
            {isTriageOperator && (
              <div className="flex bg-muted/65 p-1 rounded-xl border shrink-0">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="rounded-lg font-bold text-xs h-7 px-3 cursor-pointer"
                >
                  List View
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  onClick={() => setViewMode("kanban")}
                  className="rounded-lg font-bold text-xs h-7 px-3 cursor-pointer"
                >
                  Kanban Board
                </Button>
              </div>
            )}

            <select
              value={priorityFilter}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring shrink-0"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Listing requests */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading maintenance log...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Error loading tickets</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
        </div>
      ) : requestsList.length === 0 ? (
        <Card className="border border-dashed border-border/40 p-12 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Tickets Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            There are no maintenance requests logged under this status.
          </p>
        </Card>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start min-h-[500px]">
          {/* COLUMN 1: PENDING */}
          <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-4 flex flex-col h-[70vh]">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending Review
              </span>
              <Badge variant="secondary" className="rounded-md font-bold text-[9px]">
                {requestsList.filter(r => r.status === "pending").length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
              {requestsList.filter(r => r.status === "pending").map((req) => (
                <Card
                  key={req._id}
                  onClick={() => handleOpenDetailsModal(req)}
                  className="border border-border/40 shadow-2xs hover:shadow-xs hover:border-primary/20 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer animate-in fade-in-50 duration-200"
                >
                  <CardContent className="p-3.5 space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded-sm">
                          {req.asset?.assetTag || "N/A"}
                        </span>
                        <h5 className="font-bold text-foreground mt-1 line-clamp-1">{req.asset?.name}</h5>
                      </div>
                      {getPriorityBadge(req.priority)}
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2 text-[10px] leading-relaxed">
                      {req.description}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-2 border-t border-border/5">
                      <span>By: {req.reportedBy?.name || "System"}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>

                    {isTriageOperator && (
                      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleApprove(req._id, e)}
                          className="flex-1 h-7 text-[10px] font-bold rounded-lg border-primary/10 text-primary hover:bg-primary/5 cursor-pointer"
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenRejectModal(req, e)}
                          className="flex-1 h-7 text-[10px] font-bold rounded-lg border-destructive/10 text-destructive hover:bg-destructive/5 cursor-pointer"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {requestsList.filter(r => r.status === "pending").length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-6">No pending tickets.</p>
              )}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-4 flex flex-col h-[70vh]">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                In Progress
              </span>
              <Badge variant="secondary" className="rounded-md font-bold text-[9px]">
                {requestsList.filter(r => r.status === "in_progress").length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
              {requestsList.filter(r => r.status === "in_progress").map((req) => (
                <Card
                  key={req._id}
                  onClick={() => handleOpenDetailsModal(req)}
                  className="border border-border/40 shadow-2xs hover:shadow-xs hover:border-primary/20 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer animate-in fade-in-50 duration-200"
                >
                  <CardContent className="p-3.5 space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded-sm">
                          {req.asset?.assetTag || "N/A"}
                        </span>
                        <h5 className="font-bold text-foreground mt-1 line-clamp-1">{req.asset?.name}</h5>
                      </div>
                      {getPriorityBadge(req.priority)}
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2 text-[10px] leading-relaxed">
                      {req.description}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-2 border-t border-border/5">
                      <span>By: {req.reportedBy?.name || "System"}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>

                    {isTriageOperator && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenResolveModal(req, e)}
                          className="w-full h-7 text-[10px] font-bold rounded-lg border-emerald-500/10 text-emerald-600 hover:bg-emerald-500/5 cursor-pointer"
                        >
                          Resolve
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {requestsList.filter(r => r.status === "in_progress").length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-6">No in-progress tickets.</p>
              )}
            </div>
          </div>

          {/* COLUMN 3: RESOLVED */}
          <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-4 flex flex-col h-[70vh]">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Resolved
              </span>
              <Badge variant="secondary" className="rounded-md font-bold text-[9px]">
                {requestsList.filter(r => r.status === "resolved").length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
              {requestsList.filter(r => r.status === "resolved").map((req) => (
                <Card
                  key={req._id}
                  onClick={() => handleOpenDetailsModal(req)}
                  className="border border-border/40 shadow-2xs hover:shadow-xs hover:border-primary/20 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer animate-in fade-in-50 duration-200"
                >
                  <CardContent className="p-3.5 space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded-sm">
                          {req.asset?.assetTag || "N/A"}
                        </span>
                        <h5 className="font-bold text-foreground mt-1 line-clamp-1">{req.asset?.name}</h5>
                      </div>
                      {getPriorityBadge(req.priority)}
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2 text-[10px] leading-relaxed">
                      {req.description}
                    </p>

                    {req.resolutionNotes && (
                      <div className="bg-emerald-500/5 text-emerald-600 p-2 rounded-lg border border-emerald-500/10 text-[10px] leading-relaxed">
                        <strong>Resolution:</strong> {req.resolutionNotes}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-2 border-t border-border/5">
                      <span>By: {req.reportedBy?.name || "System"}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {requestsList.filter(r => r.status === "resolved").length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-6">No resolved tickets.</p>
              )}
            </div>
          </div>

          {/* COLUMN 4: REJECTED */}
          <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-4 flex flex-col h-[70vh]">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Rejected
              </span>
              <Badge variant="secondary" className="rounded-md font-bold text-[9px]">
                {requestsList.filter(r => r.status === "rejected").length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
              {requestsList.filter(r => r.status === "rejected").map((req) => (
                <Card
                  key={req._id}
                  onClick={() => handleOpenDetailsModal(req)}
                  className="border border-border/40 shadow-2xs hover:shadow-xs hover:border-primary/20 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer animate-in fade-in-50 duration-200"
                >
                  <CardContent className="p-3.5 space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded-sm">
                          {req.asset?.assetTag || "N/A"}
                        </span>
                        <h5 className="font-bold text-foreground mt-1 line-clamp-1">{req.asset?.name}</h5>
                      </div>
                      {getPriorityBadge(req.priority)}
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2 text-[10px] leading-relaxed">
                      {req.description}
                    </p>

                    {req.rejectionReason && (
                      <div className="bg-rose-500/5 text-rose-600 p-2 rounded-lg border border-rose-500/10 text-[10px] leading-relaxed">
                        <strong>Rejection Reason:</strong> {req.rejectionReason}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-muted-foreground pt-2 border-t border-border/5">
                      <span>By: {req.reportedBy?.name || "System"}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {requestsList.filter(r => r.status === "rejected").length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-6">No rejected tickets.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                    <th className="p-4">Asset Target</th>
                    <th className="p-4">Reported By</th>
                    <th className="p-4">Issue Details</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList.map((req) => (
                    <tr
                      key={req._id}
                      onClick={() => handleOpenDetailsModal(req)}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-4">
                        <div className="font-bold text-foreground">{req.asset?.name || "Deleted Asset"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{req.asset?.assetTag || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{req.reportedBy?.name || "N/A"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 max-w-[200px] truncate">
                        <span className="capitalize font-semibold text-foreground">{req.issueType} • </span>
                        <span className="text-muted-foreground">{req.description}</span>
                      </td>
                      <td className="p-4">{getPriorityBadge(req.priority)}</td>
                      <td className="p-4">{getStatusBadge(req.status)}</td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDetailsModal(req)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View Ticket Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isManager && req.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleApprove(req._id, e)}
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                title="Approve Request"
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleOpenRejectModal(req, e)}
                                className="h-8 w-8 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Reject Request"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {isManager && req.status === "in_progress" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleOpenResolveModal(req, e)}
                              className="h-8 cursor-pointer text-[10px] font-bold rounded-lg"
                            >
                              Resolve
                            </Button>
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
            label="tickets"
          />
        </div>
      )}

      {/* Report Breakdown Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Report Asset Breakdown</h3>
              <Button variant="ghost" size="icon" onClick={() => setCreateModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="asset">Select Target Asset</Label>
                <select
                  id="asset"
                  {...createForm.register("asset")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose asset...</option>
                  {reportableAssets.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                  ))}
                </select>
                {createForm.formState.errors.asset && (
                  <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.asset.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issueType">Type of Fault</Label>
                  <select
                    id="issueType"
                    {...createForm.register("issueType")}
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="damage">Physical Damage</option>
                    <option value="performance">Slow Performance</option>
                    <option value="preventive">Preventive Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Urgency Priority</Label>
                  <select
                    id="priority"
                    {...createForm.register("priority")}
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Detailed Description of Issue</Label>
                <textarea
                  id="description"
                  {...createForm.register("description")}
                  placeholder="Describe what went wrong, steps to reproduce, or notes..."
                  className="mt-1.5 flex min-h-[90px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
                {createForm.formState.errors.description && (
                  <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {createMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-sm border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Reject Ticket</h3>
              <Button variant="ghost" size="icon" onClick={() => setRejectModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={rejectForm.handleSubmit(handleRejectSubmit)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Rejection</Label>
                <textarea
                  id="reason"
                  {...rejectForm.register("reason")}
                  placeholder="Explain why this request is rejected..."
                  className="mt-1.5 flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
                {rejectForm.formState.errors.reason && (
                  <p className="text-[10px] text-destructive mt-0.5">{rejectForm.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setRejectModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={rejectMutation.isPending} className="h-9 cursor-pointer text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/95">
                  {rejectMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Resolve Maintenance</h3>
              <Button variant="ghost" size="icon" onClick={() => setResolveModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={resolveForm.handleSubmit(handleResolveSubmit)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="resolutionNotes">Resolution Summary Notes</Label>
                <textarea
                  id="resolutionNotes"
                  {...resolveForm.register("resolutionNotes")}
                  placeholder="Explain what steps were taken to fix the issue..."
                  className="mt-1.5 flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
                {resolveForm.formState.errors.resolutionNotes && (
                  <p className="text-[10px] text-destructive mt-0.5">{resolveForm.formState.errors.resolutionNotes.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="condition">Asset Restored Condition (Optional)</Label>
                <select
                  id="condition"
                  {...resolveForm.register("condition")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setResolveModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={resolveMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {resolveMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Resolve breakdown
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Maintenance Request Profile
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setDetailModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {detailLoading ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Fetching complete ticket profiling...</p>
              </div>
            ) : !requestDetail ? (
              <div className="p-10 text-center text-muted-foreground">Ticket detail profile not found.</div>
            ) : (
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-foreground">{requestDetail.asset?.name || "Deleted Asset"}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{requestDetail.asset?.assetTag || "N/A"}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(requestDetail.status)}
                    {getPriorityBadge(requestDetail.priority)}
                  </div>
                </div>

                <div className="border-t border-b py-3 text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block font-bold">Reported By</span>
                      <p className="font-semibold text-foreground mt-0.5">{requestDetail.reportedBy?.name || "N/A"}</p>
                      <p className="text-[10px] text-muted-foreground">{requestDetail.reportedBy?.email || ""}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block font-bold">Reported At</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {new Date(requestDetail.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block font-bold">Issue Type</span>
                    <p className="font-semibold text-foreground capitalize mt-0.5">{requestDetail.issueType || "N/A"}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block font-bold font-mono">Description</span>
                    <p className="text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-line">{requestDetail.description}</p>
                  </div>
                </div>

                {requestDetail.status === "rejected" && requestDetail.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-200/50 text-rose-900 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 block">Rejection Reason</span>
                    <p className="leading-relaxed font-semibold">{requestDetail.rejectionReason}</p>
                    <p className="text-[10px] text-rose-700/80 mt-1">
                      Reviewed by {requestDetail.reviewedBy?.name || "N/A"} on {requestDetail.reviewedAt ? new Date(requestDetail.reviewedAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                )}

                {requestDetail.status === "resolved" && requestDetail.resolutionNotes && (
                  <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-950 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">Resolution Notes</span>
                    <p className="leading-relaxed font-semibold">{requestDetail.resolutionNotes}</p>
                    <p className="text-[10px] text-emerald-800/80 mt-1">
                      Resolved by {requestDetail.resolvedBy?.name || "N/A"} on {requestDetail.resolvedAt ? new Date(requestDetail.resolvedAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                )}

                {requestDetail.status === "in_progress" && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span>In progress since {requestDetail.reviewedAt ? new Date(requestDetail.reviewedAt).toLocaleString() : ""} (Reviewed by {requestDetail.reviewedBy?.name || "N/A"})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
