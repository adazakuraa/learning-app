import { C, chip, person, eye, brain, dog, camera, vasePaths } from '../lib.js';

export function build(X) {
  const { E } = X;
  const INK = C.ink, PUR = '#7a5ce0';
  const bg = ['#f3eeff', '#e2d9ff'];

  // =========================================================== scene 0 : the chapter
  const s0 = X.sceneOf(0, 0, { bg });
  X.blobs(s0, ['#e0d4ff', '#ffe3ef', '#d6ecff'], 61);
  const a0 = X.at(0, 0), a1 = X.at(0, 1), a2 = X.at(0, 2);
  const E0 = eye(X, s0.root, 300, 330, 1.7);
  X.pop(E0.g, a0 + 0.2, 0.8, 0.4);
  X.anim(E0.iris, [{ transform: 'translateX(-30px)' }, { transform: 'translateX(30px)' }], 0, 2.4, E.inout, { loop: true, alt: true, origin: 'center' });
  const ch = chip(X, s0.root, 880, 80, '第2章', PUR, '#fff', 30); X.pop(ch, a0 + 0.4, 0.5);
  const tt = X.text(s0.root, '知覚と認知のしくみ', { x: 880, y: 160, size: 58, fill: INK }); X.pop(tt, a0 + 0.8, 0.7, 0.6);
  const qs = ['世界をどう見る？', '何に気づく？', 'どう覚えている？'];
  const qg = X.g(s0.root, 0, 0);
  qs.forEach((q, i) => { const c = chip(X, qg, 880, 290 + i * 90, q, [ '#4f9be8', '#ff8a3d', '#2aa6a0' ][i], '#fff', 38, { w: 440 }); X.pop(c, a1 + 0.8 + i * 1.8, 0.5); });
  X.hide(qg, a2 - 0.2, 0.4);
  const lim = chip(X, s0.root, 880, 560, 'そのしくみと「限界」', PUR, '#fff', 40); X.pop(lim, a1 + 6.2, 0.5); X.hide(lim, a2 - 0.2, 0.4);
  const b1 = X.g(s0.root, 0, 0), b2 = X.g(s0.root, 0, 0);
  const bub = (g, x, y, text, col, at) => { const c = chip(X, g, x, y, text, col, '#fff', 38, { w: 430 }); X.pop(c, at, 0.5); return c; };
  bub(b1, 880, 270, '「自分の目で見た」', '#4f9be8', a2 + 0.4);
  bub(b2, 880, 370, '「たしかに覚えている」', '#2aa6a0', a2 + 2.6);
  [b1, b2].forEach((g, i) => {
    const q = X.text(g, '？', { x: 1130, y: 270 + i * 100, size: 70, fill: '#e8604c' });
    X.pop(q, a2 + 4.6 + i * 0.4, 0.5, 0.2);
    X.anim(q, [{ transform: 'rotate(-12deg)' }, { transform: 'rotate(12deg)' }], a2 + 5.3, 0.5, E.inout, { loop: true, alt: true });
  });
  const surprise = chip(X, s0.root, 880, 500, '思ったほど、確かじゃない！', '#e8604c', '#fff', 40, { w: 560 }); X.pop(surprise, a2 + 5.6, 0.6);

  // =========================================================== scene 1 : sensation vs perception
  const s1 = X.sceneOf(1, 1, { bg: ['#eef3ff', '#dce6ff'] });
  X.blobs(s1, ['#d6e3ff', '#ffe9c9', '#e6dcff'], 63);
  const p0 = X.at(1, 0), p1 = X.at(1, 1);
  const grp1 = X.g(s1.root, 0, 0);
  const E1 = eye(X, grp1, 260, 330, 1.3); X.pop(E1.g, p0 + 0.2, 0.7, 0.4);
  for (let i = 0; i < 3; i++) { const r = X.line(grp1, 40, 220 + i * 110, 120, 280 + i * 50, '#ffc933', 9, { 'stroke-dasharray': '1 20' }); X.draw(r, p0 + 0.8 + i * 0.2, 0.7); }
  const kan = chip(X, grp1, 260, 500, '感覚', '#4f9be8', '#fff', 46, { w: 180 }); X.pop(kan, p0 + 3.2, 0.6);
  const kn = X.text(grp1, '光を受けとる', { x: 260, y: 570, size: 32, fill: C.soft }); X.fade(kn, p0 + 3.5, 0.4);
  const B1 = brain(X, grp1, 850, 320, 1.5); X.pop(B1, p0 + 4.3, 0.7, 0.4);
  const bulb = X.g(grp1, 850, 100);
  X.circle(bulb, 0, 0, 36, '#ffe066', { stroke: '#f0a500', 'stroke-width': 5 }); X.rect(bulb, -16, 34, 32, 22, '#9aa7c4', { rx: 6 });
  for (let i = 0; i < 6; i++) X.line(bulb, 0, -52, 0, -70, '#f0a500', 6, { transform: `rotate(${i * 60 - 150})` });
  X.pop(bulb, p0 + 5.2, 0.6, 0.3);
  const chi = chip(X, grp1, 850, 500, '知覚', '#ff8a3d', '#fff', 46, { w: 180 }); X.pop(chi, p0 + 5.6, 0.6);
  const cn = X.text(grp1, '何かを「わかる」', { x: 850, y: 570, size: 32, fill: C.soft }); X.fade(cn, p0 + 5.9, 0.4);
  const ar = X.path(grp1, 'M410 330 L690 330 M662 304 L692 330 L662 356', { stroke: '#8a95b5', 'stroke-width': 9 }); X.draw(ar, p0 + 3.9, 0.7);
  X.hide(grp1, p1 - 0.2, 0.5);
  // camera analogy
  const grp2 = X.g(s1.root, 0, 0);
  const cam = camera(X, grp2, 260, 340, 1.4); X.pop(cam, p1 + 0.3, 0.7, 0.4);
  for (let i = 0; i < 3; i++) { const r = X.line(grp2, 20, 250 + i * 80, 120, 320 + i * 30, '#ffc933', 9, { 'stroke-dasharray': '1 20' }); X.draw(r, p1 + 0.8 + i * 0.2, 0.7); }
  const lensT = chip(X, grp2, 260, 520, 'レンズ ＝ 感覚', '#4f9be8', '#fff', 36, { w: 320 }); X.pop(lensT, p1 + 2.0, 0.6);
  const photo = X.g(grp2, 640, 330);
  X.card(photo, -130, -110, 260, 220, '#fff', { r: 14 });
  const dg = dog(X, photo, 0, 0, 1.15);
  X.anim(dg, [{ filter: 'blur(16px)' }, { filter: 'blur(0px)' }], p1 + 3.6, 1.6, E.out, { origin: 'center', fill: 'both' });
  X.pop(photo, p1 + 2.6, 0.6, 0.4);
  const arr2 = X.path(grp2, 'M800 330 L930 330 M904 306 L934 330 L904 354', { stroke: '#8a95b5', 'stroke-width': 9 }); X.draw(arr2, p1 + 4.4, 0.6);
  const B2 = brain(X, grp2, 1040, 340, 1.1); X.pop(B2, p1 + 4.8, 0.6, 0.4);
  const say = chip(X, grp2, 1040, 190, 'これは犬だ！', '#ff8a3d', '#fff', 38, { w: 300 }); X.pop(say, p1 + 5.8, 0.6);
  const pT = chip(X, grp2, 1040, 520, '写った画像を見る ＝ 知覚', '#ff8a3d', '#fff', 28, { w: 440 }); X.pop(pT, p1 + 6.4, 0.6);

  // =========================================================== scene 2 : illusions
  const s2 = X.sceneOf(2, 2, { bg: ['#fff3e8', '#ffe2cc'] });
  X.blobs(s2, ['#ffe0c2', '#e6dcff', '#d7eefc'], 67);
  const i0 = X.at(2, 0), i1 = X.at(2, 1);
  const ML = X.g(s2.root, 0, 0);
  const mlT = X.text(ML, 'ミュラー・リヤー錯視', { x: 640, y: 70, size: 50, fill: INK }); X.pop(mlT, i0 + 0.2, 0.6, 0.6);
  const lines = X.g(ML, 0, 0);
  const lineAt = (y, inward, col) => {
    const x1 = 320, x2 = 960, dir = inward ? 1 : -1;
    const g = X.g(lines, 0, 0);
    X.line(g, x1, y, x2, y, col, 10);
    for (const [x, sgn] of [[x1, 1], [x2, -1]]) for (const dy of [-46, 46]) X.line(g, x, y, x + sgn * dir * 46, y + dy, col, 10);
    return g;
  };
  const ml1 = lineAt(220, true, '#e8604c'), ml2 = lineAt(390, false, '#4f9be8');
  X.draw(ml1.firstChild, i0 + 0.8, 0.8); X.fade(ml1, i0 + 0.7, 0.3);
  X.draw(ml2.firstChild, i0 + 1.6, 0.8); X.fade(ml2, i0 + 1.5, 0.3);
  const which = chip(X, ML, 640, 520, 'どっちが長い？', PUR, '#fff', 44); X.pop(which, i0 + 2.6, 0.6); X.hide(which, i0 + 4.4, 0.3);
  for (const x of [320, 960]) { const gl = X.line(ML, x, 150, x, 460, '#22304a', 5, { 'stroke-dasharray': '10 10' }); X.draw(gl, i0 + 4.4, 0.6); }
  const same = chip(X, ML, 640, 520, '同じ長さ！', '#2aa6a0', '#fff', 50); X.pop(same, i0 + 5.2, 0.6);
  X.hide(ML, i0 + 7.2, 0.5);
  // café wall
  const CW = X.g(s2.root, 0, 0);
  const cwT = X.text(CW, 'カフェウォール錯視', { x: 640, y: 70, size: 50, fill: INK }); X.pop(cwT, i0 + 7.6, 0.6, 0.6);
  const tw = 70, th = 54, rows = 6, cols = 12, x0 = 640 - (cols * tw) / 2, y0 = 130;
  const wall = X.g(CW, 0, 0);
  const clipId = 'cwclip';
  const defs = X.el('defs', {}, wall); const cp = X.el('clipPath', { id: clipId }, defs); X.el('rect', { x: x0, y: y0, width: cols * tw, height: rows * th }, cp);
  const tiles = X.g(wall, 0, 0, { 'clip-path': `url(#${clipId})` });
  X.rect(tiles, x0, y0, cols * tw, rows * th, '#9aa0ad');
  for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
    const off = (r % 2) * (tw / 2) + (r % 4 > 1 ? tw / 4 : 0);
    X.rect(tiles, x0 + c * tw + off + 3, y0 + r * th + 3, tw - 6, th - 6, c % 2 ? '#fff' : '#1b2233');
  }
  X.rise(wall, i0 + 8.0, 20, 0.7);
  const slant = chip(X, CW, 640, 540, 'かたむいて見える…', '#e8604c', '#fff', 40); X.pop(slant, i0 + 9.4, 0.6); X.hide(slant, i0 + 12.2, 0.3);
  for (let r = 0; r <= rows; r++) { const gl = X.line(CW, x0 - 10, y0 + r * th, x0 + cols * tw + 10, y0 + r * th, '#e8604c', 5); X.draw(gl, i0 + 12.2 + r * 0.12, 0.6); }
  const par = chip(X, CW, 640, 540, '本当は、まっすぐ平行！', '#2aa6a0', '#fff', 42); X.pop(par, i0 + 13.2, 0.6);
  X.hide(CW, i1 - 0.2, 0.5);
  // brain interprets
  const BR = X.g(s2.root, 0, 0);
  const eyeB = eye(X, BR, 220, 330, 1.0); X.pop(eyeB.g, i1 + 0.2, 0.6, 0.4);
  const brB = brain(X, BR, 640, 330, 1.6); X.pop(brB, i1 + 1.8, 0.7, 0.4);
  const ar1 = X.path(BR, 'M350 330 L470 330 M444 306 L474 330 L444 354', { stroke: '#8a95b5', 'stroke-width': 9 }); X.draw(ar1, i1 + 1.2, 0.5);
  const not = chip(X, BR, 220, 480, '目はまちがっていない', '#4f9be8', '#fff', 30, { w: 360 }); X.pop(not, i1 + 0.6, 0.6);
  [['過去の経験', '#ff8a3d', 640, 130, 4.2], ['まわりの状況', '#2aa6a0', 960, 250, 5.4], ['思いこみ', '#e8604c', 960, 430, 6.6]].forEach(([t, col, x, y, at], i) => {
    const c = chip(X, BR, x, y, t, col, '#fff', 34, { w: 300 }); X.pop(c, i1 + at, 0.5);
    const a = X.path(BR, `M${x + (x > 700 ? -150 : 0)} ${y + (x > 700 ? 0 : 38)} L${x > 700 ? 770 : 640} ${x > 700 ? 330 : 240}`, { stroke: col, 'stroke-width': 7, 'stroke-dasharray': '2 12' }); X.draw(a, i1 + at + 0.2, 0.5);
  });
  const interp = chip(X, BR, 640, 515, '脳が「解釈」を加えている', PUR, '#fff', 40); X.pop(interp, i1 + 8.4, 0.6);

  // =========================================================== scene 3 : Rubin's vase & everyday life
  const s3 = X.sceneOf(3, 3, { bg: ['#f3eeff', '#e2d9ff'] });
  X.blobs(s3, ['#e0d4ff', '#ffe3ef', '#d6ecff'], 71);
  const r0 = X.at(3, 0), r1 = X.at(3, 1), r2 = X.at(3, 2);
  const RB = X.g(s3.root, 0, 0);
  const rt = X.text(RB, 'ルビンの壺', { x: 640, y: 70, size: 54, fill: INK }); X.pop(rt, r0 + 5.2, 0.6, 0.6);
  const vgrp = X.g(RB, 640, 130);
  const { vase, left, right } = vasePaths(520);
  X.rect(vgrp, -260, 0, 520, 400, '#1b2233');
  X.path(vgrp, vase, { fill: '#fff' });
  const vOv = X.path(vgrp, vase, { fill: '#ffd54f' }), fOvL = X.path(vgrp, left, { fill: '#f4849c' }), fOvR = X.path(vgrp, right, { fill: '#f4849c' });
  X.pop(vgrp, r0 + 5.8, 0.8, 0.5);
  const T0 = r0 + 7.0;
  X.anim(vOv, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.46 }, { opacity: 1, offset: 0.5 }, { opacity: 1, offset: 0.96 }, { opacity: 0, offset: 1 }], T0, 3.6, E.lin, { loop: true, fill: 'backwards' });
  for (const f of [fOvL, fOvR]) X.anim(f, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.46 }, { opacity: 0, offset: 0.5 }, { opacity: 0, offset: 0.96 }, { opacity: 1, offset: 1 }], T0, 3.6, E.lin, { loop: true, fill: 'backwards' });
  const vL = chip(X, RB, 240, 360, '壺', '#e0a000', '#fff', 52, { w: 150 }), fL = chip(X, RB, 1040, 360, '2人の顔', '#e0457b', '#fff', 46, { w: 240 });
  X.pop(vL, r0 + 8.0, 0.5); X.pop(fL, r0 + 8.0, 0.5);
  const act = chip(X, RB, 640, 575, '脳が「組み立てて」いる', PUR, '#fff', 38); X.pop(act, r0 + 1.0, 0.6);
  X.hide(act, r0 + 4.6, 0.3);
  const no = chip(X, RB, 640, 575, 'どちらが正しい？ … 答えはない', '#e8604c', '#fff', 40); X.pop(no, r1 + 0.6, 0.6);
  X.hide(RB, r2 - 0.2, 0.6);
  // everyday: same event, different views
  const EV = X.g(s3.root, 0, 0);
  const dg2 = dog(X, EV, 640, 430, 1.4); X.pop(dg2, r2 + 0.6, 0.7, 0.3);
  const pA = person(X, EV, 230, 560, 2.2, '#4f9be8'), pB = person(X, EV, 1050, 560, 2.2, '#e8604c');
  X.pop(pA, r2 + 2.0, 0.6, 0.3); X.pop(pB, r2 + 2.4, 0.6, 0.3);
  const thought = (x, y, text, col, at) => { const g = X.g(EV, x, y); X.ellipse(g, 0, 0, 170, 62, '#fff', { stroke: col, 'stroke-width': 6 }); X.circle(g, -100, 90, 12, '#fff', { stroke: col, 'stroke-width': 5 }); X.circle(g, -120, 120, 7, '#fff', { stroke: col, 'stroke-width': 4 }); X.text(g, text, { size: 38, fill: col }); X.pop(g, at, 0.6, 0.3); return g; };
  thought(250, 250, 'かわいい！', '#2aa6a0', r2 + 3.6); thought(1030, 250, 'こわい…！', '#e8604c', r2 + 5.6);
  [['経験', '#ff8a3d', 7.4], ['期待', '#7a5ce0', 8.9], ['注意の向け方', '#2aa6a0', 10.4]].forEach(([t, col, at], i) => {
    const c = chip(X, EV, 640, 105 + i * 64, t, col, '#fff', 32, { w: 330 }); X.pop(c, r2 + at, 0.5);
  });
  const hard = chip(X, EV, 640, 570, '客観的に見るのは、むずかしい', '#22304a', '#fff', 42); X.pop(hard, r2 + 14.4, 0.6);
  const ans = chip(X, EV, 640, 515, '答えは、知覚のしくみにある', PUR, '#fff', 34); X.pop(ans, r2 + 16.6, 0.6);
}
