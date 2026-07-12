import axiosInstance from "@/lib/axios"

export const allocationApi = {
  getAllocations: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/allocations", { params: query })
    return response.data
  },

  createAllocation: async (data) => {
    const response = await axiosInstance.post("/allocations", data)
    return response.data
  },

  returnAsset: async (id, data) => {
    const response = await axiosInstance.patch(`/allocations/${id}/return`, data)
    return response.data
  },

  transferAsset: async (id, data) => {
    const response = await axiosInstance.post(`/allocations/${id}/transfer`, data)
    return response.data
  },
}
