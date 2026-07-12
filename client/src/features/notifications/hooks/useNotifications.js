import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationApi } from "../api/notificationApi"
import { toast } from "sonner"

export const NOTIFICATION_KEYS = {
  all: (params) => ["notifications", "list", params],
  unreadCount: () => ["notifications", "unread-count"],
}

export function useNotificationsQuery(params) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.all(params),
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 5000,
    refetchInterval: 30000, // Polling interval 30 seconds
  })
}

export function useNotificationsUnreadCountQuery() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 5000,
    refetchInterval: 30000, // Polling interval 30 seconds
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => notificationApi.markNotificationRead(id),
    onSuccess: () => {
      // Invalidate queries for notifications list and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to mark notification as read")
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAllNotificationsRead,
    onSuccess: (res) => {
      toast.success(res.message || "All notifications marked as read")
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || "Failed to mark all as read")
    },
  })
}
