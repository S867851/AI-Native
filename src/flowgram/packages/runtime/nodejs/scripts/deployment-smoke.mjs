/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const dataDir = await mkdtemp(join(tmpdir(), 'flowgram-smoke-'));
const base = 'http://127.0.0.1:4000';
let child;
let logs = '';
async function stop() {
  if (!child || child.exitCode !== null) return;
  await new Promise((done) => { child.once('exit', done); child.kill('SIGTERM'); });
}
async function start() {
  child = spawn(process.execPath, [resolve('dist/index.js')], {
    env: { ...process.env, FLOWGRAM_DATA_DIR: dataDir }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => { logs += d; });
  child.stderr.on('data', (d) => { logs += d; });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(logs);
    try { if ((await fetch(`${base}/health`)).ok) return; } catch {}
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`Runtime did not start: ${logs}`);
}
const schema = {
  nodes: [
    { id: 'start_0', type: 'start', meta: {}, data: { title: 'Start', outputs: {
      type: 'object', properties: { message: { type: 'string' } }, required: ['message'],
    } } },
    { id: 'end_0', type: 'end', meta: {}, data: { title: 'End',
      inputsValues: { message: { type: 'ref', content: ['start_0', 'message'] } },
      inputs: { type: 'object', properties: { message: { type: 'string' } } },
    } },
  ],
  edges: [{ sourceNodeID: 'start_0', targetNodeID: 'end_0' }],
};
try {
  await start();
  assert.deepEqual(await (await fetch(`${base}/workspace/workflow`)).json(), { schema: null });
  const invalid = await fetch(`${base}/workspace/workflow`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schema: {} }),
  });
  assert.equal(invalid.status, 400);
  const saved = await fetch(`${base}/workspace/workflow`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schema }),
  });
  assert.equal(saved.status, 200);
  assert.deepEqual((await (await fetch(`${base}/workspace/workflow`)).json()).schema, schema);
  const run = await fetch(`${base}/api/task/run`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: { message: 'flowgram-smoke-ok' }, schema: JSON.stringify(schema) }),
  });
  const task = await run.json();
  assert.ok(task.taskID, JSON.stringify(task));
  let result;
  for (let i = 0; i < 50; i++) {
    const text = await (await fetch(`${base}/api/task/result?taskID=${task.taskID}`)).text();
    result = text ? JSON.parse(text) : null;
    if (result?.message === 'flowgram-smoke-ok') break;
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.equal(result?.message, 'flowgram-smoke-ok', JSON.stringify(result));
  await stop();
  await start();
  assert.deepEqual((await (await fetch(`${base}/workspace/workflow`)).json()).schema, schema);
  console.log('PASS: health, empty draft, invalid schema rejection, draft save/load, real runtime execution, restart persistence');
} finally {
  await stop();
  await rm(dataDir, { recursive: true, force: true });
}
