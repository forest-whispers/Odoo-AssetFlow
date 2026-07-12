import axiosInstance from "@/lib/axios"

export const orgApi = {
  getUsers: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/users", { params: query })
    return response.data
  },

  updateUserRole: async (id, role) => {
    const response = await axiosInstance.patch(`/users/${id}/role`, { role })
    return response.data
  },

  getDepartments: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/departments", { params: query })
    return response.data
  },

  createDepartment: async (data) => {
    const payload = { ...data }
    if (!payload.head) payload.head = null
    if (!payload.parentDepartment) payload.parentDepartment = null
    const response = await axiosInstance.post("/departments", payload)
    return response.data
  },

  updateDepartment: async (id, data) => {
    const payload = { ...data }
    if (payload.head === "") payload.head = null
    if (payload.parentDepartment === "") payload.parentDepartment = null
    const response = await axiosInstance.patch(`/departments/${id}`, payload)
    return response.data
  },

  getAssetCategories: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/asset-categories", { params: query })
    return response.data
  },

  createAssetCategory: async (data) => {
    const response = await axiosInstance.post("/asset-categories", data)
    return response.data
  },
}
