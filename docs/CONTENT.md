# 教材の追加方法

```
content/
  <科目フォルダ>/subject.yaml
  <科目フォルダ>/<章フォルダ>/chapter.yaml
  <科目フォルダ>/<章フォルダ>/<単元フォルダ>/
    unit.yaml      必須
    source.md      元の教材（Notion から取り込んだまま。手で直さない）
    lesson.md      学習用テキスト（任意。無ければ source.md を表示）
    captions.vtt   字幕（WebVTT）
    video.mp4      動画（任意。別リポジトリの URL も指定可）
    *.png ...      画像（Markdown から相対パスで参照）
```

- フォルダ名の先頭に `_` を付けると無視される（下書き用）。
- 並び順は `order`、無ければフォルダ名順。

## subject.yaml / chapter.yaml

```yaml
id: info-processing     # 英小文字・数字・ハイフン
title: 情報処理
description: 任意の説明
order: 1
```

## unit.yaml

```yaml
id: tcp-ip                         # 全単元で一意。進捗データのキーになるので後から変えない
title: TCP/IP
summary: 一覧に表示する概要
order: 1
video:
  src: video.mp4                   # または https://<user>.github.io/learning-videos-1/tcp-ip.mp4
  captions: captions.vtt
  duration: 420                    # 秒（任意）
generation:                        # 動画生成時の追加指示（アプリには表示されない）
  style: animation                 # slide | animation | whiteboard | mixed
  instructions:
    - 具体的な日常生活の例を入れてほしい
```

## 動画ファイル

- H.264 + AAC の MP4、`-movflags +faststart` 付き（Safari で確実に再生するため）。
- 1ファイル 100MB 未満。リポジトリが大きくなったら動画専用リポジトリ（GitHub Pages 有効）に置き、`video.src` に URL を書く。
