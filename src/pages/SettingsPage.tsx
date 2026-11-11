import { useRef, useState } from 'react';
import { parseDoc } from '../lib/progress/model';
import { useProgress } from '../lib/progress/ProgressProvider';
import { useSettings, type Settings } from '../lib/settings';

function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { settings, set } = useSettings();
  const { doc, importDoc, sync, syncNow, githubConfig, setGithubConfig } = useProgress();
  const [form, setForm] = useState({
    owner: githubConfig?.owner ?? '',
    repo: githubConfig?.repo ?? '',
    path: githubConfig?.path ?? 'progress.json',
    token: '',
  });
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onImport = async (f: File) => {
    try {
      const incoming = parseDoc(JSON.parse(await f.text()));
      importDoc(incoming, 'merge');
      setMsg('進捗データを読み込み、現在の進捗と統合しました。');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '読み込みに失敗しました');
    }
  };

  return (
    <div className="page settings">
      <h1 className="page-title">設定</h1>

      <section className="card form">
        <h2>表示</h2>
        <label>テーマ</label>
        <Choice<Settings['theme']>
          label="テーマ"
          value={settings.theme}
          onChange={(theme) => set({ theme })}
          options={[
            ['dark', 'ダーク'],
            ['light', 'ライト'],
            ['system', '端末に合わせる'],
          ]}
        />
        <label>文字の大きさ</label>
        <Choice<Settings['textSize']>
          label="文字の大きさ"
          value={settings.textSize}
          onChange={(textSize) => set({ textSize })}
          options={[
            ['m', '標準'],
            ['l', '大きめ'],
          ]}
        />
        <label>字幕の大きさ</label>
        <Choice<Settings['captionSize']>
          label="字幕の大きさ"
          value={settings.captionSize}
          onChange={(captionSize) => set({ captionSize })}
          options={[
            ['m', '標準'],
            ['l', '大'],
            ['xl', '特大'],
          ]}
        />
      </section>

      <section className="card form">
        <h2>進捗の保存（GitHub）</h2>
        <p className="muted small">
          進捗はこの端末に自動保存されます。GitHub に保存すると、別の端末でも同じ進捗を使えます。
          非公開リポジトリと、そのリポジトリの <b>Contents: Read and write</b> だけを許可した Fine-grained トークンを使ってください。
          トークンはこのブラウザの中にだけ保存されます。
        </p>
        {githubConfig ? (
          <>
            <p>
              保存先: <code>
                {githubConfig.owner}/{githubConfig.repo}/{githubConfig.path}
              </code>
            </p>
            <p className={`sync-status ${sync.status}`}>
              {sync.status === 'syncing' && '同期中…'}
              {sync.status === 'idle' && (sync.lastSyncedAt ? `同期済み（${new Date(sync.lastSyncedAt).toLocaleTimeString('ja-JP')}）` : '待機中')}
              {sync.status === 'error' && `エラー: ${sync.message}`}
            </p>
            <div className="row">
              <button className="btn primary" onClick={() => void syncNow()} disabled={sync.status === 'syncing'}>
                今すぐ同期
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  if (confirm('この端末の GitHub 連携を解除しますか？（進捗データは消えません）')) setGithubConfig(null);
                }}
              >
                連携を解除
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.owner || !form.repo || !form.token) return setMsg('ユーザー名・リポジトリ名・トークンを入力してください');
              setGithubConfig({ owner: form.owner.trim(), repo: form.repo.trim(), path: form.path.trim() || 'progress.json', token: form.token.trim() });
              setForm((f) => ({ ...f, token: '' }));
              setMsg(null);
            }}
          >
            <label htmlFor="gh-owner">GitHub ユーザー名</label>
            <input id="gh-owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} autoCapitalize="off" autoCorrect="off" />
            <label htmlFor="gh-repo">リポジトリ名</label>
            <input id="gh-repo" value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} placeholder="learning-progress" autoCapitalize="off" autoCorrect="off" />
            <label htmlFor="gh-path">ファイル名</label>
            <input id="gh-path" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} autoCapitalize="off" autoCorrect="off" />
            <label htmlFor="gh-token">トークン</label>
            <input id="gh-token" type="password" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} autoComplete="off" placeholder="github_pat_…" />
            <button className="btn primary" type="submit">
              保存して同期
            </button>
          </form>
        )}
      </section>

      <section className="card form">
        <h2>バックアップ</h2>
        <p className="muted small">進捗データを JSON ファイルとして書き出し・読み込みできます。読み込んだデータは現在の進捗と統合されます。</p>
        <div className="row">
          <button className="btn secondary" onClick={exportJson}>
            書き出す
          </button>
          <button className="btn secondary" onClick={() => file.current?.click()}>
            読み込む
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      {msg && <div className="notice">{msg}</div>}
    </div>
  );
}
