import axiosInstance from "@/lib/axios"

export const assetAuditApi = {
  getAssetAudits: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/asset-audits", { params: query })
    return response.data
  },

  getAssetAudit: async (id) => {
    const response = await axiosInstance.get(`/asset-audits/${id}`)
    return response.data
  },

  createAssetAudit: async (data) => {
    const payload = { ...data }
    if (!payload.auditors) payload.auditors = []
    const response = await axiosInstance.post("/asset-audits", payload)
    return response.data
  },

  startAssetAudit: async (id) => {
    const response = await axiosInstance.patch(`/asset-audits/${id}/start`)
    return response.data
  },

  verifyAuditItem: async (id, itemId, data) => {
    const response = await axiosInstance.patch(`/asset-audits/${id}/items/${itemId}`, data)
    return response.data
  },

  completeAssetAudit: async (id) => {
    const response = await axiosInstance.patch(`/asset-audits/${id}/complete`)
    return response.data
  },
}
