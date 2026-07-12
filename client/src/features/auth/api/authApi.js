import axiosInstance from "@/lib/axios"

export const authApi = {
  register: async (userData) => {
    // Filter out empty strings for optional fields to avoid backend sparse unique key constraints
    const payload = { ...userData }
    if (!payload.employeeId) delete payload.employeeId
    if (!payload.jobTitle) delete payload.jobTitle

    const response = await axiosInstance.post("/users/register", payload)
    return response.data
  },

  login: async (credentials) => {
    const response = await axiosInstance.post("/users/login", credentials)
    return response.data
  },

  logout: async () => {
    const response = await axiosInstance.get("/users/logout")
    return response.data
  },

  getProfile: async () => {
    const response = await axiosInstance.get("/users/me")
    return response.data
  },
}
