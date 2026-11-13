import { describe, expect, it } from 'vitest';
import { emptyH, pickNext, predict, rating, targetP, updateTheta, type HBank, type HQuestion } from './hayaoshi';

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
    expect(rating(0)).toBe(1000);
    for (const R of [800, 1000, 1200, 1400, 1600]) {
      // find theta whose rating is R, then check the picked p
      let lo = -10, hi = 10;
      for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (rating(m) < R) lo = m; else hi = m; }
      expect(targetP(lo)).toBeCloseTo(0.7 - (R - 1000) / 1000, 2);
    }
  });
});
