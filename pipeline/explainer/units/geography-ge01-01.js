import { C, chip, globe, project, train, plane, sack } from '../lib.js';

const ease = (p) => p * p * p * (p * (p * 6 - 15) + 10);          // smootherstep
/** orientation keyframes [{t, lon, lat}] -> (t) => [lon, lat], shortest way round in longitude */
const orbit = (keys) => (t) => {
  if (t <= keys[0].t) return [keys[0].lon, keys[0].lat];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) {
      const p = ease((t - a.t) / (b.t - a.t));
      let d = ((b.lon - a.lon + 540) % 360) - 180;
      return [a.lon + d * p, a.lat + (b.lat - a.lat) * p];
    }
  }
  const l = keys[keys.length - 1];
  return [l.lon, l.lat];
};

export function build(X) {
  const { E } = X;
  const INK = C.ink;

  // =========================================================== scene 0 : opening
  const s0 = X.sceneOf(0, 0, { bg: ['#e4f4ff', '#cde8ff'] });
  X.blobs(s0, ['#bfe0ff', '#fff0c2', '#d9f2e3'], 41);
  const G0 = globe(X, s0.root, 330, 345, 200);
  X.pop(G0.root, 0.2, 0.8, 0.5);
  X.tick(0, X.range(0).end, (p) => G0.update(100 + p * X.range(0).end * 15, 20));
  const a0 = X.at(0, 0), a1 = X.at(0, 1), a2 = X.at(0, 2);
  const head = X.g(s0.root, 0, 0);
  const ch1 = chip(X, head, 890, 95, '第1章', '#2f86d4', '#fff', 30);
  const ttl = X.text(head, '地図と地球の基礎', { x: 890, y: 185, size: 60, fill: INK });
  X.pop(ch1, a0 + 0.3, 0.5); X.pop(ttl, a0 + 0.6, 0.7, 0.6);
  const topics = ['地球の大きさ', '緯度と経度', '時差', '地図の読み方'];
  const cols = ['#ff8a3d', '#2aa6a0', '#8a6fe0', '#e8604c'];
  const tg = X.g(s0.root, 0, 0);
  topics.forEach((t, i) => {
    const c = chip(X, tg, 890, 300 + i * 82, t, cols[i], '#fff', 38, { w: 360 });
    X.pop(c, a1 + 0.4 + i * 1.35, 0.5, 0.4);
  });
  X.hide(head, a2 - 0.2, 0.4); X.hide(tg, a2 - 0.2, 0.4);
  // daily-life cards
  const card = (y, label, draw, at, col) => {
    const g = X.g(s0.root, 660, y);
    X.card(g, 0, 0, 570, 124, '#fff', { r: 28 });
    X.circle(g, 62, 62, 46, col);
    draw(g);
    X.text(g, label, { x: 330, y: 62, size: 42, fill: INK });
    X.slide(g, at, 90, 0, 0.7);
    return g;
  };
  card(110, '海外旅行の時差', (g) => {
    plane(X, g, 60, 56, 0.5, '#fff');
    const ck = X.g(g, 112, 94);
    X.circle(ck, 0, 0, 17, '#fff', { stroke: INK, 'stroke-width': 3 }); X.line(ck, 0, 0, 0, -10, INK, 3); X.line(ck, 0, 0, 7, 3, '#e8604c', 3);
  }, a2 + 0.5, '#ff8a3d');
  card(262, '天気予報の地図', (g) => {
    X.circle(g, 52, 50, 15, '#ffd54f');
    X.path(g, 'M44 78 Q40 64 54 64 Q58 52 72 58 Q86 56 84 72 Q88 80 78 82 L50 82 Q42 84 44 78 Z', { fill: '#fff', stroke: '#9fb4d8', 'stroke-width': 2 });
  }, a2 + 2.8, '#2f86d4');
  card(414, 'ニュースの国の場所', (g) => {
    X.path(g, 'M62 82 Q40 56 40 46 Q40 26 62 26 Q84 26 84 46 Q84 56 62 82 Z', { fill: '#fff' });
    X.circle(g, 62, 46, 9, '#e8604c');
  }, a2 + 4.8, '#e8604c');
  const fin = chip(X, s0.root, 940, 585, '世界が、ぐっと身近に！', '#2aa6a0', '#fff', 40);
  X.pop(fin, a2 + 7.6, 0.6);

  // =========================================================== scene 1 : size of the Earth
  const s1 = X.sceneOf(1, 1, { bg: ['#e8f7ff', '#d2ebff'] });
  X.blobs(s1, ['#c3e3ff', '#ffe9b8', '#d8f1e4'], 43);
  const b0 = X.at(1, 0), b1 = X.at(1, 1);
  const G1 = globe(X, s1.root, 410, 335, 210);
  X.tick(X.range(1).start, X.range(1).end - X.range(1).start, (p) => G1.update(95 + p * 45, 18));
  X.pop(G1.root, b0 + 0.1, 0.7, 0.5);
  // equator ring (front half, drawn progressively)
  const ring = X.path(G1.extra, '', { stroke: '#ffd23f', 'stroke-width': 9 });
  X.tick(b0 + 1.2, 4.5, (p) => {
    const lo0 = G1.lon0, pts = [];
    for (let a = -90; a <= -90 + 180 * p; a += 3) pts.push([lo0 + a, 0]);
    ring.setAttribute('d', G1.lineD(pts));
  }, E.inout);
  const around = chip(X, s1.root, 900, 125, 'ぐるっと一周', '#ff8a3d', '#fff', 40); X.pop(around, b0 + 1.4, 0.5);
  const big = X.text(s1.root, '0', { x: 1090, y: 245, size: 112, fill: INK, anchor: 'end' });
  X.fade(big, b0 + 1.4, 0.3);
  X.count(big, b0 + 1.6, 4.2, 0, 40000, (v) => `${Math.round(v / 100) * 100 > 39999 ? '40,000' : Math.round(v).toLocaleString('en-US')}`);
  const km = X.text(s1.root, 'km', { x: 1105, y: 270, size: 46, fill: C.soft, anchor: 'start' }); X.fade(km, b0 + 1.6, 0.3);
  // radius
  const rad = X.line(s1.root, 410, 335, 620, 335, '#e8604c', 8, { 'stroke-dasharray': '2 14' });
  X.draw(rad, b0 + 6.2, 0.9);
  X.circle(s1.root, 410, 335, 9, '#e8604c').style.opacity = 0;
  const rch = chip(X, s1.root, 900, 395, '半径', '#e8604c', '#fff', 38); X.pop(rch, b0 + 6.4, 0.5);
  const rv = X.text(s1.root, '0', { x: 1090, y: 490, size: 100, fill: INK, anchor: 'end' }); X.fade(rv, b0 + 6.8, 0.3);
  X.count(rv, b0 + 6.9, 3.0, 0, 6400, (v) => v >= 6399 ? '6,400' : Math.round(v / 10) * 10 === 0 ? '0' : (Math.round(v / 10) * 10).toLocaleString('en-US'));
  const rk = X.text(s1.root, 'km', { x: 1105, y: 515, size: 46, fill: C.soft, anchor: 'start' }); X.fade(rk, b0 + 6.9, 0.3);
  X.hide(around, b1 - 0.2, 0.4); X.hide(big, b1 - 0.2, 0.4); X.hide(km, b1 - 0.2, 0.4);
  X.hide(rad, b1 - 0.2, 0.4); X.hide(rch, b1 - 0.2, 0.4); X.hide(rv, b1 - 0.2, 0.4); X.hide(rk, b1 - 0.2, 0.4); X.hide(ring, b1 - 0.2, 0.3);
  X.move(G1.root, [{ x: 0, y: 0, s: 1 }, { x: -300, y: -190, s: 0.4 }], b1 - 0.1, 1.0, E.inout, { fill: 'forwards' });
  // 40,000 km = Tokyo-Osaka x 80
  const eqT = chip(X, s1.root, 760, 120, '40,000 km ＝', '#2f86d4', '#fff', 40); X.pop(eqT, b1 + 0.5, 0.5);
  const cnt = X.text(s1.root, '', { x: 640, y: 250, size: 96, fill: INK });
  X.fade(cnt, b1 + 1.3, 0.3);
  const trackY = 400, tx0 = 100, tx1 = 1180, segs = 80;
  const trackBar = X.rect(s1.root, tx0 - 8, trackY - 6, tx1 - tx0 + 16, 40, '#fff', { rx: 18 });
  X.fade(trackBar, b1 + 0.8, 0.4);
  const segEls = [];
  for (let i = 0; i < segs; i++) segEls.push(X.rect(s1.root, tx0 + (i * (tx1 - tx0)) / segs, trackY, (tx1 - tx0) / segs - 1.5, 28, i % 2 ? '#ff8a3d' : '#ffb36b', { opacity: 0 }));
  const tr = train(X, s1.root, tx0, trackY - 24, 0.78);
  X.fade(tr, b1 + 1.0, 0.3);
  X.tick(b1 + 1.6, 5.2, (p) => {
    const k = Math.round(p * segs);
    segEls.forEach((s, i) => s.setAttribute('opacity', i < k ? 1 : 0));
    tr.setAttribute('transform', `translate(${p * (tx1 - tx0 - 190)} 0)`);
    cnt.textContent = `東京〜大阪 × ${k}`;
  }, E.inout);
  const sub = X.text(s1.root, '', { x: 640, y: 480, size: 36, fill: C.soft });
  const wk = chip(X, s1.root, 640, 472, '新幹線で走り続けても…', '#8a6fe0', '#fff', 36); X.pop(wk, b1 + 6.0, 0.5);
  const days = [];
  for (let i = 0; i < 8; i++) {
    const g = X.g(s1.root, 184 + i * 116, 520);
    const last = i === 7;
    X.card(g, 0, 0, 100, 76, last ? '#ff8a3d' : '#fff', { r: 16 });
    X.text(g, last ? '＋' : `${i + 1}日`, { x: 50, y: 38, size: last ? 50 : 32, fill: last ? '#fff' : INK });
    X.pop(g, b1 + 6.6 + i * 0.42, 0.4, 0.3);
    days.push(g);
  }

  // =========================================================== scene 2 : sea & land
  const s2 = X.sceneOf(2, 2, { bg: ['#e6f6ff', '#d4ecff'] });
  X.blobs(s2, ['#c5e4ff', '#ffecc2', '#dcf3e5'], 47);
  const c0 = X.at(2, 0), c1 = X.at(2, 1);
  const G2 = globe(X, s2.root, 330, 335, 195);
  X.pop(G2.root, 0.2, 0.01, 1);
  const names = { eurasia: ['ユーラシア', '#f5a623', 'eurasia', 85, 38, 5500], africa: ['アフリカ', '#e8604c', 'africa', 20, 5, 3000], na: ['北アメリカ', '#9b6fe0', 'northAmerica', -100, 42, 2400], sa: ['南アメリカ', '#2aa6a0', 'southAmerica', -60, -15, 1800], ant: ['南極', '#b8c8e6', 'antarctica', 0, -62, 1400], aus: ['オーストラリア', '#f06fa0', 'australia', 135, -25, 850] };
  const groups = { eurasia: ['eurasia', 'japan', 'britain', 'borneo', 'sumatra'], africa: ['africa', 'madagascar'], na: ['northAmerica', 'greenland'], sa: ['southAmerica'], ant: ['antarctica'], aus: ['australia', 'newzealand'] };
  const order = ['eurasia', 'africa', 'na', 'sa', 'ant', 'aus'];
  const contT = (i) => c0 + 10.5 + i * 1.32;
  const oc = [['太平洋', 200, 10, 16500, '#1e6fd0'], ['大西洋', -30, 15, 10600, '#2f9be8'], ['インド洋', 80, -15, 7400, '#37b6e0']];
  const ocT = (i) => c1 + 0.4 + i * 2.2;
  const keys = [{ t: 0, lon: 120, lat: 20 }, { t: c0 + 8.5, lon: 150, lat: 15 }];
  order.forEach((k, i) => { const [, , , lon, lat] = names[k]; keys.push({ t: contT(i) + 0.15, lon, lat }); keys.push({ t: contT(i) + 1.2, lon, lat }); });
  keys.push({ t: c1 - 0.2, lon: names.aus[3], lat: names.aus[4] });
  oc.forEach(([, lon, lat], i) => { keys.push({ t: ocT(i) + 0.4, lon, lat }); keys.push({ t: ocT(i) + 1.9, lon, lat }); });
  keys.sort((a, b) => a.t - b.t);
  const ori = orbit(keys);
  const sc2 = X.range(2);
  X.tick(sc2.start, sc2.end - sc2.start, (p) => { const t = sc2.start + p * (sc2.end - sc2.start); const [lo, la] = ori(t); G2.update(lo, la); order.forEach((k) => { const on = t >= contT(order.indexOf(k)) + 0.2; groups[k].forEach((n) => G2.land[n].setAttribute('fill', on ? names[k][1] : '#79c76f')); }); });
  // donut: sea 70% / land 30%
  const DX = 905, DY = 190, R0 = 78, CIRC = 2 * Math.PI * R0;
  const don = X.g(s2.root, DX, DY);
  X.circle(don, 0, 0, R0, 'none', { stroke: 'rgba(120,140,170,.18)', 'stroke-width': 36 });
  const sea = X.circle(don, 0, 0, R0, 'none', { stroke: '#2f86d4', 'stroke-width': 36, transform: 'rotate(-90)' });
  const lnd = X.circle(don, 0, 0, R0, 'none', { stroke: '#4cae6a', 'stroke-width': 36, transform: 'rotate(-90)' });
  X.tick(c0 + 0.8, 1.8, (p) => sea.setAttribute('stroke-dasharray', `${CIRC * 0.7 * p} ${CIRC}`), E.out);
  X.tick(c0 + 3.4, 1.4, (p) => { lnd.setAttribute('stroke-dasharray', `${CIRC * 0.3 * p} ${CIRC}`); lnd.setAttribute('transform', `rotate(${-90 + 252})`); }, E.out);
  X.fade(don, c0 + 0.6, 0.4);
  X.text(don, '7 : 3', { y: 0, size: 44, fill: INK });
  const seaC = chip(X, s2.root, 1110, 150, '海　約7割', '#2f86d4', '#fff', 34); X.pop(seaC, c0 + 1.8, 0.5);
  const landC = chip(X, s2.root, 1110, 235, '陸　約3割', '#4cae6a', '#fff', 34); X.pop(landC, c0 + 3.6, 0.5);
  // continent bars (sizes in 万 km²)
  const list = X.g(s2.root, 0, 0);
  const unit = 270 / 5500;
  order.forEach((k, i) => {
    const [label, col, , , , v] = names[k];
    const g = X.g(list, 560, 335 + i * 46);
    X.text(g, label, { x: 0, y: 0, size: 27, fill: INK, anchor: 'start' });
    const bar = X.rect(g, 215, -14, Math.max(30, v * unit), 28, col, { rx: 14 });
    X.anim(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], contT(i), 0.7, E.out, { origin: 'left center' });
    const vt = X.text(g, `約${v.toLocaleString('en-US')}万km²`, { x: 215 + Math.max(30, v * unit) + 10, y: 0, size: 22, fill: C.soft, anchor: 'start' });
    X.fade(vt, contT(i) + 0.5, 0.3);
    X.fade(g, contT(i) - 0.05, 0.2);
  });
  const big6 = chip(X, s2.root, 905, 300, '陸地は6つの大陸', '#4cae6a', '#fff', 30); X.pop(big6, c0 + 8.8, 0.5); X.hide(big6, contT(0) + 0.2, 0.3);
  X.hide(list, c1 - 0.2, 0.4); X.hide(don, c1 - 0.2, 0.4); X.hide(seaC, c1 - 0.2, 0.4); X.hide(landC, c1 - 0.2, 0.4);
  // oceans
  const olist = X.g(s2.root, 0, 0);
  const ounit = 240 / 16500;
  oc.forEach(([label, , , v, col], i) => {
    const g = X.g(olist, 620, 250 + i * 90);
    X.text(g, label, { x: 0, y: 0, size: 38, fill: INK, anchor: 'start' });
    const w = v * ounit;
    const bar = X.rect(g, 190, -20, w, 40, col, { rx: 20 });
    X.anim(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], ocT(i), 0.8, E.out, { origin: 'left center' });
    const vt = X.text(g, `約${(v / 100).toFixed(v >= 10000 ? 0 : 0)}${''}`.replace(/.*/, `約${(v / 10000).toFixed(1)}億km²`), { x: 190 + w + 12, y: 0, size: 24, fill: C.soft, anchor: 'start' });
    X.fade(vt, ocT(i) + 0.6, 0.3);
    X.fade(g, ocT(i) - 0.05, 0.2);
    const lab = chip(X, s2.root, 330, 335, label, col, '#fff', 40, { w: 220 });
    X.pop(lab, ocT(i) + 0.9, 0.45); X.hide(lab, ocT(i) + 2.0, 0.3);
  });
  const three = chip(X, s2.root, 900, 575, '3つの大洋', '#1e6fd0', '#fff', 38); X.pop(three, c1 + 0.2, 0.5);
}
