import { describe, expect, it } from 'vitest';
import { emptyH, pickNext, predict, updateTheta, type HBank, type HQuestion } from './hayaoshi';

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
