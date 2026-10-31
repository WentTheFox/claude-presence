const os = require('os');

// Path-based blocklist with glob support.
//   *   any characters within one path segment
//   **  any characters across segments
//   ?   one character within a segment
//   ~   leading home directory
// A pattern also covers everything below a matching directory, so blocking
// "~/git/private" hides "~/git/private/app/src" too. Matching is case-sensitive
// except on Windows and macOS defaults, where paths are case-insensitive.

function normalize(p) {
  let out = String(p).replace(/\\/g, '/');
  if (out.length > 1) out = out.replace(/\/+$/, '');
  return out;
}

function expandHome(pattern, home) {
  const p = normalize(pattern);
  const h = normalize(home);
  if (p === '~') return h;
  if (p.startsWith('~/')) return h + p.slice(1);
  return p;
}

function globToRegExp(pattern, caseInsensitive) {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        i++;
        // "**/" also matches zero segments
        if (pattern[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else {
          re += '.*';
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp('^' + re + '(?:/.*)?$', caseInsensitive ? 'i' : '');
}

function isBlocked(paths, patterns, options = {}) {
  if (!Array.isArray(patterns) || patterns.length === 0) return false;
  const home = options.home || os.homedir();
  const caseInsensitive = options.caseInsensitive != null
    ? options.caseInsensitive
    : process.platform === 'win32' || process.platform === 'darwin';
  const candidates = (Array.isArray(paths) ? paths : [paths])
    .filter((p) => typeof p === 'string' && p)
    .map(normalize);
  if (candidates.length === 0) return false;

  for (const pattern of patterns) {
    if (typeof pattern !== 'string' || !pattern.trim()) continue;
    let re;
    try {
      re = globToRegExp(expandHome(pattern.trim(), home), caseInsensitive);
    } catch {
      continue;
    }
    if (candidates.some((c) => re.test(c))) return true;
  }
  return false;
}

module.exports = { isBlocked, globToRegExp };
