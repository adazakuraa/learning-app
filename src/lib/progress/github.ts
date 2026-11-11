import { mergeDocs, parseDoc, type ProgressDoc } from './model';

// Saves progress as a JSON file in a (private) GitHub repository through the Contents API.
// The token is entered on each device and kept only in that browser's localStorage.
// Recommended token: fine-grained PAT, "Only select repositories" = the progress repo,
// Repository permissions -> Contents: Read and write. Nothing else.

export type GitHubConfig = { owner: string; repo: string; path: string; token: string };

const CONFIG_KEY = 'la:github';

export function loadConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    const c = raw ? (JSON.parse(raw) as GitHubConfig) : null;
    return c?.owner && c.repo && c.token ? { ...c, path: c.path || 'progress.json' } : null;
  } catch {
    return null;
  }
}

export function saveConfig(c: GitHubConfig | null) {
  try {
    if (c) localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
    else localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* ignore */
  }
}

const enc = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const dec = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

function url(c: GitHubConfig) {
  const p = c.path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${p}`;
}
const headers = (c: GitHubConfig) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${c.token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

export class SyncError extends Error {}

async function fetchRemote(c: GitHubConfig): Promise<{ doc: ProgressDoc | null; sha: string | null }> {
  const r = await fetch(`${url(c)}?t=${Date.now()}`, { headers: headers(c), cache: 'no-store' });
  if (r.status === 404) return { doc: null, sha: null };
  if (r.status === 401) throw new SyncError('トークンが無効です（期限切れの可能性があります）');
  if (r.status === 403) throw new SyncError('アクセスが拒否されました（トークンの権限を確認してください）');
  if (!r.ok) throw new SyncError(`GitHub から読み込めませんでした（HTTP ${r.status}）`);
  const j = await r.json();
  return { doc: parseDoc(JSON.parse(dec(j.content))), sha: j.sha };
}

/** Pull, merge with local, push the merged result. Returns the merged document. */
export async function syncWithGitHub(c: GitHubConfig, local: ProgressDoc, device: string): Promise<ProgressDoc> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { doc: remote, sha } = await fetchRemote(c);
    const merged = remote ? mergeDocs(remote, local) : local;
    if (remote && JSON.stringify(merged) === JSON.stringify(remote)) return merged; // nothing new to push
    const r = await fetch(url(c), {
      method: 'PUT',
      headers: { ...headers(c), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `progress: ${device} ${new Date().toISOString()}`,
        content: enc(JSON.stringify(merged, null, 1)),
        ...(sha ? { sha } : {}),
      }),
    });
    if (r.ok) return merged;
    if (r.status === 409 || r.status === 422) continue; // changed meanwhile -> retry with fresh copy
    if (r.status === 404) throw new SyncError('リポジトリが見つかりません（名前とトークンの対象リポジトリを確認してください）');
    if (r.status === 401 || r.status === 403) throw new SyncError('書き込み権限がありません（Contents: Read and write が必要です）');
    throw new SyncError(`GitHub に保存できませんでした（HTTP ${r.status}）`);
  }
  throw new SyncError('保存が競合しました。少し待ってから再度お試しください');
}
