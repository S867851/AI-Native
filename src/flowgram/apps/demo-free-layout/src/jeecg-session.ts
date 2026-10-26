/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

// Session tokens stay in memory and never travel in URLs or workflow documents.
let token = '';
let tenant = '';
let revision = 0;
let codes: string[] = [];
export const workflowId = new URLSearchParams(window.location.search).get('workflowId') || '';
export const can = (action: string) => codes.includes(`flowgram:${action}`);
export const setRevision = (value: number) => {
  revision = value;
};
export const getRevision = () => revision;

export async function platformFetch(url: string | URL, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('X-Access-Token', token);
  if (tenant) headers.set('tenant-id', tenant);
  const response = await fetch(url, { ...options, headers, cache: 'no-store' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `请求失败（${response.status}）`);
  }
  return response;
}

let sessionPromise: Promise<void> | undefined;
export function initializeSession() {
  if (sessionPromise) return sessionPromise;
  sessionPromise = new Promise<void>((resolve, reject) => {
    if (window.parent === window) {
      reject(new Error('请从 JeecgBoot 的“FlowGram 工作流”菜单进入。'));
      return;
    }
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', receive);
      reject(new Error('未取得登录状态，请重新打开菜单。'));
    }, 15000);
    async function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== 'flowgram:session'
      )
        return;
      if (typeof event.data.token !== 'string') return;
      window.clearTimeout(timer);
      window.removeEventListener('message', receive);
      token = event.data.token;
      tenant = typeof event.data.tenant === 'string' ? event.data.tenant : '';
      try {
        const response = await platformFetch('/flowgram/session');
        const session = await response.json();
        codes = session.codes;
        resolve();
      } catch (error) {
        reject(error);
      }
    }
    window.addEventListener('message', receive);
    window.parent.postMessage({ type: 'flowgram:ready' }, window.location.origin);
  });
  return sessionPromise;
}
