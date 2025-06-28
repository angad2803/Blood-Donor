import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Add token to headers automatically if logged in
API.interceptors.request.use((config) => {
  // Check sessionStorage first (tab-specific), then localStorage
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 403 on an admin route, refresh user data
    if (
      error.response?.status === 403 &&
      error.config?.url?.includes("/admin/")
    ) {
      // Dispatch a custom event to notify the app about privilege revocation
      window.dispatchEvent(
        new CustomEvent("adminPrivilegesRevoked", {
          detail: {
            message: error.response.data?.message || "Admin privileges revoked",
          },
        })
      );
    }

    // If we get a 401, the token might be invalid
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete API.defaults.headers.common["Authorization"];

      // Dispatch logout event
      window.dispatchEvent(
        new CustomEvent("forceLogout", {
          detail: { message: "Session expired" },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default API;
