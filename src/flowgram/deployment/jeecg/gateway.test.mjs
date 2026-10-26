/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { makeGateway } from './gateway.mjs';

test('shared workflow authorization, revisions, task ownership and persistence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'flowgram-acl-'));
  const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
  const schema = { nodes: [], edges: [] };
  const tasks = new Map();
  const runtime = createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/task/run') {
      tasks.set('test-task', body);
      res.end(JSON.stringify({ taskID: 'test-task' }));
    } else if (req.url.startsWith('/api/task/report')) {
      res.end(JSON.stringify({ id: 'test-task', inputs: {}, outputs: { message: 'ok', apiKey: 'private' },
        workflowStatus: { status: 'succeeded', terminated: true }, reports: {}, messages: [] }));
    } else res.end(JSON.stringify({ valid: true }));
  });
  const runtimeURL = await listen(runtime);
  const all = ['view', 'edit', 'run', 'manage', 'history'].map((code) => `flowgram:${code}`);
  const people = { admin: all, editor: ['flowgram:view', 'flowgram:edit'], runner: ['flowgram:view', 'flowgram:run'], reader: ['flowgram:view'], none: [] };
  const authenticate = async (token) => {
    if (!people[token]) throw Object.assign(new Error('expired'), { status: 401 });
    return { id: token, username: token, codes: people[token] };
  };
  let gateway = await makeGateway({ dataDir: dir, runtime: runtimeURL, authenticate });
  let base = await listen(gateway.server);
  const call = async (path, token = 'admin', method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: { 'X-Access-Token': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  try {
    assert.equal((await call('/workflows', '')).status, 401);
    assert.equal((await call('/workflows', 'expired')).status, 401);
    assert.equal((await call('/workflows', 'none')).status, 403);
    assert.equal((await call('/workspace/workflow')).status, 404);
    assert.equal((await call('/trpc/task/run')).status, 404);
    assert.equal((await call('/workflows', 'editor', 'POST', { name: 'x', schema })).status, 403);
    assert.equal((await call('/workflows', 'admin', 'POST', { name: 'x', schema: {} })).status, 400);
    const created = (await call('/workflows', 'admin', 'POST', { name: 'shared', schema })).body;
    assert.equal((await call(`/workflows/${created.id}`, 'reader')).status, 200);
    assert.equal((await call(`/workflows/${created.id}`, 'reader', 'PUT', { revision: 1 })).status, 400);
    assert.equal((await call(`/workflows/${created.id}`, 'reader', 'PUT', { revision: 1, schema })).status, 403);
    assert.equal((await call(`/workflows/${created.id}`, 'editor', 'PUT', { revision: 1, schema })).status, 200);
    assert.equal((await call(`/workflows/${created.id}`, 'editor', 'PUT', { revision: 1, schema })).status, 409);
    assert.equal((await call(`/workflows/${created.id}`, 'editor', 'PUT', { revision: 2, archived: true })).status, 403);
    assert.equal((await call(`/api/task/run?workflowId=${created.id}`, 'reader', 'POST', { inputs: {} })).status, 403);
    const run = await call(`/api/task/run?workflowId=${created.id}`, 'runner', 'POST', { schema: JSON.stringify({ nodes: ['injected'], edges: [] }), inputs: {} });
    assert.equal(run.status, 200);
    assert.deepEqual(JSON.parse(tasks.get('test-task').schema), schema);
    assert.equal((await call('/api/task/report?taskID=test-task', 'reader')).status, 403);
    assert.equal((await call('/api/task/report?taskID=test-task', 'runner')).status, 200);
    people.other = people.runner;
    assert.equal((await call('/api/task/report?taskID=test-task', 'other')).status, 403);
    assert.equal((await call('/runs', 'runner')).status, 403);
    for (let attempt = 0; attempt < 30; attempt++) {
      const row = JSON.parse(await readFile(join(dir, 'runs', 'test-task.json'), 'utf8'));
      if (row.status === 'succeeded') break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const detail = (await call('/runs/test-task')).body;
    assert.equal(detail.status, 'succeeded');
    assert.equal(detail.result.apiKey, '***');
    assert.equal((await call(`/workflows/${created.id}`, 'admin', 'PUT', { revision: 2, archived: true })).status, 200);
    assert.equal((await call(`/workflows/${created.id}`, 'reader')).status, 404);
    assert.equal((await call(`/api/task/run?workflowId=${created.id}`, 'admin', 'POST', { inputs: {} })).status, 409);
    assert.equal((await call(`/workflows/${created.id}`, 'admin', 'PUT', { revision: 3, archived: false })).status, 200);
    people.runner = [];
    assert.equal((await call('/api/task/report?taskID=test-task', 'runner')).status, 403);
    await gateway.close();
    gateway = await makeGateway({ dataDir: dir, runtime: runtimeURL, authenticate });
    base = await listen(gateway.server);
    assert.equal((await call(`/workflows/${created.id}`, 'reader')).body.revision, 4);
    assert.equal((await call('/runs/test-task')).body.result.message, 'ok');
  } finally {
    await gateway.close(); await new Promise((resolve) => runtime.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
