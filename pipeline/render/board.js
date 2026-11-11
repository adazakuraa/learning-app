// Deterministic board renderer: window.setup(timeline, unitBase) builds the DOM,
// window.seek(t) puts every element in its state at time t (no real-time animation),
// so frames can be captured one by one.
(function () {
  const stage = document.getElementById('stage');
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const SVGNS = 'http://www.w3.org/2000/svg';
  let layers = [];
  let items = []; // { node, el, chars, strokes, fills, step }
  let marks = []; // { bar, t0 }
  let hides = []; // { node, t0 }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  /** Minimal inline markup: **bold** -> highlighted, newlines -> <br> */
  const rich = (s) => esc(s ?? '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

  /** Wrap every character of text nodes in spans so "write" can reveal them one by one. */
  function splitChars(root) {
    const spans = [];
    const walk = (n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of n.textContent) {
          const sp = document.createElement('span');
          sp.className = 'ch';
          sp.textContent = ch;
          frag.appendChild(sp);
          if (ch.trim()) spans.push(sp);
          else sp.style.opacity = 1;
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('katex')) {
        [...n.childNodes].forEach(walk);
      }
    };
    walk(root);
    return spans;
  }

  function build(el, base) {
    const d = document.createElement('div');
    const size = el.size ?? (el.type === 'title' ? '' : 'm');
    d.className = `el t-${el.type} ${size} c-${el.color ?? (el.type === 'box' ? 'blue' : 'white')}`;
    switch (el.type) {
      case 'title':
        d.innerHTML = rich(el.text);
        break;
      case 'text':
      case 'label':
        d.innerHTML = rich(el.text);
        break;
      case 'tag':
        d.innerHTML = `<span class="tag">${rich(el.text)}</span>`;
        break;
      case 'list':
        d.innerHTML = `<ul class="list">${(el.items ?? []).map((i) => `<li>${rich(i)}</li>`).join('')}</ul>`;
        break;
      case 'box':
        d.innerHTML = `<div class="box">${el.title ? `<div class="bt">${rich(el.title)}</div>` : ''}${el.text || el.body ? `<div class="bb">${rich(el.text ?? el.body)}</div>` : ''}</div>`;
        break;
      case 'formula':
        d.innerHTML = window.katex.renderToString(String(el.tex), { throwOnError: false, displayMode: false });
        break;
      case 'image':
        d.innerHTML = `<img src="${base}/${encodeURI(el.src)}">${el.caption ? `<div class="cap">${rich(el.caption)}</div>` : ''}`;
        break;
      case 'svg': {
        const w = el.w ?? 400;
        const h = el.h ?? 300;
        d.innerHTML = `<svg class="draw" width="${w}" height="${h}" viewBox="${el.viewBox ?? `0 0 ${w} ${h}`}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" font-family="inherit">${el.markup}</svg>`;
        break;
      }
      case 'arrow': {
        const [x1, y1] = el.from;
        const [x2, y2] = el.to;
        const minx = Math.min(x1, x2) - 20, miny = Math.min(y1, y2) - 20;
        const w = Math.abs(x2 - x1) + 40, h = Math.abs(y2 - y1) + 40;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const hx = (a) => [x2 - minx - 16 * Math.cos(ang + a), y2 - miny - 16 * Math.sin(ang + a)];
        const [ax, ay] = hx(0.45), [bx, by] = hx(-0.45);
        d.style.left = minx + 'px';
        d.style.top = miny + 'px';
        d.classList.add('abs');
        d.innerHTML = `<svg class="draw" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M${x1 - minx} ${y1 - miny} L${x2 - minx} ${y2 - miny}"/><path d="M${ax} ${ay} L${x2 - minx} ${y2 - miny} L${bx} ${by}"/></svg>`;
        if (el.label) {
          const lb = document.createElement('div');
          lb.className = 'label abs';
          lb.style.left = (x1 + x2) / 2 - minx + 8 + 'px';
          lb.style.top = (y1 + y2) / 2 - miny - 36 + 'px';
          lb.innerHTML = rich(el.label);
          d.appendChild(lb);
        }
        break;
      }
      default:
        d.innerHTML = rich(el.text ?? `[unknown type ${el.type}]`);
    }
    if (el.w && el.type !== 'svg') d.style.width = el.w + 'px';
    if (el.align) d.style.textAlign = el.align;
    return d;
  }

  window.setup = function (tl, base) {
    stage.innerHTML = '';
    layers = [];
    items = [];
    marks = [];
    hides = [];
    for (const sc of tl.scenes) {
      const layer = document.createElement('div');
      layer.className = `layer ${sc.board}`;
      const flow = document.createElement('div');
      flow.className = 'flow';
      layer.appendChild(flow);
      stage.appendChild(layer);
      layers.push({ node: layer, start: sc.start, end: sc.end });
      const byId = {};
      for (const st of sc.steps) {
        for (const el of st.shows) {
          const node = build(el, base);
          if (el.type === 'title') layer.appendChild(node);
          else if (el.at || el.type === 'arrow') {
            if (el.at) {
              node.style.left = el.at[0] + 'px';
              node.style.top = el.at[1] + 'px';
            }
            node.classList.add('abs');
            layer.appendChild(node);
          } else flow.appendChild(node);
          byId[el.id] = node;
          const it = { node, el, chars: [], strokes: [], fades: [] };
          if (el.anim === 'write') it.chars = splitChars(node);
          if (el.anim === 'draw') {
            node.querySelectorAll('path,line,polyline,polygon,circle,rect,ellipse').forEach((s) => {
              let len = 0;
              try {
                len = s.getTotalLength();
              } catch {
                len = 0;
              }
              s.style.strokeDasharray = `${len} ${len}`;
              it.strokes.push({ s, len, fill: s.getAttribute('fill'), fo: s.getAttribute('fill-opacity') ?? '1' });
            });
            it.fades = [...node.querySelectorAll('text, .label, img')];
          }
          items.push(it);
        }
        for (const id of st.mark) {
          const target = byId[id];
          if (!target) continue;
          const bar = document.createElement('div');
          bar.className = 'markbar';
          target.style.isolation = 'isolate';
          target.appendChild(bar);
          marks.push({ bar, t0: st.t });
        }
        for (const id of st.hide) if (byId[id]) hides.push({ node: byId[id], t0: st.t });
      }
    }
  };

  window.seek = function (t) {
    for (const L of layers) {
      const on = t >= L.start && t < L.end + 0.001;
      L.node.style.display = on ? '' : 'none';
      if (on) L.node.style.opacity = ease(clamp((t - L.start) / 0.35));
    }
    for (const it of items) {
      const { el, node } = it;
      const p = el.dur > 0 ? clamp((t - el.t0) / el.dur) : t >= el.t0 ? 1 : 0;
      if (el.anim === 'write') {
        const n = Math.floor(p * it.chars.length + (p >= 1 ? 1 : 0));
        it.chars.forEach((c, i) => (c.style.opacity = i < n ? 1 : 0));
        node.style.opacity = t >= el.t0 ? 1 : 0;
      } else if (el.anim === 'draw') {
        node.style.opacity = t >= el.t0 ? 1 : 0;
        const total = it.strokes.reduce((a, s) => a + s.len, 0) || 1;
        let budget = p * total;
        for (const s of it.strokes) {
          const shown = Math.max(0, Math.min(s.len, budget));
          budget -= s.len;
          s.s.style.strokeDashoffset = s.len - shown;
          if (s.fill && s.fill !== 'none') s.s.style.fillOpacity = shown >= s.len ? s.fo : 0;
        }
        it.fades.forEach((f) => (f.style.opacity = clamp((p - 0.6) / 0.4)));
      } else if (el.anim === 'pop') {
        node.style.opacity = ease(p);
        node.style.transform = `scale(${0.85 + 0.15 * ease(p)})`;
      } else if (el.anim === 'fade') {
        node.style.opacity = ease(p);
      } else {
        node.style.opacity = t >= el.t0 ? 1 : 0;
      }
      if (el.move) {
        const m0 = el.t0 + el.dur + (el.move.delay ?? 0);
        const mp = ease(clamp((t - m0) / (el.move.dur ?? 1)));
        const [x0, y0] = el.at ?? [0, 0];
        const [x1, y1] = el.move.to;
        node.style.transform = `translate(${(x1 - x0) * mp}px, ${(y1 - y0) * mp}px)`;
      }
    }
    for (const m of marks) m.bar.style.width = `calc(${ease(clamp((t - m.t0) / 0.45)) * 100}% + 8px)`;
    for (const h of hides) if (t >= h.t0) h.node.style.opacity = 1 - clamp((t - h.t0) / 0.3);
  };
})();
