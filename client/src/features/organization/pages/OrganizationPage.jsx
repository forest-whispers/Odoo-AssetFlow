import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Users,
  Layers,
  Tags,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  UserCheck,
  Building,
  CheckCircle,
  Eye,
  Edit2,
  FileText
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useUsersQuery,
  useUpdateUserRoleMutation,
  useDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useAssetCategoriesQuery,
  useCreateAssetCategoryMutation
} from "../hooks/useOrg"
import Pagination from "@/components/Pagination"

// Schemas
const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must contain at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters"),
  head: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a valid department head").optional().or(z.literal("")),
  parentDepartment: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a valid parent department").optional().or(z.literal("")),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
})

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must contain at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Category code must contain at least 2 characters")
    .max(20, "Category code cannot exceed 20 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
})

export default function OrganizationPage() {
  const { user: currUser } = useSelector((state) => state.auth)
  const isAdmin = currUser?.role === "admin"
  const isCategoryManager = ["admin", "asset_manager"].includes(currUser?.role)

  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "departments"
  const page = parseInt(searchParams.get("page") || "1", 10)
  const userRoleFilter = searchParams.get("role") || ""
  const userSearch = searchParams.get("search") || ""

  const [searchVal, setSearchVal] = useState(userSearch)

  // Modals state
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [catModalOpen, setCatModalOpen] = useState(false)

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        if (searchVal) prev.set("search", searchVal)
        else prev.delete("search")
        prev.set("page", "1")
        return prev
      })
    }, 400)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Queries
  // 1. Users list (Admin only)
  const usersParams = useMemo(() => {
    const params = { page, limit: 10 }
    if (userRoleFilter) params.role = userRoleFilter
    if (userSearch) params.search = userSearch
    return params
  }, [page, userRoleFilter, userSearch])

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsersQuery(usersParams)
  const usersList = usersData?.data?.users || []
  const userPagination = usersData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // 2. Departments
  const { data: deptsData, isLoading: deptsLoading, refetch: refetchDepts } = useDepartmentsQuery()
  const departments = deptsData?.data || []

  // 3. Asset Categories
  const { data: catsData, isLoading: catsLoading, refetch: refetchCats } = useAssetCategoriesQuery()
  const categories = catsData?.data || []

  // 4. Department Heads selection list (users with role department_head)
  const { data: deptHeadsData } = useUsersQuery({ role: "department_head", limit: 100 })
  const departmentHeads = deptHeadsData?.data?.users || []

  // Mutations
  const updateRoleMutation = useUpdateUserRoleMutation()
  const createDeptMutation = useCreateDepartmentMutation()
  const updateDeptMutation = useUpdateDepartmentMutation()
  const createCatMutation = useCreateAssetCategoryMutation()

  // Forms
  const deptForm = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", head: "", parentDepartment: "", description: "" },
  })

  const catForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", code: "", description: "" },
  })

  // URL State Synch
  useEffect(() => {
    const nextParams = {}
    nextParams.tab = activeTab
    if (activeTab === "users" && isAdmin) {
      if (page > 1) nextParams.page = String(page)
      if (userRoleFilter) nextParams.role = userRoleFilter
      if (userSearch) nextParams.search = userSearch
    }
    setSearchParams(nextParams)
  }, [activeTab, page, userRoleFilter, userSearch])

  const handleTabChange = (tab) => {
    setSearchParams({ tab, page: "1" })
  }

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  const handleRoleFilterChange = (role) => {
    setSearchParams((prev) => {
      prev.set("page", "1")
      if (role) prev.set("role", role)
      else prev.delete("role")
      return prev
    })
  }

  const handleRoleUpdate = (userId, newRole) => {
    updateRoleMutation.mutate({ id: userId, role: newRole })
  }

  const handleOpenDeptModal = () => {
    setEditingDepartment(null)
    deptForm.reset({ name: "", head: "", parentDepartment: "", description: "" })
    setDeptModalOpen(true)
  }

  const handleOpenEditDeptModal = (dept, event) => {
    event.stopPropagation()
    setEditingDepartment(dept)
    deptForm.reset({
      name: dept.name,
      head: dept.head?._id || dept.head || "",
      parentDepartment: dept.parentDepartment?._id || dept.parentDepartment || "",
      description: dept.description || "",
    })
    setDeptModalOpen(true)
  }

  const handleOpenCatModal = () => {
    catForm.reset({ name: "", code: "", description: "" })
    setCatModalOpen(true)
  }

  const handleCreateDept = (data) => {
    if (editingDepartment) {
      updateDeptMutation.mutate(
        { id: editingDepartment._id, data },
        {
          onSuccess: () => {
            setDeptModalOpen(false)
          },
        }
      )
    } else {
      createDeptMutation.mutate(data, {
        onSuccess: () => {
          setDeptModalOpen(false)
        },
      })
    }
  }

  const handleCreateCat = (data) => {
    createCatMutation.mutate(data, {
      onSuccess: () => {
        setCatModalOpen(false)
      },
    })
  }

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-rose-500/10 text-rose-600 border-rose-200/35",
      asset_manager: "bg-blue-500/10 text-blue-600 border-blue-200/35",
      department_head: "bg-amber-500/10 text-amber-600 border-amber-200/35",
      employee: "bg-neutral-500/10 text-neutral-600 border-neutral-200/35"
    }
    return (
      <Badge variant="outline" className={`capitalize font-bold text-[10px] rounded-md ${styles[role] || ""}`}>
        {role?.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Organization Administration</h2>
          <p className="text-xs text-muted-foreground">
            Configure system roles, catalog organizational structures, and register category codes.
          </p>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => handleTabChange("departments")}
          className={`px-4 py-2 font-bold text-xs cursor-pointer border-b-2 -mb-[2px] transition-colors flex items-center gap-1.5 ${
            activeTab === "departments"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" /> Departments
        </button>
        <button
          onClick={() => handleTabChange("categories")}
          className={`px-4 py-2 font-bold text-xs cursor-pointer border-b-2 -mb-[2px] transition-colors flex items-center gap-1.5 ${
            activeTab === "categories"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tags className="h-4 w-4" /> Categories
        </button>
        {isAdmin && (
          <button
            onClick={() => handleTabChange("users")}
            className={`px-4 py-2 font-bold text-xs cursor-pointer border-b-2 -mb-[2px] transition-colors flex items-center gap-1.5 ${
              activeTab === "users"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" /> Employee
          </button>
        )}
      </div>

      {/* Content Rendering based on Tab */}

      {/* TAB 1: USERS */}
      {activeTab === "users" && isAdmin && (
        <div className="space-y-4">
          <Card className="border border-border/50 shadow-xs">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search users by name, email, employee ID..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="flex-1 h-9"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="asset_manager">Asset Manager</option>
                <option value="department_head">Department Head</option>
                <option value="employee">Employee</option>
              </select>
            </CardContent>
          </Card>

          {usersLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading users directory...</p>
            </div>
          ) : usersList.length === 0 ? (
            <Card className="border border-dashed border-border/40 p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">No Users Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                There are no user records logged matching the criteria.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                        <th className="p-4">Name / ID</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Department / Job</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">System Role</th>
                        <th className="p-4 text-right">Role Assignment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((usr) => (
                        <tr key={usr._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors duration-150">
                          <td className="p-4">
                            <div className="font-bold text-foreground">{usr.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">EMP ID: {usr.employeeId || "N/A"}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">{usr.email}</td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{usr.department?.name || "No Department"}</div>
                            <div className="text-[10px] text-muted-foreground">{usr.jobTitle || ""}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={`font-bold text-[9px] rounded-md ${usr.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                              {usr.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-4">{getRoleBadge(usr.role)}</td>
                          <td className="p-4 text-right">
                            <select
                              value={usr.role}
                              disabled={usr._id === currUser.id}
                              onChange={(e) => handleRoleUpdate(usr._id, e.target.value)}
                              className="h-8 rounded-md border border-input bg-transparent px-2 py-0.5 text-[11px] font-semibold select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <option value="admin">Admin</option>
                              <option value="asset_manager">Asset Manager</option>
                              <option value="department_head">Department Head</option>
                              <option value="employee">Employee</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                page={userPagination.page}
                totalPages={userPagination.totalPages}
                total={userPagination.total}
                limit={10}
                onPageChange={handlePageChange}
                label="users"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Total registered departments: <span className="font-bold text-foreground">{departments.length}</span>
            </div>
            {isAdmin && (
              <Button onClick={handleOpenDeptModal} className="h-8 rounded-lg text-xs font-bold gap-1 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Setup Department
              </Button>
            )}
          </div>

          {deptsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading departments list...</p>
            </div>
          ) : departments.length === 0 ? (
            <Card className="border border-dashed border-border/40 p-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">No Departments</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                There are no business departments cataloged yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <Card key={dept._id} className="border border-border/40 shadow-2xs hover:shadow-xs flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-300">
                  <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5 flex flex-row items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-extrabold text-foreground">{dept.name}</CardTitle>
                      {dept.parentDepartment && (
                        <CardDescription className="text-[10px] mt-0.5">Sub-dept of: {dept.parentDepartment.name}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEditDeptModal(dept, e)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
                          title="Edit Department"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Badge variant="outline" className={`font-bold text-[9px] rounded-md ${dept.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                        {dept.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 space-y-4 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Department Head</span>
                      <p className="font-semibold text-foreground mt-0.5">{dept.head?.name || "Unassigned"}</p>
                    </div>
                    {dept.description && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Description</span>
                        <p className="text-muted-foreground leading-relaxed mt-0.5 line-clamp-3">{dept.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSET CATEGORIES */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Total registered categories: <span className="font-bold text-foreground">{categories.length}</span>
            </div>
            {isCategoryManager && (
              <Button onClick={handleOpenCatModal} className="h-8 rounded-lg text-xs font-bold gap-1 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Setup Category
              </Button>
            )}
          </div>

          {catsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading asset categories pool...</p>
            </div>
          ) : categories.length === 0 ? (
            <Card className="border border-dashed border-border/40 p-12 text-center">
              <Tags className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-bold text-foreground mb-1">No Categories</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                There are no asset categories cataloged yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Card key={cat._id} className="border border-border/40 shadow-2xs hover:shadow-xs flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-300">
                  <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5 flex flex-row items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-extrabold text-foreground">{cat.name}</CardTitle>
                      <CardDescription className="text-[10px] font-mono mt-0.5">Code: {cat.code}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`font-bold text-[9px] rounded-md ${cat.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 space-y-4 text-xs">
                    {cat.description && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Description</span>
                        <p className="text-muted-foreground leading-relaxed mt-0.5 line-clamp-3">{cat.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Department Dialog Form */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">
                {editingDepartment ? "Update Department" : "Setup Department"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setDeptModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={deptForm.handleSubmit(handleCreateDept)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Engineering, HR"
                  {...deptForm.register("name")}
                  className={`mt-1 h-9 ${deptForm.formState.errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                {deptForm.formState.errors.name && (
                  <p className="text-[10px] text-destructive mt-0.5">{deptForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="head">Department Head User (Optional)</Label>
                <select
                  id="head"
                  {...deptForm.register("head")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose department head user...</option>
                  {departmentHeads.map((h) => (
                    <option key={h._id} value={h._id}>{h.name} ({h.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="parentDepartment">Parent Department (Optional)</Label>
                <select
                  id="parentDepartment"
                  {...deptForm.register("parentDepartment")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Choose parent department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Department Description</Label>
                <textarea
                  id="description"
                  {...deptForm.register("description")}
                  placeholder="Explain the scope of this business unit..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setDeptModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createDeptMutation.isPending || updateDeptMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {(createDeptMutation.isPending || updateDeptMutation.isPending) && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {editingDepartment ? "Save Changes" : "Create Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Dialog Form */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-base text-foreground">Setup Asset Category</h3>
              <Button variant="ghost" size="icon" onClick={() => setCatModalOpen(false)} className="h-8 w-8 rounded-lg cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={catForm.handleSubmit(handleCreateCat)} className="p-6 space-y-4">
              <div>
                <Label htmlFor="catName">Category Name</Label>
                <Input
                  id="catName"
                  placeholder="e.g. Computing Devices, Office Furniture"
                  {...catForm.register("name")}
                  className={`mt-1 h-9 ${catForm.formState.errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                {catForm.formState.errors.name && (
                  <p className="text-[10px] text-destructive mt-0.5">{catForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="code">Category Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. COMP_DEV, OFF_FURN"
                  {...catForm.register("code")}
                  className={`mt-1 h-9 ${catForm.formState.errors.code ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                />
                {catForm.formState.errors.code && (
                  <p className="text-[10px] text-destructive mt-0.5">{catForm.formState.errors.code.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="catDesc">Description</Label>
                <textarea
                  id="catDesc"
                  {...catForm.register("description")}
                  placeholder="Explain types of items classified here..."
                  className="mt-1.5 flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 bg-muted/5 -mx-6 -mb-6 p-4">
                <Button variant="outline" type="button" onClick={() => setCatModalOpen(false)} className="h-9 cursor-pointer text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={createCatMutation.isPending} className="h-9 cursor-pointer text-xs font-bold">
                  {createCatMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
