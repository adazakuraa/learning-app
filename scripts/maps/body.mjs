// Organ-position diagrams for biology "人体の仕組み" videos.
// A stylised front-view body (inline svg, uses the board font) + per-step organ highlights with leader lines and labels.
import { patchScript, unitDir } from './lib.mjs';
const C = { yellow: '#f3d77a', blue: '#8fc4ff', pink: '#f4a3b8', green: '#9be0b0', orange: '#f3a76a', white: '#e8eef5', gray: '#9aa3ad', red: '#ef8a8a' };
const AT = [90, 100], W = 1100, H = 615, OX = 70, OY = 42, S = 0.86; // figure drawn scaled at (OX, OY)
const TF = `translate(${OX},${OY}) scale(${S})`;
const BODY = `<g transform="${TF}" stroke="#c9d1cc" stroke-width="2.5" fill="#ffffff" fill-opacity="0.07">
<ellipse cx="200" cy="62" rx="46" ry="56"/>
<path d="M184 114 L184 140 M216 114 L216 140" fill="none"/>
<path d="M184 140 C150 146 112 150 94 172 L70 330 L62 432 L86 436 L98 334 L116 232 L120 300 C126 350 120 400 116 446 L124 606 L190 606 L198 474 L202 474 L210 606 L276 606 L284 446 C280 400 274 350 280 300 L284 232 L302 334 L314 436 L338 432 L330 330 L306 172 C288 150 250 146 216 140 Z"/>
</g>`;
// organ shapes in figure coordinates; each: svg markup (filled with the colour) and an anchor point for the leader line
const O = {
  brain: { d: '<path d="M164 58 C160 26 190 12 205 14 C232 14 244 34 238 58 C236 74 168 76 164 58 Z"/>', a: [236, 40] },
  pituitary: { d: '<circle cx="200" cy="74" r="6"/>', a: [206, 74] },
  spinal: { d: '<path d="M200 96 L200 440" stroke-width="7" fill="none"/>', a: [200, 330] },
  nerves: { d: '<path d="M200 200 L106 250 L80 420 M200 200 L294 250 L322 420 M200 440 L158 520 L156 600 M200 440 L242 520 L244 600 M200 300 L130 330 M200 300 L270 330" stroke-width="3" fill="none"/>', a: [300, 290] },
  mouth: { d: '<path d="M186 92 Q200 100 214 92" stroke-width="5" fill="none"/>', a: [214, 94] },
  nose: { d: '<path d="M200 60 L194 82 L206 82 Z"/>', a: [206, 74] },
  esophagus: { d: '<path d="M198 104 L198 140 L202 230 L214 300" stroke-width="8" fill="none"/>', a: [202, 200] },
  trachea: { d: '<path d="M200 106 L200 196 M200 196 L174 218 M200 196 L226 218" stroke-width="8" fill="none"/>', a: [200, 150] },
  lungL: { d: '<path d="M192 178 C160 172 136 200 132 250 C130 280 136 298 150 300 C170 300 190 292 192 280 Z"/>', a: [140, 240] },
  lungR: { d: '<path d="M208 178 C240 172 264 200 268 250 C270 280 264 298 250 300 C238 300 226 296 224 286 C236 270 230 248 208 240 Z"/>', a: [262, 230] },
  heart: { d: '<path d="M196 236 C206 222 230 226 232 244 C236 266 214 282 206 290 C196 280 184 266 186 250 C186 240 192 236 196 236 Z"/>', a: [230, 256] },
  aorta: { d: '<path d="M206 236 C206 200 186 196 182 214 L184 300 L190 440" stroke-width="6" fill="none"/>', a: [188, 380] },
  diaphragm: { d: '<path d="M128 306 Q200 266 272 306" stroke-width="5" fill="none"/>', a: [128, 306] },
  liver: { d: '<path d="M124 310 C150 296 200 296 222 306 C228 326 214 340 190 352 C160 362 130 356 124 340 Z"/>', a: [130, 330] },
  gall: { d: '<ellipse cx="186" cy="356" rx="9" ry="12"/>', a: [178, 360] },
  stomach: { d: '<path d="M214 306 C240 296 268 308 270 334 C272 360 252 376 230 374 C214 372 206 360 216 350 C232 350 240 340 236 328 C232 318 220 316 214 312 Z"/>', a: [268, 330] },
  spleen: { d: '<ellipse cx="270" cy="314" rx="10" ry="20" transform="rotate(20 270 314)"/>', a: [278, 314] },
  pancreas: { d: '<path d="M176 372 C196 364 236 360 262 356" stroke-width="12" fill="none"/>', a: [250, 360] },
  small: { d: '<path d="M164 392 C190 384 236 384 238 400 C240 414 162 410 162 424 C162 440 238 436 238 450 C238 462 186 462 176 456" stroke-width="10" fill="none"/>', a: [236, 420] },
  large: { d: '<path d="M150 466 L148 384 C148 374 154 372 162 372 L246 372 C254 372 256 380 256 388 L256 452 C256 468 232 470 212 470 L204 480" stroke-width="13" fill="none"/>', a: [256, 420] },
  kidneyL: { d: '<path d="M150 352 C140 360 140 392 152 402 C160 408 168 398 164 388 C160 378 164 366 168 360 C164 350 156 348 150 352 Z"/>', a: [148, 380] },
  kidneyR: { d: '<path d="M250 352 C260 360 260 392 248 402 C240 408 232 398 236 388 C240 378 236 366 232 360 C236 350 244 348 250 352 Z"/>', a: [254, 380] },
  ureter: { d: '<path d="M160 398 C168 430 180 448 192 462 M240 398 C232 430 220 448 208 462" stroke-width="4" fill="none"/>', a: [232, 430] },
  bladder: { d: '<ellipse cx="200" cy="466" rx="22" ry="15"/>', a: [222, 466] },
  urethra: { d: '<path d="M200 480 L200 498" stroke-width="5" fill="none"/>', a: [200, 494] },
  thyroid: { d: '<path d="M186 126 C186 118 198 120 200 128 C202 120 214 118 214 126 C214 138 204 140 200 134 C196 140 186 138 186 126 Z"/>', a: [214, 128] },
  adrenal: { d: '<path d="M148 350 L158 334 L168 350 Z M232 350 L242 334 L252 350 Z"/>', a: [250, 342] },
  gonad: { d: '<circle cx="174" cy="454" r="8"/><circle cx="226" cy="454" r="8"/>', a: [234, 454] },
  thymus: { d: '<path d="M192 196 C186 210 188 226 198 228 C200 222 202 222 202 228 C212 226 214 210 208 196 Z"/>', a: [206, 210] },
  lymph: { d: '<circle cx="180" cy="126" r="6"/><circle cx="220" cy="126" r="6"/><circle cx="118" cy="226" r="6"/><circle cx="282" cy="226" r="6"/><circle cx="160" cy="460" r="6"/><circle cx="240" cy="460" r="6"/>', a: [282, 226] },
  marrow: { d: '<path d="M158 490 L156 590 M242 490 L244 590" stroke-width="7" fill="none"/>', a: [244, 540] },
  tonsil: { d: '<circle cx="190" cy="100" r="5"/><circle cx="210" cy="100" r="5"/>', a: [212, 100] },
};
const LX = 560; // label column x (svg coords)
function organLayer(parts, labelY) {
  // parts: [{ o: [organ keys], c: colour, label, y }]
  const out = [];
  for (const p of parts) {
    const col = C[p.c];
    for (const k of p.o) {
      const s = O[k];
      out.push(`<g transform="${TF}" fill="${col}" fill-opacity="0.85" stroke="${col}" stroke-width="2">${s.d}</g>`);
    }
    if (!p.label) continue;
    const ax = OX + O[p.o[0]].a[0] * S, ay = OY + O[p.o[0]].a[1] * S;
    const y = p.y ?? labelY;
    out.push(`<path d="M${ax} ${ay} L${LX - 120} ${y} L${LX - 12} ${y}" stroke="${col}" stroke-width="2" fill="none" stroke-dasharray="5 5"/>`);
    out.push(`<circle cx="${ax}" cy="${ay}" r="4" fill="${col}" stroke="none"/>`);
    out.push(`<text x="${LX}" y="${y + 9}" fill="${col}" stroke="none" font-size="28">${p.label}</text>`);
    if (p.note) out.push(`<text x="${LX}" y="${y + 42}" fill="#c9d1cc" stroke="none" font-size="21">${p.note}</text>`);
  }
  return out.join('');
}
const svgEl = (markup, id) => ({ type: 'svg', id, at: AT, w: W, h: H, anim: 'fade', markup });

export function bodyScene(title, steps) {
  // steps: [{ say, parts: [{ o, c, label, y, note }] }]
  return {
    board: 'whiteboard',
    steps: steps.map((st, i) => {
      const show = [];
      if (i === 0) show.push({ type: 'title', text: title }, svgEl(BODY, 'body'));
      if (st.parts?.length) show.push(svgEl(organLayer(st.parts), `org${i}`));
      const step = { say: st.say, show, added: true };
      if (st.hide) step.hide = st.hide;
      return step;
    }),
  };
}
export function applyBody(code, title, steps, where) {
  const d = unitDir(code);
  patchScript(`${d}/video/script.yaml`, 'body', [bodyScene(title, steps)], where);
}
