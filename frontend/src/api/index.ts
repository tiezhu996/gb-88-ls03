import axios from 'axios';
import type { User, Project, MockAPI, RequestLog, ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', { username, password }),
  getCurrentUser: () => api.get<ApiResponse<User>>('/auth/me')
};

export const projectApi = {
  getProjects: () => api.get<ApiResponse<Project[]>>('/projects'),
  getProject: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
  createProject: (data: { name: string; description: string }) =>
    api.post<ApiResponse<Project>>('/projects', data),
  updateProject: (id: string, data: { name: string; description: string }) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete<ApiResponse<void>>(`/projects/${id}`)
};

export const mockApiApi = {
  getAPIs: (projectId: string) => api.get<ApiResponse<MockAPI[]>>(`/projects/${projectId}/apis`),
  getAPI: (projectId: string, id: string) => api.get<ApiResponse<MockAPI>>(`/projects/${projectId}/apis/${id}`),
  createAPI: (projectId: string, data: Partial<MockAPI>) =>
    api.post<ApiResponse<MockAPI>>(`/projects/${projectId}/apis`, data),
  updateAPI: (projectId: string, id: string, data: Partial<MockAPI>) =>
    api.put<ApiResponse<MockAPI>>(`/projects/${projectId}/apis/${id}`, data),
  toggleAPI: (projectId: string, id: string, enabled: boolean) =>
    api.patch<ApiResponse<MockAPI>>(`/projects/${projectId}/apis/${id}/toggle`, { enabled }),
  deleteAPI: (projectId: string, id: string) => api.delete<ApiResponse<void>>(`/projects/${projectId}/apis/${id}`)
};

export const requestLogApi = {
  getLogs: (projectId: string, page = 1, limit = 50) =>
    api.get<ApiResponse<{ logs: RequestLog[]; pagination: any }>>(`/projects/${projectId}/logs`, {
      params: { page, limit }
    }),
  clearLogs: (projectId: string) => api.delete<ApiResponse<void>>(`/projects/${projectId}/logs`)
};
