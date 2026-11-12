// Map helpers for explanation videos. A map = opaque base image (land/borders, written next to the unit's
// script as an SVG) + transparent inline-svg overlays (highlights, routes, points) placed at the same `at`.
// Labels are normal `text` elements positioned with pos(lon, lat), so they use the board's Japanese font.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import YAML from 'yaml';
import { execFileSync } from 'node:child_process';
// Scripts are always rebuilt from the committed baseline (before map work) so re-runs are idempotent.
const BASE = 'dc0beaa434ebf913770050bb78a10821b5fcc974';
const seen = new Set();
const baseText = (file) => execFileSync('git', ['show', `${BASE}:${file}`], { maxBuffer: 1 << 26 }).toString();
const require = createRequire(import.meta.url);
export const COL = { white: '#e8eef5', yellow: '#f3d77a', blue: '#8fc4ff', pink: '#f4a3b8', green: '#9be0b0', gray: '#9aa3ad', orange: '#f3a76a' };
const load = (r) => { const t = require(`world-atlas/countries-${r}.json`); return feature(t, t.objects.countries).features; };
const C = { 50: load('50m'), 110: load('110m') };
const q = (n) => Math.round(n * 10) / 10;

export class MapView {
  constructor({ bbox, W = 1000, H = 520, at = [140, 140], res, plain = false }) {
    this.plain = plain;
    this.W = W; this.H = H; this.at = at;
    this.countries = C[res ?? (bbox[2] - bbox[0] > 40 ? 110 : 50)];
    const [w, so, e, n] = bbox;
    const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    const k = Math.min(W / (((e - w) * Math.PI) / 180), H / (my(n) - my(so)));
    const cLat = ((2 * Math.atan(Math.exp((my(n) + my(so)) / 2)) - Math.PI / 2) * 180) / Math.PI;
    this.proj = geoMercator().scale(k).center([(w + e) / 2, cLat]).translate([W / 2, H / 2]).clipExtent([[0, 0], [W, H]]);
    this.path = geoPath(this.proj).digits(1);
  }
  /** point in board (1280x720) coordinates */
  pos(lon, lat) { const [x, y] = this.proj([lon, lat]); return [Math.round(x + this.at[0]), Math.round(y + this.at[1])]; }
  /** SVG text of the opaque base map */
  baseSvg() {
    const { W, H } = this;
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
      `<rect width="${W}" height="${H}" fill="#12283a"/>`];
    for (const f of this.plain ? [] : this.countries) {
      const d = this.path(f);
      if (d) out.push(`<path d="${d}" fill="#3a4a45" stroke="#8d9a95" stroke-width="0.9"/>`);
    }
    out.push('</svg>');
    return out.join('\n');
  }
  /** inner markup for an inline `svg` element (same size as the base) */
  overlay({ fill = {}, polys = [], routes = [], points = [] }) {
    const out = [];
    for (const f of this.countries) {
      const c = fill[f.properties.name];
      if (!c) continue;
      const d = this.path(f);
      if (d) out.push(`<path d="${d}" fill="${COL[c] ?? c}" fill-opacity="0.55" stroke="${COL[c] ?? c}" stroke-width="1.5"/>`);
    }
    for (const p of polys) {
      const d = 'M' + p.ring.map((q2) => this.proj(q2).map(q).join(' ')).join(' L') + ' Z';
      const c = COL[p.color] ?? p.color;
      out.push(`<path d="${d}" fill="${c}" fill-opacity="${p.opacity ?? 0.4}" stroke="${c}" stroke-width="3"${p.dash ? ' stroke-dasharray="9 7"' : ''}/>`);
    }
    for (const r of routes) {
      const pts = r.pts.map((p) => this.proj(p));
      const c = COL[r.color] ?? r.color;
      let d = 'M' + q(pts[0][0]) + ' ' + q(pts[0][1]);
      for (let i = 1; i < pts.length; i++) d += ' L' + q(pts[i][0]) + ' ' + q(pts[i][1]);
      out.push(`<path d="${d}" stroke="${c}" stroke-width="${r.width ?? 5}"${r.dash ? ' stroke-dasharray="12 9"' : ''}/>`);
      if (r.arrow !== false) {
        const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 2];
        const a = Math.atan2(y2 - y1, x2 - x1), L = 20;
        const h = (k) => `${q(x2 - L * Math.cos(a + k))} ${q(y2 - L * Math.sin(a + k))}`;
        out.push(`<path d="M${h(0.45)} L${q(x2)} ${q(y2)} L${h(-0.45)}" stroke="${c}" stroke-width="${r.width ?? 5}"/>`);
      }
    }
    for (const p of points) {
      const [x, y] = this.proj([p.lon, p.lat]);
      const c = COL[p.color ?? 'yellow'];
      out.push(`<circle cx="${q(x)}" cy="${q(y)}" r="${p.r ?? 9}" fill="${c}" stroke="#0b1c2c" stroke-width="2.5"/>`);
    }
    return out.join('\n');
  }
  /** `image` element for the base map; file is written to <unitDir>/<name> */
  baseEl(unitDir, name) {
    fs.writeFileSync(path.join(unitDir, name), this.baseSvg());
    return { type: 'image', src: name, at: this.at, w: this.W, anim: 'fade' };
  }
  overlayEl(spec, extra = {}) {
    return { type: 'svg', at: this.at, w: this.W, h: this.H, anim: spec.anim ?? 'fade', markup: this.overlay(spec), ...extra };
  }
  /** chalk label near a lon/lat point; dx/dy shift in px */
  label(text, lon, lat, color = 'white', dx = 14, dy = -34) {
    const [x, y] = this.pos(lon, lat);
    return { type: 'text', text, at: [x + dx, y + dy], size: 's', color, anim: 'fade' };
  }
}

/** Replace/insert scenes in a script.yaml. Scenes added by this tool carry `gen: <key>` and are replaced on re-run.
 *  where: { afterSay: "substring of a step's say" } inserts after the scene containing it; or { end: true }. */
export function patchScript(file, key, newScenes, where) {
  const first = !seen.has(file); seen.add(file);
  const doc = YAML.parseDocument(first ? baseText(file) : fs.readFileSync(file, 'utf8'));
  const seq = doc.get('scenes');
  for (let i = seq.items.length - 1; i >= 0; i--) if (seq.items[i].get('gen') === key) seq.items.splice(i, 1);
  let at = seq.items.length;
  if (where.afterIndex != null) {
    at = where.afterIndex + 1;
  } else if (where.replaceSay) {
    const idx = seq.items.findIndex((sc) => JSON.stringify(sc.toJSON()).includes(where.replaceSay));
    if (idx < 0) throw new Error('replaceSay not found: ' + where.replaceSay);
    seq.items.splice(idx, 1);
    at = idx;
  } else if (where.afterSay) {
    const idx = seq.items.findIndex((sc) => JSON.stringify(sc.toJSON()).includes(where.afterSay));
    if (idx < 0) throw new Error('afterSay not found: ' + where.afterSay);
    at = idx + 1;
  } else if (where.beforeSay) {
    const idx = seq.items.findIndex((sc) => JSON.stringify(sc.toJSON()).includes(where.beforeSay));
    if (idx < 0) throw new Error('beforeSay not found: ' + where.beforeSay);
    at = idx;
  }
  const nodes = newScenes.map((sc) => {
    const n = doc.createNode({ gen: key, ...sc });
    for (const st of n.get('steps').items) for (const el of st.get('show')?.items ?? []) {
      const j = el.toJSON();
      if (!j.markup) el.flow = true; // keep short elements on one line like the hand-written ones
    }
    return n;
  });
  seq.items.splice(at, 0, ...nodes);
  fs.writeFileSync(file, doc.toString({ lineWidth: 0 }));
}

export function unitDir(code) {
  const hits = fs.globSync(`content/*/*/${code}`);
  if (hits.length !== 1) throw new Error('unit dir ' + code + ': ' + hits.length);
  return hits[0];
}
