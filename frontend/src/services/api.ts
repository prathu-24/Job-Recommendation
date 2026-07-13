import axios, { InternalAxiosRequestConfig } from "axios";

// Uses VITE_API_URL if defined (e.g. for local dev proxy),
// otherwise defaults to the production Render backend API endpoint.
const API_URL = import.meta.env.VITE_API_URL || "https://job-recommendation-8ccg.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_URL}/auth/refresh`,
            {
              refresh_token: refreshToken,
            }
          );

          const { access_token, refresh_token } = res.data;

          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          return api(originalRequest);
        } catch (err) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_role");

          window.location.href = "/login";

          return Promise.reject(err);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;