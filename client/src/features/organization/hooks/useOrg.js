import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orgApi } from "../api/orgApi"
import { toast } from "sonner"

export const ORG_KEYS = {
  users: (params) => ["org", "users", params],
  departments: (params) => ["org", "departments", params],
  categories: (params) => ["org", "categories", params],
}

export function useUsersQuery(params) {
  return useQuery({
    queryKey: ORG_KEYS.users(params),
    queryFn: () => orgApi.getUsers(params),
    staleTime: 10000,
  })
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role, department }) => orgApi.updateUserRole(id, { role, department }),
    onSuccess: (res) => {
      toast.success(res.message || "User details updated successfully")
      queryClient.invalidateQueries({ queryKey: ["org", "users"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update user details")
    },
  })
}

export function useDepartmentsQuery(params) {
  return useQuery({
    queryKey: ORG_KEYS.departments(params),
    queryFn: () => orgApi.getDepartments(params),
    staleTime: 30000,
  })
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orgApi.createDepartment,
    onSuccess: (res) => {
      toast.success(res.message || "Department created successfully")
      queryClient.invalidateQueries({ queryKey: ["org", "departments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create department")
    },
  })
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => orgApi.updateDepartment(id, data),
    onSuccess: (res) => {
      toast.success(res.message || "Department updated successfully")
      queryClient.invalidateQueries({ queryKey: ["org", "departments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update department")
    },
  })
}

export function useAssetCategoriesQuery(params) {
  return useQuery({
    queryKey: ORG_KEYS.categories(params),
    queryFn: () => orgApi.getAssetCategories(params),
    staleTime: 30000,
  })
}

export function useCreateAssetCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orgApi.createAssetCategory,
    onSuccess: (res) => {
      toast.success(res.message || "Asset category created successfully")
      queryClient.invalidateQueries({ queryKey: ["org", "categories"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create asset category")
    },
  })
}
