#!/usr/bin/env python3
"""Generate narration audio for video scripts with a VOICEVOX engine (HTTP API).

For every step in content/.../video/script.yaml, the text `read` (or `say` when absent) is
synthesized into video/narration/<scene>-<step>.m4a. A manifest stores a hash per clip so only
changed steps are regenerated. The renderer (pipeline/render/render.mjs) picks the clips up,
times captions and animation to them, and mixes them into the MP4.

Usage:
  python3 pipeline/narrate.py [--filter math-ma01] [--engine http://localhost:50021]
                              [--speaker 青山龍星] [--style ノーマル]
Requires: ffmpeg, PyYAML, a running VOICEVOX engine (see .github/workflows/videos.yml)
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent

# Symbols that TTS engines read badly. Order matters (longer patterns first).
REPLACEMENTS = [
    (r'(\w)²', r'\1の2乗'), (r'(\w)³', r'\1の3乗'),
    (r'√', 'ルート'), (r'π', 'パイ'),
    (r'[＝=]', 'イコール'), (r'[＋+]', 'プラス'), (r'[×✕]', 'かける'), (r'[÷]', 'わる'),
    (r'[≦≤]', 'イコール小なり'), (r'[≧≥]', 'イコール大なり'),
    (r'(?<=\d)[－−-](?=\d)', 'ひく'), (r'[－−](?=[\dxy])', 'マイナス'),
    (r'(\d+)/(\d+)', r'\2分の\1'),
    (r'[＞>]', '大なり'), (r'[＜<]', '小なり'),
    (r'(?<![A-Za-z])x(?![A-Za-z])', 'エックス'), (r'(?<![A-Za-z])y(?![A-Za-z])', 'ワイ'),
]


def to_reading(text: str) -> str:
    t = str(text)
    for pat, rep in REPLACEMENTS:
        t = re.sub(pat, rep, t)
    return t


def find_scripts(flt: str):
    for script in sorted(ROOT.glob('content/*/*/*/video/script.yaml')):
        unit = yaml.safe_load((script.parent.parent / 'unit.yaml').read_text(encoding='utf-8')) or {}
        if flt and not str(unit.get('id', '')).startswith(flt):
            continue
        yield unit.get('id'), script


def api(engine: str, path: str, params: dict | None = None, body: bytes | None = None, method='POST'):
    url = f'{engine}{path}' + (f'?{urllib.parse.urlencode(params)}' if params else '')
    req = urllib.request.Request(url, data=body, method=method, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def speaker_id(engine: str, name: str, style: str) -> int:
    speakers = json.loads(api(engine, '/speakers', method='GET'))
    for sp in speakers:
        if sp['name'] == name:
            for st in sp['styles']:
                if st['name'] == style:
                    return st['id']
    names = ', '.join(f"{s['name']}({'/'.join(x['name'] for x in s['styles'])})" for s in speakers)
    sys.exit(f'speaker {name}/{style} not found. available: {names}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--filter', default='')
    ap.add_argument('--engine', default='http://localhost:50021')
    ap.add_argument('--speaker', default='青山龍星')
    ap.add_argument('--style', default='ノーマル')
    ap.add_argument('--speed', type=float, default=1.05)
    ap.add_argument('--changed-list', default='', help='write ids of units with new audio to this file')
    ap.add_argument('--out-root', default='', help='write clips to <out-root>/<unit-id>/ instead of the unit (voice samples)')
    a = ap.parse_args()

    sid = speaker_id(a.engine, a.speaker, a.style)
    credit = f'VOICEVOX:{a.speaker}'
    print(f'speaker {credit} ({a.style}) id={sid}')
    made = 0
    changed_units = []
    for uid, script in find_scripts(a.filter):
        before = made
        data = yaml.safe_load(script.read_text(encoding='utf-8'))
        ndir = Path(a.out_root) / uid if a.out_root else script.parent / 'narration'
        ndir.mkdir(parents=True, exist_ok=True)
        ndir.mkdir(exist_ok=True)
        mf = ndir / 'manifest.json'
        manifest = json.loads(mf.read_text()) if mf.exists() else {}
        keep = set()
        for si, scene in enumerate(data.get('scenes') or []):
            for pi, step in enumerate(scene.get('steps') or []):
                text = step.get('read') or step.get('say')
                if not text:
                    continue
                key = f'{si}-{pi}'
                reading = to_reading(text) if not step.get('read') else str(text)
                h = hashlib.sha1(f'{sid}|{a.speed}|{reading}'.encode()).hexdigest()[:12]
                out = ndir / f'{key}.m4a'
                keep.add(out.name)
                if manifest.get(key) == h and out.exists():
                    continue
                q = json.loads(api(a.engine, '/audio_query', {'text': reading, 'speaker': sid}))
                q['speedScale'] = a.speed
                q['prePhonemeLength'] = 0.05
                q['postPhonemeLength'] = 0.1
                wav = api(a.engine, '/synthesis', {'speaker': sid}, json.dumps(q).encode())
                with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
                    tmp.write(wav)
                    tmp.flush()
                    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-ac', '1', '-c:a', 'aac', '-b:a', '48k', str(out)], check=True)
                manifest[key] = h
                made += 1
        for f in ndir.glob('*.m4a'):  # steps that no longer exist
            if f.name not in keep:
                f.unlink()
                manifest.pop(f.stem, None)
        manifest['_credit'] = credit
        mf.write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
        if made > before:
            changed_units.append(uid)
        print(f'{uid}: {made - before} new clips')
    print(f'generated {made} clips')
    if a.changed_list:
        Path(a.changed_list).write_text(''.join(f'{u}\n' for u in changed_units))


if __name__ == '__main__':
    main()
