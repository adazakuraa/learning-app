// Render a unit's video script to MP4.
//
//   node pipeline/render/render.mjs <unit-id>                 -> video.mp4 + captions.vtt in the unit folder
//   node pipeline/render/render.mjs <unit-id> --stills 3,20   -> PNG previews at those seconds (scratch dir)
//
// Input:  content/.../<unit>/video/script.yaml   (+ optional video/narration/<scene>-<step>.wav)
// Output: content/.../<unit>/video.mp4, captions.vtt, and unit.yaml `video` fields.

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import YAML from 'yaml';
import { compile, loadScript, toVtt } from './compile.mjs';
import { renderHash } from './stale.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FPS = 30;
const SCALE = 1.5; // 1280x720 canvas -> 1920x1080 video

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
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
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

/** Time intervals in which something on screen changes; outside them frames can be reused. */
function dynamicIntervals(tl) {
  const iv = [];
  for (const sc of tl.scenes) {
    iv.push([sc.start, sc.start + 0.4]);
    for (const st of sc.steps) {
      for (const e of st.shows) {
        iv.push([e.t0, e.t0 + e.dur]);
        if (e.move) {
          const m0 = e.t0 + e.dur + (e.move.delay ?? 0);
          iv.push([m0, m0 + (e.move.dur ?? 1)]);
        }
      }
      if (st.mark.length) iv.push([st.t, st.t + 0.5]);
      if (st.hide.length) iv.push([st.t, st.t + 0.35]);
    }
    iv.push([sc.end - 0.05, sc.end + 0.05]);
  }
  return iv;
}

async function main() {
  const [id, ...rest] = process.argv.slice(2);
  if (!id) throw new Error('usage: render.mjs <unit-id> [--stills t1,t2]');
  const stillsArg = rest.includes('--stills') ? rest[rest.indexOf('--stills') + 1] : null;
  const unitDir = findUnit(id);
  const scriptFile = path.join(unitDir, 'video', 'script.yaml');
  const opt = (k) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : null);
  const narrDir = opt('--narration-dir') ?? path.join(unitDir, 'video', 'narration');
  const outOverride = opt('--out'); // write the MP4 elsewhere and leave the unit untouched (voice samples)
  const narr = narrationDurations(narrDir);
  const tl = compile(loadScript(scriptFile), Object.fromEntries(Object.entries(narr).map(([k, v]) => [k, v.sec])));
  console.log(`${id}: ${tl.duration.toFixed(1)}s, ${tl.cues.length} captions, narration ${Object.keys(narr).length ? 'yes' : 'no'}`);

  const server = await serve(unitDir);
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: SCALE });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()}: ${r.url()}`));
  await page.goto(`http://localhost:${port}/pipeline/render/board.html`);
  await page.evaluate((tl) => window.setup(tl, '/unit'), tl);
  // render everything once so all font subsets and images load before capturing
  await page.evaluate(() => {
    document.querySelectorAll('.layer').forEach((l) => (l.style.display = ''));
    document.querySelectorAll('.ch').forEach((c) => (c.style.opacity = 1));
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  if (errors.length) console.warn('warnings:\n  ' + errors.join('\n  '));

  // overflow check: anything outside the 1280x720 canvas is almost certainly a layout mistake
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('.el')]
      .map((e) => ({ r: e.getBoundingClientRect(), t: e.textContent.slice(0, 20) }))
      .filter(({ r }) => r.width && !(r.width >= 1279 && r.height >= 719) && (r.right > 1272 || r.bottom > 712 || r.left < 8 || r.top < 8))
      .map(({ r, t }) => `${t} (${Math.round(r.left)},${Math.round(r.top)})-(${Math.round(r.right)},${Math.round(r.bottom)})`),
  );
  if (overflow.length) console.warn('elements outside the canvas:\n  ' + overflow.join('\n  '));

  if (stillsArg) {
    const out = path.join(process.env.STILLS_DIR ?? os.tmpdir(), `stills-${id}`);
    fs.mkdirSync(out, { recursive: true });
    const times = stillsArg === 'auto' ? tl.scenes.map((sc) => Math.round((sc.end - 0.5) * 10) / 10) : stillsArg.split(',').map(Number);
    for (const s of times) {
      await page.evaluate((t) => window.seek(t), s);
      const f = path.join(out, `t${String(s).padStart(5, '0')}.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await browser.close();
    server.close();
    return;
  }

  // audio track: narration clips placed at their steps, or silence
  const narrList = [];
  for (const sc of tl.scenes) for (const st of sc.steps) if (st.audioKey) narrList.push({ file: narr[st.audioKey].file, at: st.t + 0.15 });
  const vtt = toVtt(tl.cues);
  if (outOverride) fs.mkdirSync(path.dirname(path.resolve(outOverride)), { recursive: true });
  const vttFile = outOverride ? outOverride.replace(/\.mp4$/, '.vtt') : path.join(unitDir, 'captions.vtt');
  fs.writeFileSync(vttFile, vtt);

  const outFile = outOverride ? path.resolve(outOverride) : path.join(unitDir, 'video.mp4');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const tmpFile = outFile + '.tmp.mp4';
  // inputs: 0 = frames, 1..n = narration clips (or 1 = silence), last = captions
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (narrList.length) narrList.forEach((n) => args.push('-i', n.file));
  else args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
  args.push('-i', vttFile);
  const subIdx = Math.max(1, narrList.length) + 1;
  if (narrList.length) {
    const parts = narrList.map((n, i) => `[${i + 1}:a]adelay=${Math.round(n.at * 1000)}:all=1[a${i}]`);
    args.push('-filter_complex', `${parts.join(';')};${narrList.map((_, i) => `[a${i}]`).join('')}amix=inputs=${narrList.length}:normalize=0[aout]`, '-map', '0:v', '-map', '[aout]');
  } else {
    args.push('-map', '0:v', '-map', '1:a');
  }
  args.push('-map', `${subIdx}:s`, '-c:s', 'mov_text', '-metadata:s:s:0', 'language=jpn');
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', String(FPS));
  args.push('-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-t', tl.duration.toFixed(2), tmpFile);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));

  const iv = dynamicIntervals(tl);
  const frames = Math.ceil(tl.duration * FPS);
  const isDynamic = (t) => iv.some(([a, b]) => t >= a - 1 / FPS && t <= b + 1 / FPS);
  let last = null;
  let captured = 0;
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    if (!last || isDynamic(t)) {
      await page.evaluate((t) => window.seek(t), t);
      last = await page.screenshot({ type: 'jpeg', quality: 92 });
      captured++;
    }
    if (!ff.stdin.write(last)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (FPS * 30) === 0) process.stdout.write(`\r  ${Math.round((i / frames) * 100)}%`);
  }
  ff.stdin.end();
  await ffDone;
  await browser.close();
  server.close();
  fs.renameSync(tmpFile, outFile);
  const mb = (fs.statSync(outFile).size / 1e6).toFixed(1);
  console.log(`\r  done: ${frames} frames (${captured} captured) in ${Math.round((Date.now() - started) / 1000)}s -> video.mp4 ${mb}MB`);

  if (outOverride) return;
  fs.writeFileSync(path.join(unitDir, 'video', 'render-hash.txt'), renderHash(unitDir) + '\n');
  // record in unit.yaml
  const unitYaml = path.join(unitDir, 'unit.yaml');
  const doc = YAML.parseDocument(fs.readFileSync(unitYaml, 'utf8'));
  const video = { src: 'video.mp4', captions: 'captions.vtt', duration: Math.round(tl.duration) };
  const manifest = path.join(narrDir, 'manifest.json');
  if (narrList.length && fs.existsSync(manifest)) video.narration = JSON.parse(fs.readFileSync(manifest, 'utf8'))._credit ?? 'VOICEVOX';
  doc.set('video', video);
  fs.writeFileSync(unitYaml, doc.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
