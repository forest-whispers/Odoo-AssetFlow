import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { resourceBookingApi } from "../api/resourceBookingApi"
import { toast } from "sonner"

export const RESOURCE_KEYS = {
  resources: (params) => ["resourceBooking", "resources", params],
  bookings: (params) => ["resourceBooking", "bookings", params],
  detail: (id) => ["resourceBooking", "booking", id],
}

export function useResourcesQuery(params) {
  return useQuery({
    queryKey: RESOURCE_KEYS.resources(params),
    queryFn: () => resourceBookingApi.getResources(params),
    staleTime: 30000,
  })
}

export function useCreateResourceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resourceBookingApi.createResource,
    onSuccess: (res) => {
      toast.success(res.message || "Resource created successfully")
      queryClient.invalidateQueries({ queryKey: ["resourceBooking", "resources"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create resource")
    },
  })
}

export function useBookingsQuery(params) {
  return useQuery({
    queryKey: RESOURCE_KEYS.bookings(params),
    queryFn: () => resourceBookingApi.getBookings(params),
    staleTime: 10000,
  })
}

export function useBookingQuery(id, enabled = true) {
  return useQuery({
    queryKey: RESOURCE_KEYS.detail(id),
    queryFn: () => resourceBookingApi.getBooking(id),
    enabled: !!id && enabled,
    staleTime: 30000,
  })
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resourceBookingApi.createBooking,
    onSuccess: (res) => {
      toast.success(res.message || "Resource booked successfully")
      queryClient.invalidateQueries({ queryKey: ["resourceBooking", "bookings"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      // Return error so form/page can check for conflict/overlap response
      throw err
    },
  })
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => resourceBookingApi.cancelBooking(id, data),
    onSuccess: (res, variables) => {
      toast.success(res.message || "Booking cancelled successfully")
      queryClient.invalidateQueries({ queryKey: ["resourceBooking", "bookings"] })
      queryClient.invalidateQueries({ queryKey: ["resourceBooking", "booking", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to cancel booking")
    },
  })
}

export function useCompleteBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => resourceBookingApi.completeBooking(id),
    onSuccess: (res, variables) => {
      toast.success(res.message || "Booking completed successfully")
      queryClient.invalidateQueries({ queryKey: ["resourceBooking", "bookings"] })
      queryClient.invalidateQueries({ queryKey: ["resourceBooking", "booking", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to complete booking")
    },
  })
}
