const test = require('node:test');
const assert = require('node:assert');
const { githubUrl, isPublic, clearCache } = require('../src/repo');

test('normalizes github remotes', () => {
  const want = 'https://github.com/WentTheFox/claude-presence';
  for (const r of [
    'git@github.com:WentTheFox/claude-presence.git',
    'https://github.com/WentTheFox/claude-presence.git',
    'https://github.com/WentTheFox/claude-presence',
    'https://github.com/WentTheFox/claude-presence/',
    'ssh://git@github.com/WentTheFox/claude-presence.git',
    'git@work.github.com:WentTheFox/claude-presence.git',
    'git://github.com/WentTheFox/claude-presence.git',
  ]) assert.strictEqual(githubUrl(r), want, r);
});

test('strips credentials from remotes', () => {
  assert.strictEqual(githubUrl('https://user:ghp_secret@github.com/o/r.git'), 'https://github.com/o/r');
});

test('rejects non-github and malformed remotes', () => {
  for (const r of ['git@gitlab.com:o/r.git', 'https://evil.com/github.com/o/r', 'https://github.com.evil.com/o/r', 'https://github.com/o', '', null, undefined])
    assert.strictEqual(githubUrl(r), null, String(r));
});

test('isPublic: 200 is public, 404 and errors are not, results cached', async () => {
  clearCache();
  let calls = 0;
  const mk = (status) => async () => { calls++; return { status }; };
  assert.strictEqual(await isPublic('https://github.com/a/pub', mk(200)), true);
  assert.strictEqual(await isPublic('https://github.com/a/pub', mk(404)), true);
  assert.strictEqual(calls, 1);
  assert.strictEqual(await isPublic('https://github.com/a/priv', mk(404)), false);
  assert.strictEqual(await isPublic('https://github.com/a/err', async () => { throw new Error('offline'); }), false);
});
