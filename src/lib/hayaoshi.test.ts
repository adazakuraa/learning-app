import { describe, expect, it } from 'vitest';
import { emptyH, mergeH, normH, pickNext, predict, rating, targetP, updateTheta, type HBank, type HQuestion } from './hayaoshi';

const q = (id: string, p: number, genre = 'g'): HQuestion => ({ id, genre, q: 'x', answers: ['a'], show: 'a', p, len: 3 });

describe('hayaoshi model', () => {
  it('predicts the authored rate for an average player', () => {
    expect(predict(0, q('a', 0.8))).toBeCloseTo(0.8, 5);
  });
  it('raises ability after a correct answer and lowers after a wrong one', () => {
    const s = emptyH();
    expect(updateTheta(s, q('a', 0.5), true)).toBeGreaterThan(s.theta);
    expect(updateTheta(s, q('a', 0.5), false)).toBeLessThan(s.theta);
  });
  it('prefers questions near the target success rate', () => {
    const bank: HBank = { genres: [], questions: [q('easy', 0.99), q('mid', 0.75), q('hard', 0.05)] };
    const s = { ...emptyH(), theta: 0 };
    const picks = new Map<string, number>();
    for (let i = 0; i < 200; i++) { const p = pickNext(bank, s, new Set(), [])!; picks.set(p.id, (picks.get(p.id) ?? 0) + 1); }
    expect(picks.get('mid') ?? 0).toBeGreaterThan(120);
  });
});

describe('rating', () => {
  it('is linear in the expected correct rate of the picked questions', () => {
    expect(rating(emptyH().theta)).toBe(1000);
    expect(rating(0)).toBe(1150);
    for (const R of [1000, 1150, 1350, 1550, 1750]) {
      // find theta whose rating is R, then check the picked p
      let lo = -10, hi = 10;
      for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (rating(m) < R) lo = m; else hi = m; }
      expect(targetP(lo)).toBeCloseTo(0.85 - (R - 1000) / 1000, 2);
    }
  });
});

describe('rating reset (epoch)', () => {
  it('resets the rating of old states and keeps it reset after merging with old copies', () => {
    const old = { ...emptyH(), epoch: undefined, theta: 1.5, answered: 300, correct: 250, history: { '2026-01-01': 1.5 }, sessions: 30, bestScore: 900, updatedAt: 5 };
    const n = normH(old);
    expect(n.theta).toBe(emptyH().theta);
    expect(n.answered).toBe(0);
    expect(n.history).toEqual({});
    expect(n.sessions).toBe(30);
    const fresh = { ...emptyH(), theta: 0.2, answered: 10, updatedAt: 10 };
    const m = mergeH(old, fresh)!;
    expect(m.theta).toBe(0.2);
    expect(m.answered).toBe(10);
  });
});
