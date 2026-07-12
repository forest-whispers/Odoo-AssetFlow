import axiosInstance from "@/lib/axios"

export const activityLogsApi = {
  getActivityLogs: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/audit-logs", { params: query })
    return response.data
  },
}
