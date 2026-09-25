import { defineStore } from 'pinia';
import type { User, Project, MockAPI, RequestLog } from '../types';
import { authApi, projectApi, mockApiApi, requestLogApi } from '../api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    isAuthenticated: !!localStorage.getItem('token')
  }),

  actions: {
    async login(username: string, password: string) {
      const response = await authApi.login(username, password);
      if (response.data.success) {
        this.token = response.data.data!.token;
        this.user = response.data.data!.user;
        this.isAuthenticated = true;
        localStorage.setItem('token', this.token!);
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      return response.data;
    },

    async register(username: string, password: string) {
      const response = await authApi.register(username, password);
      if (response.data.success) {
        this.token = response.data.data!.token;
        this.user = response.data.data!.user;
        this.isAuthenticated = true;
        localStorage.setItem('token', this.token!);
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      return response.data;
    },

    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  apis: MockAPI[];
  logs: RequestLog[];
  loading: boolean;
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    projects: [],
    currentProject: null,
    apis: [],
    logs: [],
    loading: false
  }),

  actions: {
    async fetchProjects() {
      this.loading = true;
      try {
        const response = await projectApi.getProjects();
        if (response.data.success) {
          this.projects = response.data.data!;
        }
      } finally {
        this.loading = false;
      }
    },

    async createProject(data: { name: string; description: string }) {
      const response = await projectApi.createProject(data);
      if (response.data.success) {
        this.projects.unshift(response.data.data!);
      }
      return response.data;
    },

    async deleteProject(id: string) {
      const response = await projectApi.deleteProject(id);
      if (response.data.success) {
        this.projects = this.projects.filter((p) => p._id !== id);
      }
      return response.data;
    },

    setCurrentProject(project: Project) {
      this.currentProject = project;
    },

    async fetchAPIs(projectId: string) {
      this.loading = true;
      try {
        const response = await mockApiApi.getAPIs(projectId);
        if (response.data.success) {
          this.apis = response.data.data!;
        }
      } finally {
        this.loading = false;
      }
    },

    async createAPI(projectId: string, data: Partial<MockAPI>) {
      const response = await mockApiApi.createAPI(projectId, data);
      if (response.data.success) {
        await this.fetchAPIs(projectId);
      }
      return response.data;
    },

    async updateAPI(projectId: string, id: string, data: Partial<MockAPI>) {
      const response = await mockApiApi.updateAPI(projectId, id, data);
      if (response.data.success) {
        await this.fetchAPIs(projectId);
      }
      return response.data;
    },

    // 列表上直接切换启用状态；停用后不参与匹配
    async toggleAPIEnabled(projectId: string, id: string, enabled: boolean) {
      const response = await mockApiApi.patchAPI(projectId, id, { enabled });
      if (response.data.success) {
        await this.fetchAPIs(projectId);
      }
      return response.data;
    },

    // 列表上直接调整优先级；数字越大越先命中
    async setAPIPriority(projectId: string, id: string, priority: number) {
      const response = await mockApiApi.patchAPI(projectId, id, { priority });
      if (response.data.success) {
        await this.fetchAPIs(projectId);
      }
      return response.data;
    },

    async deleteAPI(projectId: string, id: string) {
      const response = await mockApiApi.deleteAPI(projectId, id);
      if (response.data.success) {
        this.apis = this.apis.filter((a) => a._id !== id);
      }
      return response.data;
    },

    async fetchLogs(projectId: string) {
      this.loading = true;
      try {
        const response = await requestLogApi.getLogs(projectId);
        if (response.data.success) {
          this.logs = response.data.data!.logs;
        }
      } finally {
        this.loading = false;
      }
    },

    async clearLogs(projectId: string) {
      const response = await requestLogApi.clearLogs(projectId);
      if (response.data.success) {
        this.logs = [];
      }
      return response.data;
    }
  }
});
