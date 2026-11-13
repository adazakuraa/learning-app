// Progress data model. Designed so that two copies (e.g. two devices, or local vs GitHub)
// can always be merged without losing data:
//  - watched video ranges: union
//  - manual flags / positions: last-writer-wins per section (updatedAt)
//  - study time: per-device counters that only grow -> merge with max, total = sum of devices

export type Range = [number, number];

export type VideoProgress = { watched: Range[]; position: number; duration: number; completed: boolean; updatedAt: number };
export type TextProgress = { completed: boolean; scrollRatio: number; updatedAt: number };
export type FlagProgress = { completed: boolean; updatedAt: number };

export type UnitProgress = {
  video?: VideoProgress;
  text?: TextProgress;
  unit?: FlagProgress;
  lastStudiedAt?: number;
};

/** chapter quiz results */
export type QuizResult = { best: number; last: number; total: number; attempts: number; perfectAt?: number; updatedAt: number };

import { mergeH, type HState } from '../hayaoshi';

export type ProgressDoc = {
  version: 1;
  units: Record<string, UnitProgress>;
  quizzes?: Record<string, QuizResult>;
  /** hayaoshi (buzzer quiz game) */
  hayaoshi?: HState;
  /** hayaoshi review mode (questions from completed units) */
  hayaoshiReview?: HState;
  /** seconds studied: device -> unitId -> seconds */
  time: Record<string, Record<string, number>>;
  /** seconds studied: device -> YYYY-MM-DD -> seconds */
  days: Record<string, Record<string, number>>;
  updatedAt: number;
};

export const emptyDoc = (): ProgressDoc => ({ version: 1, units: {}, time: {}, days: {}, updatedAt: 0 });

export const VIDEO_COMPLETE_RATIO = 0.9;

/** Merge overlapping/adjacent ranges (tolerance 1s) and sort. */
export function normalizeRanges(ranges: Range[]): Range[] {
  const sorted = ranges.filter(([a, b]) => b > a).map(([a, b]) => [a, b] as Range).sort((x, y) => x[0] - y[0]);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out.map(([a, b]) => [Math.round(a * 10) / 10, Math.round(b * 10) / 10]);
}

export const watchedSeconds = (ranges: Range[]) => ranges.reduce((s, [a, b]) => s + (b - a), 0);

export function videoRatio(v: VideoProgress | undefined): number {
  if (!v || !v.duration) return 0;
  return Math.min(1, watchedSeconds(v.watched) / v.duration);
}

const newer = <T extends { updatedAt: number }>(a?: T, b?: T) => (!a ? b : !b ? a : b.updatedAt > a.updatedAt ? b : a);

function mergeVideo(a?: VideoProgress, b?: VideoProgress): VideoProgress | undefined {
  if (!a || !b) return a ?? b;
  const base = newer(a, b)!;
  const watched = normalizeRanges([...a.watched, ...b.watched]);
  const duration = Math.max(a.duration, b.duration);
  const merged = { ...base, watched, duration };
  // completion is derived from watching, so once reached in either copy it stays reached
  merged.completed = a.completed || b.completed || videoRatio(merged) >= VIDEO_COMPLETE_RATIO;
  return merged;
}

function mergeCounters(a: Record<string, Record<string, number>>, b: Record<string, Record<string, number>>) {
  const out: Record<string, Record<string, number>> = {};
  for (const dev of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[dev] ?? {};
    const y = b[dev] ?? {};
    out[dev] = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) out[dev][k] = Math.max(x[k] ?? 0, y[k] ?? 0);
  }
  return out;
}

export function mergeDocs(a: ProgressDoc, b: ProgressDoc): ProgressDoc {
  const units: Record<string, UnitProgress> = {};
  for (const id of new Set([...Object.keys(a.units), ...Object.keys(b.units)])) {
    const x = a.units[id] ?? {};
    const y = b.units[id] ?? {};
    const u: UnitProgress = {
      video: mergeVideo(x.video, y.video),
      text: newer(x.text, y.text),
      unit: newer(x.unit, y.unit),
      lastStudiedAt: Math.max(x.lastStudiedAt ?? 0, y.lastStudiedAt ?? 0) || undefined,
    };
    for (const k of Object.keys(u) as (keyof UnitProgress)[]) if (u[k] === undefined) delete u[k];
    units[id] = u;
  }
  const quizzes: Record<string, QuizResult> = {};
  const qa = a.quizzes ?? {}, qb = b.quizzes ?? {};
  for (const id of new Set([...Object.keys(qa), ...Object.keys(qb)])) {
    const x = qa[id], y = qb[id];
    if (!x || !y) { quizzes[id] = (x ?? y)!; continue; }
    const n = newer(x, y)!;
    const perfectAt = [x.perfectAt, y.perfectAt].filter(Boolean).sort()[0];
    quizzes[id] = { ...n, best: Math.max(x.best, y.best), attempts: Math.max(x.attempts, y.attempts), ...(perfectAt ? { perfectAt } : {}) };
  }
  return {
    version: 1,
    units,
    ...(Object.keys(quizzes).length ? { quizzes } : {}),
    ...(a.hayaoshi || b.hayaoshi ? { hayaoshi: mergeH(a.hayaoshi, b.hayaoshi) } : {}),
    ...(a.hayaoshiReview || b.hayaoshiReview ? { hayaoshiReview: mergeH(a.hayaoshiReview, b.hayaoshiReview) } : {}),
    time: mergeCounters(a.time ?? {}, b.time ?? {}),
    days: mergeCounters(a.days ?? {}, b.days ?? {}),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

export function unitSeconds(doc: ProgressDoc, unitId: string): number {
  let s = 0;
  for (const dev of Object.values(doc.time)) s += dev[unitId] ?? 0;
  return s;
}

export function totalSeconds(doc: ProgressDoc): number {
  let s = 0;
  for (const dev of Object.values(doc.time)) for (const v of Object.values(dev)) s += v;
  return s;
}

export type UnitStatus = 'done' | 'in-progress' | 'not-started';
export function unitStatus(u: UnitProgress | undefined): UnitStatus {
  if (u?.unit?.completed) return 'done';
  if (u && (u.lastStudiedAt || u.text?.completed || (u.video && u.video.watched.length))) return 'in-progress';
  return 'not-started';
}

/** Basic shape validation for imported / downloaded documents. */
export function parseDoc(raw: unknown): ProgressDoc {
  const d = raw as Partial<ProgressDoc>;
  if (!d || typeof d !== 'object' || d.version !== 1 || typeof d.units !== 'object') throw new Error('進捗データの形式が正しくありません');
  return { ...emptyDoc(), ...d, time: d.time ?? {}, days: d.days ?? {} } as ProgressDoc;
}
