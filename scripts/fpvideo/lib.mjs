// Small DSL for hand-written FP video scripts with diagrams.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { reading as baseReading } from '../textvideo.mjs';

export const C = { white: '#eef0ea', yellow: '#f3d77a', blue: '#8fc4ff', pink: '#f4a3b8', green: '#9be0b0', gray: '#9aa3ad', orange: '#f3a76a', red: '#ef8a8a' };
const col = (c) => C[c] ?? c;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function reading(s) {
  return baseReading(s.replace(/#9110/g, 'シャープ、きゅういちいちぜろ'))
    .replace(/iDeCo/g, 'イデコ').replace(/NISA/g, 'ニーサ').replace(/GDP/g, 'ジーディーピー').replace(/CPI/g, 'シーピーアイ')
    .replace(/FP/g, 'エフピー').replace(/ETF/g, 'イーティーエフ').replace(/REIT/g, 'リート').replace(/e-Tax/g, 'イータックス')
    .replace(/DC/g, 'ディーシー').replace(/DB/g, 'ディービー').replace(/FX/g, 'エフエックス').replace(/CFP/g, 'シーエフピー')
    .replace(/BNPL/g, 'ビーエヌピーエル').replace(/LINE/g, 'ライン').replace(/SNS/g, 'エスエヌエス').replace(/ATM/g, 'エーティーエム').replace(/SMS/g, 'エスエムエス')
    .replace(/×/g, 'かける').replace(/÷/g, 'わる').replace(/−/g, 'ひく').replace(/＝/g, 'イコール');
}

// ---------- elements ----------
export const T = (text) => ({ type: 'title', text });
export const txt = (text, o = {}) => ({ type: 'text', text, ...o });
export const box = (text, o = {}) => ({ type: 'box', w: 1100, text, ...o });
export const list = (items, o = {}) => ({ type: 'list', items, ...o });
export const tag = (text, color = 'yellow', at = [1000, 52]) => ({ type: 'tag', text, color, at });
const svg = (w, h, at, markup, o = {}) => ({ type: 'svg', w, h, at, anim: o.anim ?? 'fade', markup, ...(o.id ? { id: o.id } : {}) });
const tx = (x, y, s, size = 26, color = 'white', anchor = 'start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${col(color)}" stroke="none" text-anchor="${anchor}">${esc(s)}</text>`;

/** horizontal bar chart. items: [label, value, color, valueLabel] */
export function bars(items, o = {}) {
  const w = o.w ?? 1100, lw = o.labelW ?? 260, rowH = o.rowH ?? 70, h = items.length * rowH + 10;
  const max = o.max ?? Math.max(...items.map((i) => i[1]));
  const bw = w - lw - 190;
  const m = items.map(([label, v, c = 'blue', vl], i) => {
    const y = i * rowH + 10, len = Math.max(4, (v / max) * bw);
    return tx(lw - 16, y + rowH / 2 + 4, label, o.size ?? 26, 'white', 'end') +
      `<rect x="${lw}" y="${y + 10}" width="${len}" height="${rowH - 26}" rx="6" fill="${col(c)}" fill-opacity="0.8" stroke="none"/>` +
      tx(lw + len + 14, y + rowH / 2 + 4, vl ?? String(v), o.size ?? 26, c);
  }).join('');
  return svg(w, h, o.at ?? [80, 160], m, o);
}

/** vertical bar chart. items: [label, value, color, valueLabel] */
export function vbars(items, o = {}) {
  const w = o.w ?? 1000, h = o.h ?? 400, max = o.max ?? Math.max(...items.map((i) => i[1]));
  const n = items.length, slot = w / n, bw = Math.min(140, slot * 0.55), base = h - 50;
  const m = items.map(([label, v, c = 'blue', vl], i) => {
    const bh = (v / max) * (base - 50), x = i * slot + (slot - bw) / 2;
    return `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh}" rx="6" fill="${col(c)}" fill-opacity="0.8" stroke="none"/>` +
      tx(x + bw / 2, base - bh - 12, vl ?? String(v), 26, c, 'middle') + tx(x + bw / 2, base + 36, label, 24, 'white', 'middle');
  }).join('') + `<path d="M0 ${base} H${w}" stroke="${C.gray}" stroke-width="2"/>`;
  return svg(w, h, o.at ?? [140, 180], m, o);
}

/** boxes connected by arrows. nodes: [text | [text, color, sub]] */
export function flow(nodes, o = {}) {
  const n = nodes.length, w = o.w ?? 1120, gap = 50, bw = (w - gap * (n - 1)) / n, bh = o.h ?? 130;
  const m = nodes.map((nd, i) => {
    const [t, c = 'blue', sub] = Array.isArray(nd) ? nd : [nd];
    const x = i * (bw + gap);
    let s = `<rect x="${x + 2}" y="2" width="${bw - 4}" height="${bh - 4}" rx="14" fill="${col(c)}" fill-opacity="0.15" stroke="${col(c)}" stroke-width="3"/>`;
    const lines = String(t).split('\n');
    lines.forEach((ln, k) => { s += tx(x + bw / 2, bh / 2 - (lines.length - 1) * 16 + k * 32 + (sub ? -10 : 9), ln, o.size ?? 26, c, 'middle'); });
    if (sub) String(sub).split('\n').forEach((sl, k) => { s += tx(x + bw / 2, bh / 2 + 30 + k * 24, sl, 20, 'gray', 'middle'); });
    if (i < n - 1 && o.arrows !== false) s += `<path d="M${x + bw + 8} ${bh / 2} L${x + bw + gap - 8} ${bh / 2} M${x + bw + gap - 20} ${bh / 2 - 10} L${x + bw + gap - 8} ${bh / 2} L${x + bw + gap - 20} ${bh / 2 + 10}" stroke="${C.gray}" stroke-width="4" fill="none"/>`;
    return s;
  }).join('');
  return svg(w, bh + 4, o.at ?? [80, 200], m, o);
}

/** stacked layers (top first), e.g. pension floors. layers: [label, sub, color, widthRatio] */
export function layers(ls, o = {}) {
  const w = o.w ?? 900, lh = o.lh ?? 90, h = ls.length * (lh + 10);
  const m = ls.map(([label, sub, c = 'blue', r = 1], i) => {
    const bw = w * r, x = (w - bw) / 2, y = i * (lh + 10);
    return `<rect x="${x}" y="${y}" width="${bw}" height="${lh}" rx="10" fill="${col(c)}" fill-opacity="0.22" stroke="${col(c)}" stroke-width="3"/>` +
      tx(w / 2, y + (sub ? lh / 2 - 4 : lh / 2 + 10), label, 30, c, 'middle') + (sub ? tx(w / 2, y + lh / 2 + 28, sub, 22, 'white', 'middle') : '');
  }).join('');
  return svg(w, h, o.at ?? [190, 170], m, o);
}

/** person icon with caption lines: example persona */
export function person(name, lines = [], o = {}) {
  const c = col(o.color ?? 'yellow'), w = o.w ?? 520, h = 60 + lines.length * 36 + 40;
  let m = `<circle cx="50" cy="44" r="26" fill="none" stroke="${c}" stroke-width="4"/><path d="M8 130 C8 88 92 88 92 130" fill="none" stroke="${c}" stroke-width="4"/>`;
  m += tx(120, 50, name, 32, o.color ?? 'yellow');
  lines.forEach((l, i) => { m += tx(120, 92 + i * 36, l, 24, 'white'); });
  return svg(w, Math.max(h, 140), o.at ?? [80, 150], m, o);
}

/** two columns comparison. left/right: {title, items[], color} */
export function versus(left, right, o = {}) {
  const at = o.at ?? [60, 160];
  const mk = (side, x) => box(side.items.map((s) => `・${s}`).join('\n'), { title: side.title, color: side.color ?? 'blue', at: [x, at[1]], w: 560 });
  return [mk(left, at[0]), mk(right, at[0] + 600)];
}

/** growth lines. series: [[values], color, label]; xs: x labels */
export function lines(series, xs, o = {}) {
  const w = o.w ?? 1000, h = o.h ?? 420, base = h - 50, max = o.max ?? Math.max(...series.flatMap((s) => s[0]));
  const px = (i, n) => 60 + (i / (n - 1)) * (w - 220), py = (v) => base - (v / max) * (base - 30);
  let m = `<path d="M60 ${base} H${w - 160} M60 ${base} V20" stroke="${C.gray}" stroke-width="2" fill="none"/>`;
  xs.forEach((x, i) => { m += tx(px(i, xs.length), base + 34, x, 22, 'gray', 'middle'); });
  series.forEach(([vals, c, label], si) => {
    m += `<path d="${vals.map((v, i) => `${i ? 'L' : 'M'}${px(i, vals.length).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')}" stroke="${col(c)}" stroke-width="5" fill="none"/>`;
    m += tx(px(vals.length - 1, vals.length) + 12, py(vals[vals.length - 1]) + 8 + (si - (series.length - 1) / 2) * 30, label, 24, c);
  });
  return svg(w, h, o.at ?? [140, 170], m, { ...o, anim: o.anim ?? 'draw' });
}

/** big number with caption */
export const big = (num, cap, o = {}) => ({ type: 'text', text: `**${num}**`, size: 'xl', at: o.at ?? [80, 200], ...(o.color ? { color: o.color } : {}) });

// ---------- steps and scenes ----------
/** step: [say, ...elements] ; options via object as last item: {hide, ex, pause} */
export function st(say, ...rest) {
  const opt = rest.length && rest[rest.length - 1] && !rest[rest.length - 1].type && !Array.isArray(rest[rest.length - 1]) ? rest.pop() : {};
  const show = rest.flat();
  const s = { say };
  const r = reading(say);
  if (r !== say) s.read = r;
  if (show.length) s.show = show;
  if (opt.hide) s.hide = opt.hide;
  if (opt.ex) s.added = true;
  if (opt.pause) s.pause = opt.pause;
  return s;
}
export const scene = (...steps) => ({ board: 'whiteboard', steps });
export const slide = (...steps) => ({ board: 'slide', steps });

export function write(code, title, scenes) {
  const dir = fs.globSync(`content/19-finance/*/${code}`)[0];
  if (!dir) throw new Error('no unit ' + code);
  fs.mkdirSync(path.join(dir, 'video'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'video', 'script.yaml'), YAML.stringify({ title, scenes }, { lineWidth: 0 }));
  return dir;
}
