# 解説動画の作り方

動画は「台本（script.yaml）」から自動で描画して MP4 にする。AI は台本を書くだけで、映像生成 AI は使わない。
これにより、内容の正確さを保ちつつ、修正は台本の一部を直して再描画するだけで済む。

## 流れ

0. 章の1本目の動画は、冒頭で章の概要と学ぶ目的に軽く触れる。練習問題は単元の動画に入れず、章末の「練習問題」単元（`<章>-PR`）の動画で扱う。
1. 指示を確認する: `python3 scripts/video_prompt.py <単元ID>`
   - `pipeline/guidelines.md`（共通ルール）＋科目・章・単元の `generation` 指示＋元教材 `source.md`
2. 台本を書く: `content/.../<単元>/video/script.yaml`（AI エージェントが作成）
3. 静止画で確認: `node pipeline/render/render.mjs <単元ID> --stills 10,60,120`
4. MP4 を書き出す: `node pipeline/render/render.mjs <単元ID>`
   - `video.mp4`（1920x1080, H.264, 字幕トラック入り）と `captions.vtt` を単元フォルダに出力
   - `unit.yaml` の `video` が自動で設定され、アプリで再生できるようになる

## 台本の書き方（概要）

```yaml
title: 数の種類
scenes:
  - board: whiteboard            # whiteboard（黒板風） | slide
    steps:
      - say: 字幕（ナレーション）の文。長い文は2行ずつに自動分割される
        show:                    # この文を話している間に描かれる要素
          - { type: title, text: 数の種類 }
          - { type: text, text: "**強調**は黄色になる", at: [80, 300] }
        pause: 3                 # 問題の「考える時間」など
        added: true              # 元教材にない補足（確認対象の目印）
```

要素: `title` `text` `list` `box` `formula`（KaTeX）`image`（単元フォルダの画像）`svg`（図を自由に描く。線は描かれるアニメーション）`arrow` `tag`
共通: `at: [x, y]`（1280x720 の座標。省略で上から順に配置）`size: s|m|l|xl` `color: white|yellow|blue|pink|green|gray`
`anim: write|fade|pop|draw|none` `delay` `dur` `move: { to: [x, y], dur }`、ステップに `mark: [id]`（マーカー）`hide: [id]`

詳しくは `pipeline/render/compile.mjs` の先頭のコメントを参照。

## ナレーション（音声）

`video/narration/<シーン番号>-<ステップ番号>.wav` を置くと、その長さに合わせて字幕と映像のタイミングが調整され、音声付きで書き出される。
音声合成ツールは固定しない（VOICEVOX などで生成して置く）。音声がなければ字幕のみの動画になる。

## 容量

1単元（5〜8分）で数MB〜十数MB。リポジトリが大きくなったら、動画専用リポジトリ（GitHub Pages 有効）に移し、`unit.yaml` の `video.src` を URL にする。
