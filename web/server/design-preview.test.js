import assert from 'node:assert/strict';
import { test } from 'node:test';
import { designPreviewProxy } from './design-preview.js';

function response() {
  return { code: 200, status(n) { this.code = n; return this; }, type() { return this; }, json(value) { this.value = value; return this; }, send(value) { this.value = value; return this; } };
}

test('preview blocks writes and private account endpoints before fetching', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected network request'); };
  try {
    for (const [path, method] of [['/.netlify/functions/sign-in', 'POST'], ['/.netlify/functions/users', 'POST'], ['/.netlify/functions/me', 'GET'], ['/.netlify/functions/markets-search', 'DELETE']]) {
      const res = response();
      await designPreviewProxy({ path, method, query: {}, originalUrl: path }, res);
      assert.equal(res.code, 403);
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; }
});

test('public reads strip session credentials and preserve upstream failure status', async () => {
  const original = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response('{"error":"Unavailable"}', { status: 503, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const res = response();
    await designPreviewProxy({ path: '/.netlify/functions/markets-search', originalUrl: '/.netlify/functions/markets-search', method: 'POST', query: {}, body: { categoryList: ['crypto'] }, headers: { cookie: 'private', authorization: 'private' } }, res);
    assert.equal(request.url, 'https://app.seer.pm/.netlify/functions/markets-search');
    assert.deepEqual(request.options.headers, { 'Content-Type': 'application/json' });
    assert.equal(request.options.redirect, 'error');
    assert.equal(res.code, 503);
  } finally { globalThis.fetch = original; }
});
