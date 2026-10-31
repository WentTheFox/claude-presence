const test = require('node:test');
const assert = require('node:assert');
const { isBlocked } = require('../src/blocklist');

const opts = { home: '/home/me', caseInsensitive: false };
const blocked = (paths, patterns) => isBlocked(paths, patterns, opts);

test('empty or missing blocklist blocks nothing', () => {
  assert.strictEqual(blocked('/home/me/git/app', undefined), false);
  assert.strictEqual(blocked('/home/me/git/app', []), false);
});

test('exact directory matches itself and everything below', () => {
  assert.strictEqual(blocked('/home/me/git/secret', ['/home/me/git/secret']), true);
  assert.strictEqual(blocked('/home/me/git/secret/src/x', ['/home/me/git/secret']), true);
  assert.strictEqual(blocked('/home/me/git/secretive', ['/home/me/git/secret']), false);
});

test('~ expands to the home directory', () => {
  assert.strictEqual(blocked('/home/me/work/a', ['~/work']), true);
  assert.strictEqual(blocked('/home/other/work/a', ['~/work']), false);
});

test('* stays within one segment', () => {
  assert.strictEqual(blocked('/home/me/git/acme/app', ['~/git/*/app']), true);
  assert.strictEqual(blocked('/home/me/git/acme/team/app', ['~/git/*/app']), false);
  assert.strictEqual(blocked('/home/me/git/private-x', ['~/git/private-*']), true);
});

test('** crosses segments, including zero', () => {
  assert.strictEqual(blocked('/home/me/a/b/c/secret', ['~/**/secret']), true);
  assert.strictEqual(blocked('/home/me/secret', ['~/**/secret']), true);
  assert.strictEqual(blocked('/home/me/git/acme/x', ['**/acme']), true);
});

test('? matches one character', () => {
  assert.strictEqual(blocked('/home/me/v1', ['~/v?']), true);
  assert.strictEqual(blocked('/home/me/v12', ['~/v?']), false);
});

test('checks every candidate path (cwd and repo root)', () => {
  assert.strictEqual(blocked(['/home/me/git/app/sub', '/home/me/git/app'], ['~/git/app']), true);
  assert.strictEqual(blocked(['/x', null, undefined], ['~/git/app']), false);
});

test('normalizes backslashes and trailing slashes', () => {
  assert.strictEqual(blocked('C:\\Users\\me\\priv\\app', ['C:/Users/me/priv/']), true);
});

test('regex metacharacters in patterns are literal', () => {
  assert.strictEqual(blocked('/home/me/a+b', ['~/a+b']), true);
  assert.strictEqual(blocked('/home/me/aab', ['~/a+b']), false);
});

test('case sensitivity follows the option', () => {
  assert.strictEqual(isBlocked('/Home/Me/App', ['/home/me/app'], { home: '/h', caseInsensitive: true }), true);
  assert.strictEqual(blocked('/Home/Me/App', ['/home/me/app']), false);
});

test('ignores non-string and blank patterns', () => {
  assert.strictEqual(blocked('/home/me/a', [null, 5, '  ', '~/a']), true);
});
