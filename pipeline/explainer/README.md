# explainer（アニメーション重視の別バージョン動画）

台本（`script.yaml`）とナレーション音声はそのまま使い、映像だけを「授業っぽくない」モーショングラフィックス風に
作り直すためのレンダラー。既存の動画（`video.mp4`、`pipeline/render/`）には一切触れない。

    node pipeline/explainer/render.mjs <単元ID> --out /任意の場所/video.mp4      # MP4 を書き出す
    node pipeline/explainer/render.mjs <単元ID> --stills 5,20,40 --out-dir /dir  # 静止画で確認

- `engine.js` … SVG + Web Animations を `seek(t)` で動かす小さなエンジン（どの時刻のフレームも取れる）
- `lib.js` … 色・チップ・人物・地球儀・分子など共通の部品
- `units/<単元ID>.js` … その単元の映像（ナレーションの各ステップの時刻に合わせて動きを付ける）
- 字幕は画面に焼き込む。出力は単元フォルダの外に書く。
