# TriLens - AI Council

複数AIの回答を並べて比較し、評価・統合・意思決定まで行うフロントエンドアプリケーション。

## Features

- **3モデル同時送信**: ChatGPT / Gemini / Claude に同じプロンプトを同時投入
- **3カラム回答ビュー**: 回答を横並びで表示、マークダウン対応
- **クロスレビュー機能**: 任意のモデルの回答を別のモデルに評価させる
- **比較マトリクス**: 評価軸ごとのスコア・コメント表
- **統合回答**: 3つの回答を統合した最終判断を生成
- **目的選択**: 調査、意思決定、文章作成、技術検証、アイデア出し
- **評価軸指定**: 正確性、網羅性、実用性、リスク、創造性

## Tech Stack

- React 19 + TypeScript + Vite
- Streaming API integration (SSE)
- LocalStorage for API key management (no server required)

## Getting Started

```bash
npm install
npm run dev
```

## API Keys

Settings から各モデルの API キーを設定してください:
- **ChatGPT**: OpenAI API Key (`sk-...`)
- **Gemini**: Google AI Studio Key (`AIza...`)
- **Claude**: Anthropic API Key (`sk-ant-...`)

API キーはブラウザの localStorage に保存され、サーバーには送信されません。
