import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  RefreshCw,
  Plus,
  ArrowRightLeft,
  CornerUpLeft,
  X,
  History,
  AlertTriangle,
  User,
  CheckCircle2,
  FileText
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAllocationsQuery, useCreateAllocationMutation, useReturnAssetMutation, useTransferAssetMutation } from "../hooks/useAllocations"
import { useAssetsQuery } from "../../assets/hooks/useAssets"
import { useUsersQuery } from "../../organization/hooks/useOrg"
import Pagination from "@/components/Pagination"

const createAllocationSchema = z.object({
  asset: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select an asset"),
  employee: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select an employee"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

const returnAssetSchema = z.object({
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

const transferAssetSchema = z.object({
  employee: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select an employee"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

export default function AllocationsPage() {
  const { user } = useSelector((state) => state.auth)
  const isManager = ["admin", "asset_manager"].includes(user?.role)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const statusFilter = searchParams.get("status") || "active"

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState(null)

  // Build query params based on role:
  // Admin, Manager, and Dept Head see all. Employees see only their own.
  const queryParams = useMemo(() => {
    const params = { page, limit: 10, status: statusFilter }
    if (user?.role === "employee") {
      params.employee = user.id
    }
    return params
  }, [page, statusFilter, user])

  // Fetch allocations list
  const { data: allocationsData, isLoading, isError, error, refetch } = useAllocationsQuery(queryParams)
  const allocationsList = allocationsData?.data?.allocations || []
  const pagination = allocationsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Fetch available assets and employees for dropdowns (only when modal is open and user is manager)
  const { data: availableAssetsData } = useAssetsQuery({ status: "available", limit: 100 })
  const { data: employeesData } = useUsersQuery({ isActive: "true", limit: 100 })

  const availableAssets = availableAssetsData?.data?.assets || []
  const activeEmployees = employeesData?.data?.users || []

  // Mutations
  const createAllocationMutation = useCreateAllocationMutation()
  const returnAssetMutation = useReturnAssetMutation()
  const transferAssetMutation = useTransferAssetMutation()

  // Forms setup
  const createForm = useForm({
    resolver: zodResolver(createAllocationSchema),
    defaultValues: { asset: "", employee: "", notes: "" },
  })

  const returnForm = useForm({
    resolver: zodResolver(returnAssetSchema),
    defaultValues: { condition: "good", notes: "" },
  })

  const transferForm = useForm({
    resolver: zodResolver(transferAssetSchema),
    defaultValues: { employee: "", notes: "" },
  })

  // Synchronize search params with URL
  useEffect(() => {
    const nextParams = {}
    if (page > 1) nextParams.page = String(page)
    if (statusFilter) nextParams.status = statusFilter
    setSearchParams(nextParams)
  }, [page, statusFilter])

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  const handleStatusChange = (status) => {
    setSearchParams({ status, page: "1" })
  }

  const handleOpenCreateModal = () => {
    createForm.reset({ asset: "", employee: "", notes: "" })
    setCreateModalOpen(true)
  }

  const handleOpenReturnModal = (allocation) => {
    setSelectedAllocation(allocation)
    returnForm.reset({ condition: allocation.asset?.condition || "good", notes: "" })
    setReturnModalOpen(true)
  }

  const handleOpenTransferModal = (allocation) => {
    setSelectedAllocation(allocation)
    transferForm.reset({ employee: "", notes: "" })
    setTransferModalOpen(true)
  }

  const handleCreateSubmit = (data) => {
    createAllocationMutation.mutate(data, {
      onSuccess: () => {
        setCreateModalOpen(false)
      },
    })
  }

  const handleReturnSubmit = (data) => {
    returnAssetMutation.mutate(
      { id: selectedAllocation._id, data },
      {
        onSuccess: () => {
          setReturnModalOpen(false)
        },
      }
    )
  }

  const handleTransferSubmit = (data) => {
    transferAssetMutation.mutate(
      { id: selectedAllocation._id, data },
      {
        onSuccess: () => {
          setTransferModalOpen(false)
        },
      }
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-emerald-500/10 text-emerald-600 border-emerald-200/35",
      returned: "bg-neutral-500/10 text-neutral-600 border-neutral-200/35",
      transferred: "bg-blue-500/10 text-blue-600 border-blue-200/35"
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
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Allocations Registry</h2>
          <p className="text-xs text-muted-foreground">
            Track ownership transitions, returns, and department transfers for physical resources.
          </p>
        </div>
        {isManager && (
          <Button onClick={handleOpenCreateModal} className="cursor-pointer gap-2 h-9 rounded-xl font-bold self-start sm:self-auto text-xs">
            <Plus className="h-4 w-4" /> Allocate Asset
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap bg-muted/20 p-1.5 rounded-xl border border-border/10 self-start inline-flex">
        {[
          { key: "active", label: "Active custody" },
          { key: "returned", label: "Returned" },
          { key: "transferred", label: "Transferred" }
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? "default" : "ghost"}
            onClick={() => handleStatusChange(tab.key)}
            className="rounded-lg font-bold text-xs h-8 px-4 cursor-pointer"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* List content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading allocations log...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Error loading allocations</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
        </div>
      ) : allocationsList.length === 0 ? (
        <Card className="border border-dashed border-border/40 p-12 text-center">
          <History className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Allocations Logged</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            There are no allocation transitions recorded matching this status.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                    <th className="p-4">Asset</th>
                    <th className="p-4">Custodian / Department</th>
                    <th className="p-4">Allocated At</th>
                    {statusFilter === "returned" && <th className="p-4">Returned At</th>}
                    <th className="p-4">Status</th>
                    {isManager && statusFilter === "active" && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {allocationsList.map((alloc) => (
                    <tr key={alloc._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{alloc.asset?.name || "Deleted Asset"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{alloc.asset?.assetTag || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{alloc.employee?.name || "N/A"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {alloc.department?.name || "No Dept"} • EMP ID: {alloc.employee?.employeeId || "N/A"}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div>{new Date(alloc.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px]">by {alloc.allocatedBy?.name || "N/A"}</div>
                      </td>
                      {statusFilter === "returned" && (
                        <td className="p-4 text-muted-foreground">
                          {alloc.returnedAt ? new Date(alloc.returnedAt).toLocaleDateString() : "N/A"}
                        </td>
                      )}
                      <td className="p-4">{getStatusBadge(alloc.status)}</td>
                      {isManager && statusFilter === "active" && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenTransferModal(alloc)}
                              className="cursor-pointer gap-1.5 h-8 text-[11px] font-bold rounded-lg"
                            >
                              <ArrowRightLeft className="h-3 w-3" /> Transfer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReturnModal(alloc)}
                              className="cursor-pointer gap-1.5 h-8 text-[11px] font-bold rounded-lg"
                            >
                              <CornerUpLeft className="h-3 w-3" /> Return
                            </Button>
                          </div>
                        </td>
                      )}
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
            label="allocations"
          />
        </div>
      )}

      {/* Allocate Dialog */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Allocate Asset</h3>
              <Button variant="ghost" size="icon" onClick={() => setCreateModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="asset">Select Available Asset</Label>
                <select
                  id="asset"
                  {...createForm.register("asset")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose asset...</option>
                  {availableAssets.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                  ))}
                </select>
                {createForm.formState.errors.asset && (
                  <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.asset.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="employee">Select Custodian Employee</Label>
                <select
                  id="employee"
                  {...createForm.register("employee")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose employee...</option>
                  {activeEmployees.map((e) => (
                    <option key={e._id} value={e._id}>{e.name} ({e.department?.name || "No Dept"})</option>
                  ))}
                </select>
                {createForm.formState.errors.employee && (
                  <p className="text-[10px] text-destructive mt-0.5">{createForm.formState.errors.employee.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Allocation Notes</Label>
                <textarea
                  id="notes"
                  {...createForm.register("notes")}
                  placeholder="Notes or special conditions..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createAllocationMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {createAllocationMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Dialog */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Return Asset</h3>
              <Button variant="ghost" size="icon" onClick={() => setReturnModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={returnForm.handleSubmit(handleReturnSubmit)} className="p-6 space-y-4">
              <div className="bg-muted/10 p-3 rounded-xl border border-border/20 text-xs">
                <span className="font-bold text-foreground">Returning:</span> {selectedAllocation?.asset?.name} ({selectedAllocation?.asset?.assetTag})
              </div>

              <div>
                <Label htmlFor="condition">Asset Return Condition</Label>
                <select
                  id="condition"
                  {...returnForm.register("condition")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Notes / Issues</Label>
                <textarea
                  id="notes"
                  {...returnForm.register("notes")}
                  placeholder="Notes on return condition or issues..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setReturnModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={returnAssetMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {returnAssetMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Return
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Transfer Custody</h3>
              <Button variant="ghost" size="icon" onClick={() => setTransferModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={transferForm.handleSubmit(handleTransferSubmit)} className="p-6 space-y-4">
              <div className="bg-muted/10 p-3 rounded-xl border border-border/20 text-xs">
                <span className="font-bold text-foreground">Transferring:</span> {selectedAllocation?.asset?.name} ({selectedAllocation?.asset?.assetTag})
              </div>

              <div>
                <Label htmlFor="employee">Select New Custodian</Label>
                <select
                  id="employee"
                  {...transferForm.register("employee")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose new employee...</option>
                  {activeEmployees
                    .filter((e) => e._id !== selectedAllocation?.employee?._id)
                    .map((e) => (
                      <option key={e._id} value={e._id}>{e.name} ({e.department?.name || "No Dept"})</option>
                    ))}
                </select>
                {transferForm.formState.errors.employee && (
                  <p className="text-[10px] text-destructive mt-0.5">{transferForm.formState.errors.employee.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Transfer Notes</Label>
                <textarea
                  id="notes"
                  {...transferForm.register("notes")}
                  placeholder="Notes on transfer reason..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setTransferModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={transferAssetMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {transferAssetMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Transfer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
