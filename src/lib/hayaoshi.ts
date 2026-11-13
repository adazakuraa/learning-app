// Hayaoshi (buzzer) quiz: adaptive question selection with a simple Rasch / Elo model.
//   P(correct) = sigmoid(theta - b),  b = logit-difficulty from the authored "expected correct rate" p:
//   b = -logit(p)  (an average adult, theta = 0, answers with probability p)
export type HQuestion = { id: string; genre: string; q: string; answers: string[]; show: string; p: number; len: number; unit?: string; batch?: string };
export type HMode = 'general' | 'review';
export type HBank = { genres: { id: string; title: string; academic?: boolean }[]; questions: HQuestion[] };
/** share of academic genres in the general mode */
export const ACADEMIC_SHARE = 0.3;

export type HItem = { seen: number; correct: number; lastAt: number; lastPos?: number; bestPos?: number; lastWrongAt?: number };
export type HState = {
  theta: number;
  answered: number;
  correct: number;
  sessions: number;
  bestScore: number;
  items: Record<string, HItem>;
  /** daily rating snapshots: YYYY-MM-DD -> theta */
  history: Record<string, number>;
  updatedAt: number;
};
export const emptyH = (): HState => ({ theta: -0.6, answered: 0, correct: 0, sessions: 0, bestScore: 0, items: {}, history: {}, updatedAt: 0 });

/** Target success rate. A bit above "even" so a casual break stays fun, but not trivially easy. */
export const TARGET = 0.7;
export const SESSION_LEN = 10;
/** reveal speed (characters per second) */
export const CPS = 7;
/** thinking time after the buzz: per answer character, with a floor */
export const SEC_PER_CHAR = 2.5;
export const MIN_THINK = 8;
/** time to buzz after the full question is shown */
export const AFTER_FULL = 4;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clampP = (p: number) => Math.min(0.97, Math.max(0.03, p));
export const difficulty = (p: number) => -Math.log(clampP(p) / (1 - clampP(p)));
export const predict = (theta: number, q: HQuestion) => sigmoid(theta - difficulty(q.p));

/** rating shown to the user (1000 = an average adult) */
export const rating = (theta: number) => Math.round(1000 + theta * 200);

export function thinkSeconds(q: HQuestion): number {
  return Math.max(MIN_THINK, Math.ceil(q.len * SEC_PER_CHAR));
}

/** learning rate shrinks as more questions are answered */
const kFactor = (answered: number) => Math.max(0.1, 0.45 / Math.sqrt(1 + answered / 15));

export function updateTheta(s: HState, q: HQuestion, ok: boolean): number {
  const pr = predict(s.theta, q);
  return s.theta + kFactor(s.answered) * ((ok ? 1 : 0) - pr);
}

/**
 * Per-session target: varies around TARGET so some rounds are tough (~5/10) and some go well (~9/10),
 * while the long-run average stays at TARGET (symmetric, roughly bell-shaped, ±0.25).
 */
export function sessionTarget(rnd = Math.random): number {
  return TARGET + (rnd() + rnd() + rnd() - 1.5) * 0.167;
}

/** Pick the next question: predicted success near the target, fresh genres, unseen or due for review. */
export function pickNext(bank: HBank, s: HState, exclude: Set<string>, recentGenres: string[], rnd = Math.random, target = TARGET): HQuestion | null {
  const now = Date.now();
  const DAY = 864e5;
  let best: HQuestion | null = null;
  let bestScore = -Infinity;
  for (const q of bank.questions) {
    if (exclude.has(q.id)) continue;
    const it = s.items[q.id];
    let score = -Math.abs(predict(s.theta, q) - target) * 4;
    if (it) {
      const age = (now - it.lastAt) / DAY;
      if (it.correct > 0 && it.lastWrongAt === undefined) score -= 2.5; // solved: rarely again
      else if (it.lastWrongAt !== undefined && it.lastWrongAt >= it.lastAt - 1) score += age > 1 ? 0.6 : -2; // missed: review after a day
      if (age < 0.5) score -= 3;
      score -= Math.min(2, it.seen * 0.3);
    }
    const gi = recentGenres.lastIndexOf(q.genre);
    if (gi >= 0) score -= 0.8 * (1 - (recentGenres.length - 1 - gi) / 4);
    score += rnd() * 0.9; // variety
    if (score > bestScore) { bestScore = score; best = q; }
  }
  return best;
}

export function mergeH(a?: HState, b?: HState): HState | undefined {
  if (!a || !b) return a ?? b;
  const n = b.updatedAt > a.updatedAt ? b : a;
  const items: Record<string, HItem> = {};
  for (const id of new Set([...Object.keys(a.items), ...Object.keys(b.items)])) {
    const x = a.items[id], y = b.items[id];
    if (!x || !y) { items[id] = (x ?? y)!; continue; }
    const m = y.lastAt > x.lastAt ? y : x;
    const best = [x.bestPos, y.bestPos].filter((v): v is number => v !== undefined);
    items[id] = { ...m, seen: Math.max(x.seen, y.seen), correct: Math.max(x.correct, y.correct), ...(best.length ? { bestPos: Math.min(...best) } : {}) };
  }
  return {
    ...n,
    answered: Math.max(a.answered, b.answered),
    correct: Math.max(a.correct, b.correct),
    sessions: Math.max(a.sessions, b.sessions),
    bestScore: Math.max(a.bestScore, b.bestScore),
    items,
    history: { ...a.history, ...b.history, ...n.history },
  };
}

/** points for a correct answer: base + speed bonus (earlier buzz = more) + streak bonus */
export function points(pos: number, total: number, streak: number): number {
  const early = 1 - pos / total; // share of the question still hidden
  return Math.round((100 + 150 * early) * (1 + Math.min(streak, 5) * 0.1));
}
