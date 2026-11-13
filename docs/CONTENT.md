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

## Notion からの取り込み（一括）

1. Notion の「勉強用テキスト」ページで エクスポート → Markdown & CSV、サブページを含める
2. zip を GitHub の Releases に添付する（スマホのブラウザから可）
3. Claude Code に「Releases の zip を取り込んで」と依頼する。内部では次を実行する:

```sh
unzip export.zip -d /tmp/export
python3 scripts/import_notion.py /tmp/export content
```

- 科目ページの `# XX01｜章名` が章、`### XX01-01｜単元名` が単元になる。
- 画像は WebP に変換・縮小（最大幅1600px）して単元フォルダに置く。
- 再実行しても `lesson.md`・動画・字幕・`unit.yaml` の追加項目（video, generation, summary）は消えない。
- 単元 ID（例: `math-ma01-02`）は進捗データのキー。Notion 側で単元コードを変えると別単元扱いになるので注意。

## 動画生成の指示

- 全科目共通のルール: `pipeline/guidelines.md`
- 科目ごとの指示: `content/<科目>/subject.yaml` の `generation`
- 章・単元ごとの指示: `chapter.yaml` / `unit.yaml` の `generation`（同じ形式）

```yaml
generation:
  style: auto          # auto | slide | animation | whiteboard | mixed
  instructions:
    - 具体的な日常生活の例を入れてほしい
```

AI に渡す指示一式は `python3 scripts/video_prompt.py <単元ID>` で確認できる。

## 練習問題（章末）

`python3 scripts/build_practice.py` で、各単元の「- 問題」「- 答え/解答」をまとめた「練習問題」単元（`<章>-PR`）を章の最後に作る。
問題がない章には作られない。教材の取り込み・訂正のあとに実行する。

## 章末の練習問題（quiz.yaml）

章フォルダに `quiz.yaml` を置くと、その章の最後に「練習問題」が出る（動画は作らない）。答えは入力式で、選択肢はない。

```yaml
questions:
  - q: 問題文（**太字** や $数式$ も使える）
    a: [正解, 別の書き方]   # どれか1つと一致すれば正解（全角半角・カタカナひらがな・空白・記号の違いは無視）
    r: [よみがな]           # 任意。漢字の答えの読みがな（自動の読みが間違うときだけ書く）
    show: 画面に出す答え     # 任意。省略すると a の最初
    explain: 解説            # 任意
```

- 漢字の答えは、ビルド時に kuromoji で読みがなを自動で足すので、ひらがなで答えても正解になる。
- 判定が厳しすぎた場合に備え、画面に「書き方が違うだけで合っていた → 正解にする」ボタンがある。
- 結果（最高点・最終点・回数・全問正解した日時）は進捗データの `quizzes` に保存され、GitHub 同期の対象になる。
- 既存の「練習問題」単元（`<章>-PR`）がある章には quiz.yaml を置いていない。

## 早押しクイズ（content/hayaoshi/*.yaml）

ジャンルごとに1ファイル。`p` は「一般の大人が答えられる割合（%）」の予想で、難易度の自動調整に使う。

```yaml
genre: 日本史
questions:
  - {p: 85, q: "前半に難しい情報、後半に答えやすい情報を置いた問題文…何でしょう？", a: [正解, 別解], r: [よみがな], show: 表示用の答え}
```

- 問題文は「前ほど難しく、後ろほど易しい」順に情報を並べる。意表を突く「〜ですが」は使わない。時事問題は入れない。
- 問題IDは「ジャンル＋最初の答え」から作るので、問題文を直しても記録は引き継がれる（答えを変えると別の問題扱い）。
- `p` の範囲は 10〜75（学問以外のジャンルは実際の正答率に合わせて全体を+10している）。80以上の易しすぎる問題は入れない。難易度ごとの問題数がほぼ均等になるようにする（10%刻みで各帯 約400問、80%台は80〜85の半幅なので約半分）。
- 実力（クイズ力）は Rasch モデルで推定し、予想正答率が目標に近い問題を選んで出す。目標は回ごとに 0.45〜0.95 の間でばらつかせ（`sessionTarget`）、平均が7割（`TARGET`）になるようにしている。そのため5問正解の回も9〜10問正解の回もある。

### 復習クイズ（content/<科目>/review.yaml）

早押しクイズの「復習クイズ」モードは、学習を完了した単元の問題だけを出す。問題は科目ごとの `review.yaml` に、単元コード `u` を付けて書く。

```yaml
questions:
  - {u: JH05-01, p: 60, q: "…", a: [源頼朝]}
```

- `p` は「その単元を学んだ人」が答えられる割合（%）の予想。
- 実力（クイズ力）と記録は、いろいろクイズとは別々に持つ（進捗データの `hayaoshiReview`）。

## 簿記3級（content/20-boki）

- 本文・図・unit.yaml は `node scripts/boki/text/chNN.mjs` で生成する（図は `scripts/boki/svg.mjs` の SVG。明るい背景のカードなのでダークモードでも読める）。
- 動画の台本は `node scripts/bokivideo/chNN.mjs`（`video/script.yaml` を書き出す）。読み上げの読み（借方→かりかた など）は `scripts/bokivideo/lib.mjs` の WORDS。
- 章末クイズは各章の `quiz.yaml`、復習クイズは `content/20-boki/review.yaml`。

## 第0章「この科目について」

- 各科目の先頭の章（`<prefix>00`）。`chapter.yaml` に `intro: true` を書くと、画面では「第0章」と表示される。
- 本文と動画台本は `scripts/intro/data.mjs`（概要・学ぶ意味・役立つ場面・コツ）から `node scripts/intro/build.mjs` で生成する。章の一覧は各科目の chapter.yaml から自動で作る。
