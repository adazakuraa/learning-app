import { unitStatus, type ProgressDoc } from './progress/model';
import type { Chapter, Subject, UnitMeta } from './types';

export type Counts = { total: number; done: number; inProgress: number; notStarted: number; ratio: number };

export function countUnits(units: UnitMeta[], doc: ProgressDoc): Counts {
  const c = { total: units.length, done: 0, inProgress: 0, notStarted: 0, ratio: 0 };
  for (const u of units) {
    const s = unitStatus(doc.units[u.id]);
    if (s === 'done') c.done++;
    else if (s === 'in-progress') c.inProgress++;
    else c.notStarted++;
  }
  c.ratio = c.total ? c.done / c.total : 0;
  return c;
}
export const chapterCounts = (ch: Chapter, doc: ProgressDoc) => countUnits(ch.units, doc);
export const subjectCounts = (s: Subject, doc: ProgressDoc) => countUnits(s.chapters.flatMap((c) => c.units), doc);
