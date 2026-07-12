import axiosInstance from "@/lib/axios"

export const dashboardApi = {
  getDashboardData: async () => {
    const response = await axiosInstance.get("/dashboard")
    return response.data
  },
}
