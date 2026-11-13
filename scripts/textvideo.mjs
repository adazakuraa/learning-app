// Build a video script (script.yaml) from a structured source.md (used for medicine).
// Expected source: "## まず覚えること" (3 bullets) then sections with bullets / numbered lists / tables / paragraphs.
// Usage: node scripts/textvideo.mjs <subject-dir> [unit-code ...]
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const COLORS = ['yellow', 'pink', 'blue', 'green'];
const NUM = ['①', '②', '③', '④', '⑤'];
const plain = (s) => s.replace(/\*\*/g, '').replace(/`/g, '');
// subtitle text: no markdown, shorter punctuation
const sayText = (s) => plain(s).replace(/：/g, '、').replace(/＋/g, 'と').replace(/。$/, '').replace(/→/g, '、').replace(/／/g, '、').replace(/[（(]/g, '、').replace(/[）)]/g, '、')
  .replace(/、\s*、/g, '、').replace(/、([。！？])/g, '$1').replace(/^、|、$/g, '').replace(/\s+/g, '');
// TTS reading
export function reading(s) {
  return s
    .replace(/#7119/g, 'シャープ、ななないちいちきゅう').replace(/#8000/g, 'シャープ、はっせん')
    .replace(/(?<![\d])119(?![\d])/g, 'いちいちきゅう').replace(/(?<![\d])110番/g, 'ひゃくとおばん')
    .replace(/(\d+)\/(\d+)/g, '$1の$2').replace(/〜/g, 'から').replace(/～/g, 'から')
    .replace(/%/g, 'パーセント').replace(/℃/g, '度').replace(/(\d)m(?![a-zA-Z])/g, '$1メートル').replace(/(\d)cm/g, '$1センチ')
    .replace(/(\d)mSv/g, '$1ミリシーベルト').replace(/BMI/g, 'ビーエムアイ').replace(/CT/g, 'シーティー').replace(/MRI/g, 'エムアールアイ')
    .replace(/HPV/g, 'エイチピーブイ').replace(/AED/g, 'エーイーディー').replace(/HbA1c/g, 'ヘモグロビンエーワンシー').replace(/LDL/g, 'エルディーエル')
    .replace(/0120-279-338/g, 'ゼロイチニーゼロ、ニーナナキュウ、サンサンハチ').replace(/0570-064-556/g, 'ゼロゴーナナゼロ、ゼロロクヨン、ゴーゴーロク')
    .replace(/0570-783-556/g, 'ゼロゴーナナゼロ、ナナハチサン、ゴーゴーロク').replace(/072-727-2499/g, 'ゼロナナニー、ナナニーナナ、ニーヨンキュウキュウ');
}
const step = (say, show, extra = {}) => {
  const s = { say, show };
  const r = reading(say);
  if (r !== say) s.read = r;
  return { ...s, ...extra };
};

function parseSections(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const secs = [];
  let cur = null;
  for (const ln of lines) {
    if (/^# /.test(ln)) continue;
    if (/^---\s*$/.test(ln)) break; // footer
    const h = ln.match(/^##+\s+(.*)/);
    if (h) { cur = { head: h[1].trim(), blocks: [] }; secs.push(cur); continue; }
    if (!cur) { cur = { head: '', blocks: [] }; secs.push(cur); }
    const last = cur.blocks[cur.blocks.length - 1];
    if (/^\s*([-*]|\d+\.)\s+/.test(ln)) {
      const item = ln.replace(/^\s*([-*]|\d+\.)\s+/, '').trim();
      if (last?.type === 'list') last.items.push(item); else cur.blocks.push({ type: 'list', items: [item] });
    } else if (/^\|/.test(ln)) {
      const cells = ln.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      if (last?.type === 'table') last.rows.push(cells); else cur.blocks.push({ type: 'table', head: cells, rows: [] });
    } else if (ln.trim()) {
      if (last?.type === 'para') last.text += ln.trim(); else cur.blocks.push({ type: 'para', text: ln.trim() });
    }
  }
  return secs;
}

function lead(head) {
  if (/119/.test(head)) return '次のようなときは、すぐに119番に電話します。';
  if (/今日中/.test(head)) return '次のようなときは、夜間や休日でも、今日中に受診しましょう。';
  if (/数日以内/.test(head)) return '次のようなときは、数日以内に受診しましょう。';
  if (/様子見/.test(head)) return '一方で、次のような場合は、家で様子を見てよいことが多いです。';
  if (/知っておきたい病気|よくある病気|主な病気|子どもに多い病気|主な感染症/.test(head)) return 'ここで、知っておきたい病気を、かんたんに紹介します。';
  if (/自分でできること/.test(head)) return '自分でできることも、覚えておきましょう。';
  return `次は、${plain(head)}です。`;
}

function urgencyTag(head) {
  const t = (text, color) => ({ type: 'tag', text, color, at: [1010, 52] });
  if (/119/.test(head)) return t('緊急度：最高', 'pink');
  if (/今日中/.test(head)) return t('緊急度：高', 'yellow');
  if (/数日以内/.test(head)) return t('緊急度：中', 'blue');
  if (/様子見/.test(head)) return t('緊急度：低', 'green');
  return null;
}
// turn one section into scenes (paginate so a board never gets too full)
function sectionScenes(sec) {
  const scenes = [];
  let scene = null, load = 0, first = true;
  const title = plain(sec.head);
  const newScene = () => { scene = { board: 'whiteboard', steps: [] }; scenes.push(scene); load = 0; };
  const add = (say, show, cost) => {
    if (!scene || load + cost > 6) {
      newScene();
      const tag = urgencyTag(sec.head);
      show = [{ type: 'title', text: scenes.length > 1 ? `${title}（つづき）` : title }, ...(tag ? [tag] : []), ...show];
    }
    if (first) { say = lead(sec.head) + say; first = false; }
    scene.steps.push(step(say, show));
    load += cost;
  };
  for (const b of sec.blocks) {
    if (b.type === 'list') {
      for (let i = 0; i < b.items.length; i += 3) {
        const items = b.items.slice(i, i + 3);
        const say = items.map((x) => sayText(x) + '。').join('');
        add(say, [{ type: 'list', items }], items.reduce((c, x) => c + (plain(x).length > 34 ? 1.6 : 1), 0));
      }
    } else if (b.type === 'table') {
      const hd = b.head;
      b.rows.forEach((r, i) => {
        const rest = r.slice(1).map((c, j) => (hd.length > 2 && hd[j + 1] ? `${plain(hd[j + 1])}：${c}` : c));
        const text = rest.join('　');
        let say;
        if (hd.length > 2) say = `${sayText(r[0])}。` + r.slice(1).map((c, j) => `${plain(hd[j + 1])}は、${sayText(c)}`).join('、') + '。';
        else say = `${sayText(r[0])}。${sayText(r[1] ?? '')}。`;
        add(say, [{ type: 'box', color: COLORS[i % 4], w: 1100, title: r[0], text }], text.length > 40 ? 2.2 : 1.6);
      });
    } else if (b.type === 'para') {
      add(sayText(b.text).replace(/。?$/, '。'), [{ type: 'text', text: b.text, w: 1100 }], plain(b.text).length > 40 ? 2 : 1);
    }
  }
  return scenes;
}

export function buildScript({ title, summary, chapter, chapterNo, chapterUnits, isFirst, md }) {
  const secs = parseSections(md);
  const keySec = secs.find((s) => /まず覚えること/.test(s.head));
  const keys = keySec?.blocks.find((b) => b.type === 'list')?.items ?? [];
  const scenes = [];
  if (isFirst) {
    scenes.push({ board: 'slide', steps: [
      step(`第${chapterNo}章、「${chapter}」です。`, [{ type: 'title', text: `第${chapterNo}章　${chapter}` }]),
      step(`この章では、${chapterUnits.map((t) => t.replace(/：.*/, '')).join('、')}を学びます。`, [{ type: 'list', items: chapterUnits }]),
    ] });
  }
  scenes.push({ board: 'whiteboard', steps: [
    step(`「${title}」です。${sayText(summary)}`, [{ type: 'title', text: title }]),
    step(`この単元で、まず覚えてほしいことは、${keys.length}つです。`, []),
    ...keys.map((k, i) => step(sayText(k) + '。', [{ type: 'box', color: COLORS[i % 4], w: 1100, text: `${NUM[i]} ${k}` }])),
  ] });
  for (const s of secs) if (s !== keySec) scenes.push(...sectionScenes(s));
  scenes.push({ board: 'whiteboard', steps: [
    step('最後に、この単元で覚えることを、もう一度確認しましょう。', [{ type: 'title', text: 'まとめ' }, { type: 'list', items: keys.map((k, i) => `${NUM[i]} ${k}`) }]),
    step(keys.map((k) => sayText(k) + '。').join('') + '迷ったときは、ためらわずに、相談や受診をしてください。', []),
  ] });
  // drop empty show lists
  for (const sc of scenes) for (const st of sc.steps) if (!st.show.length) delete st.show;
  return { title, scenes };
}

if (process.argv[1].endsWith('textvideo.mjs')) {
  const [dir, ...only] = process.argv.slice(2);
  const chapters = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'chapter.yaml'))).sort();
  chapters.forEach((ch) => {
    const cy = YAML.parse(fs.readFileSync(path.join(dir, ch, 'chapter.yaml'), 'utf8'));
    const units = fs.readdirSync(path.join(dir, ch)).filter((d) => fs.existsSync(path.join(dir, ch, d, 'unit.yaml'))).sort();
    const metas = units.map((u) => YAML.parse(fs.readFileSync(path.join(dir, ch, u, 'unit.yaml'), 'utf8')));
    units.forEach((u, i) => {
      if (only.length && !only.includes(u)) return;
      const ud = path.join(dir, ch, u);
      const s = buildScript({ title: metas[i].title, summary: metas[i].summary, chapter: cy.title, chapterNo: cy.order, chapterUnits: metas.map((m) => m.title), isFirst: i === 0, md: fs.readFileSync(path.join(ud, 'source.md'), 'utf8') });
      fs.mkdirSync(path.join(ud, 'video'), { recursive: true });
      fs.writeFileSync(path.join(ud, 'video', 'script.yaml'), YAML.stringify(s, { lineWidth: 0 }));
      console.log('ok', u, s.scenes.length, 'scenes');
    });
  });
}
