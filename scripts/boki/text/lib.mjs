// Writes 簿記3級 chapters/units: chapter.yaml, unit.yaml, source.md and SVG figures.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = 'content/20-boki';
fs.mkdirSync(ROOT, { recursive: true });
fs.writeFileSync(`${ROOT}/subject.yaml`, 'id: boki\ntitle: 簿記3級\ngroup: 資格\norder: 20\n');
let chap = null, uorder = 0;
export function chapter(code, title, order) {
  chap = path.join(ROOT, code); uorder = 0;
  fs.mkdirSync(chap, { recursive: true });
  fs.writeFileSync(path.join(chap, 'chapter.yaml'), `id: ${code.toLowerCase()}\ntitle: ${title}\norder: ${order}\n`);
}
/** figs: { 'name.svg': svgString } — reference in md as ![説明](name.svg) */
export function unit(code, title, summary, md, figs = {}) {
  const dir = path.join(chap, code); uorder++;
  fs.mkdirSync(dir, { recursive: true });
  const uy = path.join(dir, 'unit.yaml');
  let extra = '';
  if (fs.existsSync(uy)) { const old = fs.readFileSync(uy, 'utf8'); const i = old.indexOf('\nvideo:'); if (i >= 0) extra = old.slice(i + 1); }
  fs.writeFileSync(uy, `id: boki-${code.toLowerCase()}\ncode: ${code}\ntitle: ${title}\norder: ${uorder}\nsummary: ${summary}\n${extra}`);
  for (const [n, s] of Object.entries(figs)) fs.writeFileSync(path.join(dir, n), s);
  for (const m of md.matchAll(/\]\(([^)]+\.svg)\)/g)) if (!figs[m[1]]) throw new Error(`${code}: missing fig ${m[1]}`);
  fs.writeFileSync(path.join(dir, 'source.md'), `# ${title}\n\n${md.trim()}\n`);
}
/** journal entry table. rows: [[借方科目, 金額, 貸方科目, 金額], ...] */
export function jt(rows) {
  const f = (v) => (v === '' || v == null ? '' : typeof v === 'number' ? v.toLocaleString('ja-JP') : v);
  return ['| 借方科目 | 金額 | 貸方科目 | 金額 |', '|---|--:|---|--:|', ...rows.map((r) => `| ${f(r[0])} | ${f(r[1])} | ${f(r[2])} | ${f(r[3])} |`)].join('\n');
}
