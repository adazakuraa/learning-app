// Decide which videos need (re-)rendering, independent of git history or file times.
// A video is up to date when video/render-hash.txt matches the hash of:
//   its script.yaml + its narration clips' manifest + the renderer source (pipeline/render/*) + pipeline/voice.json
//   node pipeline/render/stale.mjs [prefix]   -> prints stale unit ids
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RENDER_DIR = path.join(ROOT, 'pipeline/render');
const rendererHash = crypto.createHash('sha1');
// Some renderer fixes only matter for videos that use a particular feature. Such a fix lives in a marked block that is
// left out of the renderer hash and mixed into the hash of just the videos that use the feature, so fixing it does not
// re-render every video. (Block + feature: Japanese characters inside formulas, see KATEX-CJK in board.css.)
const FIX_RE = /\n\/\* KATEX-CJK-START \*\/[\s\S]*?\/\* KATEX-CJK-END \*\/\n/;
let cjkFix = '';
for (const f of fs.readdirSync(RENDER_DIR).sort()) {
  if (!/\.(mjs|js|css|html)$/.test(f) || f === 'stale.mjs' || f === 'batch.mjs') continue;
  let src = fs.readFileSync(path.join(RENDER_DIR, f), 'utf8');
  if (f === 'board.css') {
    cjkFix = (src.match(FIX_RE) ?? [''])[0];
    src = src.replace(FIX_RE, '');
  }
  rendererHash.update(src);
}
const CJK_IN_FORMULA = /\btex:[^\n]*[\u3000-\u30ff\u4e00-\u9fff\uff00-\uffef]/;
rendererHash.update(fs.readFileSync(path.join(ROOT, 'pipeline/voice.json'))); // a new voice re-narrates and re-renders everything
const RENDERER = rendererHash.digest('hex');

export function renderHash(unitDir) {
  const h = crypto.createHash('sha1').update(RENDERER);
  const script = fs.readFileSync(path.join(unitDir, 'video', 'script.yaml'), 'utf8');
  h.update(script);
  if (CJK_IN_FORMULA.test(script)) h.update(cjkFix);
  const mf = path.join(unitDir, 'video', 'narration', 'manifest.json');
  if (fs.existsSync(mf)) h.update(fs.readFileSync(mf));
  for (const f of fs.readdirSync(unitDir)) if (/\.(webp|png|jpe?g|svg|gif)$/i.test(f)) h.update(f);
  return h.digest('hex').slice(0, 16);
}

export function staleUnits(prefix = '') {
  const out = [];
  const content = path.join(ROOT, 'content');
  for (const s of fs.readdirSync(content)) {
    const sp = path.join(content, s);
    if (!fs.statSync(sp).isDirectory()) continue;
    for (const c of fs.readdirSync(sp)) {
      const cp = path.join(sp, c);
      if (!fs.statSync(cp).isDirectory()) continue;
      for (const u of fs.readdirSync(cp)) {
        const up = path.join(cp, u);
        if (!fs.existsSync(path.join(up, 'video', 'script.yaml'))) continue;
        const id = YAML.parse(fs.readFileSync(path.join(up, 'unit.yaml'), 'utf8')).id;
        if (prefix && !id.startsWith(prefix)) continue;
        const hf = path.join(up, 'video', 'render-hash.txt');
        const ok = fs.existsSync(path.join(up, 'video.mp4')) && fs.existsSync(hf) && fs.readFileSync(hf, 'utf8').trim() === renderHash(up);
        if (!ok) out.push(id);
      }
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(staleUnits(process.argv[2] ?? '').join('\n'));
