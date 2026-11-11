// Render every unit whose video/script.yaml is newer than its video.mp4 (or has no video yet).
//   node pipeline/render/batch.mjs [--jobs 3] [--filter math-]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const jobs = Number(args.includes('--jobs') ? args[args.indexOf('--jobs') + 1] : 3);
const filter = args.includes('--filter') ? args[args.indexOf('--filter') + 1] : '';

const todo = [];
const walk = (d, depth) => {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (!fs.statSync(p).isDirectory()) continue;
    if (depth < 2) walk(p, depth + 1);
    else {
      const script = path.join(p, 'video', 'script.yaml');
      const unitYaml = path.join(p, 'unit.yaml');
      if (!fs.existsSync(script) || !fs.existsSync(unitYaml)) continue;
      const id = YAML.parse(fs.readFileSync(unitYaml, 'utf8')).id;
      if (filter && !id.startsWith(filter)) continue;
      const mp4 = path.join(p, 'video.mp4');
      const newest = Math.max(...fs.readdirSync(path.join(p, 'video'), { recursive: true }).map((f) => fs.statSync(path.join(p, 'video', String(f))).mtimeMs));
      if (!fs.existsSync(mp4) || fs.statSync(mp4).mtimeMs < newest) todo.push(id);
    }
  }
};
walk(path.join(ROOT, 'content'), 0);
console.log(`${todo.length} videos to render (${jobs} at a time)`);

let failed = 0;
const run = (id) =>
  new Promise((res) => {
    const p = spawn('node', [path.join(ROOT, 'pipeline/render/render.mjs'), id], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('close', (code) => {
      const last = out.split(/[\r\n]/).filter((l) => /done:|outside|Error|warning/i.test(l));
      console.log(`${code === 0 ? 'OK ' : 'NG '} ${id} ${last.join(' | ')}`);
      if (code !== 0) failed++;
      res();
    });
  });
const queue = [...todo];
await Promise.all(Array.from({ length: jobs }, async () => {
  while (queue.length) await run(queue.shift());
}));
console.log(`finished: ${todo.length - failed} ok, ${failed} failed`);
process.exit(failed ? 1 : 0);
