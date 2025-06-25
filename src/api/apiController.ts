import axios, { InternalAxiosRequestConfig } from "axios";
import { io } from "socket.io-client";
import { auth } from "../Firestore/firestore";

interface AuthRequestConfig extends InternalAxiosRequestConfig {
  useAuth?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

const apiController = {
  get: (url: string, config = {}) => api.get(url, config),
  post: (url: string, data: any, config = {}) => api.post(url, data, config),
  put: (url: string, data: any, config = {}) => api.put(url, data, config),
  delete: (url: string, config = {}) => api.delete(url, config),
};

export const apiSocket = io(import.meta.env.VITE_SOCKET_BASE_URL, {
  autoConnect: false,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

export const apiSocketAuthUserId = 81; // TODO: Replace with dynamic user ID

export default apiController;
