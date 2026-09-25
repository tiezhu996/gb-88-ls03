export interface User {
  id: string;
  username: string;
  role: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  baseUrl: string;
  userId: string;
  createdAt: string;
}

export interface ConditionRule {
  field: string;
  operator: string;
  value: string;
  responseBody: string;
  statusCode: number;
}

export interface MockAPI {
  _id: string;
  projectId: string;
  path: string;
  method: string;
  statusCode: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  delay: number;
  conditions: ConditionRule[];
  createdAt: string;
}

export interface RequestLog {
  _id: string;
  projectId: string;
  apiId?: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  responseStatus: number;
  responseBody: any;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
