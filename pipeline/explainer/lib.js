// Shared drawing helpers for explainer units (palette + small illustrations).
export const C = {
  ink: '#22304a', soft: '#5b6785', white: '#ffffff',
  red: '#e8604c', orange: '#f59a3c', gold: '#f2b632', green: '#4cae6a', leaf: '#8ed081', teal: '#2aa6a0',
  blue: '#4f9be8', sky: '#bfe6fb', purple: '#8a6fe0', pink: '#f4849c', wood: '#b9784a', sand: '#f6d9a6', paper: '#fff8ea',
};

/** rounded label chip centred at (x,y); returns the group (width estimated from text length) */
export function chip(X, p, x, y, str, fill = C.ink, color = '#fff', size = 30, o = {}) {
  const w = o.w ?? Math.max(60, [...str].length * size * (o.k ?? 1.02) + 44);
  const h = size + 24;
  const g = X.g(p, x, y);
  X.rect(g, -w / 2, -h / 2, w, h, fill, { rx: h / 2, css: { filter: 'drop-shadow(0 5px 8px rgba(30,40,70,.22))' } });
  X.text(g, str, { size, fill: color, weight: 900 });
  return g;
}

/** simple person: head + body; kind 'chief' gets a headdress, 'worker' bends and carries */
export function person(X, p, x, y, s = 1, color = C.blue, kind = 'plain') {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.ellipse(k, 0, 2, 22, 5, 'rgba(30,40,70,.15)');
  X.path(k, 'M-18 0 Q-20 -44 -9 -50 L9 -50 Q20 -44 18 0 Z', { fill: color });
  X.circle(k, 0, -66, 15, '#ffd9b3');
  if (kind === 'chief') {
    X.path(k, 'M-17 -76 L-12 -100 L-4 -82 L0 -104 L4 -82 L12 -100 L17 -76 Z', { fill: C.gold, stroke: '#c98d12', 'stroke-width': 2 });
  }
  if (kind === 'worker') X.path(k, 'M-16 -80 L16 -80 L12 -86 L-12 -86 Z', { fill: '#e7c27a' });
  X.circle(k, -5, -66, 2, C.ink);
  X.circle(k, 5, -66, 2, C.ink);
  return g;
}

/** rice plant (3 stalks with grain ears) */
export function rice(X, p, x, y, s = 1, ear = C.gold, stalk = C.green) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  for (const [dx, h, bend] of [[-10, 46, -10], [0, 56, 0], [10, 46, 10]]) {
    X.path(k, `M${dx} 0 Q${dx} ${-h * 0.6} ${dx + bend} ${-h}`, { stroke: stalk, 'stroke-width': 4 });
    for (let i = 0; i < 4; i++) X.ellipse(k, dx + bend + (i % 2 ? 4 : -4), -h - i * 6 + 8, 3.2, 5.5, ear, { transform: `rotate(${i % 2 ? 22 : -22} ${dx + bend} ${-h})` });
  }
  return g;
}

export function sack(X, p, x, y, s = 1, fill = '#ead3a3') {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.path(k, 'M-17 0 Q-22 -20 -12 -30 L12 -30 Q22 -20 17 0 Z', { fill, stroke: '#b99557', 'stroke-width': 2.5 });
  X.path(k, 'M-9 -30 Q0 -40 9 -30', { stroke: '#b99557', 'stroke-width': 3 });
  X.circle(k, 0, -17, 4, '#c9a56a');
  return g;
}

export function hut(X, p, x, y, s = 1, roof = '#c98a4b', wall = '#f1d3a1') {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.rect(k, -28, -26, 56, 28, wall, { rx: 3 });
  X.path(k, 'M-38 -22 L0 -64 L38 -22 Z', { fill: roof, stroke: '#9a6431', 'stroke-width': 2, 'stroke-linejoin': 'round' });
  X.rect(k, -7, -16, 14, 18, '#7a5230', { rx: 3 });
  return g;
}

export function coinStack(X, p, x, y, n, s = 1, fill = C.gold) {
  const g = X.g(p, x, y);
  const coins = [];
  for (let i = 0; i < n; i++) {
    const c = X.g(g, 0, -i * 11 * s);
    X.ellipse(c, 0, 5 * s, 30 * s, 10 * s, '#d99b14');
    X.ellipse(c, 0, 0, 30 * s, 10 * s, fill, { stroke: '#d99b14', 'stroke-width': 2 });
    coins.push(c);
  }
  return { g, coins };
}

/** a wavy water line (static path) */
export function wave(X, p, x, y, w, amp = 6, len = 40, stroke = 'rgba(255,255,255,.7)') {
  let d = `M${x} ${y}`;
  for (let i = 0; i < w / len; i++) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
  return X.path(p, d, { stroke, 'stroke-width': 4 });
}

let clipN = 0;
/** pinecone clipped to its oval, with rows of overlapping scales */
export function pinecone(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  const id = `cone${clipN++}`;
  const defs = X.el('defs', {}, k);
  const cp = X.el('clipPath', { id }, defs);
  X.el('ellipse', { cx: 0, cy: 0, rx: 64, ry: 96 }, cp);
  X.ellipse(k, 0, 0, 64, 96, '#a8703c');
  const inner = X.g(k, 0, 0, { 'clip-path': `url(#${id})` });
  for (let r = 0; r < 8; r++) for (let c = -2; c < 3; c++) {
    const cx = c * 34 + (r % 2) * 17, cy = -84 + r * 25;
    X.path(inner, `M${cx - 17} ${cy} Q${cx} ${cy + 34} ${cx + 17} ${cy} Q${cx} ${cy + 8} ${cx - 17} ${cy} Z`, { fill: r % 2 ? '#b97d44' : '#c88b50', stroke: '#7a4a24', 'stroke-width': 3 });
  }
  X.ellipse(k, 0, 0, 64, 96, 'none', { stroke: '#7a4a24', 'stroke-width': 5 });
  return g;
}

// ------------------------------------------------------------------ rotating globe (orthographic projection)
// Very coarse continent outlines as [lon, lat] points (stylised on purpose).
export const LAND = {
  northAmerica: [[-168, 65], [-162, 70], [-140, 70], [-125, 70], [-110, 73], [-95, 72], [-82, 68], [-90, 62], [-93, 58], [-85, 55], [-80, 52], [-78, 60], [-70, 60], [-62, 58], [-56, 52], [-60, 47], [-66, 45], [-70, 42], [-76, 38], [-76, 34], [-81, 31], [-80, 26], [-83, 30], [-88, 30], [-94, 29], [-97, 26], [-97, 21], [-94, 18], [-90, 21], [-87, 21], [-88, 16], [-84, 15], [-83, 10], [-79, 9], [-77, 8], [-80, 7], [-85, 10], [-87, 13], [-92, 14], [-97, 16], [-105, 20], [-106, 23], [-112, 29], [-114, 31], [-117, 33], [-121, 35], [-124, 40], [-124, 47], [-128, 51], [-133, 56], [-140, 60], [-148, 61], [-152, 59], [-158, 57], [-164, 55], [-166, 60]],
  southAmerica: [[-77, 8], [-72, 12], [-62, 11], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -14], [-41, -22], [-48, -26], [-53, -34], [-58, -35], [-62, -39], [-65, -42], [-68, -50], [-69, -54], [-73, -52], [-75, -47], [-73, -38], [-71, -30], [-70, -20], [-76, -14], [-81, -6], [-80, -1], [-78, 2]],
  eurasia: [[-9, 37], [-9, 43], [-2, 44], [-1, 48], [-5, 48], [2, 51], [5, 53], [8, 55], [9, 57], [10, 57], [5, 59], [5, 62], [14, 67], [20, 70], [30, 71], [40, 67], [44, 68], [60, 69], [70, 73], [80, 73], [100, 77], [115, 74], [130, 71], [150, 71], [170, 70], [180, 68], [180, 65], [170, 60], [163, 58], [160, 60], [156, 51], [150, 59], [142, 59], [137, 54], [141, 52], [140, 48], [135, 43], [130, 42], [129, 35], [126, 34], [125, 38], [121, 39], [122, 37], [121, 32], [120, 27], [114, 22], [108, 21], [106, 18], [109, 12], [105, 9], [101, 13], [100, 7], [103, 2], [98, 8], [98, 16], [94, 17], [92, 22], [88, 22], [80, 15], [77, 8], [73, 16], [72, 21], [67, 25], [61, 25], [57, 26], [52, 28], [48, 30], [50, 26], [56, 25], [59, 22], [52, 16], [43, 13], [39, 21], [35, 28], [34, 31], [36, 35], [30, 37], [27, 37], [26, 40], [23, 40], [24, 37], [20, 40], [19, 42], [13, 45], [12, 44], [16, 41], [18, 40], [16, 38], [12, 41], [9, 44], [3, 43], [0, 39], [-5, 36]],
  africa: [[-17, 21], [-13, 28], [-6, 36], [10, 37], [11, 33], [20, 31], [31, 31], [34, 28], [37, 21], [43, 12], [51, 12], [46, 3], [40, -3], [40, -10], [35, -20], [33, -26], [27, -34], [19, -35], [15, -28], [12, -17], [14, -8], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 9], [-17, 14]],
  australia: [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [151, -34], [145, -38], [138, -35], [131, -31], [123, -34], [115, -34]],
  greenland: [[-55, 60], [-45, 60], [-20, 70], [-20, 80], [-40, 83], [-65, 80], [-72, 77], [-58, 75]],
  antarctica: [[-180, -72], [-90, -73], [0, -70], [90, -66], [180, -72], [180, -90], [-180, -90]],
  japan: [[130, 31], [132, 34], [136, 34], [140, 35], [142, 38], [142, 41], [141, 45], [145, 43], [141, 41], [140, 38], [137, 37], [133, 35], [131, 34]],
  britain: [[-5, 50], [1, 51], [2, 53], [-3, 56], [-5, 58], [-6, 56], [-3, 54], [-5, 52]],
  madagascar: [[44, -25], [47, -25], [50, -15], [48, -13], [44, -17]],
  borneo: [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
  sumatra: [[95, 5], [98, 4], [106, -6], [103, -5], [100, 0]],
  newzealand: [[172, -41], [176, -38], [178, -39], [174, -42], [170, -46], [167, -46]],
};
export const LAND_COLOR = '#79c76f';

function densify(pts, step = 3) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
const D2R = Math.PI / 180;
export const project = (lon, lat, lon0, lat0) => {
  const l = lon * D2R, f = lat * D2R, l0 = lon0 * D2R, f0 = lat0 * D2R;
  const dl = l - l0;
  const x = Math.cos(f) * Math.sin(dl);
  const y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(dl);
  const z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(dl);
  return { x, y, z };
};

/**
 * A rotating globe drawn with SVG. g.update(lon0, lat0) redraws; g.land[name] are the <path>s (colour them freely);
 * g.ring(lat, fromLon, toLon) returns a path 'd' for a parallel/meridian piece (front side only).
 */
export function globe(X, parent, cx, cy, r) {
  const root = X.g(parent, cx, cy);
  const id = `gl${clipN++}`;
  const defs = X.el('defs', {}, root);
  const cp = X.el('clipPath', { id }, defs);
  X.el('circle', { cx: 0, cy: 0, r }, cp);
  const grad = X.el('radialGradient', { id: id + 'g', cx: '35%', cy: '30%', r: '75%' }, defs);
  X.el('stop', { offset: '0', 'stop-color': '#7cc8f5' }, grad);
  X.el('stop', { offset: '1', 'stop-color': '#2f86d4' }, grad);
  const shade = X.el('radialGradient', { id: id + 's', cx: '35%', cy: '30%', r: '80%' }, defs);
  X.el('stop', { offset: '0.55', 'stop-color': '#fff', 'stop-opacity': '0' }, shade);
  X.el('stop', { offset: '1', 'stop-color': '#0b2a5b', 'stop-opacity': '0.32' }, shade);
  X.circle(root, 0, 0, r + 10, 'rgba(79,155,232,.18)');
  X.circle(root, 0, 0, r, `url(#${id}g)`);
  const inner = X.g(root, 0, 0, { 'clip-path': `url(#${id})` });
  const grat = X.path(inner, '', { stroke: 'rgba(255,255,255,.28)', 'stroke-width': 1.5 });
  const land = {};
  const polys = {};
  for (const [name, pts] of Object.entries(LAND)) {
    polys[name] = densify(pts, name === 'antarctica' ? 5 : 3);
    land[name] = X.path(inner, '', { fill: LAND_COLOR, stroke: '#4f9f56', 'stroke-width': 1.5 });
  }
  const extra = X.g(inner, 0, 0);
  X.circle(root, 0, 0, r, `url(#${id}s)`);
  X.circle(root, 0, 0, r, 'none', { stroke: 'rgba(255,255,255,.55)', 'stroke-width': 3 });

  const pt = (lon, lat, lon0, lat0) => {
    const p = project(lon, lat, lon0, lat0);
    if (p.z >= 0) return [p.x * r, -p.y * r, true];
    const m = Math.hypot(p.x, p.y) || 1;
    return [(p.x / m) * r, (-p.y / m) * r, false];
  };
  const polyD = (poly, lon0, lat0) => {
    let seen = 0;
    const d = poly.map(([lo, la], i) => { const [x, y, vis] = pt(lo, la, lon0, lat0); if (vis) seen++; return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';
    return seen ? d : '';           // completely on the far side: draw nothing (clamped points would wrap the whole rim)
  };
  const lineD = (pts, lon0, lat0) => {
    let d = '', pen = false;
    for (const [lo, la] of pts) {
      const p = project(lo, la, lon0, lat0);
      if (p.z < 0) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${(p.x * r).toFixed(1)} ${(-p.y * r).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  const api = {
    root, land, extra, r, lon0: 0, lat0: 20, pt,
    lineD: (pts) => lineD(pts, api.lon0, api.lat0),
    update(lon0, lat0 = 20) {
      api.lon0 = lon0; api.lat0 = lat0;
      for (const name of Object.keys(polys)) land[name].setAttribute('d', polyD(polys[name], lon0, lat0));
      let d = '';
      for (let la = -60; la <= 60; la += 30) { const pts = []; for (let lo = -180; lo <= 180; lo += 4) pts.push([lo, la]); d += lineD(pts, lon0, lat0); }
      for (let lo = -180; lo < 180; lo += 30) { const pts = []; for (let la = -90; la <= 90; la += 4) pts.push([lo, la]); d += lineD(pts, lon0, lat0); }
      grat.setAttribute('d', d);
    },
  };
  api.update(0, 20);
  return api;
}

/** shinkansen (side view), facing right, ~220 px long */
export function train(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.path(k, 'M-110 0 L60 0 Q100 0 118 22 L120 34 L-110 34 Z', { fill: '#fff', stroke: '#c9d3e8', 'stroke-width': 3 });
  X.rect(k, -110, 20, 230, 8, '#2f86d4');
  for (let i = 0; i < 6; i++) X.rect(k, -96 + i * 28, 6, 18, 12, '#8fc4ff', { rx: 3 });
  X.path(k, 'M66 6 Q92 8 106 22 L66 22 Z', { fill: '#8fc4ff' });
  X.circle(k, -70, 38, 8, '#556', {}); X.circle(k, 70, 38, 8, '#556', {});
  return g;
}

export function plane(X, p, x, y, s = 1, fill = '#fff') {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.path(k, 'M-60 0 Q-30 -14 40 -10 L70 -4 Q80 0 70 6 L40 10 Q-30 14 -60 0 Z', { fill, stroke: '#9aa8c8', 'stroke-width': 3 });
  X.path(k, 'M-6 -8 L-34 -46 L-18 -46 L22 -8 Z', { fill, stroke: '#9aa8c8', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  X.path(k, 'M-6 8 L-34 46 L-18 46 L22 8 Z', { fill, stroke: '#9aa8c8', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  X.path(k, 'M-60 0 L-74 -22 L-60 -22 L-40 -6 Z', { fill, stroke: '#9aa8c8', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return g;
}

export function clock(X, p, x, y, r = 34, hands = [0, 0]) {
  const g = X.g(p, x, y);
  X.circle(g, 0, 0, r, '#fff', { stroke: '#22304a', 'stroke-width': 5 });
  const m = X.line(g, 0, 0, 0, -r * 0.72, '#22304a', 4), h = X.line(g, 0, 0, 0, -r * 0.5, '#e8604c', 5);
  m.style.transformOrigin = '0px 0px'; h.style.transformOrigin = '0px 0px';
  m.style.transformBox = 'view-box'; h.style.transformBox = 'view-box';
  return { g, minute: m, hour: h };
}

/** text with chemical-formula subscripts: a digit that follows a letter (or ")") becomes a subscript */
export function chemText(X, p, str, o = {}) {
  const size = o.size ?? 40;
  const t = X.el('text', {
    x: o.x ?? 0, y: o.y ?? 0, 'font-size': size, 'font-weight': o.weight ?? 900, fill: o.fill ?? '#22304a',
    'text-anchor': o.anchor ?? 'middle', 'dominant-baseline': 'central',
  }, p);
  const runs = [];
  let prev = '';
  for (const ch of str) {
    const sub = /[0-9]/.test(ch) && /[A-Za-z)]/.test(prev);
    if (runs.length && runs[runs.length - 1].sub === sub) runs[runs.length - 1].text += ch; else runs.push({ text: ch, sub });
    prev = ch;
  }
  runs.forEach((r, i) => {
    const before = i ? runs[i - 1].sub : false;
    const ts = X.el('tspan', { text: r.text }, t);
    if (r.sub) { ts.setAttribute('font-size', String(size * 0.66)); if (!before) ts.setAttribute('dy', String(size * 0.2)); }
    else if (before) ts.setAttribute('dy', String(-size * 0.2));
  });
  return t;
}

// ---------------------------------------------------------------- small illustrations
export function sun(X, p, x, y, r = 50, rays = 12) {
  const g = X.g(p, x, y);
  const rot = X.g(g, 0, 0);
  for (let i = 0; i < rays; i++) X.path(rot, `M0 ${-r - 14} L0 ${-r - 34}`, { stroke: '#ffb300', 'stroke-width': 8, transform: `rotate(${(i * 360) / rays})` });
  X.anim(rot, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], 0, 24, 'linear', { loop: true, origin: 'center' });
  X.circle(g, 0, 0, r, '#ffd54f', { stroke: '#ffb300', 'stroke-width': 5 });
  return g;
}

export function leafPlant(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.ellipse(k, 0, 6, 120, 18, '#9c6b3f');
  X.path(k, 'M0 0 Q-6 -120 0 -230', { stroke: '#3a8f4b', 'stroke-width': 14 });
  for (const [sx, sy, rot] of [[-64, -150, -25], [66, -178, 25], [-52, -92, -15], [50, -62, 15]]) {
    const l = X.g(k, sx, sy);
    X.ellipse(l, 0, 0, 82, 34, '#5cc46e', { transform: `rotate(${rot})`, stroke: '#3a8f4b', 'stroke-width': 4 });
    X.line(l, -70, 0, 70, 0, '#3a8f4b', 3, { transform: `rotate(${rot})`, opacity: 0.6 });
  }
  X.ellipse(k, 0, -246, 30, 46, '#7ad68a', { stroke: '#3a8f4b', 'stroke-width': 4 });
  return g;
}

/** atoms: 'C' dark, 'O' red, 'H' pale */
export function atom(X, p, x, y, el) {
  const spec = { C: ['#556079', 17], O: ['#e8604c', 16], H: ['#e6f0ff', 10] }[el];
  const g = X.g(p, x, y);
  X.circle(g, 0, 0, spec[1], spec[0], { stroke: el === 'H' ? '#9bb4d8' : 'rgba(0,0,0,.18)', 'stroke-width': 2.5 });
  return g;
}
export function mol(X, p, x, y, kind, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  if (kind === 'CO2') { X.line(k, -34, 0, 34, 0, '#556079', 6); atom(X, k, -34, 0, 'O'); atom(X, k, 0, 0, 'C'); atom(X, k, 34, 0, 'O'); }
  else if (kind === 'H2O') { X.line(k, 0, 0, -24, 20, '#9bb4d8', 5); X.line(k, 0, 0, 24, 20, '#9bb4d8', 5); atom(X, k, 0, 0, 'O'); atom(X, k, -24, 20, 'H'); atom(X, k, 24, 20, 'H'); }
  else if (kind === 'O2') { X.line(k, -14, -4, 14, -4, '#e8604c', 4); X.line(k, -14, 4, 14, 4, '#e8604c', 4); atom(X, k, -17, 0, 'O'); atom(X, k, 17, 0, 'O'); }
  else if (kind === 'sugar') {
    const pts = [...Array(6)].map((_, i) => [Math.cos((i * Math.PI) / 3 - Math.PI / 2) * 38, Math.sin((i * Math.PI) / 3 - Math.PI / 2) * 38]);
    X.path(k, 'M' + pts.map((q) => q.join(' ')).join(' L') + ' Z', { fill: '#ffd8a8', stroke: '#ff8a3d', 'stroke-width': 6, 'stroke-linejoin': 'round' });
    pts.forEach((q, i) => atom(X, k, q[0], q[1], i === 1 ? 'O' : 'C'));
  }
  return g;
}

export function rabbit(X, p, x, y, s = 1, fill = '#fff') {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.ellipse(k, 0, 0, 50, 36, fill, { stroke: '#c9d3e8', 'stroke-width': 3 });
  X.circle(k, 46, -22, 24, fill, { stroke: '#c9d3e8', 'stroke-width': 3 });
  X.ellipse(k, 40, -62, 8, 26, fill, { stroke: '#c9d3e8', 'stroke-width': 3, transform: 'rotate(-8 40 -62)' });
  X.ellipse(k, 56, -62, 8, 26, fill, { stroke: '#c9d3e8', 'stroke-width': 3, transform: 'rotate(10 56 -62)' });
  X.circle(k, 54, -26, 3.5, '#22304a'); X.circle(k, 69, -18, 3, '#f48fb1');
  X.circle(k, -48, 4, 12, fill, { stroke: '#c9d3e8', 'stroke-width': 3 });
  return g;
}

// ---------------------------------------------------------------- psychology illustrations
export function eye(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.path(k, 'M-110 0 Q0 -90 110 0 Q0 90 -110 0 Z', { fill: '#fff', stroke: '#22304a', 'stroke-width': 7, 'stroke-linejoin': 'round' });
  const iris = X.g(k, 0, 0);
  X.circle(iris, 0, 0, 46, '#4f9be8', { stroke: '#2f6fb8', 'stroke-width': 4 });
  X.circle(iris, 0, 0, 22, '#13203a');
  X.circle(iris, 14, -14, 9, '#fff');
  X.path(k, 'M-110 0 Q0 -90 110 0', { stroke: '#22304a', 'stroke-width': 9 });
  for (let i = 0; i < 5; i++) X.path(k, `M${-70 + i * 35} ${-48 + Math.abs(i - 2) * 9} l${(i - 2) * 6} -22`, { stroke: '#22304a', 'stroke-width': 6 });
  return { g, iris };
}

export function brain(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.path(k, 'M-100 10 Q-120 -50 -70 -72 Q-40 -105 0 -88 Q50 -110 85 -70 Q130 -45 108 5 Q122 50 70 62 Q50 90 10 76 Q-30 96 -62 66 Q-112 62 -100 10 Z', { fill: '#f7a8b8', stroke: '#d9708a', 'stroke-width': 7, 'stroke-linejoin': 'round' });
  for (const d of ['M-62 -40 Q-30 -62 0 -40', 'M10 -52 Q40 -30 70 -52', 'M-78 14 Q-40 -8 -10 18', 'M20 20 Q60 -4 92 22', 'M-50 52 Q-10 30 30 54']) X.path(k, d, { stroke: '#d9708a', 'stroke-width': 5 });
  return g;
}

export function dog(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.ellipse(k, -70, -20, 28, 56, '#6b4a2f', { transform: 'rotate(18 -70 -20)' });
  X.ellipse(k, 70, -20, 28, 56, '#6b4a2f', { transform: 'rotate(-18 70 -20)' });
  X.circle(k, 0, 0, 76, '#e2b77a', { stroke: '#b9884a', 'stroke-width': 5 });
  X.ellipse(k, 0, 26, 42, 32, '#f6dcb0');
  X.circle(k, -26, -12, 9, '#22304a'); X.circle(k, 26, -12, 9, '#22304a');
  X.ellipse(k, 0, 14, 15, 11, '#22304a');
  X.path(k, 'M0 25 L0 40 M-16 40 Q0 54 16 40', { stroke: '#22304a', 'stroke-width': 4 });
  X.ellipse(k, 0, 56, 10, 15, '#f4849c');
  return g;
}

export function camera(X, p, x, y, s = 1) {
  const g = X.g(p, x, y);
  const k = X.g(g, 0, 0);
  k.setAttribute('transform', `scale(${s})`);
  X.rect(k, -110, -62, 220, 130, '#5b6785', { rx: 22 });
  X.rect(k, -70, -88, 70, 34, '#46506b', { rx: 8 });
  X.circle(k, 0, 6, 54, '#2a3350', { stroke: '#8fa0c4', 'stroke-width': 8 });
  X.circle(k, 0, 6, 32, '#4f9be8'); X.circle(k, -10, -4, 9, 'rgba(255,255,255,.8)');
  X.circle(k, 82, -34, 9, '#ffd54f');
  return g;
}

/** Rubin's vase: half-widths of the vase at heights y=0..400; faces are the black parts on both sides */
export const VASE = [[0, 78], [25, 86], [55, 64], [90, 44], [115, 56], [135, 48], [160, 60], [185, 52], [215, 76], [250, 104], [290, 118], [330, 112], [360, 98], [400, 98]];
const smooth = () => {
  const out = [];
  for (let i = 0; i < VASE.length - 1; i++) {
    const [y0, h0] = VASE[i], [y1, h1] = VASE[i + 1];
    for (let k = 0; k < 8; k++) { const t = k / 8, e = (1 - Math.cos(Math.PI * t)) / 2; out.push([y0 + (y1 - y0) * t, h0 + (h1 - h0) * e]); }
  }
  out.push(VASE[VASE.length - 1]);
  return out;
};
export function vasePaths(w = 480) {
  const pts = smooth();
  const L = pts.map(([y, hw]) => `${(-hw).toFixed(1)} ${y.toFixed(1)}`), R = pts.map(([y, hw]) => `${hw.toFixed(1)} ${y.toFixed(1)}`);
  const vase = 'M' + L.join(' L') + ' L' + [...R].reverse().join(' L') + ' Z';
  const left = 'M' + L.join(' L') + ` L${-w / 2} 400 L${-w / 2} 0 Z`;
  const right = 'M' + R.join(' L') + ` L${w / 2} 400 L${w / 2} 0 Z`;
  return { vase, left, right };
}
