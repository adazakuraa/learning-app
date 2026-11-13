import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  emptyDoc,
  mergeDocs,
  normalizeRanges,
  VIDEO_COMPLETE_RATIO,
  videoRatio,
  type ProgressDoc,
  type Range,
  type UnitProgress,
} from './model';
import { deviceId, loadLocal, saveLocal } from './storage';
import { loadConfig, saveConfig, syncWithGitHub, type GitHubConfig } from './github';

export type SyncState = { status: 'off' | 'idle' | 'syncing' | 'error'; message?: string; lastSyncedAt?: number };

type Api = {
  doc: ProgressDoc;
  ready: boolean;
  unit: (id: string) => UnitProgress | undefined;
  recordVideo: (id: string, v: { ranges: Range[]; position: number; duration: number }) => void;
  setTextScroll: (id: string, ratio: number) => void;
  setTextCompleted: (id: string, completed: boolean) => void;
  setUnitCompleted: (id: string, completed: boolean) => void;
  addStudyTime: (id: string, seconds: number) => void;
  recordQuiz: (quizId: string, score: number, total: number) => void;
  importDoc: (doc: ProgressDoc, mode: 'merge' | 'replace') => void;
  sync: SyncState;
  syncNow: () => Promise<void>;
  githubConfig: GitHubConfig | null;
  setGithubConfig: (c: GitHubConfig | null) => void;
};

const Ctx = createContext<Api | null>(null);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<ProgressDoc>(emptyDoc);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>({ status: loadConfig() ? 'idle' : 'off' });
  const [githubConfig, setConfigState] = useState<GitHubConfig | null>(loadConfig);
  const docRef = useRef(doc);
  const dirtyRemote = useRef(false);
  const syncing = useRef<Promise<void> | null>(null);
  const device = useMemo(deviceId, []);
  const saveTimer = useRef<number | undefined>(undefined);
  const syncTimer = useRef<number | undefined>(undefined);

  const syncNow = useCallback(async () => {
    const cfg = loadConfig();
    if (!cfg) return;
    if (syncing.current) return syncing.current;
    const run = (async () => {
      setSync((s) => ({ ...s, status: 'syncing' }));
      try {
        dirtyRemote.current = false;
        const merged = await syncWithGitHub(cfg, docRef.current, device);
        // keep anything recorded while the request was in flight
        const next = mergeDocs(docRef.current, merged);
        docRef.current = next;
        setDoc(next);
        void saveLocal(next);
        setSync({ status: 'idle', lastSyncedAt: Date.now() });
      } catch (e) {
        dirtyRemote.current = true;
        setSync({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      } finally {
        syncing.current = null;
      }
    })();
    syncing.current = run;
    return run;
  }, [device]);

  const scheduleSync = useCallback(
    (delay: number) => {
      if (!loadConfig()) return;
      window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => void syncNow(), delay);
    },
    [syncNow],
  );

  /** Apply a change. important=true (manual buttons) pushes to GitHub soon. */
  const update = useCallback(
    (fn: (d: ProgressDoc) => ProgressDoc, important = false) => {
      const next = { ...fn(docRef.current), updatedAt: Date.now() };
      docRef.current = next;
      setDoc(next);
      dirtyRemote.current = true;
      // throttle (not debounce) so frequent small updates can never starve the save
      if (important) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
        void saveLocal(next);
      } else if (saveTimer.current === undefined) {
        saveTimer.current = window.setTimeout(() => {
          saveTimer.current = undefined;
          void saveLocal(docRef.current);
        }, 1000);
      }
      if (important) scheduleSync(1500);
    },
    [scheduleSync],
  );

  useEffect(() => {
    loadLocal().then((d) => {
      docRef.current = mergeDocs(d, docRef.current);
      setDoc(docRef.current);
      setReady(true);
      void syncNow();
    });
  }, [syncNow]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden') return void (dirtyRemote.current && scheduleSync(500));
      void saveLocal(docRef.current);
      if (dirtyRemote.current) void syncNow();
    };
    const timer = window.setInterval(() => dirtyRemote.current && void syncNow(), 3 * 60 * 1000);
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [syncNow, scheduleSync]);

  // actions keep a stable identity (they read docRef), so effects depending on them don't re-run on every change
  const actions = useMemo(() => {
    const patchUnit = (id: string, fn: (u: UnitProgress) => UnitProgress, important = false) =>
      update((d) => ({ ...d, units: { ...d.units, [id]: fn(d.units[id] ?? {}) } }), important);

    return {
      recordVideo: (id: string, { ranges, position, duration }: { ranges: Range[]; position: number; duration: number }) =>
        patchUnit(id, (u) => {
          const prev = u.video ?? { watched: [], position: 0, duration, completed: false, updatedAt: 0 };
          const video = { ...prev, watched: normalizeRanges([...prev.watched, ...ranges]), position, duration: duration || prev.duration, updatedAt: Date.now() };
          const justCompleted = !prev.completed && videoRatio(video) >= VIDEO_COMPLETE_RATIO;
          video.completed = prev.completed || justCompleted;
          return { ...u, video, lastStudiedAt: Date.now() };
        }),
      setTextScroll: (id: string, ratio: number) =>
        patchUnit(id, (u) => ({
          ...u,
          text: { completed: u.text?.completed ?? false, scrollRatio: ratio, updatedAt: Date.now() },
          lastStudiedAt: Date.now(),
        })),
      setTextCompleted: (id: string, completed: boolean) =>
        patchUnit(id, (u) => ({ ...u, text: { scrollRatio: u.text?.scrollRatio ?? 0, completed, updatedAt: Date.now() }, lastStudiedAt: Date.now() }), true),
      setUnitCompleted: (id: string, completed: boolean) =>
        patchUnit(id, (u) => ({ ...u, unit: { completed, updatedAt: Date.now() }, lastStudiedAt: Date.now() }), true),
      addStudyTime: (id: string, seconds: number) =>
        update((d) => {
          const t = { ...(d.time[device] ?? {}) };
          t[id] = (t[id] ?? 0) + seconds;
          const days = { ...(d.days[device] ?? {}) };
          days[today()] = (days[today()] ?? 0) + seconds;
          const u = d.units[id] ?? {};
          return { ...d, time: { ...d.time, [device]: t }, days: { ...d.days, [device]: days }, units: { ...d.units, [id]: { ...u, lastStudiedAt: Date.now() } } };
        }),
      recordQuiz: (quizId: string, score: number, total: number) =>
        update((d) => {
          const prev = d.quizzes?.[quizId];
          const now = Date.now();
          const r = {
            best: Math.max(prev?.best ?? 0, score),
            last: score,
            total,
            attempts: (prev?.attempts ?? 0) + 1,
            updatedAt: now,
            ...(prev?.perfectAt || score === total ? { perfectAt: prev?.perfectAt ?? now } : {}),
          };
          return { ...d, quizzes: { ...(d.quizzes ?? {}), [quizId]: r } };
        }, true),
      importDoc: (incoming: ProgressDoc, mode: 'merge' | 'replace') => update((d) => (mode === 'merge' ? mergeDocs(d, incoming) : incoming), true),
      setGithubConfig: (c: GitHubConfig | null) => {
        saveConfig(c);
        setConfigState(c);
        setSync({ status: c ? 'idle' : 'off' });
        if (c) {
          dirtyRemote.current = true;
          void syncNow();
        }
      },
    };
  }, [update, device, syncNow]);

  const api = useMemo<Api>(
    () => ({ ...actions, doc, ready, unit: (id: string) => doc.units[id], sync, syncNow, githubConfig }),
    [actions, doc, ready, sync, syncNow, githubConfig],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress outside ProgressProvider');
  return v;
}
