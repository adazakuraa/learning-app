// SVG figure helpers for the 簿記3級 textbook (light card style, readable in light & dark themes).
export const K = { asset: '#2f6fc4', liab: '#c94b50', eq: '#2f8f55', rev: '#d07a1e', exp: '#7d4fc0', gray: '#6b7280', ink: '#1f2328', bg: '#fbfaf6', line: '#d6d3cc', yellow: '#b8860b' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const col = (c) => K[c] ?? c;
export const text = (x, y, s, { size = 18, color = 'ink', anchor = 'start', weight = 'normal' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${col(color)}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
const lines = (x, y, s, o = {}) => String(s).split('\n').map((l, i) => text(x, y + i * ((o.size ?? 18) + 6), l, o)).join('');
export function wrap(w, h, body, title) {
  const th = title ? 34 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + th}" width="${w}" height="${h + th}" font-family="'Hiragino Sans','Noto Sans JP','Yu Gothic',sans-serif">` +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h + th - 1}" rx="12" fill="${K.bg}" stroke="${K.line}"/>` +
    (title ? text(w / 2, 26, title, { size: 18, anchor: 'middle', weight: 'bold', color: 'gray' }) : '') +
    `<g transform="translate(0,${th})">${body}</g></svg>\n`;
}
/** colored block: rect + centered label (multi-line) */
export function block(x, y, w, h, label, c, o = {}) {
  const ls = String(label).split('\n'), size = o.size ?? 18;
  const y0 = y + h / 2 - ((ls.length - 1) * (size + 6)) / 2 + size / 3;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 8}" fill="${col(c)}" fill-opacity="${o.op ?? 0.13}" stroke="${col(c)}" stroke-width="2"/>` +
    ls.map((l, i) => text(x + w / 2, y0 + i * (size + 6), l, { size, anchor: 'middle', color: o.tc ?? c, weight: o.weight ?? 'bold' })).join('');
}
export function arrow(x1, y1, x2, y2, c = 'gray', label) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11;
  const p = (ang) => `${x2 - L * Math.cos(a - ang)},${y2 - L * Math.sin(a - ang)}`;
  return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col(c)}" stroke-width="2.5" fill="none"/><path d="M${p(0.45)} L${x2} ${y2} L${p(-0.45)}" stroke="${col(c)}" stroke-width="2.5" fill="none"/>` +
    (label ? text((x1 + x2) / 2, (y1 + y2) / 2 - 8, label, { size: 15, anchor: 'middle', color: c }) : '');
}
/** split box like a balance sheet. left/right: [[label, color, heightRatio], ...] */
export function splitBox(left, right, o = {}) {
  const w = o.w ?? 640, h = o.h ?? 300, pad = 20, cw = (w - pad * 3) / 2, top = 40;
  let b = text(pad + cw / 2, 26, o.lh ?? '借方（左）', { anchor: 'middle', color: 'gray', size: 16 }) + text(pad * 2 + cw * 1.5, 26, o.rh ?? '貸方（右）', { anchor: 'middle', color: 'gray', size: 16 });
  const col_ = (items, x) => { let y = top; const tot = items.reduce((s, i) => s + (i[2] ?? 1), 0); return items.map(([l, c, r = 1]) => { const hh = (h - top - pad) * r / tot; const s = block(x, y, cw, hh - 6, l, c, { size: o.size ?? 20 }); y += hh; return s; }).join(''); };
  b += col_(left, pad) + col_(right, pad * 2 + cw);
  return wrap(w, h, b, o.title);
}
/** T-accounts in a grid. accts: [{name, l:[...], r:[...], c}] ; entry "4/1 借入金 100,000" (amount = last token) */
export function tAccounts(accts, o = {}) {
  const aw = o.aw ?? 360, gap = 26, per = Math.min(o.perRow ?? 2, accts.length);
  const rows = Math.max(...accts.map((a) => Math.max(a.l?.length ?? 0, a.r?.length ?? 0)), 1);
  const ah = 70 + rows * 26 + 14, nr = Math.ceil(accts.length / per);
  const w = per * aw + (per + 1) * gap, h = nr * (ah + 10);
  const ent = (x, y, t, half) => { const m = String(t).match(/^(.*?)\s+([\d,]+)$/); return m ? text(x + 6, y, m[1], { size: 15 }) + text(x + half - 8, y, m[2], { size: 15, anchor: 'end' }) : text(x + 6, y, t, { size: 15 }); };
  const b = accts.map((a, i) => {
    const x = gap + (i % per) * (aw + gap), y0 = Math.floor(i / per) * (ah + 10), c = a.c ?? 'ink', half = aw / 2;
    let s = text(x + aw / 2, y0 + 26, a.name, { anchor: 'middle', weight: 'bold', color: c, size: 19 });
    s += `<path d="M${x} ${y0 + 38} H${x + aw} M${x + half} ${y0 + 38} V${y0 + ah - 6}" stroke="${col(c)}" stroke-width="2.5"/>`;
    s += text(x + 4, y0 + 54, '借方', { size: 12, color: 'gray' }) + text(x + aw - 4, y0 + 54, '貸方', { size: 12, color: 'gray', anchor: 'end' });
    (a.l ?? []).forEach((t, k) => { s += ent(x, y0 + 78 + k * 26, t, half); });
    (a.r ?? []).forEach((t, k) => { s += ent(x + half, y0 + 78 + k * 26, t, half); });
    return s;
  }).join('');
  return wrap(w, h, b, o.title);
}
/** horizontal flow of blocks. nodes: [label | [label,color]] */
export function flowFig(nodes, o = {}) {
  const n = nodes.length, bw = o.bw ?? 130, bh = o.bh ?? 70, gap = o.gap ?? 34, pad = 20;
  const w = pad * 2 + n * bw + (n - 1) * gap, h = bh + pad * 2 + (o.extraH ?? 0);
  const b = nodes.map((nd, i) => {
    const [l, c = 'asset'] = Array.isArray(nd) ? nd : [nd];
    const x = pad + i * (bw + gap);
    return block(x, pad, bw, bh, l, c, { size: o.size ?? 17 }) + (i < n - 1 ? arrow(x + bw + 4, pad + bh / 2, x + bw + gap - 4, pad + bh / 2) : '');
  }).join('') + (o.under ?? '');
  return wrap(w, h, b, o.title);
}
/** time bar: segments [[label, ratio, color, sub]] and markers [{at: ratio, label}] */
export function timeBar(segs, o = {}) {
  const w = o.w ?? 680, pad = 30, bw = w - pad * 2, h = 150;
  let x = pad, b = '';
  const tot = segs.reduce((s, g) => s + g[1], 0);
  for (const [l, r, c, sub] of segs) {
    const sw = bw * r / tot;
    b += block(x, 40, sw, 50, l, c, { size: 16 });
    if (sub) b += text(x + sw / 2, 112, sub, { size: 14, anchor: 'middle', color: 'gray' });
    x += sw;
  }
  for (const m of o.marks ?? []) { const mx = pad + bw * m.at; b += `<path d="M${mx} 30 V100" stroke="${K.ink}" stroke-width="2" stroke-dasharray="4 3"/>` + text(mx, 24, m.label, { size: 14, anchor: 'middle', weight: 'bold' }); }
  return wrap(w, h, b, o.title);
}
/** generic: free composition with given size */
export const free = (w, h, body, title) => wrap(w, h, body, title);
export { lines };
