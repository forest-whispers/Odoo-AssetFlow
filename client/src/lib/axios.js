import axios from "axios"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_AXIOS_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Shared interceptor logic (e.g., adding headers if needed in the future)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Minimal standard error handling
    return Promise.reject(error);
  }
)

export default axiosInstance