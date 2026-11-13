// Small DSL for hand-written 簿記3級 video scripts with diagrams (based on the FP one).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { reading as baseReading } from '../textvideo.mjs';

export const C = { white: '#eef0ea', yellow: '#f3d77a', blue: '#8fc4ff', pink: '#f4a3b8', green: '#9be0b0', gray: '#9aa3ad', orange: '#f3a76a', red: '#ef8a8a', purple: '#c9a6f5' };
const col = (c) => C[c] ?? c;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const WORDS = [['借方', 'かりかた'], ['貸方', 'かしかた'], ['仕訳', 'しわけ'], ['諸口', 'しょくち'], ['繰越', 'くりこし'], ['仕入', 'しいれ'], ['売掛金', 'うりかけきん'], ['買掛金', 'かいかけきん'],
  ['未収入金', 'みしゅうにゅうきん'], ['前受金', 'まえうけきん'], ['前払金', 'まえばらいきん'], ['雑損', 'ざつぞん'], ['雑益', 'ざつえき'], ['租税公課', 'そぜいこうか'], ['貯蔵品', 'ちょぞうひん'],
  ['再振替', 'さいふりかえ'], ['振替', 'ふりかえ'], ['繰入', 'くりいれ'], ['戻入', 'もどしいれ'], ['有高帳', 'ありだかちょう'], ['証ひょう', 'しょうひょう'], ['当座借越', 'とうざかりこし'],
  ['小切手', 'こぎって'], ['振出', 'ふりだし'], ['振り出', 'ふりだ'], ['剰余金', 'じょうよきん'], ['期首', 'きしゅ'], ['期末', 'きまつ'], ['立替金', 'たてかえきん'], ['預り金', 'あずかりきん'],
  ['過不足', 'かぶそく'], ['小口', 'こぐち'], ['諸掛', 'しょがかり'], ['取得原価', 'しゅとくげんか'], ['簿記', 'ぼき'], ['元帳', 'もとちょう'], ['出納帳', 'すいとうちょう'], ['棚卸', 'たなおろし'],
  ['減価償却', 'げんかしょうきゃく'], ['貸倒', 'かしだおれ'], ['手形', 'てがた'], ['発送費', 'はっそうひ'], ['法定福利費', 'ほうていふくりひ'], ['差入保証金', 'さしいれほしょうきん'],
  ['未払', 'みばらい'], ['未収', 'みしゅう'], ['前払', 'まえばらい'], ['前受', 'まえうけ'], ['仮払', 'かりばらい'], ['仮受', 'かりうけ'], ['精算表', 'せいさんひょう'], ['試算表', 'しさんひょう'],
  ['先入先出法', 'さきいれさきだしほう'], ['移動平均法', 'いどうへいきんほう'], ['三分法', 'さんぶんぽう'], ['定額法', 'ていがくほう'], ['間接法', 'かんせつほう'], ['商品券', 'しょうひんけん'],
  ['損益', 'そんえき'], ['資本的支出', 'しほんてきししゅつ'], ['入金伝票', 'にゅうきんでんぴょう'], ['出金伝票', 'しゅっきんでんぴょう'], ['振替伝票', 'ふりかえでんぴょう'], ['伝票', 'でんぴょう'], ['3級', 'さんきゅう']];
export function reading(s) {
  let r = s.replace(/B\/S/g, 'ビーエス').replace(/P\/L/g, 'ピーエル').replace(/T\/B/g, 'ティービー').replace(/T字/g, 'ティーじ').replace(/@(\d)/g, '単価$1')
    .replace(/(\d+)\/12/g, '12ぶんの$1').replace(/(\d+)\/(\d+)/g, '$2ぶんの$1');
  for (const [w, k] of WORDS) r = r.split(w).join(k);
  return baseReading(r).replace(/×/g, 'かける').replace(/÷/g, 'わる').replace(/−/g, 'ひく').replace(/＝/g, 'イコール').replace(/＋/g, 'たす');
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
  const dir = fs.globSync(`content/20-boki/*/${code}`)[0];
  if (!dir) throw new Error('no unit ' + code);
  fs.mkdirSync(path.join(dir, 'video'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'video', 'script.yaml'), YAML.stringify({ title, scenes }, { lineWidth: 0 }));
  return dir;
}

// ---------- 簿記 elements ----------
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('ja-JP') : v ?? '');
/** journal entry table. rows: [[借方, 金額, 貸方, 金額]] */
export function jr(rows, o = {}) {
  const w = o.w ?? 1100, rh = 56, h = (rows.length + 1) * rh + 8, cw = [0.32, 0.18, 0.32, 0.18].map((r) => r * w);
  const xs = [0, cw[0], cw[0] + cw[1], cw[0] + cw[1] + cw[2], w];
  let m = `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="10" fill="none" stroke="${C.gray}" stroke-width="2"/>`;
  m += `<path d="M2 ${rh} H${w - 2} M${xs[2]} 2 V${h - 2}" stroke="${C.gray}" stroke-width="2"/>`;
  ['借方', '金額', '貸方', '金額'].forEach((t, i) => { m += tx(xs[i] + cw[i] / 2, rh / 2 + 10, t, 24, 'gray', 'middle'); });
  rows.forEach((r, k) => {
    const y = (k + 1) * rh + rh / 2 + 10;
    m += tx(xs[0] + 20, y, fmt(r[0]), 30, o.lc ?? 'blue') + tx(xs[2] - 20, y, fmt(r[1]), 30, 'white', 'end');
    m += tx(xs[2] + 20, y, fmt(r[2]), 30, o.rc ?? 'pink') + tx(xs[4] - 20, y, fmt(r[3]), 30, 'white', 'end');
  });
  return svg(w, h, o.at ?? [90, 170], m, o);
}
/** T-accounts. accts: [{name, l:[], r:[], c}] */
export function tacc(accts, o = {}) {
  const aw = o.aw ?? 520, gap = 40, rows = Math.max(...accts.map((a) => Math.max(a.l?.length ?? 0, a.r?.length ?? 0)), 1);
  const w = accts.length * aw + (accts.length - 1) * gap, h = 70 + rows * 44 + 10;
  const ent = (x, y, t, half) => { const mm = String(t).match(/^(.*?)\s+([\d,]+)$/); return mm ? tx(x + 10, y, mm[1], 24) + tx(x + half - 12, y, mm[2], 24, 'white', 'end') : tx(x + 10, y, t, 24); };
  const m = accts.map((a, i) => {
    const x = i * (aw + gap), c = a.c ?? 'white', half = aw / 2;
    let s = tx(x + half, 32, a.name, 30, c, 'middle') + `<path d="M${x} 48 H${x + aw} M${x + half} 48 V${h - 4}" stroke="${col(c)}" stroke-width="4"/>`;
    (a.l ?? []).forEach((t, k) => { s += ent(x, 88 + k * 44, t, half); });
    (a.r ?? []).forEach((t, k) => { s += ent(x + half, 88 + k * 44, t, half); });
    return s;
  }).join('');
  return svg(w, h, o.at ?? [80, 170], m, o);
}
/** split box (B/S, P/L, box diagram). left/right: [[label, color, ratio]] */
export function sbox(left, right, o = {}) {
  const w = o.w ?? 900, h = o.h ?? 380, cw = (w - 30) / 2;
  const colm = (items, x) => { let y = 0; const tot = items.reduce((s, i) => s + (i[2] ?? 1), 0); return items.map(([l, c, r = 1]) => { const hh = h * r / tot; const ls = String(l).split('\n'); let s = `<rect x="${x}" y="${y + 3}" width="${cw}" height="${hh - 6}" rx="12" fill="${col(c)}" fill-opacity="0.18" stroke="${col(c)}" stroke-width="3"/>`; ls.forEach((t, k) => { s += tx(x + cw / 2, y + hh / 2 + 10 - (ls.length - 1) * 18 + k * 36, t, 30, c, 'middle'); }); y += hh; return s; }).join(''); };
  return svg(w, h, o.at ?? [190, 180], colm(left, 0) + colm(right, cw + 30), o);
}
/** time bar for 経過勘定. segs: [[label, ratio, color]], marks: [[ratio, label]] */
export function tbar(segs, marks = [], o = {}) {
  const w = o.w ?? 1100, h = 200, tot = segs.reduce((s, g) => s + g[1], 0);
  let x = 0, m = '';
  for (const [l, r, c] of segs) { const sw = w * r / tot; const ls = String(l).split('\n'); m += `<rect x="${x + 2}" y="60" width="${sw - 4}" height="90" rx="10" fill="${col(c)}" fill-opacity="0.2" stroke="${col(c)}" stroke-width="3"/>`; ls.forEach((t, k) => { m += tx(x + sw / 2, 112 - (ls.length - 1) * 16 + k * 32, t, 26, c, 'middle'); }); x += sw; }
  for (const [at, l] of marks) { const mx = Math.min(w - 2, Math.max(2, w * at)); m += `<path d="M${mx} 44 V166" stroke="${C.white}" stroke-width="3" stroke-dasharray="8 6"/>` + tx(mx, 32, l, 24, 'yellow', 'middle'); }
  return svg(w, h, o.at ?? [90, 200], m, o);
}
