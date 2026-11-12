// Turn a compact map-scene spec into script scenes.
// spec: { code, after (scene index to insert after), title, bbox, W?, H?, steps: [{ say, fill, routes, polys, pts: [[label, lon, lat, color, dx, dy]], labels: [[text, lon, lat, color, dx, dy]], clear }] }
import { MapView, patchScript, unitDir } from './lib.mjs';
// approximate rendered width of a size-s label (26px font)
const textW = (t) => [...t].reduce((w, ch) => w + (/[\x20-\x7e]/.test(ch) ? 15 : 26), 0);
const LH = 40;
export function mapScene(spec) {
  const d = unitDir(spec.code);
  const m = new MapView({ bbox: spec.bbox, W: spec.W, H: spec.H, res: spec.res });
  const ids = [];
  const steps = spec.steps.map((st, i) => {
    const show = [];
    const hide = st.clear ? ids.splice(0) : [];
    if (i === 0) show.push({ type: 'title', text: spec.title }, { ...m.baseEl(d, `map-${spec.name ?? 'main'}.svg`), id: 'mb' });
    const points = (st.pts ?? []).map(([, lon, lat, color = 'yellow']) => ({ lon, lat, color }));
    const lab = [...(st.pts ?? []).map(([t, lon, lat, c = 'yellow', dx = 16, dy = -20]) => [t, lon, lat, c, dx, dy]), ...(st.labels ?? [])];
    // place labels (clamped inside the map) and put a dark backing under each so lines don't cross the text
    const placed = lab.map(([t, lon, lat, c = 'white', dx = 0, dy = 0]) => {
      const [px, py] = m.pos(lon, lat);
      const w = textW(t);
      const x = Math.min(Math.max(px + dx, m.at[0] + 6), m.at[0] + m.W - w - 8);
      const y = Math.min(Math.max(py + dy, m.at[1] + 4), m.at[1] + m.H - LH - 4);
      return { t, c, x, y, w };
    });
    const backs = placed.map(({ x, y, w }) => `<rect x="${x - m.at[0] - 6}" y="${y - m.at[1] + 1}" width="${w + 12}" height="${LH - 2}" rx="8" fill="#0d1a24" fill-opacity="0.72" stroke="none"/>`).join('');
    if (st.fill || st.routes || st.polys || points.length || placed.length) {
      const id = `mo${i}`;
      const el = m.overlayEl({ fill: st.fill, routes: st.routes, polys: st.polys, points }, { id });
      el.markup += backs;
      show.push(el);
      ids.push(id);
    }
    placed.forEach(({ t, c, x, y }, j) => {
      const id = `ml${i}_${j}`;
      show.push({ type: 'text', text: t, at: [x, y], size: 's', color: c, anim: 'fade', id });
      ids.push(id);
    });
    const step = { say: st.say, show };
    if (hide.length) step.hide = hide;
    if (st.added !== false) step.added = true;
    return step;
  });
  return { dir: d, scene: { board: 'whiteboard', steps } };
}
export function apply(spec) {
  const { dir, scene } = mapScene(spec);
  patchScript(`${dir}/video/script.yaml`, 'map', [scene], spec.where ?? { afterIndex: spec.after });
}
