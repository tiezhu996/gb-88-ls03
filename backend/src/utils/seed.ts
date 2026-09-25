import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './db';
import User from '../models/User';
import Project from '../models/Project';
import MockAPI from '../models/MockAPI';
import RequestLog from '../models/RequestLog';

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
      path: '/api/users',
      method: 'GET',
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
      path: '/api/users/:id',
      method: 'GET',
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
      path: '/api/users',
      method: 'POST',
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
      path: '/api/users/:id',
      method: 'PUT',
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
      path: '/api/users/:id',
      method: 'DELETE',
      statusCode: 204,
      responseBody: '',
      responseHeaders: {},
      delay: 0,
      conditions: []
    }
  ]);

  console.log('Mock APIs created');

  const logs = [];
  for (let i = 0; i < 10; i++) {
    logs.push({
      projectId: project._id,
      apiId: apis[i % apis.length]._id,
      method: apis[i % apis.length].method,
      path: apis[i % apis.length].path,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: null,
      query: {},
      responseStatus: apis[i % apis.length].statusCode,
      responseBody: {}
    });
  }
  await RequestLog.insertMany(logs);

  console.log('Request logs created');
  console.log('Seed data completed!');

  await disconnectDB();
}

seed().catch(console.error);
