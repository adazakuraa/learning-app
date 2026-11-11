#!/usr/bin/env python3
"""Collect the practice problems of each chapter into a "練習問題" unit at the end of the chapter.

A unit has practice problems when its source.md contains a top-level list item "- 問題"
followed by "- 答え" / "- 解答". For every chapter with at least one such unit this writes
    content/<subject>/<chapter>/<chapter>-PR/unit.yaml, source.md (+ referenced images)
The original units are not changed. Re-run after importing / correcting materials.

Usage: python3 scripts/build_practice.py [content dir]
"""
import re
import shutil
import sys
from pathlib import Path

import yaml

TOP = re.compile(r'^- (.*)$')
IMG = re.compile(r'!\[[^\]]*\]\(([^)\s]+)\)')


def load(p: Path) -> dict:
    return (yaml.safe_load(p.read_text(encoding='utf-8')) or {}) if p.exists() else {}


def extract(md: str) -> str | None:
    """Return the '- 問題' ... '- 答え/解答' block (top-level list items) or None."""
    lines = md.splitlines()
    start = next((i for i, l in enumerate(lines) if re.match(r'^- 問題\s*$', l)), None)
    if start is None:
        return None
    end = len(lines)
    seen_answer = False
    for i in range(start + 1, len(lines)):
        l = lines[i]
        m = TOP.match(l)
        if m:
            if re.match(r'^(答え|解答)\s*$', m.group(1)):
                seen_answer = True
                continue
            end = i
            break
        if l.strip() and not l.startswith((' ', '\t')):  # non-list paragraph ends the block
            end = i
            break
    if not seen_answer:
        return None
    return '\n'.join(lines[start:end]).rstrip()


def main():
    content = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / 'content')
    made = 0
    for chapter_yaml in sorted(content.glob('*/*/chapter.yaml')):
        cdir = chapter_yaml.parent
        subject = load(cdir.parent / 'subject.yaml')
        chapter = load(chapter_yaml)
        code = cdir.name
        pdir = cdir / f'{code}-PR'
        units = []
        for uy in cdir.glob('*/unit.yaml'):
            if uy.parent == pdir:
                continue
            u = load(uy)
            src = uy.parent / 'source.md'
            block = extract(src.read_text(encoding='utf-8')) if src.exists() else None
            if block:
                units.append((u.get('order', 999), u, uy.parent, block))
        if not units:
            if pdir.exists():
                shutil.rmtree(pdir)
            continue
        pdir.mkdir(exist_ok=True)
        for old in pdir.iterdir():
            if old.suffix.lower() in ('.webp', '.png', '.jpg', '.jpeg', '.gif'):
                old.unlink()
        parts = ['# 練習問題', '', f'この章（{chapter.get("title")}）の練習問題をまとめたものです。', '']
        for _, u, udir, block in sorted(units, key=lambda x: x[0]):
            for m in IMG.finditer(block):
                src = udir / m.group(1)
                if src.exists():
                    shutil.copy2(src, pdir / src.name)
            parts += [f'## {u.get("title")}（{u.get("code", "")}）', '', block, '']
        (pdir / 'source.md').write_text('\n'.join(parts), encoding='utf-8')
        uy = pdir / 'unit.yaml'
        data = load(uy)
        data.update({
            'id': f'{subject["id"]}-{chapter["id"]}-practice',
            'code': f'{code}-PR',
            'title': '練習問題',
            'summary': '、'.join(str(u.get('title')) for _, u, _, _ in sorted(units, key=lambda x: x[0])) + ' の問題',
            'order': 999,
            'practice': True,
        })
        uy.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding='utf-8')
        made += 1
        print(f'{subject.get("title")} {code}: {len(units)} 単元分の問題')
    print(f'練習問題ユニット: {made} 章')


if __name__ == '__main__':
    main()
