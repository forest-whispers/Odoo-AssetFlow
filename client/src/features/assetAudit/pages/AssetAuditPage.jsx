import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
  User,
  Info,
  Calendar,
  Building,
  ChevronRight,
  Filter
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useAssetAuditsQuery,
  useAssetAuditQuery,
  useCreateAssetAuditMutation,
  useStartAssetAuditMutation,
  useVerifyAuditItemMutation,
  useCompleteAssetAuditMutation
} from "../hooks/useAssetAudit"
import { useDepartmentsQuery, useUsersQuery } from "../../organization/hooks/useOrg"
import Pagination from "@/components/Pagination"

const createAuditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Audit name must contain at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  auditors: z.array(z.string()).default([]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true
  return new Date(data.endDate) >= new Date(data.startDate)
}, {
  message: "End date cannot be before start date",
  path: ["endDate"],
})

const verifyItemSchema = z.object({
  verificationStatus: z.enum(["verified", "missing", "damaged", "location_mismatch"]),
  actualLocation: z.string().trim().optional().or(z.literal("")).or(z.null()),
  notes: z.string().trim().optional().or(z.literal("")).or(z.null()),
})

export default function AssetAuditPage() {
  const { user } = useSelector((state) => state.auth)
  const isManager = ["admin", "asset_manager"].includes(user?.role)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const statusFilter = searchParams.get("status") || ""
  const departmentFilter = searchParams.get("department") || ""

  // Active Audit Detail View
  const [selectedAuditId, setSelectedAuditId] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Forms modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [verifyItemModalOpen, setVerifyItemModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Fetch departments and department heads (for auditor list dropdown)
  const { data: deptData } = useDepartmentsQuery({ isActive: "true" })
  const { data: usersData } = useUsersQuery({ limit: 100, isActive: "true" })
  
  const departments = deptData?.data || []
  const users = usersData?.data?.users || []

  // Filter users to show only those who could be auditors (department_head, asset_manager, admin)
  const potentialAuditors = useMemo(() => {
    return users.filter((u) => ["admin", "asset_manager", "department_head"].includes(u.role))
  }, [users])

  // Build list params
  const listParams = useMemo(() => {
    const params = { page, limit: 10 }
    if (statusFilter) params.status = statusFilter
    if (departmentFilter) params.department = departmentFilter
    return params
  }, [page, statusFilter, departmentFilter])

  // Fetch audit cycles list
  const { data: listData, isLoading, isError, error, refetch } = useAssetAuditsQuery(listParams)
  const auditsList = listData?.data?.audits || []
  const pagination = listData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Fetch single audit detail
  const { data: detailData, isLoading: detailLoading } = useAssetAuditQuery(selectedAuditId, detailModalOpen)
  const auditDetail = detailData?.data
  const auditItems = auditDetail?.items || []

  // Mutations
  const createMutation = useCreateAssetAuditMutation()
  const startMutation = useStartAssetAuditMutation()
  const verifyMutation = useVerifyAuditItemMutation()
  const completeMutation = useCompleteAssetAuditMutation()

  // Forms
  const createForm = useForm({
    resolver: zodResolver(createAuditSchema),
    defaultValues: { name: "", department: "", auditors: [], startDate: "", endDate: "" },
  })

  const verifyForm = useForm({
    resolver: zodResolver(verifyItemSchema),
    defaultValues: { verificationStatus: "verified", actualLocation: "", notes: "" },
  })

  // URL Sync
  useEffect(() => {
    const nextParams = {}
    if (page > 1) nextParams.page = String(page)
    if (statusFilter) nextParams.status = statusFilter
    if (departmentFilter) nextParams.department = departmentFilter
    setSearchParams(nextParams)
  }, [page, statusFilter, departmentFilter])

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
    createForm.reset({ name: "", department: "", auditors: [], startDate: "", endDate: "" })
    setCreateModalOpen(true)
  }

  const handleOpenDetails = (auditId) => {
    setSelectedAuditId(auditId)
    setDetailModalOpen(true)
  }

  const handleStartAudit = (auditId, event) => {
    event.stopPropagation()
    startMutation.mutate(auditId)
  }

  const handleCompleteAudit = (auditId) => {
    completeMutation.mutate(auditId, {
      onSuccess: () => {
        // Refresh detail view
        refetch()
      },
    })
  }

  // Determine if current user can verify items in the active audit detail
  const canVerify = useMemo(() => {
    if (!user || !auditDetail) return false
    if (["admin", "asset_manager"].includes(user.role)) return true

    const auditors = auditDetail.auditors || []
    if (auditors.length === 0) return true // empty array defaults to open to all permitted roles (admin/manager/dept_head)

    return auditors.some((a) => (a._id || a) === user.id)
  }, [user, auditDetail])

  const handleOpenVerifyModal = (item) => {
    setSelectedItem(item)
    verifyForm.reset({
      verificationStatus: item.verificationStatus === "pending" ? "verified" : item.verificationStatus,
      actualLocation: item.actualLocation || "",
      notes: item.notes || "",
    })
    setVerifyItemModalOpen(true)
  }

  const handleCreateSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateModalOpen(false)
      },
    })
  }

  const handleVerifySubmit = (data) => {
    const payload = {
      verificationStatus: data.verificationStatus,
      actualLocation: data.actualLocation || null,
      notes: data.notes || null,
    }

    verifyMutation.mutate(
      { id: auditDetail._id, itemId: selectedItem._id, data: payload },
      {
        onSuccess: () => {
          setVerifyItemModalOpen(false)
        },
      }
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: "bg-blue-500/10 text-blue-600 border-blue-200/35",
      in_progress: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-bold text-[10px] rounded-md ${styles[status] || ""}`}>
        {status?.replace("_", " ")}
      </Badge>
    )
  }

  const getItemStatusBadge = (status) => {
    const styles = {
      pending: "bg-neutral-500/10 text-neutral-600 border-neutral-200/35",
      verified: "bg-emerald-500/10 text-emerald-600 border-emerald-200/35",
      missing: "bg-rose-500/10 text-rose-600 border-rose-200/35",
      damaged: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      location_mismatch: "bg-purple-500/10 text-purple-600 border-purple-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-bold text-[9px] rounded-md ${styles[status] || ""}`}>
        {status?.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Physical Asset Audits</h2>
          <p className="text-xs text-muted-foreground">
            Schedule department stock audits, reconcile item locations, and check physical asset integrity.
          </p>
        </div>
        {isManager && (
          <Button onClick={handleOpenCreateModal} className="cursor-pointer gap-2 h-9 rounded-xl font-bold self-start sm:self-auto text-xs">
            <Plus className="h-4 w-4" /> Schedule Audit
          </Button>
        )}
      </div>

      {/* Filters and List view */}
      <Card className="border border-border/50 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Listing Audits */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading audit records...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Error loading audits</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
        </div>
      ) : auditsList.length === 0 ? (
        <Card className="border border-dashed border-border/40 p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Audits Scheduled</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            There are no asset audit schedules matching the current filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                    <th className="p-4">Audit Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Period Dates</th>
                    <th className="p-4">Reconciliation Progress</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditsList.map((audit) => {
                    const progressPercent = audit.totalAssets > 0 
                      ? Math.round((audit.verifiedAssets / audit.totalAssets) * 100)
                      : 0
                    
                    return (
                      <tr
                        key={audit._id}
                        onClick={() => handleOpenDetails(audit._id)}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                      >
                        <td className="p-4 font-bold text-foreground">{audit.name}</td>
                        <td className="p-4 text-muted-foreground">{audit.department?.name || "N/A"}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(audit.startDate).toLocaleDateString()} to {new Date(audit.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="font-semibold text-foreground shrink-0">{audit.verifiedAssets}/{audit.totalAssets} ({progressPercent}%)</span>
                          </div>
                          {audit.discrepancyCount > 0 && (
                            <span className="text-[10px] text-rose-600 font-medium">{audit.discrepancyCount} discrepancies flagged</span>
                          )}
                        </td>
                        <td className="p-4">{getStatusBadge(audit.status)}</td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDetails(audit._id)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Open Detail Sheet"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            {isManager && audit.status === "scheduled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleStartAudit(audit._id, e)}
                                className="h-8 cursor-pointer text-[10px] font-bold gap-1 rounded-lg border-primary/20 hover:border-primary text-primary hover:bg-primary/5"
                                disabled={startMutation.isPending}
                              >
                                <Play className="h-3 w-3" /> Start
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
            label="audits"
          />
        </div>
      )}

      {/* Schedule Audit Dialog */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Schedule Physical Audit</h3>
              <Button variant="ghost" size="icon" onClick={() => setCreateModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Audit Cycle Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Q3 IT Hardware Reconciliation"
                  {...createForm.register("name")}
                  className={`mt-1 h-9 ${createForm.formState.errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                {createForm.formState.errors.name && (
                  <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="department">Target Department</Label>
                <select
                  id="department"
                  {...createForm.register("department")}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                {createForm.formState.errors.department && (
                  <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.department.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="auditors">Assign Auditors (Optional)</Label>
                <select
                  id="auditors"
                  multiple
                  {...createForm.register("auditors")}
                  className="mt-1.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring min-h-[90px]"
                >
                  {potentialAuditors.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role?.replace("_", " ")})</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Hold Ctrl (or Cmd) to select multiple auditors. If empty, any manager can audit.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...createForm.register("startDate")}
                    className="mt-1 h-9"
                  />
                  {createForm.formState.errors.startDate && (
                    <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...createForm.register("endDate")}
                    className="mt-1 h-9"
                  />
                  {createForm.formState.errors.endDate && (
                    <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {createMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Audit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Audit Sheet Detail View Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-4xl border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  {auditDetail?.name || "Audit Reconciliation Sheet"}
                </h3>
                {auditDetail?.department && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Department: {auditDetail.department.name}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDetailModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Retrieving item list profiles...</p>
                </div>
              ) : !auditDetail ? (
                <div className="p-10 text-center text-muted-foreground">Audit details profile not found.</div>
              ) : (
                <div className="space-y-6">
                  {/* Status header block */}
                  <div className="flex flex-wrap justify-between items-center gap-4 bg-muted/20 border border-border/50 p-4 rounded-xl text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                        <div className="mt-1">{getStatusBadge(auditDetail.status)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Dates</span>
                        <div className="mt-1 font-semibold text-foreground">
                          {new Date(auditDetail.startDate).toLocaleDateString()} to {new Date(auditDetail.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Progress</span>
                        <div className="mt-1 font-semibold text-foreground">
                          {auditDetail.verifiedAssets} / {auditDetail.totalAssets} verified ({Math.round((auditDetail.verifiedAssets / auditDetail.totalAssets) * 100)}%)
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-800 uppercase font-mono">Discrepancies</span>
                        <div className="mt-1 font-bold text-rose-600">{auditDetail.discrepancyCount} flags</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isManager && auditDetail.status === "in_progress" && (
                        <Button
                          onClick={() => handleCompleteAudit(auditDetail._id)}
                          className="h-8 px-4 font-bold text-xs rounded-xl cursor-pointer"
                          disabled={completeMutation.isPending || auditDetail.totalAssets !== auditDetail.verifiedAssets}
                          title={auditDetail.totalAssets !== auditDetail.verifiedAssets ? "All items must be verified first" : "Complete audit cycle"}
                        >
                          {completeMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                          Complete Audit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Auditors List Info */}
                  <div className="text-xs border-b pb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Auditors</span>
                    <p className="mt-1 font-medium text-foreground">
                      {auditDetail.auditors?.length > 0 
                        ? auditDetail.auditors.map((a) => `${a.name} (${a.role?.replace("_", " ")})`).join(", ")
                        : "Open (Any administrator can audit)"}
                    </p>
                  </div>

                  {/* Audit Item list Table */}
                  <div className="space-y-3">
                    {auditDetail.discrepancyCount > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2.5 font-bold text-xs animate-pulse">
                        <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                        <span>{auditDetail.discrepancyCount} assets flagged — discrepancy report generated automatically</span>
                      </div>
                    )}
                    <h4 className="font-extrabold text-sm text-foreground">Asset Checklists</h4>
                    
                    <div className="border rounded-xl overflow-hidden bg-card">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b bg-muted/10 text-muted-foreground font-extrabold">
                            <th className="p-3">Asset</th>
                            <th className="p-3">Expected Location</th>
                            <th className="p-3">Actual Location</th>
                            <th className="p-3">Audit Notes</th>
                            <th className="p-3">Verification</th>
                            {auditDetail.status === "in_progress" && <th className="p-3 text-right">Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {auditItems.map((item) => (
                            <tr key={item._id} className="border-b last:border-0 hover:bg-muted/10">
                              <td className="p-3">
                                <div className="font-semibold text-foreground">{item.asset?.name || "Deleted Asset"}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{item.asset?.assetTag || "N/A"}</div>
                              </td>
                              <td className="p-3 text-muted-foreground">{item.expectedLocation || "N/A"}</td>
                              <td className="p-3 text-foreground">{item.actualLocation || "N/A"}</td>
                              <td className="p-3 text-muted-foreground max-w-[150px] truncate" title={item.notes}>{item.notes || "—"}</td>
                              <td className="p-3">
                                <div className="flex flex-col gap-0.5">
                                  {getItemStatusBadge(item.verificationStatus)}
                                  {item.verifiedBy && (
                                    <span className="text-[8px] text-muted-foreground">by {item.verifiedBy?.name}</span>
                                  )}
                                </div>
                              </td>
                              {auditDetail.status === "in_progress" && (
                                <td className="p-3 text-right">
                                  {canVerify ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenVerifyModal(item)}
                                      className="h-7 text-[10px] font-bold rounded-lg cursor-pointer"
                                    >
                                      Verify
                                    </Button>
                                  ) : (
                                    <span className="text-[9px] text-muted-foreground flex items-center justify-end gap-1" title="You are not assigned as an auditor for this cycle">
                                      <Lock className="h-3 w-3" /> Locked
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-muted/10 flex justify-end shrink-0">
              <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)} className="h-8 cursor-pointer text-xs">
                Close Sheet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Item Modal */}
      {verifyItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-sm border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Verify Asset Placement</h3>
              <Button variant="ghost" size="icon" onClick={() => setVerifyItemModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={verifyForm.handleSubmit(handleVerifySubmit)} className="p-6 space-y-4">
              <div className="bg-muted/10 p-3 rounded-xl border border-border/20 text-xs">
                <span className="font-bold text-foreground">Verifying:</span> {selectedItem?.asset?.name} ({selectedItem?.asset?.assetTag})
                <div className="text-[10px] text-muted-foreground mt-0.5">Expected Place: {selectedItem?.expectedLocation || "N/A"}</div>
              </div>

              <div>
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <select
                  id="verificationStatus"
                  {...verifyForm.register("verificationStatus")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="verified">Verified (Correct & Safe)</option>
                  <option value="location_mismatch">Location Mismatch (Found elsewhere)</option>
                  <option value="damaged">Damaged (Requires attention)</option>
                  <option value="missing">Missing (Not found)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="actualLocation">Actual Location (Required if mismatched)</Label>
                <Input
                  id="actualLocation"
                  placeholder="e.g. Server Room B, Head Office"
                  {...verifyForm.register("actualLocation")}
                  className="mt-1.5 h-9"
                />
              </div>

              <div>
                <Label htmlFor="notes">Audit Notes</Label>
                <textarea
                  id="notes"
                  {...verifyForm.register("notes")}
                  placeholder="Describe status notes, issues, or findings..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setVerifyItemModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={verifyMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {verifyMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
