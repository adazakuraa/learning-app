// Compile a video script (script.yaml) into an absolute-time timeline + WebVTT captions.
//
// script.yaml (written by the AI agent from source.md + instructions):
//   title: 数の種類
//   scenes:
//     - board: whiteboard          # whiteboard | slide   (visual theme of the scene)
//       steps:
//         - say: ナレーション/字幕の文。長い文は自動で字幕2行ずつに分割される
//           show:                  # elements that appear while this is said
//             - { id: t1, type: title, text: 数の種類 }
//           mark: [t1]             # optional: highlight existing elements
//           hide: [t1]             # optional: remove elements
//           pause: 1.5             # optional: extra seconds of silence (e.g. "think" time)
//
// Element types: title, text, list, box, formula, image, svg, arrow, label, tag
// Common keys: id, at: [x, y] (1280x720 canvas; omit = auto stack), w, size: s|m|l|xl,
//   color: white|yellow|blue|pink|green|gray, anim: write|fade|pop|draw|none,
//   delay (s, relative to step start), dur (s), move: { to: [x, y], delay, dur }

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const CHARS_PER_SEC = 6.5; // comfortable Japanese reading speed for captions
const MAX_CUE = 44; // ~2 lines of 22 full-width characters
const MIN_CUE = 1.8;

/** Split narration into caption cues of at most MAX_CUE chars, preferring sentence/comma breaks. */
export function splitCues(text) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (!t) return [];
  const sentences = t.match(/[^。！？!?]+[。！？!?」』）)]*|[^。！？!?]+$/g) ?? [t];
  const out = [];
  for (let s of sentences.map((x) => x.trim()).filter(Boolean)) {
    while (s.length > MAX_CUE) {
      // break at the last comma within the limit, else hard break
      const window = s.slice(0, MAX_CUE);
      let cut = Math.max(window.lastIndexOf('、'), window.lastIndexOf('，'), window.lastIndexOf(' '));
      if (cut < MAX_CUE * 0.4) cut = MAX_CUE - 1;
      out.push(s.slice(0, cut + 1).trim());
      s = s.slice(cut + 1).trim();
    }
    if (s) out.push(s);
  }
  // merge very short cues into the previous one when they fit
  const merged = [];
  for (const c of out) {
    const last = merged[merged.length - 1];
    if (last && last.length + c.length <= MAX_CUE && c.length < 10) merged[merged.length - 1] = last + c;
    else merged.push(c);
  }
  return merged;
}

const readTime = (s) => Math.max(MIN_CUE, s.replace(/\s/g, '').length / CHARS_PER_SEC + 0.4);

/** Estimate how long an element's entrance animation takes. */
function animDuration(el) {
  if (el.dur != null) return el.dur;
  const anim = el.anim ?? defaultAnim(el);
  if (anim === 'none') return 0;
  if (anim === 'fade' || anim === 'pop') return 0.5;
  if (anim === 'draw') return 1.2;
  // write: proportional to amount of text
  const txt = [el.text, el.title, el.body, ...(el.items ?? [])].filter(Boolean).join('');
  return Math.min(3, Math.max(0.5, txt.length * 0.045));
}
export function defaultAnim(el) {
  if (['image', 'formula', 'tag'].includes(el.type)) return 'fade';
  if (['svg', 'arrow'].includes(el.type)) return 'draw';
  return 'write';
}

/**
 * @param script parsed script.yaml
 * @param audio optional map stepKey -> seconds (narration audio length) where stepKey = `${scene}-${step}`
 */
export function compile(script, audio = {}) {
  const scenes = [];
  const cues = [];
  let t = 0;
  script.scenes.forEach((scene, si) => {
    const start = t;
    const steps = [];
    (scene.steps ?? []).forEach((step, pi) => {
      const key = `${si}-${pi}`;
      const parts = splitCues(step.say ?? '');
      const speech = audio[key] ?? parts.reduce((s, p) => s + readTime(p), 0);
      // captions: spread the speech time over the cues by length
      const totalChars = parts.reduce((s, p) => s + p.length, 0) || 1;
      let ct = t + 0.15;
      for (const p of parts) {
        const d = audio[key] ? (speech * p.length) / totalChars : readTime(p);
        cues.push({ start: ct, end: ct + d, text: p });
        ct += d;
      }
      const shows = (step.show ?? []).map((el, ei) => ({
        ...el,
        id: el.id ?? `s${si}p${pi}e${ei}`,
        anim: el.anim ?? defaultAnim(el),
        t0: t + (el.delay ?? 0),
        dur: animDuration(el),
      }));
      const animEnd = Math.max(0, ...shows.map((e) => e.t0 - t + e.dur + (e.move ? (e.move.delay ?? 0) + (e.move.dur ?? 1) : 0)));
      const dur = Math.max(speech + 0.3, animEnd + 0.4, 1) + (step.pause ?? 0);
      steps.push({ t, dur, shows, mark: step.mark ?? [], hide: step.hide ?? [], audioKey: audio[key] ? key : null });
      t += dur;
    });
    t += 0.4; // breath between scenes
    scenes.push({ board: scene.board ?? 'whiteboard', start, end: t, steps });
  });
  return { title: script.title ?? '', duration: t + 0.6, scenes, cues };
}

const vttTime = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};
export const toVtt = (cues) => 'WEBVTT\n\n' + cues.map((c) => `${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.text}\n`).join('\n');

export function loadScript(file) {
  return YAML.parse(fs.readFileSync(file, 'utf8'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  const tl = compile(loadScript(file));
  fs.writeFileSync(path.join(path.dirname(file), 'captions.vtt'), toVtt(tl.cues));
  console.log(`duration ${tl.duration.toFixed(1)}s, ${tl.cues.length} cues, ${tl.scenes.length} scenes`);
}
