import axiosInstance from "@/lib/axios"

export const assetApi = {
  getAssets: async (params) => {
    // Filter out undefined, null or empty strings
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/assets", { params: query })
    return response.data
  },

  getAsset: async (id) => {
    const response = await axiosInstance.get(`/assets/${id}`)
    return response.data
  },

  createAsset: async (data) => {
    // Normalize costs and null fields
    const payload = { ...data }
    if (payload.department === "") payload.department = null
    const response = await axiosInstance.post("/assets", payload)
    return response.data
  },

  updateAsset: async (id, data) => {
    const payload = { ...data }
    if (payload.department === "") payload.department = null
    const response = await axiosInstance.patch(`/assets/${id}`, payload)
    return response.data
  },

  retireAsset: async (id) => {
    const response = await axiosInstance.patch(`/assets/${id}/retire`)
    return response.data
  },
}
