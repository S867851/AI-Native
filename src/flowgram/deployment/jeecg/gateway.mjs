/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { createServer } from 'node:http';
import { mkdir, readFile, readdir, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const fail = (status, message) => Object.assign(new Error(message), { status });
const terminal = new Set(['succeeded', 'failed', 'canceled', 'interrupted']);
const validID = (id) => /^[a-zA-Z0-9_-]{1,100}$/.test(id || '');
function schemaCheck(schema) {
  if (!schema || !Array.isArray(schema.nodes) || !Array.isArray(schema.edges)) {
    throw fail(400, '流程必须包含节点和连线');
  }
}
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(
    ([key, item]) => [key, /api.?key|password|secret|access.?token|authorization/i.test(key) ? '***' : redact(item)]
  ));
  return value;
}

export async function makeGateway({ dataDir, jeecg, runtime, authenticate } = {}) {
  await mkdir(join(dataDir, 'workflows'), { recursive: true });
  await mkdir(join(dataDir, 'runs'), { recursive: true });
  const file = (type, id) => {
    if (!validID(id)) throw fail(400, '无效编号');
    return join(dataDir, type, `${id}.json`);
  };
  const load = async (type, id) => {
    try { return JSON.parse(await readFile(file(type, id), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') throw fail(404, '记录不存在'); throw error; }
  };
  const save = async (type, data) => {
    const dest = file(type, data.id);
    const tmp = `${dest}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(data), { mode: 0o600 });
    await rename(tmp, dest);
  };
  const list = async (type) => {
    const names = (await readdir(join(dataDir, type))).filter((name) => name.endsWith('.json'));
    return Promise.all(names.map((name) => load(type, name.slice(0, -5))));
  };
  // Serialize writes and permission-sensitive run submission to avoid lost revisions.
  let queue = Promise.resolve();
  const serial = (fn) => { const next = queue.then(fn); queue = next.catch(() => {}); return next; };
  async function jsonFetch(url, options = {}) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
    const body = await response.json();
    if (!response.ok) throw fail(response.status >= 500 ? 502 : response.status, '上游服务请求失败');
    return body;
  }
  const auth = authenticate || (async (token, tenant) => {
    const headers = { 'X-Access-Token': token, ...(tenant ? { 'tenant-id': tenant } : {}) };
    const [permissions, info] = await Promise.all([
      jsonFetch(`${jeecg}/sys/permission/getUserPermissionByToken`, { headers }),
      jsonFetch(`${jeecg}/sys/user/getUserInfo`, { headers }),
    ]);
    if (!permissions.success || !info.success || !info.result?.userInfo?.id) throw fail(401, '登录已失效，请重新登录');
    return { id: info.result.userInfo.id, username: info.result.userInfo.username,
      codes: permissions.result?.codeList || [] };
  });
  const requireCode = (user, code) => {
    if (!user.codes.includes(`flowgram:${code}`)) throw fail(403, '没有此操作权限，请联系管理员');
  };
  const runtimeRequest = (path, method = 'GET', body) => jsonFetch(`${runtime}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const workflowSummary = ({ schema, ...row }) => row;
  const runSummary = ({ report, result, ...row }) => row;
  const pollers = new Map();
  let closing = false;
  async function collect(id) {
    const row = await load('runs', id);
    if (terminal.has(row.status)) return row;
    try {
      const report = await runtimeRequest(`/task/report?taskID=${encodeURIComponent(id)}`);
      if (!report?.workflowStatus) throw new Error('Missing task');
      row.report = redact(report);
      row.status = report.workflowStatus.status;
      row.updatedAt = new Date().toISOString();
      row.pollFailures = 0;
      if (terminal.has(row.status)) {
        row.result = redact(report.outputs ?? {});
        row.finishedAt = row.updatedAt;
      }
    } catch {
      row.pollFailures = (row.pollFailures || 0) + 1;
      if (row.pollFailures >= 5) {
        row.status = 'interrupted';
        row.error = '运行服务不可用或任务状态已丢失；历史记录已保留，请检查后重新运行';
        row.finishedAt = new Date().toISOString();
      }
    }
    await save('runs', row);
    return row;
  }
  function watch(id) {
    if (closing || pollers.has(id)) return;
    const tick = async () => {
      try {
        const row = await serial(() => collect(id));
        if (!terminal.has(row.status) && !closing) { pollers.set(id, setTimeout(tick, 1000)); return; }
      } catch { /* Persistent read failure: do not create an unhandled rejection. */ }
      pollers.delete(id);
    };
    pollers.set(id, setTimeout(tick, 100));
  }
  for (const row of await list('runs')) if (!terminal.has(row.status)) watch(row.id);
  // Idempotent migration preserves the original user draft without overwriting it.
  try {
    await load('workflows', 'legacy-shared');
  } catch (error) {
    if (error.status !== 404) throw error;
    try {
      const old = JSON.parse(await readFile(join(dataDir, 'workflow.json'), 'utf8'));
      if (old.schema) await save('workflows', { id: 'legacy-shared', name: '已有共享流程', schema: old.schema,
        revision: 1, archived: false, createdBy: 'migration', updatedBy: 'migration',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }

  async function dispatch(req, url, user, body) {
    requireCode(user, 'view');
    if (url.pathname === '/session' && req.method === 'GET') return user;
    if (url.pathname === '/workflows' && req.method === 'GET') {
      const rows = await list('workflows');
      return rows.filter((row) => user.codes.includes('flowgram:manage') || !row.archived).map(workflowSummary)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    if (url.pathname === '/workflows' && req.method === 'POST') {
      requireCode(user, 'manage'); schemaCheck(body.schema);
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) throw fail(400, '流程名称应为1至100个字符');
      const row = { id: randomUUID(), name: body.name.trim(), schema: body.schema, revision: 1, archived: false,
        createdBy: user.username, updatedBy: user.username, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await save('workflows', row); return row;
    }
    const workflowMatch = url.pathname.match(/^\/workflows\/([a-zA-Z0-9_-]+)$/);
    if (workflowMatch) {
      const row = await load('workflows', workflowMatch[1]);
      if (row.archived && !user.codes.includes('flowgram:manage')) throw fail(404, '流程不存在或已归档');
      if (req.method === 'GET') return row;
      if (req.method === 'PUT') {
        if (!['schema', 'name', 'archived'].some((key) => body[key] !== undefined)) throw fail(400, '没有可更新的流程字段');
        if (body.revision !== row.revision) throw fail(409, '流程已被其他人修改，请先重新打开后再编辑');
        if (body.schema !== undefined) { requireCode(user, 'edit'); schemaCheck(body.schema); row.schema = body.schema; }
        if (body.name !== undefined || body.archived !== undefined) {
          requireCode(user, 'manage');
          if (body.name !== undefined) {
            if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) throw fail(400, '流程名称应为1至100个字符');
            row.name = body.name.trim();
          }
          if (body.archived !== undefined) {
            if (typeof body.archived !== 'boolean') throw fail(400, '无效归档状态');
            row.archived = body.archived;
          }
        }
        row.revision += 1; row.updatedAt = new Date().toISOString(); row.updatedBy = user.username;
        await save('workflows', row); return row;
      }
    }
    if (url.pathname === '/runs' && req.method === 'GET') {
      requireCode(user, 'history');
      return (await list('runs')).map(runSummary).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
    }
    const runMatch = url.pathname.match(/^\/runs\/([a-zA-Z0-9_-]+)$/);
    if (runMatch && req.method === 'GET') {
      requireCode(user, 'history'); return load('runs', runMatch[1]);
    }
    if (url.pathname === '/api/task/run' || url.pathname === '/api/task/validate') {
      if (req.method !== 'POST') throw fail(405, '请求方式不支持');
      requireCode(user, 'run');
      const workflow = await load('workflows', url.searchParams.get('workflowId'));
      if (workflow.archived) throw fail(409, '已归档流程不能运行');
      // A run-only user cannot inject an arbitrary executable workflow.
      const schema = user.codes.includes('flowgram:edit') && typeof body.schema === 'string' ? JSON.parse(body.schema) : workflow.schema;
      schemaCheck(schema);
      const output = await runtimeRequest(url.pathname.slice(4), 'POST', { schema: JSON.stringify(schema), inputs: body.inputs || {} });
      if (url.pathname.endsWith('/run') && output.taskID) {
        await save('runs', { id: output.taskID, workflowId: workflow.id, workflowName: workflow.name,
          workflowRevision: workflow.revision, unsavedChanges: JSON.stringify(schema) !== JSON.stringify(workflow.schema),
          createdBy: user.id, username: user.username, status: 'pending',
          createdAt: new Date().toISOString(), inputs: redact(body.inputs || {}) });
        watch(output.taskID);
      }
      return output;
    }
    if (['/api/task/report', '/api/task/result', '/api/task/cancel'].includes(url.pathname)) {
      const cancel = url.pathname.endsWith('/cancel');
      if (req.method !== (cancel ? 'PUT' : 'GET')) throw fail(405, '请求方式不支持');
      requireCode(user, 'run');
      const id = cancel ? body.taskID : url.searchParams.get('taskID');
      const row = await load('runs', id);
      if (row.createdBy !== user.id && !user.codes.includes('flowgram:manage')) throw fail(403, '只能操作自己的运行任务');
      if (cancel) {
        if (terminal.has(row.status)) return { success: false };
        const output = await runtimeRequest('/task/cancel', 'PUT', { taskID: id });
        if (output.success) { row.status = 'canceled'; row.finishedAt = new Date().toISOString(); await save('runs', row); }
        return output;
      }
      if (row.status === 'interrupted') throw fail(409, row.error);
      if (terminal.has(row.status) && row.report) return url.pathname.endsWith('/report') ? row.report : row.result;
      return runtimeRequest(`${url.pathname.slice(4)}?taskID=${encodeURIComponent(id)}`);
    }
    throw fail(404, '接口不存在');
  }
  const server = createServer(async (req, res) => {
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data ?? {})); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/health') return send(200, { status: 'ok', service: 'flowgram-jeecg-gateway' });
      const token = req.headers['x-access-token'];
      if (typeof token !== 'string' || !token) throw fail(401, '请从 JeecgBoot 登录后访问');
      const origin = req.headers.origin;
      if (origin && origin !== process.env.PUBLIC_ORIGIN && !authenticate) throw fail(403, '请求来源不允许');
      const user = await auth(token, req.headers['tenant-id']);
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 2 * 1024 * 1024) throw fail(413, '流程数据超过2MB'); }
      let body = {};
      if (raw) { try { body = JSON.parse(raw); } catch { throw fail(400, 'JSON格式无效'); } }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail(400, '请求体必须为对象');
      const action = () => dispatch(req, url, user, body);
      const output = await (['POST', 'PUT', 'DELETE'].includes(req.method) ? serial(action) : action());
      return send(200, output);
    } catch (error) {
      const status = error.status || (error instanceof SyntaxError ? 400 : 502);
      return send(status, { code: status, message: error.status ? error.message : '服务暂不可用，请稍后重试' });
    }
  });
  return { server, close: async () => { closing = true; for (const timer of pollers.values()) clearTimeout(timer); await new Promise((resolve) => server.close(resolve)); } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const gateway = await makeGateway({ dataDir: process.env.FLOWGRAM_DATA_DIR,
    jeecg: process.env.JEECG_URL || 'http://127.0.0.1:8081/jeecg-boot', runtime: 'http://127.0.0.1:4000' });
  gateway.server.listen(4001, '127.0.0.1');
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await gateway.close(); process.exit(0); });
}
