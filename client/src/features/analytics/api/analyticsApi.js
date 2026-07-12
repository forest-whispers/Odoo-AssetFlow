import axiosInstance from "@/lib/axios"

export const analyticsApi = {
  getAnalytics: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/analytics", { params: query })
    return response.data
  },
}
