export interface IUser {
  _id?: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt?: Date;
}

export interface IProject {
  _id?: string;
  name: string;
  description: string;
  baseUrl: string;
  userId: string;
  createdAt?: Date;
}

export interface IConditionRule {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
  responseBody: string;
  statusCode: number;
}

export interface IMockAPI {
  _id?: string;
  projectId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  statusCode: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  delay: number;
  conditions: IConditionRule[];
  priority: number;
  enabled: boolean;
  createdAt?: Date;
}

export interface IMatchedCondition {
  index: number;
  field: string;
  operator: string;
  value: string;
}

export interface IRequestLog {
  _id?: string;
  projectId: string;
  apiId?: string;
  matched: boolean;
  matchedApiPath?: string;
  matchedCondition?: IMatchedCondition | null;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  responseStatus: number;
  responseBody: any;
  createdAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
