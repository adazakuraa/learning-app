import { C, chip, person, rice, sack, hut, coinStack, wave } from '../lib.js';

export function build(X) {
  const { E } = X;
  const bg = ['#fff4de', '#ffe3bf'];

  // =========================================================== scene 0 : timeline + the arrival of rice
  const s0 = X.sceneOf(0, 0, { bg });
  X.blobs(s0, ['#ffd9a0', '#ffc2a0', '#fde7b0'], 3);

  // ---- 0-0 title + timeline
  const title = X.g(s0.root, 640, 250);
  [...'弥生時代'].forEach((ch, i) => {
    const t = X.text(title, ch, { x: (i - 1.5) * 150, y: 0, size: 150, weight: 900, fill: C.ink });
    X.pop(t, 0.35 + i * 0.13, 0.7, 0.2);
  });
  const ul = X.rect(title, -300, 92, 600, 12, C.red, { rx: 6 });
  X.anim(ul, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 1.2, 0.8, E.out);
  const tl0 = X.g(s0.root, 0, 0);
  X.line(tl0, 180, 470, 1100, 470, '#d7bf98', 12);
  const bar = X.rect(tl0, 270, 458, 740, 24, C.red, { rx: 12 });
  X.anim(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 3.6, 2.6, E.inout, { origin: 'left center' });
  const m1 = X.g(tl0, 270, 470), m2 = X.g(tl0, 1010, 470);
  for (const [m, label] of [[m1, '紀元前3世紀ごろ'], [m2, '3世紀ごろ']]) {
    X.circle(m, 0, 0, 22, '#fff', { stroke: C.red, 'stroke-width': 8 });
    X.text(m, label, { y: 60, size: 34, fill: C.ink });
  }
  X.pop(m1, 2.6, 0.5);
  X.pop(m2, 5.9, 0.5);
  const dur600 = chip(X, tl0, 640, 400, '約600年間', C.red, '#fff', 30);
  X.pop(dur600, 6.1, 0.5);
  const jomon = chip(X, s0.root, 190, 110, '縄文時代', '#b9a98a', '#fff', 32);
  X.slide(jomon, 0.2, 0, 0, 0.5);
  X.move(jomon, [{ x: 0, o: 1 }, { x: -260, o: 0 }], 1.3, 1.0, E.in, { fill: 'forwards' });
  X.hide(title, 7.5, 0.5); X.hide(tl0, 7.5, 0.5);

  // ---- 0-1 rice arrives from the continent
  const map = X.g(s0.root, 0, 0);
  X.card(map, 70, 160, 1140, 450, '#c9ebfb', { r: 36 });
  for (let i = 0; i < 4; i++) { const w = wave(X, map, 380 + (i % 2) * 40, 230 + i * 105, 470, 8, 44); X.float(w, 16, 0, 3 + i * 0.4, i * 0.7); }
  // continent (left) and archipelago (right)
  X.path(map, 'M70 160 L330 160 Q380 240 340 330 Q380 420 330 520 Q350 570 300 610 L70 610 Z', { fill: '#b9dd8f' });
  X.path(map, 'M1210 190 L1090 190 Q1050 230 1080 280 Q1010 330 1040 390 Q990 430 1020 500 Q1050 560 1120 560 L1210 560 Z', { fill: '#b9dd8f' });
  X.path(map, 'M960 250 Q990 230 1010 262 Q990 300 960 285 Z', { fill: '#b9dd8f' });
  X.path(map, 'M900 470 Q935 440 960 470 Q950 520 915 520 Z', { fill: '#b9dd8f' });
  const cont = X.text(map, '中国・朝鮮半島', { x: 200, y: 215, size: 34, fill: '#3b6b2e' });
  const jp = X.text(map, '日本列島', { x: 1100, y: 235, size: 34, fill: '#3b6b2e' });
  X.rise(map, 8.15, 40, 0.7);
  const hd = X.text(s0.root, [['大陸', C.red], ['から ', C.ink], ['稲作', C.green], ['が伝わる', C.ink]], { x: 640, y: 92, size: 62 });
  X.rise(hd, 8.3, 24, 0.7);
  // rice on the continent
  const rc = X.g(map, 200, 400);
  rice(X, rc, -50, 40, 1.5); rice(X, rc, 30, 60, 1.5); rice(X, rc, -10, -10, 1.5);
  X.pop(rc, 11.0, 0.7, 0.2);
  const rl = chip(X, map, 205, 540, '稲作の技術', C.green, '#fff', 30);
  X.pop(rl, 11.3, 0.5);
  // boats
  const boat = (y, at) => {
    const g = X.g(map, 410, y);
    const b = X.g(g, 0, 0);
    const bs = X.g(b, 0, 0);
    bs.setAttribute('transform', 'scale(1.35)');
    X.path(bs, 'M-60 0 L60 0 L40 28 L-40 28 Z', { fill: C.wood, stroke: '#7a4a24', 'stroke-width': 3 });
    X.path(bs, 'M0 -2 L0 -78', { stroke: '#7a4a24', 'stroke-width': 4 });
    X.path(bs, 'M4 -76 L58 -22 L4 -22 Z', { fill: '#fff', stroke: C.red, 'stroke-width': 3 });
    person(X, bs, -30, 2, 0.55, C.orange);
    sack(X, bs, 20, 4, 0.8);
    X.float(b, 0, 7, 1.6, y / 90, 3);
    X.move(g, [{ x: 0, o: 0, offset: 0 }, { x: 0, o: 1, offset: 0.08 }, { x: 330, o: 1, offset: 0.9 }, { x: 440, o: 0, offset: 1 }], at, 4.8, E.inout);
    return g;
  };
  boat(330, 12.6); boat(440, 13.6);
  const tori = chip(X, map, 640, 560, '渡来人', C.orange, '#fff', 34);
  X.pop(tori, 12.3, 0.5);
  X.hide(tori, 17.5, 0.4);
  // rice sprouts in Japan
  for (const [x, y, d] of [[1100, 330, 0], [1060, 440, 0.4], [1130, 470, 0.8]]) {
    const r = X.g(map, x, y);
    rice(X, r, 0, 0, 1.3);
    X.pop(r, 17.0 + d, 0.7, 0.1);
  }
  const ok = chip(X, map, 1000, 560, '稲作スタート！', C.red, '#fff', 30);
  X.pop(ok, 17.8, 0.5);

  // =========================================================== scene 1 : how rice changed society
  const s1 = X.sceneOf(1, 1, { bg: ['#fff1dc', '#ffe0c0'] });
  X.blobs(s1, ['#ffd8a8', '#ffc7b0', '#fbe6b8'], 5);

  // ---- 1-0 paddies -> sacks -> granary
  const a0 = X.at(1, 0), a1 = X.at(1, 1), a2 = X.at(1, 2), a3 = X.at(1, 3), a4 = X.at(1, 4);
  const field = X.g(s1.root, 0, 0);
  X.card(field, 70, 200, 620, 380, '#9fd99c', { r: 30 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const g = X.g(field, 130 + c * 100 + (r % 2) * 20, 290 + r * 85);
    const green = X.g(g, 0, 0), gold = X.g(g, 0, 0);
    rice(X, green, 0, 0, 0.8); rice(X, gold, 0, 0, 0.8, C.gold, '#e0b84a');
    X.anim(green, [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], a0 + 0.5 + (r * 6 + c) * 0.07, 0.6, E.back, { origin: 'center bottom' });
    X.anim(gold, [{ opacity: 0 }, { opacity: 1 }], a0 + 3.5, 1.2, E.lin);
    X.anim(green, [{ opacity: 1 }, { opacity: 0 }], a0 + 3.5, 1.2, E.lin);
  }
  // granary (raised-floor storehouse)
  const gran = X.g(s1.root, 930, 380);
  X.rect(gran, -90, 30, 180, 12, '#8a5a30', { rx: 5 });
  for (const x of [-72, -24, 24, 72]) X.rect(gran, x - 6, 40, 12, 90, '#a8703c', { rx: 4 });
  X.rect(gran, -80, -40, 160, 72, '#f1d3a1', { rx: 6, stroke: '#b9784a', 'stroke-width': 4 });
  X.path(gran, 'M-110 -34 L0 -120 L110 -34 Z', { fill: '#c98a4b', stroke: '#9a6431', 'stroke-width': 4, 'stroke-linejoin': 'round' });
  X.rect(gran, -16, -18, 32, 50, '#7a5230', { rx: 4 });
  const gl = X.text(gran, '高床倉庫', { y: 170, size: 30, fill: C.soft });
  X.fade(field, a0 + 0.2, 0.5); X.fade(gran, a0 + 0.2, 0.5);
  // sacks fly from field to granary
  for (let i = 0; i < 7; i++) {
    const g = X.g(s1.root, 620, 520);
    const k = sack(X, g, 0, 0, 0.9);
    const dx = 310 - (i % 3) * 16, dy = -170 - (i % 2) * 14 + 0;
    X.anim(k, [
      { transform: 'translate(0px,0px) scale(0.2)', opacity: 0, offset: 0 },
      { transform: 'translate(0px,0px) scale(1)', opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.5}px, ${dy - 90}px) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.8)`, opacity: 0, offset: 1 },
    ], a0 + 4.7 + i * 0.45, 1.3, E.inout);
  }
  const pile = X.g(gran, 0, 0);
  for (let i = 0; i < 6; i++) {
    const sg = X.g(pile, -50 + (i % 3) * 50, 26 - Math.floor(i / 3) * 26);
    sack(X, sg, 0, 0, 0.55);
    X.pop(sg, a0 + 5.6 + i * 0.5, 0.35, 0.1);
  }
  const keep = chip(X, s1.root, 930, 120, '長く保存できる！', C.green, '#fff', 34);
  X.pop(keep, a0 + 4.2, 0.55);
  const tak = chip(X, s1.root, 380, 130, '食べ物をたくわえる', C.red, '#fff', 38);
  X.pop(tak, a0 + 7.0, 0.55);

  // ---- 1-1 chief & workers (social classes)
  X.hide(field, a1 - 0.2, 0.5); X.hide(keep, a1 - 0.2, 0.4); X.hide(tak, a1 - 0.2, 0.4);
  X.move(gran, [{ x: 0, y: 0, s: 1 }, { x: -710, y: -10, s: 0.62 }], a1 - 0.1, 0.9, E.inout);
  const soc = X.g(s1.root, 0, 0);
  X.rect(soc, 330, 340, 760, 18, '#e8c887', { rx: 9 });             // dividing floor
  const top = X.g(soc, 0, 0), bottom = X.g(soc, 0, 0);
  X.rect(top, 560, 262, 300, 78, '#f6c46a', { rx: 14, stroke: '#c98d12', 'stroke-width': 4 });
  person(X, top, 710, 266, 1.45, C.red, 'chief');
  const fan = chip(X, top, 970, 285, '働かない', '#fff', C.red, 28);
  for (let i = 0; i < 4; i++) {
    const w = person(X, bottom, 460 + i * 160, 505, 1.25, C.blue, 'worker');
    X.float(w, 0, 5, 1.1 + i * 0.12, i * 0.3, 2);
    const s = sack(X, bottom, 460 + i * 160 + 38, 502, 0.7);
    X.float(s, 0, 5, 1.1 + i * 0.12, i * 0.3, 2);
  }
  for (let i = 0; i < 4; i++) rice(X, bottom, 400 + i * 160, 548, 0.5);
  X.fade(soc, a1 + 1.6, 0.5);
  X.rise(top, a1 + 2.3, 30, 0.7);
  X.pop(fan, a1 + 3.8, 0.5);
  X.rise(bottom, a1 + 2.0, 20, 0.6);
  const up = chip(X, soc, 400, 270, '支配する人', C.red, '#fff', 36);
  const down = chip(X, soc, 1000, 590, '支配される人', C.blue, '#fff', 36);
  X.pop(up, a1 + 6.0, 0.5); X.pop(down, a1 + 6.9, 0.5);
  const stamp = chip(X, s1.root, 640, 150, '身分の差', C.ink, '#fff', 54);
  X.anim(stamp, [{ opacity: 0, transform: 'scale(2.6) rotate(-8deg)' }, { opacity: 1, transform: 'scale(1) rotate(-4deg)' }], a1 + 9.1, 0.45, E.back);
  X.hide(soc, a2 - 0.2, 0.5); X.hide(stamp, a2 - 0.2, 0.4); X.hide(gran, a2 - 0.2, 0.4);

  // ---- 1-2 villages fight over land / water / stores
  const war = X.g(s1.root, 0, 0);
  const village = (x, color) => {
    const g = X.g(war, x, 420);
    X.ellipse(g, 0, 40, 150, 70, 'rgba(160,110,60,.18)', { stroke: '#8a5a30', 'stroke-width': 5, 'stroke-dasharray': '10 8' });
    hut(X, g, -60, 70, 1.0, color); hut(X, g, 50, 80, 1.1, color); hut(X, g, 0, 20, 0.9, color);
    X.rect(g, 100, -30, 10, 70, '#8a5a30'); X.rect(g, 88, -48, 34, 22, '#c98a4b', { rx: 3 });
    return g;
  };
  const vl = village(230, '#d5694f'), vr = village(1050, '#4f86d5');
  X.rise(war, a2 + 0.1, 0, 0.5);
  X.pop(vl, a2 + 0.2, 0.6, 0.6); X.pop(vr, a2 + 0.5, 0.6, 0.6);
  X.text(war, 'ムラ', { x: 230, y: 330, size: 34, fill: '#d5694f' });
  X.text(war, 'ムラ', { x: 1050, y: 330, size: 34, fill: '#4f86d5' });
  const prize = X.g(war, 640, 250);
  const items = [['土地', -120, '#9fd99c'], ['水', 0, '#7cc4f2'], ['たくわえ', 120, '#f0d28a']];
  items.forEach(([label, dx, col], i) => {
    const it = X.g(prize, dx, 0);
    X.circle(it, 0, 0, 52, col, { stroke: '#fff', 'stroke-width': 6 });
    if (i === 1) X.path(it, 'M0 -26 Q22 4 0 22 Q-22 4 0 -26 Z', { fill: '#fff' });
    else if (i === 0) { X.rect(it, -26, -6, 52, 26, '#6cbc6a', { rx: 4 }); for (const x of [-14, 0, 14]) X.path(it, `M${x} 2 q0 -14 6 -20`, { stroke: '#2f7d32', 'stroke-width': 3 }); }
    else sack(X, it, 0, 24, 1.1);
    X.text(it, label, { y: 80, size: 28, fill: C.ink });
    X.pop(it, a2 + 1.2 + i * 0.7, 0.5);
    X.pulse(it, a2 + 3.8 + i * 0.25, 1.2, 0.5);
  });
  const arrowL = X.line(war, 380, 430, 560, 430, '#d5694f', 12); const arrowR = X.line(war, 900, 430, 720, 430, '#4f86d5', 12);
  X.draw(arrowL, a2 + 4.8, 0.6); X.draw(arrowR, a2 + 4.8, 0.6);
  const clash = X.g(war, 640, 430);
  const star = X.path(clash, 'M0 -60 L14 -20 L56 -30 L26 0 L52 36 L10 24 L0 66 L-14 24 L-52 36 L-26 0 L-56 -30 L-14 -20 Z', { fill: C.gold, stroke: C.red, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  X.anim(clash, [{ opacity: 0, transform: 'scale(0) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1.1) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(8deg)' }], a2 + 5.5, 0.8, E.back);
  const trace = chip(X, s1.root, 640, 575, '戦争のあとが、この時代から', C.red, '#fff', 36);
  X.pop(trace, a2 + 7.0, 0.55);
  X.hide(war, a3 - 0.2, 0.5); X.hide(trace, a3 - 0.2, 0.4);

  // ---- 1-3 wealth and conflict come as a set (balance)
  const bal = X.g(s1.root, 640, 300);
  X.path(bal, 'M0 -10 L0 240', { stroke: '#8a5a30', 'stroke-width': 14 });
  X.rect(bal, -90, 234, 180, 18, '#8a5a30', { rx: 8 });
  const beam = X.g(bal, 0, -10);
  X.line(beam, -230, 0, 230, 0, '#c98a4b', 14);
  const panL = X.g(beam, -230, 0), panR = X.g(beam, 230, 0);
  for (const [pan, col] of [[panL, '#f0c75e'], [panR, '#e47a6a']]) {
    X.line(pan, 0, 0, -70, 110, '#8a5a30', 4); X.line(pan, 0, 0, 70, 110, '#8a5a30', 4);
    X.path(pan, 'M-90 110 L90 110 Q80 150 0 150 Q-80 150 -90 110 Z', { fill: col, stroke: '#8a5a30', 'stroke-width': 4 });
  }
  for (let i = 0; i < 3; i++) sack(X, panL, -50 + i * 50, 108, 0.75);
  X.path(panR, 'M-40 100 L40 20 M30 20 L40 20 L40 30', { stroke: C.ink, 'stroke-width': 7 });
  X.path(panR, 'M-10 105 L50 105', { stroke: C.ink, 'stroke-width': 7 });
  X.path(panR, 'M-60 100 L-4 44 L4 52 L-52 108 Z', { fill: '#a9b3c4', stroke: C.ink, 'stroke-width': 3 });
  X.rise(bal, a3 + 0.1, 40, 0.6);
  X.anim(beam, [{ transform: 'rotate(-10deg)' }, { transform: 'rotate(8deg)', offset: 0.35 }, { transform: 'rotate(-4deg)', offset: 0.65 }, { transform: 'rotate(0deg)' }], a3 + 0.5, 2.2, E.out, { origin: 'center' });
  for (const p of [panL, panR]) X.anim(p, [{ transform: 'rotate(10deg)' }, { transform: 'rotate(-8deg)', offset: 0.35 }, { transform: 'rotate(4deg)', offset: 0.65 }, { transform: 'rotate(0deg)' }], a3 + 0.5, 2.2, E.out, { origin: 'center top' });
  const lab1 = chip(X, s1.root, 410, 180, '豊かになる', '#e8a722', '#fff', 36), lab2 = chip(X, s1.root, 870, 180, '争いが生まれる', C.red, '#fff', 36);
  X.pop(lab1, a3 + 0.6, 0.5); X.pop(lab2, a3 + 1.1, 0.5);
  const set = chip(X, s1.root, 640, 560, 'セット！', C.ink, '#fff', 56);
  X.anim(set, [{ opacity: 0, transform: 'scale(2.4) rotate(-10deg)' }, { opacity: 1, transform: 'scale(1) rotate(-3deg)' }], a3 + 2.7, 0.5, E.back);
  X.hide(bal, a4 - 0.2, 0.5); X.hide(lab1, a4 - 0.2, 0.4); X.hide(lab2, a4 - 0.2, 0.4); X.hide(set, a4 - 0.2, 0.4);

  // ---- 1-4 same issues today
  const now = X.g(s1.root, 0, 0);
  const oldH = X.g(now, 200, 300); hut(X, oldH, 0, 60, 1.7);
  X.text(oldH, '弥生', { y: 110, size: 34, fill: C.soft });
  // modern skyline
  const sky = X.g(now, 920, 300);
  [[-130, 120, 70, '#7aa7e8'], [-60, 190, 80, '#5b8fdc'], [30, 150, 70, '#8bb6f0'], [100, 100, 60, '#6aa0e6']].forEach(([x, h, w, col]) => {
    X.rect(sky, x, 60 - h, w, h, col, { rx: 6 });
    for (let r = 0; r < Math.floor(h / 28); r++) for (let c = 0; c < 2; c++) X.rect(sky, x + 14 + c * 26, 60 - h + 14 + r * 28, 14, 14, 'rgba(255,255,255,.8)', { rx: 3 });
  });
  X.text(sky, '現代', { y: 110, size: 34, fill: C.soft });
  const arr = X.path(now, 'M330 290 L740 290 M712 266 L744 290 L712 314', { stroke: C.red, 'stroke-width': 12 }); X.draw(arr, a4 + 0.3, 1.2);
  const yrs = chip(X, now, 545, 235, '約2000年', C.red, '#fff', 32); X.pop(yrs, a4 + 1.0, 0.5);
  X.fade(now, a4 + 0.1, 0.5);
  // inequality coins
  const rich = coinStack(X, now, 470, 590, 9, 1.0), poor = coinStack(X, now, 790, 590, 2, 1.0);
  rich.coins.forEach((c, i) => X.anim(c, [{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], a4 + 3.3 + i * 0.18, 0.4, E.back));
  poor.coins.forEach((c, i) => X.anim(c, [{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], a4 + 3.3 + i * 0.18, 0.4, E.back));
  const gap = chip(X, now, 630, 470, '格差', C.red, '#fff', 44); X.pop(gap, a4 + 5.2, 0.5);
  const grab = chip(X, now, 630, 545, '奪い合い', C.orange, '#fff', 36); X.pop(grab, a4 + 6.2, 0.5);
}
