// A tiny deterministic motion-graphics engine for "explainer" style videos.
// Everything is built from SVG nodes + Web Animations (paused, driven by seek(t)), so a frame at time t can be
// captured at any moment. The narration/timing comes from the normal script.yaml + narration clips (compile.mjs);
// a unit module (units/<unit-id>.js) only describes the visuals.
export const NS = 'http://www.w3.org/2000/svg';
export const E = {
  out: 'cubic-bezier(.16,1,.3,1)',
  back: 'cubic-bezier(.34,1.56,.64,1)',
  inout: 'cubic-bezier(.65,0,.35,1)',
  in: 'cubic-bezier(.5,0,.9,.5)',
  lin: 'linear',
};
const clamp = (x) => Math.max(0, Math.min(1, x));

export function createEngine(stage, tl, base) {
  const anims = [];
  const ticks = [];
  const X = { E, NS, tl, base, stage };

  // ---------- timing helpers ----------
  X.T = tl.scenes.map((sc) => sc.steps.map((st) => ({ t: st.t, dur: st.dur })));
  /** absolute time of step (si, pi), plus fraction f (0..1) of its duration */
  X.at = (si, pi, f = 0) => X.T[si][pi].t + f * X.T[si][pi].dur;
  X.range = (si) => ({ start: tl.scenes[si].start, end: tl.scenes[si].end });
  X.duration = tl.duration;

  // ---------- svg building ----------
  X.el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'css') Object.assign(n.style, v);
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    }
    if (parent) parent.appendChild(n);
    return n;
  };
  // positioned group: an outer <g translate> holds the position, the returned inner <g> is free to be animated
  X.g = (parent, x = 0, y = 0, attrs = {}) => {
    if (!x && !y) return X.el('g', attrs, parent);
    return X.el('g', attrs, X.el('g', { transform: `translate(${x} ${y})` }, parent));
  };
  X.rect = (p, x, y, w, h, fill, attrs = {}) => X.el('rect', { x, y, width: w, height: h, fill, ...attrs }, p);
  X.circle = (p, cx, cy, r, fill, attrs = {}) => X.el('circle', { cx, cy, r, fill, ...attrs }, p);
  X.ellipse = (p, cx, cy, rx, ry, fill, attrs = {}) => X.el('ellipse', { cx, cy, rx, ry, fill, ...attrs }, p);
  X.line = (p, x1, y1, x2, y2, stroke, w = 4, attrs = {}) => X.el('line', { x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'round', ...attrs }, p);
  X.path = (p, d, attrs = {}) => X.el('path', { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, p);
  /** text. `str` may be a string or [[text, fill], ...] for coloured runs */
  X.text = (p, str, o = {}) => {
    const t = X.el('text', {
      x: o.x ?? 0, y: o.y ?? 0, 'font-size': o.size ?? 40, 'font-weight': o.weight ?? 900,
      fill: o.fill ?? '#22304a', 'text-anchor': o.anchor ?? 'middle', 'dominant-baseline': o.baseline ?? 'central',
      'letter-spacing': o.spacing, stroke: o.stroke, 'stroke-width': o.strokeWidth, 'paint-order': o.stroke ? 'stroke' : null,
      'stroke-linejoin': 'round', 'font-family': o.font,
    }, p);
    if (Array.isArray(str)) for (const [s, c] of str) X.el('tspan', { fill: c, text: s }, t);
    else t.textContent = str;
    return t;
  };
  /** rounded "pill/card" with optional shadow */
  X.card = (p, x, y, w, h, fill = '#fff', o = {}) =>
    X.rect(p, x, y, w, h, fill, { rx: o.r ?? 22, stroke: o.stroke, 'stroke-width': o.sw, css: o.shadow === false ? {} : { filter: 'drop-shadow(0 6px 10px rgba(30,40,70,.16))' } });

  // ---------- animation ----------
  const prep = (n, origin) => {
    n.style.transformBox = 'fill-box';
    n.style.transformOrigin = origin ?? 'center';
  };
  X.anim = (n, kf, at, dur = 0.5, ease = E.out, o = {}) => {
    if (o.origin !== undefined || !n.style.transformOrigin) prep(n, o.origin);
    const a = n.animate(kf, { delay: Math.max(0, at) * 1000, duration: Math.max(1, dur * 1000), easing: ease, fill: o.fill ?? 'both', iterations: o.loop ? Infinity : 1, direction: o.alt ? 'alternate' : 'normal' });
    a.pause();
    a.currentTime = 0;
    anims.push(a);
    return a;
  };
  X.fade = (n, at, dur = 0.45) => X.anim(n, [{ opacity: 0 }, { opacity: 1 }], at, dur, E.out);
  // exit animations only fill forwards: before `at` they must not override an entrance animation on the same node
  X.hide = (n, at, dur = 0.35) => X.anim(n, [{ opacity: 1 }, { opacity: 0 }], at, dur, E.out, { origin: n.style.transformOrigin, fill: 'forwards' });
  /** hold invisible until `at`, then pop in with overshoot */
  X.pop = (n, at, dur = 0.55, from = 0.4) => X.anim(n, [{ opacity: 0, transform: `scale(${from})` }, { opacity: 1, transform: 'scale(1)' }], at, dur, E.back);
  X.rise = (n, at, dy = 28, dur = 0.6) => X.anim(n, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }], at, dur, E.out);
  X.slide = (n, at, dx = 0, dy = 0, dur = 0.7, ease = E.out) => X.anim(n, [{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }, { opacity: 1, transform: 'translate(0,0)' }], at, dur, ease);
  /** move relative to the resting position: keyframes of {x,y,s,r,o} (translate, scale, rotate deg, opacity) */
  X.move = (n, frames, at, dur = 1, ease = E.inout, o = {}) =>
    X.anim(n, frames.map((f) => ({ transform: `translate(${f.x ?? 0}px, ${f.y ?? 0}px) scale(${f.s ?? 1}) rotate(${f.r ?? 0}deg)`, opacity: f.o ?? 1, offset: f.offset })), at, dur, ease, o);
  /** stroke-draw a path/line (sets pathLength=1) */
  X.draw = (path, at, dur = 1, ease = E.inout) => {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 1';
    // opacity 0 until the draw starts (round caps would otherwise leave a dot at the path end)
    return X.anim(path, [{ strokeDashoffset: 1, opacity: 0, offset: 0 }, { strokeDashoffset: 1, opacity: 1, offset: 0.001 }, { strokeDashoffset: 0, opacity: 1, offset: 1 }], at, dur, ease, { origin: 'center' });
  };
  /** gentle endless float / sway */
  X.float = (n, dx = 0, dy = 10, period = 3, phase = 0, rot = 0) =>
    X.anim(n, [{ transform: `translate(${-dx}px, ${-dy}px) rotate(${-rot}deg)` }, { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` }], -phase, period, E.inout, { loop: true, alt: true });
  X.pulse = (n, at, scale = 1.18, dur = 0.5) => X.anim(n, [{ transform: 'scale(1)' }, { transform: `scale(${scale})`, offset: 0.4 }, { transform: 'scale(1)' }], at, dur, E.out, { fill: 'none' });
  /** call fn(progress 0..1) while time is within [at, at+dur] (progress is clamped outside) */
  X.tick = (at, dur, fn, ease = E.lin) => {
    const easeFn = ease === E.inout ? (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2) : ease === E.out ? (p) => 1 - Math.pow(1 - p, 3) : (p) => p;
    ticks.push({ at, dur, fn, easeFn });
  };
  X.count = (textEl, at, dur, from, to, fmt = (v) => String(Math.round(v))) => X.tick(at, dur, (p) => (textEl.textContent = fmt(from + (to - from) * p)), E.out);

  // ---------- scenes ----------
  const bgOf = (c) => (Array.isArray(c) ? `linear-gradient(160deg, ${c[0]}, ${c[1]})` : c);
  /** a visual scene between absolute times; returns { root (svg <g> to draw into), svg, bg } */
  X.scene = (start, end, o = {}) => {
    const div = document.createElement('div');
    div.className = 'scene';
    div.style.background = bgOf(o.bg ?? ['#fff7e6', '#ffeacc']);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1280 720');
    div.appendChild(svg);
    stage.insertBefore(div, stage.querySelector('#sub'));
    const root = X.el('g', {}, svg);
    root.style.transformBox = 'view-box';
    root.style.transformOrigin = '640px 360px';
    const fin = o.fadeIn ?? 0.5;
    const fout = o.fadeOut ?? 0.45;
    const total = end - start + fout;
    const a = div.animate(
      [{ opacity: 0, offset: 0 }, { opacity: 1, offset: fin / total }, { opacity: 1, offset: (end - start) / total }, { opacity: 0, offset: 1 }],
      { delay: start * 1000, duration: total * 1000, fill: 'both', easing: 'linear' },
    );
    a.pause();
    a.currentTime = 0;
    anims.push(a);
    // slow push-in for life
    if (o.push !== false) X.anim(root, [{ transform: 'scale(1)' }, { transform: `scale(${o.push ?? 1.035})` }], start, end - start + fout, E.lin, { origin: '640px 360px' });
    return { root, svg, div, start, end };
  };
  /** scene covering compile-scenes si..sj (inclusive) */
  X.sceneOf = (si, sj = si, o = {}) => X.scene(tl.scenes[si].start, tl.scenes[sj].end, o);

  /** soft drifting background blobs for depth */
  X.blobs = (sc, colors, seed = 1) => {
    let s = seed * 9301;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const g = X.g(sc.root, 0, 0);
    colors.forEach((c, i) => {
      const b = X.circle(g, 100 + rnd() * 1080, 80 + rnd() * 560, 90 + rnd() * 130, c, { opacity: 0.5 });
      X.float(b, 30 + rnd() * 40, 20 + rnd() * 30, 5 + rnd() * 4, i * 1.3);
    });
    return g;
  };

  // ---------- seek / subtitles ----------
  const subSpan = stage.querySelector('#sub span');
  const cues = tl.cues;
  X.finish = () => {
    X.seek(0);
  };
  X.seek = (t) => {
    for (const a of anims) a.currentTime = t * 1000;
    for (const k of ticks) k.fn(k.easeFn(clamp((t - k.at) / k.dur)));
    const c = cues.find((q) => t >= q.start && t < q.end);
    subSpan.textContent = c ? c.text : '';
    subSpan.parentElement.style.display = c ? 'flex' : 'none';
  };
  return X;
}
