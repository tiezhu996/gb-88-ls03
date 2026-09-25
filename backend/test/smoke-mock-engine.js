// 冒烟测试：验证 mockEngine 的优先级匹配、启用开关与日志命中记录
// 通过 stub MockAPI.find / RequestLog.create 模拟数据库行为
const assert = require('assert');
const MockAPI = require('../dist/models/MockAPI').default;
const RequestLog = require('../dist/models/RequestLog').default;
const { mockEngine } = require('../dist/middleware/mockEngine');

function makeApi(overrides) {
  return {
    _id: overrides._id,
    path: overrides.path,
    method: overrides.method || 'GET',
    statusCode: overrides.statusCode ?? 200,
    responseBody: overrides.responseBody ?? '{}',
    responseHeaders: {},
    delay: 0,
    conditions: overrides.conditions ?? [],
    priority: overrides.priority ?? 0,
    enabled: overrides.enabled ?? true,
    createdAt: overrides.createdAt
  };
}

// 内存中的候选接口：同路径两份（不同优先级+创建时间）、一条带条件规则、一条停用
const apis = [
  makeApi({ _id: 'fixed-first', path: '/api/users', priority: 0, createdAt: new Date('2026-01-01'), responseBody: '{"source":"fixed"}' }),
  makeApi({ _id: 'role-high', path: '/api/users', priority: 10, createdAt: new Date('2026-01-03'), responseBody: '{"source":"high"}',
    conditions: [
      { field: 'role', operator: 'equals', value: 'admin', responseBody: '{"source":"admin"}', statusCode: 200 },
      { field: 'role', operator: 'equals', value: 'guest', responseBody: '{"source":"guest"}', statusCode: 200 }
    ] }),
  makeApi({ _id: 'tie-older', path: '/api/users', priority: 10, createdAt: new Date('2026-01-02'), responseBody: '{"source":"tie-older"}' }),
  makeApi({ _id: 'disabled-top', path: '/api/users', priority: 99, createdAt: new Date('2025-12-01'), enabled: false, responseBody: '{"source":"disabled"}' })
];

let lastFindFilter = null;
let lastFindSort = null;
let lastLog = null;

// 模拟 Mongoose：find 只返回未停用（enabled !== false）的文档，并按 priority desc, createdAt asc 排序
MockAPI.find = (filter) => {
  lastFindFilter = filter;
  return {
    sort: (sortSpec) => {
      lastFindSort = sortSpec;
      const result = apis
        .filter((a) => a.method === filter.method && a.enabled !== false)
        .sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt));
      return Promise.resolve(result);
    }
  };
};
RequestLog.create = (doc) => { lastLog = doc; return Promise.resolve(doc); };

function runRequest(query) {
  return new Promise((resolve, reject) => {
    const req = {
      path: '/mock/proj1/api/users',
      method: 'GET',
      query: query || {},
      body: {},
      headers: {}
    };
    const res = {
      _headers: {},
      setHeader(k, v) { this._headers[k] = v; },
      status(code) { this._status = code; return this; },
      json(body) { this._body = body; resolve(this); },
      send(body) { this._body = body; resolve(this); }
    };
    mockEngine(req, res, reject);
  });
}

(async () => {
  // 1. 优先级最高的启用接口命中（tie-older 与 role-high 同为 10，先创建的 tie-older 胜出）
  let res = await runRequest();
  assert.deepStrictEqual(res._body, { source: 'tie-older' }, '同优先级应先创建的先命中');
  assert.deepStrictEqual(lastFindFilter.enabled, { $ne: false }, '匹配查询必须排除停用接口');
  assert.deepStrictEqual(lastFindSort, { priority: -1, createdAt: 1 }, '排序应为优先级降序+创建时间升序');
  assert.strictEqual(lastLog.matched, true);
  assert.strictEqual(lastLog.matchedApiPath, '/api/users');
  assert.strictEqual(lastLog.apiId, 'tie-older');
  assert.strictEqual(lastLog.matchedCondition, null, '默认响应时规则快照应为 null');
  console.log('✓ 优先级排序：同优先级按创建时间，停用接口(priority=99)未参与');

  // 2. 把 tie-older 停用后，role-high 补上；条件规则命中并记录规则快照
  apis.find((a) => a._id === 'tie-older').enabled = false;
  res = await runRequest({ role: 'admin' });
  assert.deepStrictEqual(res._body, { source: 'admin' }, '条件规则应命中');
  assert.strictEqual(lastLog.apiId, 'role-high');
  assert.deepStrictEqual(lastLog.matchedCondition, { index: 0, field: 'role', operator: 'equals', value: 'admin' });
  console.log('✓ 条件规则命中，日志记录规则快照（index/field/operator/value）');

  // 3. 第二条规则
  res = await runRequest({ role: 'guest' });
  assert.deepStrictEqual(res._body, { source: 'guest' });
  assert.strictEqual(lastLog.matchedCondition.index, 1);
  console.log('✓ 第二条规则命中，index=1');

  // 4. 高优先级接口无规则命中时走默认响应
  res = await runRequest({ role: 'nobody' });
  assert.deepStrictEqual(res._body, { source: 'high' });
  assert.strictEqual(lastLog.matchedCondition, null);
  console.log('✓ 规则不匹配时回落到该接口默认响应');

  // 5. 未命中任何接口：404 + 日志 matched=false
  const req404 = new Promise((resolve, reject) => {
    const req = { path: '/mock/proj1/api/unknown', method: 'GET', query: {}, body: {}, headers: {} };
    const res = {
      _headers: {},
      setHeader() {},
      status(code) { this._status = code; return this; },
      json(body) { this._body = body; resolve(this); },
      send(body) { this._body = body; resolve(this); }
    };
    mockEngine(req, res, reject);
  });
  res = await req404;
  assert.strictEqual(res._status, 404);
  assert.strictEqual(lastLog.matched, false, '未命中请求也要记录日志且 matched=false');
  assert.strictEqual(lastLog.apiId, undefined);
  assert.strictEqual(lastLog.path, '/api/unknown');
  console.log('✓ 未命中请求返回 404，日志 matched=false');

  console.log('\n全部冒烟测试通过');
  process.exit(0);
})().catch((err) => {
  console.error('测试失败:', err.message);
  process.exit(1);
});
