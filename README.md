# learning-app

個人専用の学習アプリ。教材（テキスト・動画・字幕）を科目 › 章 › 単元で表示し、進捗を記録する。

- 設計と計画: [docs/PLAN.md](docs/PLAN.md)
- 教材の追加方法: [docs/CONTENT.md](docs/CONTENT.md)

## 開発

```sh
npm install
npm run dev      # 教材をビルドして開発サーバーを起動
npm test         # ユニットテスト
npm run build    # dist/ に本番ビルド
```

## 公開（GitHub Pages）

1. リポジトリの Settings → Pages → Source を **GitHub Actions** にする
2. `main` に push すると `.github/workflows/deploy.yml` が自動でビルド・公開する

## 構成

| パス | 内容 |
|---|---|
| `content/` | 教材の原本（科目/章/単元フォルダ、YAML + Markdown + 動画・字幕） |
| `scripts/build-content.mjs` | `content/` → `public/data/`（JSON化・Markdown→HTML変換・素材コピー） |
| `src/lib/progress/` | 進捗（IndexedDB 保存、GitHub 同期、統合ロジック） |
| `src/components/VideoPlayer.tsx` | 動画プレーヤー（字幕・速度・視聴区間の記録） |
| `src/pages/` | 画面 |
