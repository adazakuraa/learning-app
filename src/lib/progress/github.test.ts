import { afterEach, expect, it, vi } from 'vitest';
import { syncWithGitHub } from './github';
import { emptyDoc, type ProgressDoc } from './model';

const cfg = { owner: 'me', repo: 'learning-progress', path: 'progress.json', token: 't' };
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
afterEach(() => vi.unstubAllGlobals());

it('merges remote and local then pushes with the remote sha', async () => {
  const remote: ProgressDoc = { ...emptyDoc(), units: { a: { unit: { completed: true, updatedAt: 1 } } }, time: { mac: { a: 60 } } };
  const local: ProgressDoc = { ...emptyDoc(), units: { b: { text: { completed: true, scrollRatio: 1, updatedAt: 2 } } }, time: { phone: { b: 30 } } };
  const calls: { method: string; body?: string }[] = [];
  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    calls.push({ method: init?.method ?? 'GET', body: init?.body as string });
    if (!init?.method) return new Response(JSON.stringify({ sha: 'abc', content: b64(JSON.stringify(remote)) }), { status: 200 });
    return new Response('{}', { status: 200 });
  });
  const merged = await syncWithGitHub(cfg, local, 'phone');
  expect(Object.keys(merged.units).sort()).toEqual(['a', 'b']);
  const put = JSON.parse(calls[1].body!);
  expect(put.sha).toBe('abc');
  const pushed = JSON.parse(Buffer.from(put.content, 'base64').toString('utf8'));
  expect(pushed.time).toEqual({ mac: { a: 60 }, phone: { b: 30 } });
});

it('creates the file when it does not exist', async () => {
  const methods: string[] = [];
  vi.stubGlobal('fetch', async (_u: string, init?: RequestInit) => {
    methods.push(init?.method ?? 'GET');
    return new Response('{}', { status: init?.method ? 201 : 404 });
  });
  await syncWithGitHub(cfg, emptyDoc(), 'pc');
  expect(methods).toEqual(['GET', 'PUT']);
});

it('reports a helpful error on 401', async () => {
  vi.stubGlobal('fetch', async () => new Response('', { status: 401 }));
  await expect(syncWithGitHub(cfg, emptyDoc(), 'pc')).rejects.toThrow('トークン');
});
