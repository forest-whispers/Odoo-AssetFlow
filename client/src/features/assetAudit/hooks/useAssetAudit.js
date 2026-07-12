import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { assetAuditApi } from "../api/assetAuditApi"
import { toast } from "sonner"

export const AUDIT_KEYS = {
  all: ["assetAudits"],
  lists: () => [...AUDIT_KEYS.all, "list"],
  list: (params) => [...AUDIT_KEYS.lists(), params],
  details: () => [...AUDIT_KEYS.all, "detail"],
  detail: (id) => [...AUDIT_KEYS.details(), id],
}

export function useAssetAuditsQuery(params) {
  return useQuery({
    queryKey: AUDIT_KEYS.list(params),
    queryFn: () => assetAuditApi.getAssetAudits(params),
    staleTime: 10000,
  })
}

export function useAssetAuditQuery(id, enabled = true) {
  return useQuery({
    queryKey: AUDIT_KEYS.detail(id),
    queryFn: () => assetAuditApi.getAssetAudit(id),
    enabled: !!id && enabled,
    staleTime: 10000,
  })
}

export function useCreateAssetAuditMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetAuditApi.createAssetAudit,
    onSuccess: (res) => {
      toast.success(res.message || "Asset audit scheduled successfully")
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to schedule asset audit")
    },
  })
}

export function useStartAssetAuditMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetAuditApi.startAssetAudit,
    onSuccess: (res, id) => {
      toast.success(res.message || "Asset audit started successfully")
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.detail(id) })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to start audit cycle")
    },
  })
}

export function useVerifyAuditItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, itemId, data }) => assetAuditApi.verifyAuditItem(id, itemId, data),
    onSuccess: (res, variables) => {
      toast.success(res.message || "Asset verified successfully")
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.detail(variables.id) })
      // Invalidate list to keep progress numbers up-to-date
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to verify asset")
    },
  })
}

export function useCompleteAssetAuditMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetAuditApi.completeAssetAudit,
    onSuccess: (res, id) => {
      toast.success(res.message || "Asset audit completed successfully")
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.detail(id) })
      // Invalidate assets list as verified conditions could propagate
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to complete audit cycle")
    },
  })
}
