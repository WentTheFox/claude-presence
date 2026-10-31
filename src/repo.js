// Turns a git remote URL into a canonical GitHub web URL, or null for anything else.
// Handles https, ssh://, and scp-style (git@github.com:owner/repo.git) remotes, and strips
// any embedded credentials, and accepts SSH host aliases like git@work.github.com, always rebuilding the URL as plain github.com so a token never reaches the presence.
function githubUrl(remote) {
  if (typeof remote !== 'string') return null;
  const m = remote.trim().match(
    /^(?:https?:\/\/(?:[^/@]+@)?|ssh:\/\/(?:[^/@]+@)?|git:\/\/|(?:[^/@:]+@))(?:[A-Za-z0-9-]+\.)?github\.com[/:]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i
  );
  if (!m) return null;
  return `https://github.com/${m[1]}/${m[2]}`;
}

const POSITIVE_TTL_MS = 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // url -> { value: Promise<boolean>, expires }

// True only when an unauthenticated request can see the repo, so private repos (404)
// and any failure (offline, rate limited) yield false. Results are cached; no polling,
// this runs only when a presence update is built.
function isPublic(url, fetchImpl = globalThis.fetch) {
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) return hit.value;

  const value = (async () => {
    try {
      const res = await fetchImpl(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(3000),
      });
      return res.status === 200;
    } catch {
      return false;
    }
  })();
  const entry = { value, expires: Date.now() + NEGATIVE_TTL_MS };
  cache.set(url, entry);
  value.then((ok) => { if (ok) entry.expires = Date.now() + POSITIVE_TTL_MS; });
  return value;
}

function clearCache() { cache.clear(); }

module.exports = { githubUrl, isPublic, clearCache };
