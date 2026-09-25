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
  _id?: string;
  name?: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
  responseBody: string;
  statusCode: number;
}

export interface IMockAPI {
  _id?: string;
  projectId: string;
  name?: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  priority: number;
  enabled: boolean;
  statusCode: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  delay: number;
  conditions: IConditionRule[];
  createdAt?: Date;
}

export type MatchSource = 'default' | 'condition' | 'none';

export interface IRequestLog {
  _id?: string;
  projectId: string;
  apiId?: string;
  apiName?: string;
  apiPath?: string;
  apiMethod?: string;
  matched: boolean;
  matchSource: MatchSource;
  matchedRuleId?: string;
  matchedRuleName?: string;
  priority?: number;
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
