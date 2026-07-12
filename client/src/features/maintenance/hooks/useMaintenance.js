import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { maintenanceApi } from "../api/maintenanceApi"
import { toast } from "sonner"

export const MAINTENANCE_KEYS = {
  all: ["maintenance"],
  lists: () => [...MAINTENANCE_KEYS.all, "list"],
  list: (params) => [...MAINTENANCE_KEYS.lists(), params],
  details: () => [...MAINTENANCE_KEYS.all, "detail"],
  detail: (id) => [...MAINTENANCE_KEYS.details(), id],
}

export function useMaintenanceRequestsQuery(params) {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.list(params),
    queryFn: () => maintenanceApi.getMaintenanceRequests(params),
    staleTime: 10000,
  })
}

export function useMaintenanceRequestQuery(id, enabled = true) {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.detail(id),
    queryFn: () => maintenanceApi.getMaintenanceRequest(id),
    enabled: !!id && enabled,
    staleTime: 30000,
  })
}

export function useCreateMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: maintenanceApi.createMaintenance,
    onSuccess: (res) => {
      toast.success(res.message || "Maintenance request reported successfully")
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create request")
    },
  })
}

export function useApproveMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: maintenanceApi.approveMaintenance,
    onSuccess: (res, id) => {
      toast.success(res.message || "Maintenance request approved")
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to approve request")
    },
  })
}

export function useRejectMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => maintenanceApi.rejectMaintenance(id, data),
    onSuccess: (res, variables) => {
      toast.success(res.message || "Maintenance request rejected")
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to reject request")
    },
  })
}

export function useResolveMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => maintenanceApi.resolveMaintenance(id, data),
    onSuccess: (res, variables) => {
      toast.success(res.message || "Maintenance request resolved successfully")
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to resolve request")
    },
  })
}
