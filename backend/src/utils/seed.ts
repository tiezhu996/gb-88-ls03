import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './db';
import User from '../models/User';
import Project from '../models/Project';
import MockAPI from '../models/MockAPI';
import RequestLog from '../models/RequestLog';
import { IRequestLog } from '../types';

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Project.deleteMany({});
  await MockAPI.deleteMany({});
  await RequestLog.deleteMany({});

  const hashedPassword1 = await bcrypt.hash('dev123', 10);
  const hashedPassword2 = await bcrypt.hash('lead123', 10);

  const user1 = await User.create({
    username: 'dev',
    password: hashedPassword1,
    role: 'user'
  });

  await User.create({
    username: 'lead',
    password: hashedPassword2,
    role: 'admin'
  });

  console.log('Users created');

  const project = await Project.create({
    name: '用户管理系统',
    description: '用户管理系统的 Mock API 项目',
    baseUrl: `/mock`,
    userId: user1._id
  });

  console.log('Project created');

  const apis = await MockAPI.insertMany([
    {
      projectId: project._id,
      name: '固定用户列表',
      path: '/api/users',
      method: 'GET',
      priority: 0,
      enabled: true,
      statusCode: 200,
      responseBody: JSON.stringify([
        { id: 1, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'admin' },
        { id: 2, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'user' },
        { id: 3, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'user' },
        { id: 4, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'user' },
        { id: 5, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'user' }
      ]),
      responseHeaders: { 'Content-Type': 'application/json' },
      delay: 0,
      conditions: []
    },
    {
      projectId: project._id,
      name: '按角色返回用户列表',
      path: '/api/users',
      method: 'GET',
      priority: 10,
      enabled: true,
      statusCode: 200,
      responseBody: JSON.stringify([
        { id: 0, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'guest' }
      ]),
      responseHeaders: { 'Content-Type': 'application/json' },
      delay: 0,
      conditions: [
        {
          name: '管理员角色',
          field: 'role',
          operator: 'equals',
          value: 'admin',
          statusCode: 200,
          responseBody: JSON.stringify([
            { id: 1, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'admin' },
            { id: 9, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'admin' }
          ])
        },
        {
          name: '普通用户角色',
          field: 'role',
          operator: 'equals',
          value: 'user',
          statusCode: 200,
          responseBody: JSON.stringify([
            { id: 2, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'user' },
            { id: 3, name: '{{person.fullName}}', email: '{{internet.email}}', role: 'user' }
          ])
        }
      ]
    },
    {
      projectId: project._id,
      name: '已停用的高优先级数据',
      path: '/api/users',
      method: 'GET',
      priority: 99,
      enabled: false,
      statusCode: 200,
      responseBody: JSON.stringify({ message: '这份数据已停用，不应被命中' }),
      responseHeaders: { 'Content-Type': 'application/json' },
      delay: 0,
      conditions: []
    },
    {
      projectId: project._id,
      name: '用户详情',
      path: '/api/users/:id',
      method: 'GET',
      priority: 0,
      enabled: true,
      statusCode: 200,
      responseBody: JSON.stringify({
        id: 1,
        name: '{{person.fullName}}',
        email: '{{internet.email}}',
        role: 'user',
        createdAt: '{{date.past}}'
      }),
      responseHeaders: { 'Content-Type': 'application/json' },
      delay: 0,
      conditions: []
    },
    {
      projectId: project._id,
      name: '创建用户',
      path: '/api/users',
      method: 'POST',
      priority: 0,
      enabled: true,
      statusCode: 201,
      responseBody: JSON.stringify({
        id: '{{datatype.uuid}}',
        name: '{{person.fullName}}',
        email: '{{internet.email}}',
        role: 'user',
        createdAt: '{{date.now}}'
      }),
      responseHeaders: { 'Content-Type': 'application/json' },
      delay: 0,
      conditions: []
    },
    {
      projectId: project._id,
      name: '更新用户',
      path: '/api/users/:id',
      method: 'PUT',
      priority: 0,
      enabled: true,
      statusCode: 200,
      responseBody: JSON.stringify({
        success: true,
        message: '用户更新成功',
        updatedAt: '{{date.now}}'
      }),
      responseHeaders: { 'Content-Type': 'application/json' },
      delay: 0,
      conditions: []
    },
    {
      projectId: project._id,
      name: '删除用户',
      path: '/api/users/:id',
      method: 'DELETE',
      priority: 0,
      enabled: true,
      statusCode: 204,
      responseBody: '',
      responseHeaders: {},
      delay: 0,
      conditions: []
    }
  ]);

  console.log('Mock APIs created');

  const [fixedList, roleList, , userDetail, createUser, updateUser, deleteUser] = apis;

  const logs: Partial<IRequestLog>[] = [
    {
      projectId: project._id,
      apiId: roleList._id,
      apiName: roleList.name,
      apiPath: roleList.path,
      apiMethod: roleList.method,
      priority: roleList.priority,
      matched: true,
      matchSource: 'condition' as const,
      matchedRuleId: roleList.conditions[0]._id,
      matchedRuleName: '管理员角色',
      method: 'GET',
      path: '/api/users',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: null,
      query: { role: 'admin' },
      responseStatus: 200,
      responseBody: {}
    },
    {
      projectId: project._id,
      apiId: roleList._id,
      apiName: roleList.name,
      apiPath: roleList.path,
      apiMethod: roleList.method,
      priority: roleList.priority,
      matched: true,
      matchSource: 'condition' as const,
      matchedRuleId: roleList.conditions[1]._id,
      matchedRuleName: '普通用户角色',
      method: 'GET',
      path: '/api/users',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: null,
      query: { role: 'user' },
      responseStatus: 200,
      responseBody: {}
    },
    {
      projectId: project._id,
      matched: false,
      matchSource: 'none' as const,
      method: 'GET',
      path: '/api/orders',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: null,
      query: {},
      responseStatus: 404,
      responseBody: {}
    }
  ];

  // 其余日志均匀覆盖各接口的默认响应
  const restApis = [fixedList, userDetail, createUser, updateUser, deleteUser, fixedList, userDetail];
  for (const api of restApis) {
    logs.push({
      projectId: project._id,
      apiId: api._id,
      apiName: api.name,
      apiPath: api.path,
      apiMethod: api.method,
      priority: api.priority,
      matched: true,
      matchSource: 'default' as const,
      method: api.method,
      path: api.path,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: null,
      query: {},
      responseStatus: api.statusCode,
      responseBody: {}
    });
  }

  await RequestLog.insertMany(logs);

  console.log('Request logs created');
  console.log('Seed data completed!');

  await disconnectDB();
}

seed().catch(console.error);
