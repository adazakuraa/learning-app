// Still previews of a unit's video plus an automatic layout check (no MP4, no unit changes).
//
//   STILLS_DIR=/tmp/x node pipeline/preview.mjs <unit-id> [<unit-id> ...]
//
// For every scene it captures the last frame and reports elements whose drawn content
// overlaps another element or leaves the 1280x720 canvas. Lives outside pipeline/render
// so editing it does not change the render hash (which would re-render every video).
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import YAML from 'yaml';
import { compile, loadScript } from './render/compile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function unitDirs() {
  const map = new Map();
  for (const f of execFileSync('find', [path.join(ROOT, 'content'), '-name', 'unit.yaml']).toString().trim().split('\n')) {
    const id = YAML.parse(fs.readFileSync(f, 'utf8'))?.id;
    if (id) map.set(id, path.dirname(f));
  }
  return map;
}

function narration(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(\d+-\d+)\.(wav|mp3|m4a)$/);
    if (m) out[m[1]] = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, f)]).toString());
  }
  return out;
}

let unitDir = '';
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = url.startsWith('/unit/') ? path.join(unitDir, url.slice(6)) : path.join(ROOT, url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404), res.end();
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const dirs = unitDirs();
let problems = 0;

for (const id of process.argv.slice(2)) {
  unitDir = dirs.get(id);
  if (!unitDir) { console.error(`${id}: unit not found`); problems++; continue; }
  const tl = compile(loadScript(path.join(unitDir, 'video', 'script.yaml')), narration(path.join(unitDir, 'video', 'narration')));
  await page.goto(`http://localhost:${server.address().port}/pipeline/render/board.html`);
  await page.evaluate((tl) => window.setup(tl, '/unit'), tl);
  await page.evaluate(async () => {
    document.querySelectorAll('.layer').forEach((l) => (l.style.display = ''));
    document.querySelectorAll('.ch').forEach((c) => (c.style.opacity = 1));
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  const out = path.join(process.env.STILLS_DIR ?? os.tmpdir(), `stills-${id}`);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const issues = [];
  for (const [i, sc] of tl.scenes.entries()) {
    const t = Math.round((sc.end - 0.5) * 10) / 10;
    await page.evaluate((t) => window.seek(t), t);
    await page.screenshot({ path: path.join(out, `s${String(i + 1).padStart(2, '0')}.png`) });
    const found = await page.evaluate(() => {
      const shown = (e) => { for (let n = e; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || parseFloat(cs.opacity) < 0.5) return false; } return true; };
      const els = [...document.querySelectorAll('.el')].filter((e) => !e.parentElement.closest('.el') && shown(e));
      const boxes = els.map((e) => {
        const r = document.createRange();
        r.selectNodeContents(e);
        return { b: r.getBoundingClientRect(), t: e.textContent.replace(/\s+/g, '').slice(0, 12) || e.className.split(' ')[1], title: e.classList.contains('t-title') };
      }).filter(({ b }) => b.width > 4 && b.height > 4);
      const msgs = [];
      for (const { b, t } of boxes) if (b.right > 1272 || b.bottom > 712 || b.left < 8 || b.top < 8) msgs.push(`outside: 「${t}」`);
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].b, c = boxes[j].b;
          const w = Math.min(a.right, c.right) - Math.max(a.left, c.left);
          const h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
          if (w > 6 && h > 6 && w * h > 300) msgs.push(`overlap: 「${boxes[i].t}」×「${boxes[j].t}」`);
        }
      return msgs;
    });
    for (const m of found) issues.push(`scene ${i + 1}: ${m}`);
  }
  problems += issues.length;
  console.log(`${id}: ${tl.duration.toFixed(0)}s, ${tl.scenes.length} scenes${issues.length ? '\n  ' + issues.join('\n  ') : ' ok'}`);
}
await browser.close();
server.close();
process.exit(problems ? 1 : 0);
