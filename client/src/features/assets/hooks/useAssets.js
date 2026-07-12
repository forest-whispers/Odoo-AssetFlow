import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { assetApi } from "../api/assetApi"
import { toast } from "sonner"

export const ASSET_KEYS = {
  all: ["assets"],
  lists: () => [...ASSET_KEYS.all, "list"],
  list: (params) => [...ASSET_KEYS.lists(), params],
  details: () => [...ASSET_KEYS.all, "detail"],
  detail: (id) => [...ASSET_KEYS.details(), id],
}

export function useAssetsQuery(params) {
  return useQuery({
    queryKey: ASSET_KEYS.list(params),
    queryFn: () => assetApi.getAssets(params),
    staleTime: 10000,
  })
}

export function useAssetQuery(id, enabled = true) {
  return useQuery({
    queryKey: ASSET_KEYS.detail(id),
    queryFn: () => assetApi.getAsset(id),
    enabled: !!id && enabled,
    staleTime: 30000,
  })
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetApi.createAsset,
    onSuccess: (res) => {
      toast.success(res.message || "Asset registered successfully")
      queryClient.invalidateQueries({ queryKey: ASSET_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to register asset")
    },
  })
}

export function useUpdateAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => assetApi.updateAsset(id, data),
    onSuccess: (res, variables) => {
      toast.success(res.message || "Asset updated successfully")
      queryClient.invalidateQueries({ queryKey: ASSET_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ASSET_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update asset")
    },
  })
}

export function useRetireAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assetApi.retireAsset,
    onSuccess: (res, id) => {
      toast.success(res.message || "Asset retired successfully")
      queryClient.invalidateQueries({ queryKey: ASSET_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ASSET_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to retire asset")
    },
  })
}
