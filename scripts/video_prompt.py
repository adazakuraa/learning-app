#!/usr/bin/env python3
"""Print the full instruction set for generating one unit's video.

Combines: pipeline/guidelines.md + subject / chapter / unit `generation` settings + source.md.
This is what an AI agent (e.g. Claude Code) reads before writing the video script.

Usage: python3 scripts/video_prompt.py <unit-id>      e.g. math-ma01-02
"""
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent


def load(p: Path) -> dict:
    return yaml.safe_load(p.read_text(encoding='utf-8')) or {} if p.exists() else {}


def find_unit(unit_id: str) -> Path:
    for p in (ROOT / 'content').glob('*/*/*/unit.yaml'):
        if load(p).get('id') == unit_id:
            return p.parent
    sys.exit(f'unit not found: {unit_id}')


def section(name: str, gen: dict) -> str:
    if not gen:
        return ''
    lines = [f'## {name}の指示']
    if gen.get('style') and gen['style'] != 'auto':
        lines.append(f'- 表現方法: {gen["style"]}')
    for i in gen.get('instructions') or []:
        lines.append(f'- {i}')
    return '\n'.join(lines) + '\n' if len(lines) > 1 else ''


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    udir = find_unit(sys.argv[1])
    unit, chapter, subject = load(udir / 'unit.yaml'), load(udir.parent / 'chapter.yaml'), load(udir.parent.parent / 'subject.yaml')
    out = [
        (ROOT / 'pipeline' / 'guidelines.md').read_text(encoding='utf-8'),
        f'# 対象単元\n- 科目: {subject.get("title")}\n- 章: {chapter.get("title")}\n- 単元: {unit.get("code", "")} {unit.get("title")}\n',
        section(f'科目「{subject.get("title")}」', subject.get('generation') or {}),
        section(f'章「{chapter.get("title")}」', chapter.get('generation') or {}),
        section('この単元', unit.get('generation') or {}),
        '# 元教材（source.md）\n',
        (udir / 'source.md').read_text(encoding='utf-8'),
    ]
    print('\n'.join(x for x in out if x))


if __name__ == '__main__':
    main()
