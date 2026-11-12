// Render the "explainer" version of a unit's video (same script + narration, different visuals).
//   node pipeline/explainer/render.mjs <unit-id> --out /path/video.mp4            -> MP4 (+ .vtt) outside the unit folder
//   node pipeline/explainer/render.mjs <unit-id> --stills 5,20,41 --out-dir /dir   -> PNG previews at those seconds
//   --stills auto                                                                   -> one frame per second of the video / 4
// The unit's normal video (video.mp4, render-hash, unit.yaml) is never touched.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import YAML from 'yaml';
import { compile, loadScript } from '../render/compile.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FPS = 30;

function findUnit(id) {
  const content = path.join(ROOT, 'content');
  for (const s of fs.readdirSync(content)) {
    const sp = path.join(content, s);
    if (!fs.statSync(sp).isDirectory()) continue;
    for (const c of fs.readdirSync(sp)) {
      const cp = path.join(sp, c);
      if (!fs.statSync(cp).isDirectory()) continue;
      for (const u of fs.readdirSync(cp)) {
        const f = path.join(cp, u, 'unit.yaml');
        if (fs.existsSync(f) && YAML.parse(fs.readFileSync(f, 'utf8'))?.id === id) return path.join(cp, u);
      }
    }
  }
  throw new Error(`unit not found: ${id}`);
}
function narrationDurations(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(\d+-\d+)\.(wav|mp3|m4a)$/);
    if (!m) continue;
    const d = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, f)]).toString();
    out[m[1]] = { sec: Number(d), file: path.join(dir, f) };
  }
  return out;
}
function serve(unitDir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = url.startsWith('/unit/') ? path.join(unitDir, url.slice(6)) : path.join(ROOT, url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, () => r(server)));
}

const [id, ...rest] = process.argv.slice(2);
const opt = (k) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : null);
if (!id) throw new Error('usage: render.mjs <unit-id> [--stills t1,t2|auto --out-dir dir] [--out file.mp4] [--scale 1.5]');
const SCALE = Number(opt('--scale') ?? 1.5);
const unitDir = findUnit(id);
const narr = narrationDurations(path.join(unitDir, 'video', 'narration'));
const tl = compile(loadScript(path.join(unitDir, 'video', 'script.yaml')), Object.fromEntries(Object.entries(narr).map(([k, v]) => [k, v.sec])));
console.log(`${id}: ${tl.duration.toFixed(1)}s, narration ${Object.keys(narr).length ? 'yes' : 'no'}`);

const server = await serve(unitDir);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: SCALE });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://localhost:${server.address().port}/pipeline/explainer/stage.html`);
await page.evaluate(({ tl, id }) => window.setup(tl, id, '/unit'), { tl, id });
await page.evaluate(async () => { await document.fonts.ready; });
if (errors.length) console.warn('page errors:\n  ' + [...new Set(errors)].join('\n  '));

const stills = opt('--stills');
if (stills) {
  const out = opt('--out-dir') ?? '/tmp';
  fs.mkdirSync(out, { recursive: true });
  const times = stills === 'auto' ? Array.from({ length: Math.floor(tl.duration / 4) }, (_, i) => 2 + i * 4) : stills.split(',').map(Number);
  for (const s of times) {
    await page.evaluate((t) => window.seek(t), s);
    await page.evaluate(async () => { await document.fonts.ready; });
    const f = path.join(out, `${id}-t${String(Math.round(s * 10)).padStart(4, '0')}.png`);
    await page.screenshot({ path: f });
    console.log(f);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

const outFile = path.resolve(opt('--out') ?? `/tmp/${id}-explainer.mp4`);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const tmp = outFile + '.tmp.mp4';
const narrList = [];
for (const sc of tl.scenes) for (const st of sc.steps) if (st.audioKey) narrList.push({ file: narr[st.audioKey].file, at: st.t + 0.15 });
const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
if (narrList.length) narrList.forEach((n) => args.push('-i', n.file));
else args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
if (narrList.length) {
  const parts = narrList.map((n, i) => `[${i + 1}:a]adelay=${Math.round(n.at * 1000)}:all=1[a${i}]`);
  args.push('-filter_complex', `${parts.join(';')};${narrList.map((_, i) => `[a${i}]`).join('')}amix=inputs=${narrList.length}:normalize=0[aout]`, '-map', '0:v', '-map', '[aout]');
} else args.push('-map', '0:v', '-map', '1:a');
args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', '-t', tl.duration.toFixed(2), tmp);
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
const frames = Math.ceil(tl.duration * FPS);
const started = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.seek(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % (FPS * 10) === 0) process.stdout.write(`\r  ${Math.round((i / frames) * 100)}%`);
}
ff.stdin.end();
await ffDone;
await browser.close();
server.close();
fs.renameSync(tmp, outFile);
console.log(`\r  done: ${frames} frames in ${Math.round((Date.now() - started) / 1000)}s -> ${outFile} (${(fs.statSync(outFile).size / 1e6).toFixed(1)}MB)`);
