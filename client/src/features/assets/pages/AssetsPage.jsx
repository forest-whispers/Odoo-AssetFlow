import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  FileText
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAssetsQuery, useCreateAssetMutation, useUpdateAssetMutation, useRetireAssetMutation, useAssetQuery } from "../hooks/useAssets"
import { useDepartmentsQuery, useAssetCategoriesQuery } from "../../organization/hooks/useOrg"
import { assetSchema } from "../schemas/assetSchemas"
import Pagination from "@/components/Pagination"

// Helper function to debounce input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function AssetsPage() {
  const { user } = useSelector((state) => state.auth)
  const isManager = ["admin", "asset_manager"].includes(user?.role)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const categoryFilter = searchParams.get("category") || ""
  const departmentFilter = searchParams.get("department") || ""
  const statusFilter = searchParams.get("status") || ""
  const conditionFilter = searchParams.get("condition") || ""
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Modals state
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [retireConfirmId, setRetireConfirmId] = useState(null)

  // Fetch departments and categories for selectors
  const { data: deptData } = useDepartmentsQuery({ isActive: "true" })
  const { data: catData } = useAssetCategoriesQuery({ isActive: "true" })
  
  const departments = deptData?.data || []
  const categories = catData?.data || []

  // Build query params
  const queryParams = useMemo(() => {
    const params = { page, limit: 10 }
    if (debouncedSearch) params.search = debouncedSearch
    if (categoryFilter) params.category = categoryFilter
    if (departmentFilter) params.department = departmentFilter
    if (statusFilter) params.status = statusFilter
    if (conditionFilter) params.condition = conditionFilter
    return params
  }, [page, debouncedSearch, categoryFilter, departmentFilter, statusFilter, conditionFilter])

  // Fetch assets list
  const { data: assetsData, isLoading, isError, error, refetch } = useAssetsQuery(queryParams)
  const assetsList = assetsData?.data?.assets || []
  const pagination = assetsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Fetch single asset details when modal is active
  const { data: assetDetailData, isLoading: detailLoading } = useAssetQuery(selectedAssetId, detailModalOpen)
  const assetDetail = assetDetailData?.data

  // Mutations
  const createAssetMutation = useCreateAssetMutation()
  const updateAssetMutation = useUpdateAssetMutation()
  const retireAssetMutation = useRetireAssetMutation()

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetTag: "",
      name: "",
      category: "",
      department: "",
      serialNumber: "",
      condition: "good",
      location: "",
      purchaseDate: "",
      purchaseCost: 0,
      warrantyExpiry: "",
      notes: "",
    },
  })

  // Synchronize search params with URL
  useEffect(() => {
    const nextParams = {}
    if (page > 1) nextParams.page = String(page)
    if (debouncedSearch) nextParams.search = debouncedSearch
    if (categoryFilter) nextParams.category = categoryFilter
    if (departmentFilter) nextParams.department = departmentFilter
    if (statusFilter) nextParams.status = statusFilter
    if (conditionFilter) nextParams.condition = conditionFilter
    setSearchParams(nextParams)
  }, [page, debouncedSearch, categoryFilter, departmentFilter, statusFilter, conditionFilter])

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

  const handleOpenCreateForm = () => {
    setEditingAsset(null)
    reset({
      assetTag: "",
      name: "",
      category: "",
      department: "",
      serialNumber: "",
      condition: "good",
      location: "",
      purchaseDate: "",
      purchaseCost: 0,
      warrantyExpiry: "",
      notes: "",
    })
    setFormModalOpen(true)
  }

  const handleOpenEditForm = (asset, event) => {
    event.stopPropagation()
    setEditingAsset(asset)
    reset({
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category?._id || asset.category,
      department: asset.department?._id || asset.department || "",
      serialNumber: asset.serialNumber || "",
      condition: asset.condition || "good",
      location: asset.location || "",
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0] : "",
      purchaseCost: asset.purchaseCost || 0,
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split("T")[0] : "",
      notes: asset.notes || "",
    })
    setFormModalOpen(true)
  }

  const handleFormSubmit = (data) => {
    // Convert empty cost to 0 or null
    const payload = { ...data }
    if (!payload.purchaseCost) payload.purchaseCost = undefined

    if (editingAsset) {
      updateAssetMutation.mutate(
        { id: editingAsset._id, data: payload },
        {
          onSuccess: () => {
            setFormModalOpen(false)
          },
        }
      )
    } else {
      createAssetMutation.mutate(payload, {
        onSuccess: () => {
          setFormModalOpen(false)
        },
      })
    }
  }

  const handleOpenDetails = (assetId) => {
    setSelectedAssetId(assetId)
    setDetailModalOpen(true)
  }

  const handleRetireClick = (assetId, event) => {
    event.stopPropagation()
    setRetireConfirmId(assetId)
  }

  const handleRetireConfirm = () => {
    retireAssetMutation.mutate(retireConfirmId, {
      onSuccess: () => {
        setRetireConfirmId(null)
      },
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      available: "bg-emerald-500/10 text-emerald-600 border-emerald-200/35",
      allocated: "bg-blue-500/10 text-blue-600 border-blue-200/35",
      maintenance: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      retired: "bg-neutral-500/10 text-neutral-600 border-neutral-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-bold text-[10px] rounded-md ${styles[status] || ""}`}>
        {status}
      </Badge>
    )
  }

  const getConditionBadge = (cond) => {
    const styles = {
      excellent: "bg-purple-500/10 text-purple-600 border-purple-200/35",
      good: "bg-blue-500/10 text-blue-600 border-blue-200/35",
      fair: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      poor: "bg-rose-500/10 text-rose-600 border-rose-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-semibold text-[10px] rounded-md ${styles[cond] || ""}`}>
        {cond}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Assets Directory</h2>
          <p className="text-xs text-muted-foreground">
            Register, allocate, monitor status, and review the catalog of enterprise equipment and devices.
          </p>
        </div>
        {isManager && (
          <Button onClick={handleOpenCreateForm} className="cursor-pointer gap-2 h-9 rounded-xl font-bold self-start sm:self-auto text-xs">
            <Plus className="h-4 w-4" /> Register Asset
          </Button>
        )}
      </div>

      {/* Filter and Search controls */}
      <Card className="border border-border/50 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets by tag, name, serial number, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
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

            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => handleFilterChange("condition", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Conditions</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Asset list Grid/Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading asset records...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Error loading asset directory</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
        </div>
      ) : assetsList.length === 0 ? (
        <Card className="border border-dashed border-border/40 p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Assets Registered</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            There are no equipment records registered matching the current filters or query criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                    <th className="p-4 w-[120px]">Asset Tag</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsList.map((asset) => (
                    <tr
                      key={asset._id}
                      onClick={() => handleOpenDetails(asset._id)}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-4 font-bold text-foreground">{asset.assetTag}</td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{asset.name}</div>
                        {asset.serialNumber && (
                          <div className="text-[10px] text-muted-foreground">S/N: {asset.serialNumber}</div>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{asset.category?.name || "N/A"}</td>
                      <td className="p-4 text-muted-foreground">{asset.department?.name || "N/A"}</td>
                      <td className="p-4 text-muted-foreground">{asset.location || "N/A"}</td>
                      <td className="p-4">{getStatusBadge(asset.status)}</td>
                      <td className="p-4">{getConditionBadge(asset.condition)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDetails(asset._id)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View Asset Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isManager && asset.status !== "retired" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleOpenEditForm(asset, e)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Edit Asset Info"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleRetireClick(asset._id, e)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Retire Asset"
                              >
                                <Trash2 className="h-4 w-4" />
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
            label="assets"
          />
        </div>
      )}

      {/* Asset Form Modal (Create / Edit) */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-2xl border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">
                {editingAsset ? "Update Asset Record" : "Register New Asset"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setFormModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assetTag">Asset Tag Code</Label>
                  <Input
                    id="assetTag"
                    type="text"
                    disabled={!!editingAsset}
                    placeholder="e.g. LAP-2024-001"
                    {...register("assetTag")}
                    className={`mt-1 h-9 ${errors.assetTag ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  {errors.assetTag && <p className="text-[10px] text-destructive mt-0.5">{errors.assetTag.message}</p>}
                </div>
                <div>
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. MacBook Pro M3"
                    {...register("name")}
                    className={`mt-1 h-9 ${errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                  />
                  {errors.name && <p className="text-[10px] text-destructive mt-0.5">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Asset Category</Label>
                  <select
                    id="category"
                    {...register("category")}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-[10px] text-destructive mt-0.5">{errors.category.message}</p>}
                </div>
                <div>
                  <Label htmlFor="department">Assign to Department (Optional)</Label>
                  <select
                    id="department"
                    {...register("department")}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Not Assigned (Available in General Inventory)</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    type="text"
                    placeholder="e.g. C02X12345678"
                    {...register("serialNumber")}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Physical Condition</Label>
                  <select
                    id="condition"
                    {...register("condition")}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchaseCost">Purchase Cost (USD)</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    step="0.01"
                    placeholder="1200.00"
                    {...register("purchaseCost")}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    {...register("purchaseDate")}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    {...register("warrantyExpiry")}
                    className="mt-1 h-9"
                  />
                  {errors.warrantyExpiry && <p className="text-[10px] text-destructive mt-0.5">{errors.warrantyExpiry.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="location">Inventory Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g. Room 402, Headquarters"
                  {...register("location")}
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes / Special Instructions</Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Additional descriptions..."
                  className="mt-1 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setFormModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createAssetMutation.isPending || updateAssetMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {(createAssetMutation.isPending || updateAssetMutation.isPending) && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingAsset ? "Save Changes" : "Register"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail View Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-xl border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Asset Information Profile
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setDetailModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {detailLoading ? (
              <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Fetching complete catalog details...</p>
              </div>
            ) : !assetDetail ? (
              <div className="p-10 text-center text-muted-foreground">Asset record details not found.</div>
            ) : (
              <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-foreground">{assetDetail.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{assetDetail.assetTag}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(assetDetail.status)}
                    {getConditionBadge(assetDetail.condition)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b py-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Category</span>
                    <p className="font-semibold text-foreground mt-0.5">{assetDetail.category?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Department</span>
                    <p className="font-semibold text-foreground mt-0.5">{assetDetail.department?.name || "Unassigned"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Serial Number</span>
                    <p className="font-semibold text-foreground mt-0.5">{assetDetail.serialNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Current Location</span>
                    <p className="font-semibold text-foreground mt-0.5">{assetDetail.location || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Purchase Cost</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {assetDetail.purchaseCost ? `$${assetDetail.purchaseCost.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Purchase Date</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {assetDetail.purchaseDate ? new Date(assetDetail.purchaseDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Warranty Expiry</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {assetDetail.warrantyExpiry ? new Date(assetDetail.warrantyExpiry).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                {assetDetail.notes && (
                  <div className="bg-muted/30 border rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-foreground block">Notes</span>
                    <p className="leading-relaxed">{assetDetail.notes}</p>
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground/80 flex items-center gap-2 pt-2 border-t justify-between">
                  <span>Registered by: {assetDetail.createdBy?.name || "N/A"}</span>
                  <span>Registered on: {new Date(assetDetail.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retire Confirmation Dialog */}
      {retireConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-sm border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Retire Asset Record?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to retire this asset? This action will mark the asset status as "retired" and cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setRetireConfirmId(null)} className="h-8 cursor-pointer text-xs">
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleRetireConfirm} className="h-8 cursor-pointer text-xs font-bold">
                Retire Asset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
