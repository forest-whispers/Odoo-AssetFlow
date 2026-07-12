import axiosInstance from "@/lib/axios"

export const resourceBookingApi = {
  getResources: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/resource-booking/resources", { params: query })
    return response.data
  },

  createResource: async (data) => {
    const response = await axiosInstance.post("/resource-booking/resources", data)
    return response.data
  },

  getBookings: async (params) => {
    const query = {}
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          query[key] = params[key]
        }
      })
    }
    const response = await axiosInstance.get("/resource-booking/bookings", { params: query })
    return response.data
  },

  getBooking: async (id) => {
    const response = await axiosInstance.get(`/resource-booking/bookings/${id}`)
    return response.data
  },

  createBooking: async (data) => {
    const response = await axiosInstance.post("/resource-booking/bookings", data)
    return response.data
  },

  cancelBooking: async (id, data) => {
    // Exact cancel payload: { reason }
    const response = await axiosInstance.patch(`/resource-booking/bookings/${id}/cancel`, data)
    return response.data
  },

  completeBooking: async (id) => {
    const response = await axiosInstance.patch(`/resource-booking/bookings/${id}/complete`)
    return response.data
  },
}
