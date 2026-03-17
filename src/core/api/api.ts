import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Le pega la llave (Token) a todas las peticiones automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("club_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
