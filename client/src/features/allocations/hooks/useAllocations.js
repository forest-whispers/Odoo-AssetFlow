import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { allocationApi } from "../api/allocationApi"
import { toast } from "sonner"

export const ALLOCATION_KEYS = {
  all: ["allocations"],
  lists: () => [...ALLOCATION_KEYS.all, "list"],
  list: (params) => [...ALLOCATION_KEYS.lists(), params],
}

export function useAllocationsQuery(params) {
  return useQuery({
    queryKey: ALLOCATION_KEYS.list(params),
    queryFn: () => allocationApi.getAllocations(params),
    staleTime: 10000,
  })
}

export function useCreateAllocationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: allocationApi.createAllocation,
    onSuccess: (res) => {
      toast.success(res.message || "Asset allocated successfully")
      queryClient.invalidateQueries({ queryKey: ALLOCATION_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to allocate asset")
    },
  })
}

export function useReturnAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => allocationApi.returnAsset(id, data),
    onSuccess: (res) => {
      toast.success(res.message || "Asset returned successfully")
      queryClient.invalidateQueries({ queryKey: ALLOCATION_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to return asset")
    },
  })
}

export function useTransferAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => allocationApi.transferAsset(id, data),
    onSuccess: (res) => {
      toast.success(res.message || "Asset transferred successfully")
      queryClient.invalidateQueries({ queryKey: ALLOCATION_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ["assets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to transfer asset")
    },
  })
}
