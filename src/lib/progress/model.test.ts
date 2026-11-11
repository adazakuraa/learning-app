import { describe, expect, it } from 'vitest';
import { emptyDoc, mergeDocs, normalizeRanges, totalSeconds, videoRatio, type ProgressDoc } from './model';

describe('normalizeRanges', () => {
  it('merges overlapping and adjacent ranges', () => {
    expect(normalizeRanges([[10, 20], [0, 5], [5.5, 8], [19, 30]])).toEqual([[0, 8], [10, 30]]);
  });
  it('drops empty ranges', () => {
    expect(normalizeRanges([[3, 3], [5, 4]])).toEqual([]);
  });
});

describe('mergeDocs', () => {
  const doc = (p: Partial<ProgressDoc>): ProgressDoc => ({ ...emptyDoc(), ...p });

  it('unions watched ranges and keeps the newer position', () => {
    const a = doc({ units: { u: { video: { watched: [[0, 50]], position: 50, duration: 100, completed: false, updatedAt: 1 } } } });
    const b = doc({ units: { u: { video: { watched: [[50, 95]], position: 95, duration: 100, completed: false, updatedAt: 2 } } } });
    const v = mergeDocs(a, b).units.u.video!;
    expect(v.watched).toEqual([[0, 95]]);
    expect(v.position).toBe(95);
    expect(videoRatio(v)).toBeCloseTo(0.95);
    expect(v.completed).toBe(true);
  });

  it('uses last-writer-wins for manual flags (un-completing is respected)', () => {
    const a = doc({ units: { u: { unit: { completed: true, updatedAt: 1 } } } });
    const b = doc({ units: { u: { unit: { completed: false, updatedAt: 2 } } } });
    expect(mergeDocs(a, b).units.u.unit!.completed).toBe(false);
    expect(mergeDocs(b, a).units.u.unit!.completed).toBe(false);
  });

  it('never double counts study time', () => {
    const a = doc({ time: { mac: { u: 100 } } });
    const b = doc({ time: { mac: { u: 60 }, phone: { u: 30 } } });
    const m = mergeDocs(a, b);
    expect(totalSeconds(m)).toBe(130);
    expect(totalSeconds(mergeDocs(m, m))).toBe(130);
  });
});
