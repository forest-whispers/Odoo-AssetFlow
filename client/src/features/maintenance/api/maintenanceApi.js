import axiosInstance from "@/lib/axios"

export const maintenanceApi = {
  getMaintenanceRequests: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/maintenance", { params: query })
    return response.data
  },

  getMaintenanceRequest: async (id) => {
    const response = await axiosInstance.get(`/maintenance/${id}`)
    return response.data
  },

  createMaintenance: async (data) => {
    const response = await axiosInstance.post("/maintenance", data)
    return response.data
  },

  approveMaintenance: async (id) => {
    const response = await axiosInstance.patch(`/maintenance/${id}/approve`)
    return response.data
  },

  rejectMaintenance: async (id, data) => {
    const response = await axiosInstance.patch(`/maintenance/${id}/reject`, data)
    return response.data
  },

  resolveMaintenance: async (id, data) => {
    const response = await axiosInstance.patch(`/maintenance/${id}/resolve`, data)
    return response.data
  },
}
