#!/usr/bin/env python3
"""Import a Notion "Markdown & CSV" export into content/.

Expected export layout (top page = 勉強用テキスト):
    <root>.md                     links to subject pages, grouped by "## 文系学問" etc.
    <root>/<科目> <id>.md          one page per subject
    <root>/<科目>/<image files>    images used by that subject

Inside a subject page:
    # 数学                         subject title (skipped)
    # MA01｜数と計算の基礎           chapter
    ### MA01-01｜指数と累乗          unit (#### is accepted too)
    ...unit body...

Output:
    content/<NN>-<slug>/subject.yaml
    content/<NN>-<slug>/<code>/chapter.yaml
    content/<NN>-<slug>/<code>/<code>/unit.yaml, source.md, images (WebP)

Re-running is safe: source.md and images are regenerated, while hand-written files
(lesson.md, captions, videos) and extra keys in unit.yaml (video, generation, summary) are kept.

Usage: python3 scripts/import_notion.py <export dir> [content dir]
Requires: Pillow, PyYAML
"""
import re
import shutil
import sys
import urllib.parse
from pathlib import Path

import yaml
from PIL import Image

# Notion subject title -> stable URL-safe slug (used in unit ids; never change once used)
SLUGS = {
    'ロジカルシンキング': 'logical-thinking',
    '哲学': 'philosophy',
    '宗教': 'religion',
    '心理学': 'psychology',
    '国語': 'japanese',
    '日本史': 'japanese-history',
    '世界史': 'world-history',
    '地理': 'geography',
    '英語': 'english',
    '社会学': 'sociology',
    '政治・経済': 'politics-economics',
    '数学': 'math',
    '物理': 'physics',
    '化学': 'chemistry',
    '生物学': 'biology',
    '地学': 'earth-science',
    '情報': 'information',
}

CHAPTER_RE = re.compile(r'^# ([A-Z]{2})(\d{2,3})\s*｜\s*(.+?)\s*$')
UNIT_RE = re.compile(r'^#{3,4} ([A-Z]{2}\d{2}-\d{2})\s*｜\s*(.+?)\s*$')
IMG_RE = re.compile(r'!\[([^\]]*)\]\(([^)\s]+)\)')
MAX_W = 1600

warnings: list[str] = []


def clean_title(t: str) -> str:
    return re.sub(r'\*\*(.+?)\*\*', r'\1', t).strip()


def strip_notion_id(name: str) -> str:
    return re.sub(r'\s+[0-9a-f]{32}$', '', name)


def convert_image(src: Path, dest_dir: Path) -> str:
    """Convert to WebP (max width 1600) unless that would not help. Returns output file name."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() in ('.gif', '.svg'):
        shutil.copy2(src, dest_dir / src.name)
        return src.name
    out = dest_dir / (src.stem + '.webp')
    with Image.open(src) as im:
        im = im.convert('RGBA') if im.mode in ('P', 'LA', 'RGBA') else im.convert('RGB')
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.save(out, 'WEBP', quality=85, method=6)
    if out.stat().st_size >= src.stat().st_size:
        out.unlink()
        shutil.copy2(src, dest_dir / src.name)
        return src.name
    return out.name


def write_yaml(path: Path, data: dict, keep_existing: bool = False):
    if keep_existing and path.exists():
        old = yaml.safe_load(path.read_text(encoding='utf-8')) or {}
        old.update(data)
        data = old
    path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding='utf-8')


def parse_root(export: Path):
    roots = [p for p in export.glob('*.md')]
    if len(roots) != 1:
        sys.exit(f'expected exactly one top-level .md in {export}, found {len(roots)}')
    root_md = roots[0]
    root_dir = export / strip_notion_id(root_md.stem)
    subjects, group = [], ''
    for line in root_md.read_text(encoding='utf-8').splitlines():
        if line.startswith('## '):
            group = line[3:].strip()
        m = re.match(r'^\[(.+?)\]\((.+?\.md)\)\s*$', line)
        if m:
            file = export / urllib.parse.unquote(m.group(2))
            subjects.append({'title': m.group(1), 'file': file, 'group': group})
    return root_dir, subjects


def import_subject(order: int, subj: dict, root_dir: Path, content: Path):
    title = subj['title']
    slug = SLUGS.get(title)
    if not slug:
        sys.exit(f'no slug for subject "{title}" – add it to SLUGS in {__file__}')
    sdir = content / f'{order:02d}-{slug}'
    sdir.mkdir(parents=True, exist_ok=True)
    write_yaml(sdir / 'subject.yaml', {'id': slug, 'title': title, 'group': subj['group'], 'order': order}, keep_existing=True)

    lines = subj['file'].read_text(encoding='utf-8').splitlines()
    chapters: list[dict] = []
    preamble = []
    for i, line in enumerate(lines):
        if i == 0 and line.startswith('# '):
            continue  # subject title
        if m := CHAPTER_RE.match(line):
            code = f'{m.group(1)}{int(m.group(2)):02d}'
            if code != m.group(1) + m.group(2):
                warnings.append(f'{title}: 章コード "{m.group(1)}{m.group(2)}" を "{code}" として扱いました')
            chapters.append({'code': code, 'title': clean_title(m.group(3)), 'units': []})
        elif m := UNIT_RE.match(line):
            if not chapters:
                warnings.append(f'{title}: unit {m.group(1)} before any chapter')
                continue
            if line.startswith('####'):
                warnings.append(f'{title}: "{line.strip()}" は見出しレベル4ですが単元として扱いました')
            units = chapters[-1]['units']
            if units and units[-1]['code'] == m.group(1) and units[-1]['title'] == clean_title(m.group(2)):
                # same heading written twice in a row: keep one unit, both bodies
                warnings.append(f'{title}: 見出し "{line.strip()}" が2回続いていたため、1つの単元にまとめました')
                units[-1]['body'].append('')
                continue
            units.append({'code': m.group(1), 'title': clean_title(m.group(2)), 'body': []})
        elif line.startswith('#') and re.match(r'^#{1,4} ', line):
            warnings.append(f'{title}: 想定外の見出し "{line.strip()[:50]}"（本文として扱いました）')
            (chapters[-1]['units'][-1]['body'] if chapters and chapters[-1]['units'] else preamble).append(line)
        elif chapters and chapters[-1]['units']:
            chapters[-1]['units'][-1]['body'].append(line)
        elif line.strip():
            (preamble if not chapters else preamble).append(line)
    if any(l.strip() for l in preamble):
        warnings.append(f'{title}: 単元に属さない本文があります（取り込まれていません）: {" / ".join(l.strip()[:30] for l in preamble if l.strip())[:120]}')

    seen = set()
    unit_count = 0
    for ci, ch in enumerate(chapters, 1):
        cdir = sdir / ch['code']
        cdir.mkdir(exist_ok=True)
        write_yaml(cdir / 'chapter.yaml', {'id': ch['code'].lower(), 'title': ch['title'], 'order': ci}, keep_existing=True)
        if not ch['units']:
            warnings.append(f'{title}: 章 {ch["code"]} に単元がありません')
        for ui, u in enumerate(ch['units'], 1):
            code = u['code']
            if code in seen:
                warnings.append(f'{title}: 単元コード {code} が重複しています')
                code = f'{code}-{ui}'
            seen.add(code)
            if not code.startswith(ch['code']):
                warnings.append(f'{title}: 単元 {code} が章 {ch["code"]} の下にあります')
            udir = cdir / code
            udir.mkdir(exist_ok=True)
            for old in udir.iterdir():  # regenerate images
                if old.suffix.lower() in ('.webp', '.png', '.jpg', '.jpeg', '.gif'):
                    old.unlink()

            def repl(m: re.Match) -> str:
                alt, href = m.group(1), m.group(2)
                if re.match(r'^[a-z]+:', href):
                    return m.group(0)
                src = subj['file'].parent / urllib.parse.unquote(href)
                if not src.exists():
                    warnings.append(f'{title} {u["code"]}: 画像が見つかりません {urllib.parse.unquote(href)}')
                    return m.group(0)
                name = convert_image(src, udir)
                # Notion uses the file name as alt text; keep author-written alt text only
                if re.fullmatch(r'\d+\.(png|jpe?g|gif|webp)', alt):
                    alt = ''
                return f'![{alt}]({name})'

            body = '\n'.join(u['body']).strip('\n')
            body = IMG_RE.sub(repl, body)
            (udir / 'source.md').write_text(f'# {u["title"]}\n\n{body}\n', encoding='utf-8')
            write_yaml(
                udir / 'unit.yaml',
                {'id': f'{slug}-{code.lower()}', 'code': code, 'title': u['title'], 'order': ui},
                keep_existing=True,
            )
            unit_count += 1
    return len(chapters), unit_count


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    export = Path(sys.argv[1])
    content = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / 'content')
    root_dir, subjects = parse_root(export)
    total_c = total_u = 0
    for i, s in enumerate(subjects, 1):
        if not s['file'].exists():
            warnings.append(f'科目ページが見つかりません: {s["file"]}')
            continue
        c, u = import_subject(i, s, root_dir, content)
        total_c += c
        total_u += u
        print(f'{s["title"]}: {c} 章 / {u} 単元')
    print(f'合計: {len(subjects)} 科目 / {total_c} 章 / {total_u} 単元')
    if warnings:
        print('\n注意:')
        for w in warnings:
            print(' -', w)


if __name__ == '__main__':
    main()
