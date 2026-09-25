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
  _id?: string;
  name?: string;
  field: string;
  operator: string;
  value: string;
  responseBody: string;
  statusCode: number;
}

export interface MockAPI {
  _id: string;
  projectId: string;
  name?: string;
  path: string;
  method: string;
  priority: number;
  enabled: boolean;
  statusCode: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  delay: number;
  conditions: ConditionRule[];
  createdAt: string;
}

export type MatchSource = 'default' | 'condition' | 'none';

export interface RequestLog {
  _id: string;
  projectId: string;
  apiId?: string;
  apiName?: string;
  apiPath?: string;
  apiMethod?: string;
  priority?: number;
  matched: boolean;
  matchSource: MatchSource;
  matchedRuleId?: string;
  matchedRuleName?: string;
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
