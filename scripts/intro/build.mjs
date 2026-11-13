// 各科目の第0章「この科目について」を生成: chapter.yaml / unit.yaml / source.md / video/script.yaml
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { SUBJECTS } from './data.mjs';
import { T, box, list, reading } from '../bokivideo/lib.mjs';

const plain = (s) => s.replace(/\*\*/g, '');
const read = (s) => reading(plain(s).replace(/NISA/g, 'ニーサ').replace(/iDeCo/g, 'イデコ').replace(/SNS/g, 'エスエヌエス').replace(/SMS/g, 'エスエムエス').replace(/DNA/g, 'ディーエヌエー').replace(/AI/g, 'エーアイ'));
const step = (say, show = [], extra = {}) => { const s = { say: plain(say) }; const r = read(say); if (r !== s.say) s.read = r; if (show.length) s.show = show; return { ...s, ...extra }; };

for (const S of SUBJECTS) {
  const sdir = path.join('content', S.dir);
  const subj = YAML.parse(fs.readFileSync(path.join(sdir, 'subject.yaml'), 'utf8'));
  const chapters = fs.readdirSync(sdir).filter((d) => d !== S.code && fs.existsSync(path.join(sdir, d, 'chapter.yaml')))
    .map((d) => ({ d, ...YAML.parse(fs.readFileSync(path.join(sdir, d, 'chapter.yaml'), 'utf8')) })).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const cdir = path.join(sdir, S.code), udir = path.join(cdir, `${S.code}-01`);
  fs.mkdirSync(path.join(udir, 'video'), { recursive: true });
  fs.writeFileSync(path.join(cdir, 'chapter.yaml'), `id: ${S.code.toLowerCase()}\ntitle: この科目について\norder: 0\nintro: true\n`);
  const uy = path.join(udir, 'unit.yaml');
  let extra = '';
  if (fs.existsSync(uy)) { const old = fs.readFileSync(uy, 'utf8'); const i = old.indexOf('\nvideo:'); if (i >= 0) extra = old.slice(i + 1); }
  fs.writeFileSync(uy, `id: ${subj.id}-${S.code.toLowerCase()}-01\ncode: ${S.code}-01\ntitle: ${subj.title}とは・学ぶ意味\norder: 1\nsummary: ${subj.title}で何を学ぶのか、学ぶとどんな場面で役立つのかを紹介します。\n${extra}`);

  const md = `# ${subj.title}とは・学ぶ意味

## この科目の概要

${S.lead}

## この科目で学ぶこと

| 章 | 内容 |
|---|---|
${chapters.map((c, i) => `| 第${i + 1}章 | ${c.title} |`).join('\n')}

## 学ぶ意味

${S.why.map(([h, t]) => `### ${h}\n\n${t}`).join('\n\n')}

## こんなときに役立つ

${S.use.map((u) => `- ${u}`).join('\n')}

## 学び方のコツ

${S.tips.map((t) => `- ${t}`).join('\n')}
${S.note ? `\n---\n\n${S.note}\n` : ''}`;
  fs.writeFileSync(path.join(udir, 'source.md'), md);

  const n = chapters.length, half = Math.ceil(n / 2);
  const chapList = n > 7
    ? [list(chapters.slice(0, half).map((c, i) => `第${i + 1}章　${c.title}`), { at: [60, 150], w: 580 }), list(chapters.slice(half).map((c, i) => `第${half + i + 1}章　${c.title}`), { at: [660, 150], w: 580 })]
    : [list(chapters.map((c, i) => `第${i + 1}章　${c.title}`), { at: [80, 150] })];
  const scenes = [
    { board: 'slide', steps: [step(`第0章、「この科目について」です。この動画では、${subj.title}がどんな科目なのか、そして、学ぶとどんな良いことがあるのかを紹介します。`, [T(`${subj.title}とは`)]),
      step(S.lead, [box(S.lead, { color: 'yellow', at: [80, 200] })])] },
    { board: 'slide', steps: [step(`この科目は、全部で${n}章です。${chapters.map((c, i) => `第${i + 1}章は${c.title}`).join('、')}。`, [T('この科目で学ぶこと'), ...chapList])] },
    { board: 'whiteboard', steps: [step(`では、${subj.title}を学ぶ意味を、3つ紹介します。`, [T('学ぶ意味')]),
      ...S.why.map(([h, t], i) => step(`${['ひとつ目', 'ふたつ目', 'みっつ目'][i]}は、${h}。${t}`, [box(`**${h}**\n${t}`, { color: ['yellow', 'green', 'blue'][i], at: [80, 140 + i * 165] })]))] },
    { board: 'whiteboard', steps: [step(`たとえば、${S.use.join('、')}、などに役立ちます。`, [T('こんなときに役立つ'), list(S.use, { at: [80, 160] })]),
      step(`学び方のコツは、${S.tips.map(plain).join('。そして、')}。それでは、第1章から始めましょう。`, [box(`**学び方のコツ**\n${S.tips.map((t) => `・${t}`).join('\n')}`, { color: 'pink', at: [80, 420] })])] },
  ];
  fs.writeFileSync(path.join(udir, 'video', 'script.yaml'), YAML.stringify({ title: `${subj.title}とは・学ぶ意味`, scenes }, { lineWidth: 0 }));
}
console.log('intro ok', SUBJECTS.length);
