export type Cue = { start: number; end: number; text: string };

const toSec = (t: string) => {
  const parts = t.trim().split(':').map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

/** Minimal WebVTT parser (timings + text; settings and styling are ignored). */
export function parseVtt(src: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = src.replace(/\r/g, '').split(/\n{2,}/);
  for (const b of blocks) {
    const lines = b.split('\n');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, z] = lines[i].split('-->');
    const text = lines.slice(i + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (text) cues.push({ start: toSec(a), end: toSec(z.trim().split(/\s+/)[0]), text });
  }
  return cues.sort((x, y) => x.start - y.start);
}

export const fmtTime = (s: number) => {
  if (!Number.isFinite(s)) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export const fmtDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}時間${m}分`;
  if (m) return `${m}分`;
  return s > 0 ? '1分未満' : '0分';
};
