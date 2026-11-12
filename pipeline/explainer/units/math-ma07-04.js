import { C, chip, pinecone } from '../lib.js';

const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
const hsl = (h, s = 70, l = 62) => `hsl(${h} ${s}% ${l}%)`;

export function build(X) {
  const { E } = X;
  const bg = ['#f4f2ff', '#e4e8ff'];
  const IND = '#4f5bd5', ORG = '#ff8a3d';

  // =========================================================== scene 0 : the sequence and its rule
  const s0 = X.sceneOf(0, 1, { bg });
  X.blobs(s0, ['#d8d5ff', '#ffe1c7', '#cfe9ff'], 11);
  const title = X.text(s0.root, 'フィボナッチ数列', { x: 640, y: 118, size: 84, fill: C.ink });
  [...Array(1)].forEach(() => X.pop(title, 0.2, 0.8, 0.5));
  const t0 = X.at(0, 1);                       // narration of the numbers starts here
  // tiles
  const tw = 100, gap = 18, x0 = (1280 - (10 * tw + 9 * gap)) / 2, ty = 250;
  const tiles = FIB.map((v, i) => {
    const g = X.g(s0.root, x0 + i * (tw + gap), ty);
    X.card(g, 0, 0, tw, 110, hsl(235 + i * 12, 78, 90), { r: 20, stroke: hsl(235 + i * 12, 60, 60), sw: 4 });
    const hl = X.rect(g, 0, 0, tw, 110, ORG, { rx: 20, opacity: 0 });
    X.text(g, String(v), { x: tw / 2, y: 56, size: v > 9 ? 56 : 70, fill: C.ink });
    X.pop(g, t0 + 0.4 + i * 0.62, 0.5, 0.3);
    return { g, hl };
  });
  // rule: previous two add up
  const ruleChip = chip(X, s0.root, 640, 470, '前の2つを足すと、次の数になる', IND, '#fff', 36);
  X.pop(ruleChip, t0 + 8.6, 0.6);
  const eq = X.text(s0.root, '', { x: 640, y: 566, size: 86, fill: C.ink });
  X.fade(eq, t0 + 9.8, 0.3);
  const rs = t0 + 10.0, per = 0.95;
  const centre = (i) => x0 + i * (tw + gap) + tw / 2;
  for (let k = 2; k < 10; k++) {
    const at = rs + (k - 2) * per;
    // arcs from the two previous tiles down to the new one
    const a = X.path(s0.root, `M${centre(k - 2)} ${ty + 118} Q${centre(k - 2)} ${ty + 175} ${centre(k) - 22} ${ty + 118}`, { stroke: ORG, 'stroke-width': 7 });
    const b = X.path(s0.root, `M${centre(k - 1)} ${ty + 118} Q${centre(k - 1)} ${ty + 160} ${centre(k) + 22} ${ty + 118}`, { stroke: ORG, 'stroke-width': 7 });
    for (const p of [a, b]) {
      X.draw(p, at, 0.45);
      X.anim(p, [{ opacity: 1 }, { opacity: 0 }], at + per - 0.12, 0.12, E.lin, { fill: 'forwards' });
    }
    for (const j of [k - 2, k - 1, k]) X.anim(tiles[j].hl, [{ opacity: 0 }, { opacity: 0.55 }, { opacity: 0.55 }, { opacity: 0 }], at, per, E.lin, { fill: 'none' });
    X.tick(at, 0.001, () => {});
    X.tick(at, per - 0.02, (p) => { if (p > 0 && p < 1) eq.textContent = `${FIB[k - 2]} + ${FIB[k - 1]} = ${FIB[k]}`; });
  }
  // everything in scene 0 clears at the very end by the scene fade

  // =========================================================== scene 1 : in nature
  const s1 = X.sceneOf(1, 1, { bg: ['#effaf0', '#dcf3e3'] });
  X.blobs(s1, ['#cdeccf', '#fff1c4', '#d3eefb'], 21);
  const n0 = X.at(1, 0), n1 = X.at(1, 1);
  const head = X.text(s1.root, [['自然界', '#2e9d5a'], ['のあちこちに！', C.ink]], { x: 640, y: 130, size: 82 });
  X.pop(head, n0 + 0.2, 0.7, 0.5);
  const mini = X.g(s1.root, 0, 0);
  // mini icons
  const mSun = X.g(mini, 330, 390);
  for (let i = 0; i < 16; i++) X.ellipse(mSun, 0, -70, 16, 40, '#ffc933', { transform: `rotate(${i * 22.5})` });
  X.circle(mSun, 0, 0, 52, '#7a4a24'); X.circle(mSun, 0, 0, 34, '#5b3418');
  const mCone = pinecone(X, mini, 640, 390, 1.0);
  const mFlower = X.g(mini, 950, 390);
  for (let i = 0; i < 8; i++) X.ellipse(mFlower, 0, -52, 22, 44, '#f48fb1', { transform: `rotate(${i * 45})`, stroke: '#e0608a', 'stroke-width': 3 });
  X.circle(mFlower, 0, 0, 24, '#ffd54f');
  [mSun, mCone, mFlower].forEach((m, i) => { X.pop(m, n0 + 1.2 + i * 0.7, 0.6, 0.2); X.float(m, 0, 6, 2.2 + i * 0.3, i, 2); });
  X.hide(mini, n1 - 0.2, 0.4); X.hide(head, n1 - 0.2, 0.4);

  // sunflower seeds (golden angle 137.5°)
  const SUN = X.g(s1.root, 330, 335);
  const N = 300, seeds = [];
  for (let i = 0; i < 34; i++) X.ellipse(SUN, 0, -222, 17, 40, '#ffc933', { transform: `rotate(${(i * 360) / 34})`, stroke: '#f0a500', 'stroke-width': 2 });
  X.circle(SUN, 0, 0, 205, '#ffc933'); X.circle(SUN, 0, 0, 188, '#6b3f1d');
  for (let n = 0; n < N; n++) {
    const r = 10.6 * Math.sqrt(n), th = n * 2.399963;
    seeds.push(X.circle(SUN, r * Math.cos(th), r * Math.sin(th), 5.6 + n * 0.006, '#c98a4b', { opacity: 0 }));
  }
  X.pop(SUN, n1 + 0.2, 0.6, 0.3);
  X.tick(n1 + 0.8, 3.6, (p) => { const k = Math.floor(p * N); seeds.forEach((s, n) => s.setAttribute('opacity', n < k ? 1 : 0)); });
  const colour = (mod) => (p) => seeds.forEach((s, n) => s.setAttribute('fill', p <= 0 ? '#c98a4b' : hsl(((n % mod) * 360) / mod, 85, 62)));
  X.tick(n1 + 4.6, 0.4, colour(21));
  X.tick(n1 + 7.3, 0.4, (p) => (p <= 0 ? colour(21)(1) : colour(34)(1)));
  const c21 = chip(X, s1.root, 330, 575, 'らせんの数　21', '#e0457b', '#fff', 34); X.pop(c21, n1 + 4.7, 0.5); X.hide(c21, n1 + 7.2, 0.3);
  const c34 = chip(X, s1.root, 330, 575, 'らせんの数　34', IND, '#fff', 34); X.pop(c34, n1 + 7.4, 0.5);
  // pinecone
  const CONE = pinecone(X, s1.root, 690, 285, 1.0);
  X.pop(CONE, n1 + 3.3, 0.6, 0.3);
  const cc = chip(X, s1.root, 640, 440, '松ぼっくり　8・13', '#a8703c', '#fff', 28); X.pop(cc, n1 + 5.0, 0.5);
  // flowers
  const FL = X.g(s1.root, 0, 0);
  [[5, 880, '#f48fb1'], [8, 1010, '#ffb74d'], [13, 1140, '#ba8bf0']].forEach(([n, x, col], i) => {
    const f = X.g(FL, x, 285);
    for (let k = 0; k < n; k++) X.ellipse(f, 0, -34, n > 10 ? 9 : 13, 28, col, { transform: `rotate(${(k * 360) / n})`, stroke: '#fff', 'stroke-width': 2 });
    X.circle(f, 0, 0, 15, '#ffd54f');
    X.text(f, `${n}枚`, { y: 80, size: 28, fill: C.ink });
    X.pop(f, n1 + 5.4 + i * 0.7, 0.5, 0.2);
  });
  const cp = chip(X, s1.root, 1040, 440, '花びら　5・8・13', '#d9468f', '#fff', 28); X.pop(cp, n1 + 7.6, 0.5);
  const same = chip(X, s1.root, 900, 570, 'どれもフィボナッチ数！', '#2e9d5a', '#fff', 38); X.pop(same, n1 + 8.8, 0.6);

  // =========================================================== scene 2 : the golden ratio
  const s2 = X.sceneOf(2, 2, { bg: ['#fff6e6', '#ffe9c9'] });
  X.blobs(s2, ['#ffe0b2', '#e1d9ff', '#ffd6d6'], 31);
  const g0 = X.at(2, 0), g1 = X.at(2, 1);
  const ratios = FIB.slice(1).map((v, i) => [FIB[i + 1], FIB[i]]).map(([a, b]) => [a, b]); // (1,1)? use pairs (a=next, b=prev)
  const pairs = [[2, 1], [3, 2], [5, 3], [8, 5], [13, 8], [21, 13], [34, 21], [55, 34]];
  const R = X.g(s2.root, 0, 0);
  const ttl = X.text(R, 'となり合う数の比', { x: 640, y: 100, size: 62, fill: C.ink }); X.pop(ttl, g0 + 0.2, 0.6, 0.5);
  // number line 1 .. 2
  const lx0 = 150, lx1 = 1130, ly = 470, xs = (v) => lx0 + (v - 1) * (lx1 - lx0);
  X.line(R, lx0 - 20, ly, lx1 + 20, ly, '#c9b99a', 8);
  for (const v of [1, 1.5, 2]) { X.line(R, xs(v), ly - 14, xs(v), ly + 14, '#c9b99a', 6); if (v !== 1.5) X.text(R, String(v), { x: xs(v), y: ly + 46, size: 30, fill: C.soft }); }
  const goldLine = X.path(R, `M${xs(1.618)} ${ly - 150} L${xs(1.618)} ${ly + 10}`, { stroke: '#e0a000', 'stroke-width': 6, 'stroke-dasharray': '10 10' });
  X.draw(goldLine, g0 + 8.5, 0.8);
  const gl = chip(X, R, xs(1.618), ly - 175, '1.618…　黄金比', '#e0a000', '#fff', 34); X.pop(gl, g0 + 9.2, 0.6);
  // equation 55 ÷ 34
  const eqn = X.text(R, '', { x: 640, y: 240, size: 100, fill: C.ink });
  X.fade(eqn, g0 + 3.2, 0.4);
  X.tick(g0 + 3.2, 0.001, () => {});
  X.tick(g0 + 3.4, 2.8, (p) => { eqn.textContent = `55 ÷ 34 ≈ ${(1 + (55 / 34 - 1) * p).toFixed(3)}`; }, E.out);
  X.tick(g0 + 6.3, 0.5, () => {});
  // dots converge
  pairs.forEach(([a, b], i) => {
    const v = a / b, at = g0 + 3.4 + i * 0.85;
    const d = X.g(R, xs(v), ly);
    X.circle(d, 0, 0, 17, i === 7 ? '#e0a000' : IND, { stroke: '#fff', 'stroke-width': 5 });
    X.text(d, `${a}/${b}`, { y: [-44, 46, -84, 86][i % 4], size: 26, fill: C.ink });
    X.pop(d, at, 0.4, 0.2);
  });
  X.hide(R, g1 - 0.25, 0.4);
  // golden rectangle
  const G = X.g(s2.root, 0, 0);
  const u = 46, rx = 90, ry = 130;   // 13u x 8u
  const sq = [[8, 'left'], [5, 'top'], [3, 'right'], [2, 'bottom'], [1, 'left'], [1, 'top']];
  let cur = { x: rx, y: ry, w: 13 * u, h: 8 * u };
  const shapes = [];
  const cols = ['#ffe0b2', '#cdeccf', '#d3eefb', '#e1d9ff', '#ffd6d6', '#fff1c4'];
  sq.forEach(([n, dir], i) => {
    const s = n * u; let x, y;
    if (dir === 'left') { x = cur.x; y = cur.y; cur = { x: cur.x + s, y: cur.y, w: cur.w - s, h: cur.h }; }
    else if (dir === 'top') { x = cur.x; y = cur.y; cur = { x: cur.x, y: cur.y + s, w: cur.w, h: cur.h - s }; }
    else if (dir === 'right') { x = cur.x + cur.w - s; y = cur.y; cur = { x: cur.x, y: cur.y, w: cur.w - s, h: cur.h }; }
    else { x = cur.x; y = cur.y + cur.h - s; cur = { x: cur.x, y: cur.y, w: cur.w, h: cur.h - s }; }
    // arc for this square (opposite corners, centre on one of the other two)
    const TL = [x, y], TR = [x + s, y], BL = [x, y + s], BR = [x + s, y + s];
    const arcs = { left: [BL, TR, BR, 0], top: [TL, BR, BL, 0], right: [TR, BL, TL, 0], bottom: [BR, TL, TR, 0] };
    const [from, to, centre] = arcs[dir];
    shapes.push({ x, y, s, n, i, from, to, centre });
  });
  const order = [...shapes].reverse();              // smallest first, like the sequence grows
  order.forEach((sh, k) => {
    const at = g1 + 0.3 + k * 0.5;
    const g = X.g(G, 0, 0);
    X.rect(g, sh.x, sh.y, sh.s, sh.s, cols[sh.i], { stroke: '#fff', 'stroke-width': 4, rx: 6 });
    X.text(g, String(sh.n), { x: sh.x + sh.s / 2, y: sh.y + sh.s / 2, size: Math.max(26, sh.s * 0.42), fill: 'rgba(34,48,74,.55)' });
    X.pop(g, at, 0.4, 0.5);
    const r = sh.s;
    const sweep = (() => { const [fx, fy] = sh.from, [tx, ty2] = sh.to, [cx, cy] = sh.centre; const cross = (fx - cx) * (ty2 - cy) - (fy - cy) * (tx - cx); return cross > 0 ? 1 : 0; })();
    const arc = X.path(G, `M${sh.from[0]} ${sh.from[1]} A${r} ${r} 0 0 ${sweep} ${sh.to[0]} ${sh.to[1]}`, { stroke: IND, 'stroke-width': 7 });
    X.draw(arc, at + 0.1, 0.45);
  });
  const ex1 = X.g(G, 0, 0), ex2 = X.g(G, 0, 0);
  // examples: temple + card
  const tp = X.g(ex1, 880, 320);
  X.path(tp, 'M-110 -60 L0 -120 L110 -60 Z', { fill: '#e8d9c0', stroke: '#9a8460', 'stroke-width': 4, 'stroke-linejoin': 'round' });
  X.rect(tp, -118, -58, 236, 14, '#c9b48e', { rx: 4 });
  for (let i = 0; i < 6; i++) X.rect(tp, -100 + i * 40, -42, 20, 100, '#f2e6d0', { stroke: '#9a8460', 'stroke-width': 3, rx: 4 });
  X.rect(tp, -124, 58, 248, 16, '#c9b48e', { rx: 4 });
  X.text(ex1, '建築', { x: 880, y: 420, size: 36, fill: C.ink });
  X.pop(ex1, g1 + 4.2, 0.6, 0.3);
  const card = X.g(ex2, 1090, 300);
  X.card(card, -78, -48, 156, 96, '#fff', { r: 12 }); X.rect(card, -62, -30, 56, 56, '#ffd54f', { rx: 10 }); X.line(card, -6 + 14, -14, 60, -14, '#c8cfe0', 8); X.line(card, 20, 10, 60, 10, '#c8cfe0', 8);
  X.text(ex2, 'デザイン', { x: 1090, y: 420, size: 36, fill: C.ink });
  X.pop(ex2, g1 + 4.9, 0.6, 0.3);
  const gr = chip(X, G, 389, 560, '黄金比　約 1 : 1.618', '#e0a000', '#fff', 40); X.pop(gr, g1 + 3.4, 0.6);
}
