import { C, chip, person, chemText, sun, leafPlant, mol, atom, rabbit } from '../lib.js';

export function build(X) {
  const { E } = X;
  const INK = C.ink, GREEN = '#3fae5a';
  const bg = ['#eefaf0', '#d6f1dc'];

  // =========================================================== scene 0 : the chapter
  const s0 = X.sceneOf(0, 0, { bg });
  X.blobs(s0, ['#c9ecd0', '#fff0b8', '#cfe9ff'], 51);
  const a0 = X.at(0, 0), a1 = X.at(0, 1), a2 = X.at(0, 2);
  const t0 = X.text(s0.root, [['生命活動', GREEN], ['と', INK], ['エネルギー', '#ff8a3d']], { x: 600, y: 130, size: 78 });
  X.pop(t0, a0 + 0.3, 0.8, 0.5);
  const sunS = sun(X, s0.root, 1160, 110, 44); X.pop(sunS, a0 + 0.8, 0.7, 0.3);
  const chA = chip(X, s0.root, 460, 255, '光合成', GREEN, '#fff', 48, { w: 250 }); X.pop(chA, a1 + 2.2, 0.6);
  const chB = chip(X, s0.root, 820, 255, '呼吸', '#ff8a3d', '#fff', 48, { w: 250 }); X.pop(chB, a1 + 4.3, 0.6);
  // energy cycle: sun -> plant -> animal -> energy
  const cyc = X.g(s0.root, 0, 0);
  const sunC = sun(X, cyc, 170, 460, 46);
  const plantC = leafPlant(X, cyc, 460, 600, 0.9);
  const rab = rabbit(X, cyc, 800, 520, 1.5);
  X.float(rab, 0, 6, 1.4, 0, 2);
  const bolt = X.g(cyc, 1090, 470);
  X.path(bolt, 'M10 -70 L-34 8 L-4 8 L-14 70 L36 -12 L4 -12 Z', { fill: '#ffd23f', stroke: '#e0a000', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  const arr = (x1, y1, x2, y2, col, at, label, lx, ly) => {
    const g = X.g(cyc, 0, 0);
    X.path(g, `M${x1} ${y1} L${x2} ${y2}`, { stroke: col, 'stroke-width': 9, 'stroke-dasharray': '2 16' });
    const a = Math.atan2(y2 - y1, x2 - x1);
    X.path(g, `M${x2 - 26 * Math.cos(a - 0.5)} ${y2 - 26 * Math.sin(a - 0.5)} L${x2} ${y2} L${x2 - 26 * Math.cos(a + 0.5)} ${y2 - 26 * Math.sin(a + 0.5)}`, { stroke: col, 'stroke-width': 9 });
    X.draw(g.firstChild, at, 0.7);
    X.fade(g.lastChild, at + 0.5, 0.3);
    const c = chip(X, cyc, lx, ly, label, col, '#fff', 32); X.pop(c, at + 0.4, 0.5);
  };
  X.pop(sunC, a2 + 0.3, 0.6, 0.3); X.pop(plantC, a2 + 0.6, 0.7, 0.3);
  arr(240, 450, 380, 440, '#ffb300', a2 + 1.4, '光', 310, 390);
  X.pop(rab, a2 + 3.6, 0.7, 0.3);
  arr(560, 470, 720, 490, GREEN, a2 + 4.2, '栄養（食べる）', 640, 410);
  X.pop(bolt, a2 + 6.6, 0.7, 0.3);
  arr(900, 480, 1020, 470, '#ff8a3d', a2 + 7.0, '呼吸', 960, 405);
  const loop = chip(X, s0.root, 640, 580, '地球全体のエネルギーのめぐり', '#2aa6a0', '#fff', 36); X.pop(loop, a2 + 8.6, 0.6);

  // =========================================================== scene 1 : photosynthesis
  const s1 = X.sceneOf(1, 1, { bg: ['#ecf9ee', '#d4efd9'] });
  X.blobs(s1, ['#c9ecd0', '#fff0b8', '#cfe9ff'], 53);
  const b0 = X.at(1, 0), b1 = X.at(1, 1);
  const stage = X.g(s1.root, 0, 0);
  const plant = leafPlant(X, stage, 640, 570, 1.0); X.pop(plant, b0 + 0.2, 0.8, 0.5);
  const who = ['植物', '藻', '細菌'];
  who.forEach((w, i) => { const c = chip(X, stage, 470 + i * 170, 70, w, GREEN, '#fff', 34); X.pop(c, b0 + 1.0 + i * 0.8, 0.5); });
  const sn = sun(X, stage, 150, 190, 54); X.pop(sn, b0 + 4.2, 0.7, 0.3);
  for (let i = 0; i < 3; i++) {
    const ray = X.line(stage, 215, 215 + i * 20, 560, 330 + i * 40, '#ffc933', 10, { 'stroke-dasharray': '1 22' });
    X.draw(ray, b0 + 4.8 + i * 0.25, 0.8);
    X.anim(ray, [{ strokeDashoffset: 0 }, { strokeDashoffset: -46 }], b0 + 5.5, 2, 'linear', { loop: true, fill: 'none' });
  }
  const lg = chip(X, stage, 150, 280, '光のエネルギー', '#ffb300', '#fff', 28); X.pop(lg, b0 + 5.0, 0.5);
  // CO2 flying in, H2O flying up, sugar + O2 flying out
  const fly = (kind, x1, y1, x2, y2, at, dur = 1.5, s = 1.1) => {
    const g = mol(X, stage, x1, y1, kind, s);
    X.move(g, [{ x: 0, y: 0, s: 0.6, o: 0, offset: 0 }, { x: 0, y: 0, s: 1, o: 1, offset: 0.12 }, { x: x2 - x1, y: y2 - y1, s: 1, o: 1, offset: 0.85 }, { x: x2 - x1, y: y2 - y1, s: 0.4, o: 0, offset: 1 }], at, dur, E.inout);
    return g;
  };
  const coL = chip(X, stage, 130, 450, '二酸化炭素', '#6b7a99', '#fff', 30); X.pop(coL, b0 + 6.6, 0.5);
  chemText(X, stage, 'CO2', { x: 130, y: 500, size: 36, fill: '#6b7a99' }).style.opacity = 1;
  [[0, 380], [0.5, 430], [1.0, 480]].forEach(([d, y]) => fly('CO2', 80, y + 20, 590, 360, b0 + 6.9 + d));
  const hwL = chip(X, stage, 380, 600, '水', '#4f9be8', '#fff', 30); X.pop(hwL, b0 + 8.0, 0.5);
  [[0, 0], [0.5, 40], [1.0, 80]].forEach(([d, dx]) => fly('H2O', 430 + dx, 590, 625, 380, b0 + 8.3 + d));
  const glow = X.circle(stage, 640, 345, 120, 'rgba(255,230,120,.0)');
  X.anim(glow, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.3 }], b0 + 9.6, 1.0, E.out, { fill: 'forwards' });
  glow.setAttribute('fill', 'rgba(255,236,130,.55)');
  const sg = fly('sugar', 640, 340, 1010, 290, b0 + 10.3, 1.8, 1.5); X.fade(sg, b0 + 10.3, 0.1);
  const sgL = chip(X, stage, 1010, 205, '糖', '#ff8a3d', '#fff', 34); X.pop(sgL, b0 + 12.0, 0.5);
  [0, 0.4, 0.8].forEach((d, i) => fly('O2', 660, 360, 1000 + i * 40, 470 + i * 24, b0 + 10.6 + d, 1.7, 1.2));
  const o2L = chip(X, stage, 1060, 400, '酸素', '#e8604c', '#fff', 34); X.pop(o2L, b0 + 12.4, 0.5);
  X.hide(stage, b1 - 0.2, 0.5);
  // 1-1 glucose + the equation
  const gl1 = mol(X, s1.root, 640, 190, 'sugar', 2.4);
  X.pop(gl1, b1 + 0.2, 0.6, 0.3);
  const gtxt = X.text(s1.root, [['糖', '#ff8a3d'], [' ＝ グルコース ＝ ブドウ糖', INK]], { x: 640, y: 410, size: 50 });
  X.rise(gtxt, b1 + 0.8, 24, 0.6);
  X.hide(gl1, b1 + 3.5, 0.4); X.hide(gtxt, b1 + 3.5, 0.4);
  const items = [['6CO2', '#6b7a99', 190, '二酸化炭素'], ['6H2O', '#4f9be8', 190, '水'], ['光', '#ffb300', 100, '光'], ['C6H12O6', '#ff8a3d', 250, '糖'], ['6O2', '#e8604c', 150, '酸素']];
  const ops = ['+', '+', '→', '+'];
  let cx = 640 - (items.reduce((a, it) => a + it[2], 0) + 4 * 66) / 2;
  items.forEach(([label, col, w, name], i) => {
    const g = X.g(s1.root, cx + w / 2, 300);
    X.rect(g, -w / 2, -42, w, 84, col, { rx: 22, css: { filter: 'drop-shadow(0 6px 10px rgba(30,40,70,.2))' } });
    chemText(X, g, label, { x: 0, y: 2, size: 46, fill: '#fff' });
    X.pop(g, b1 + 3.9 + i * 0.42, 0.45, 0.4);
    const nm = X.text(s1.root, name, { x: cx + w / 2, y: 372, size: 26, fill: C.soft }); X.fade(nm, b1 + 4.3 + i * 0.42, 0.4);
    cx += w;
    if (i < 4) {
      const op = X.text(s1.root, ops[i], { x: cx + 33, y: 300, size: 58, fill: INK }); X.pop(op, b1 + 4.0 + i * 0.42, 0.4, 0.4);
      cx += 66;
    }
  });
  const lightNote = chip(X, s1.root, 640, 470, '光のエネルギーで、糖と酸素をつくる', GREEN, '#fff', 36); X.pop(lightNote, b1 + 5.2, 0.6);

  // =========================================================== scene 2 : chloroplast, and everything depends on it
  const s2 = X.sceneOf(2, 2, { bg: ['#edf8ef', '#d7efdc'] });
  X.blobs(s2, ['#c9ecd0', '#fff0b8', '#cfe9ff'], 57);
  const c0 = X.at(2, 0), c1 = X.at(2, 1);
  // A: leaf
  const A = X.g(s2.root, 0, 0);
  const leaf = X.g(A, 640, 340);
  X.path(leaf, 'M-250 90 Q-60 -170 230 -110 Q170 140 -250 90 Z', { fill: '#5cc46e', stroke: '#3a8f4b', 'stroke-width': 6 });
  X.path(leaf, 'M-250 90 Q-20 0 190 -86', { stroke: '#3a8f4b', 'stroke-width': 5 });
  X.pop(A, c0 + 0.2, 0.6, 0.6);
  const lens = X.circle(leaf, 20, -10, 62, 'rgba(255,255,255,.0)', { stroke: '#22304a', 'stroke-width': 8 });
  X.line(leaf, 64, 34, 120, 90, '#22304a', 12);
  X.anim(lens, [{ opacity: 0, transform: 'scale(2)' }, { opacity: 1, transform: 'scale(1)' }], c0 + 1.0, 0.6, E.back);
  const leafL = chip(X, A, 640, 150, '葉っぱの中を見てみよう', GREEN, '#fff', 36); X.pop(leafL, c0 + 0.6, 0.5);
  X.anim(A, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(3.4)', opacity: 0 }], c0 + 2.8, 0.9, E.in, { origin: '660px 330px', fill: 'forwards' });
  // B: a cell with chloroplasts
  const B = X.g(s2.root, 0, 0);
  X.rect(B, 250, 130, 780, 440, '#e9f7d4', { rx: 120, stroke: '#7bb661', 'stroke-width': 8 });
  X.ellipse(B, 520, 300, 100, 80, '#bfe0f5', { stroke: '#8bbbe0', 'stroke-width': 5 });
  X.text(B, '核', { x: 520, y: 300, size: 36, fill: '#4f7fb0' });
  [[760, 220], [870, 330], [740, 440], [400, 460], [900, 200], [380, 190]].forEach(([x, y], i) => {
    const cp = X.g(B, x, y);
    X.ellipse(cp, 0, 0, 46, 26, '#4cb866', { stroke: '#2f8f4a', 'stroke-width': 4, transform: `rotate(${i * 30})` });
    for (let k = -1; k <= 1; k++) X.ellipse(cp, k * 14, 0, 6, 11, '#2f8f4a', { transform: `rotate(${i * 30})` });
  });
  X.pop(B, c0 + 3.5, 0.7, 0.4);
  const cellL = chip(X, B, 640, 90, '細胞', '#7bb661', '#fff', 38); X.pop(cellL, c0 + 3.9, 0.5);
  X.anim(B, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(3.2)', opacity: 0 }], c0 + 5.0, 0.9, E.in, { origin: '830px 300px', fill: 'forwards' });
  // C: the chloroplast
  const Cg = X.g(s2.root, 0, 0);
  const chlo = X.g(Cg, 560, 360);
  X.ellipse(chlo, 0, 0, 300, 175, '#4cb866', { stroke: '#2f8f4a', 'stroke-width': 8 });
  X.ellipse(chlo, 0, 0, 270, 148, 'none', { stroke: '#2f8f4a', 'stroke-width': 3, 'stroke-dasharray': '2 9' });
  const stacks = [[-150, -30], [-30, 40], [100, -20], [170, 50], [-90, 85]];
  const dots = [];
  stacks.forEach(([x, y]) => { for (let k = 0; k < 5; k++) { X.ellipse(chlo, x, y - k * 14, 46, 10, '#2f9d52', { stroke: '#1f7a3a', 'stroke-width': 3 }); } });
  stacks.forEach(([x, y], i) => { for (let k = 0; k < 4; k++) { const d = X.circle(chlo, x - 30 + k * 20, y - 66 + (k % 2) * 8, 4.5, '#b7f58a'); dots.push(d); } });
  X.pop(Cg, c0 + 5.9, 0.8, 0.3);
  const chL = chip(X, Cg, 560, 140, '葉緑体', '#2f8f4a', '#fff', 42); X.pop(chL, c0 + 6.3, 0.5);
  const clL = chip(X, Cg, 1000, 250, 'クロロフィル', '#7bb661', '#fff', 38, { w: 300 }); X.pop(clL, c0 + 8.0, 0.5);
  const clN = X.text(Cg, '緑色の色素', { x: 1000, y: 308, size: 30, fill: C.soft }); X.fade(clN, c0 + 8.3, 0.4);
  const ptr = X.path(Cg, 'M880 262 Q760 300 640 320', { stroke: '#7bb661', 'stroke-width': 6 }); X.draw(ptr, c0 + 8.4, 0.6);
  dots.forEach((d, i) => X.pulse(d, c0 + 8.4 + (i % 5) * 0.12, 2.2, 0.8));
  for (let i = 0; i < 3; i++) {
    const r = X.line(Cg, 880 + i * 60, 90 + i * 12, 700 - i * 20, 250 + i * 40, '#ffc933', 10, { 'stroke-dasharray': '1 22' });
    X.draw(r, c0 + 9.6 + i * 0.3, 0.8);
  }
  const lite = chip(X, Cg, 1040, 470, '光を受けとめる', '#ffb300', '#fff', 34); X.pop(lite, c0 + 10.4, 0.5);
  X.hide(Cg, c1 - 0.2, 0.5);
  // D: everything depends on photosynthesis
  const D = X.g(s2.root, 0, 0);
  const plantD = leafPlant(X, D, 640, 490, 0.9);
  X.pop(plantD, c1 + 0.2, 0.7, 0.4);
  const sunD = sun(X, D, 1120, 120, 44); X.pop(sunD, c1 + 0.2, 0.6, 0.3);
  const me = person(X, D, 190, 490, 2.0, '#4f9be8'); X.pop(me, c1 + 1.0, 0.6, 0.3);
  const apple = X.g(D, 1070, 410);
  X.circle(apple, 0, 0, 48, '#e8604c'); X.path(apple, 'M0 -44 Q4 -64 20 -66', { stroke: '#3a8f4b', 'stroke-width': 7 }); X.ellipse(apple, 22, -58, 18, 9, '#5cc46e');
  const bread = X.g(D, 1070, 500);
  X.ellipse(bread, 0, 0, 60, 30, '#e8b86a', { stroke: '#b9803a', 'stroke-width': 4 });
  X.pop(apple, c1 + 3.4, 0.6, 0.3); X.pop(bread, c1 + 3.8, 0.6, 0.3);
  const o2c = chip(X, D, 330, 330, '私たちが吸う酸素', '#e8604c', '#fff', 34); X.pop(o2c, c1 + 0.6, 0.5);
  const fdc = chip(X, D, 960, 330, '食べている食べ物', '#ff8a3d', '#fff', 34); X.pop(fdc, c1 + 3.2, 0.5);
  for (let i = 0; i < 5; i++) {
    const b = X.g(D, 0, 0); mol(X, b, 700, 370, 'O2', 1.0);
    X.move(b, [{ x: 0, y: 0, o: 0, offset: 0 }, { x: -40, y: -10, o: 1, offset: 0.1 }, { x: -300, y: 40, o: 1, offset: 0.9 }, { x: -340, y: 50, o: 0, offset: 1 }], c1 + 1.4 + i * 0.55, 1.8, E.inout);
  }
  [[0, 0], [0.5, 1]].forEach(([d, i]) => { const a = X.path(D, `M760 ${370 + i * 70} Q900 ${390 + i * 60} 980 ${400 + i * 90}`, { stroke: '#ff8a3d', 'stroke-width': 7, 'stroke-dasharray': '2 14' }); X.draw(a, c1 + 3.6 + d, 0.8); });
  const root = chip(X, D, 640, 150, 'もとをたどれば、光合成', GREEN, '#fff', 40); X.pop(root, c1 + 6.4, 0.6);
  const ban = chip(X, s2.root, 640, 572, '光合成が、地球の生き物すべてを支えている', '#2aa6a0', '#fff', 36); X.pop(ban, c1 + 10.4, 0.6);
}
