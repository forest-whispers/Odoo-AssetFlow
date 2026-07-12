import axiosInstance from "@/lib/axios"

export const notificationApi = {
  getNotifications: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/notifications", { params: query })
    return response.data
  },

  getUnreadCount: async () => {
    const response = await axiosInstance.get("/notifications/unread-count")
    return response.data
  },

  markNotificationRead: async (id) => {
    const response = await axiosInstance.patch(`/notifications/${id}/read`)
    return response.data
  },

  markAllNotificationsRead: async () => {
    const response = await axiosInstance.patch("/notifications/read-all")
    return response.data
  },
}
