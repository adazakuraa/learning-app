import { apply } from './build.mjs';
const only = process.argv.slice(2);
for (const f of ['./wh1.mjs', './wh2.mjs', './wh3.mjs']) {
  let mod; try { mod = (await import(f)).default; } catch (e) { if (e.code === 'ERR_MODULE_NOT_FOUND') continue; throw e; }
  for (const spec of mod) if (!only.length || only.includes(spec.code)) { apply(spec); console.log('ok', spec.code); }
}
