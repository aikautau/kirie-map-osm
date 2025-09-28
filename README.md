# 切り絵の地図×OpenStreetMap

個人作家のための地理的記録管理システム

## 概要

このプロジェクトは、地図を題材とする作家が制作した地図の範囲を視覚的に管理・公開するためのWebアプリケーションです。
静的サイトのみで動作し、低コストでの運用を実現しています。

## 特徴

- 📍 **地図上での範囲管理**: 制作した地図の範囲を OpenStreetMap 上で視覚的に管理
- 🏗️ **デュアルサイト構成**: 閲覧用と管理者用を分離したセキュアな設計
- 📱 **モバイル対応**: スマートフォンでも使いやすいレスポンシブUI
- 💰 **低コスト運用**: 静的ホスティングのみで動作（サーバーレス）
- 🔒 **セキュア**: 管理者機能と閲覧機能を物理的に分離

## 実装例

### 本番運用サイト（参考）
- **閲覧用**: https://your-domain.com
- **管理者用**: https://your-domain.com/admin （Basic認証保護）

※ このシステムを使用して実際に運用されている切り絵作家のサイトです

## 技術スタック

- **Frontend**: React 19 + TypeScript
- **地図**: Leaflet + React-Leaflet
- **スタイリング**: Tailwind CSS
- **ビルドツール**: Vite
- **ホスティング**: 静的サイトホスティング（GitHub Pages, Netlify, 等）

## アーキテクチャ

```
┌─────────────┐    ┌─────────────┐
│   閲覧用    │    │   管理者用   │
│  (静的サイト) │    │  (静的サイト) │
└─────────────┘    └─────────────┘
        │                   │
        └─── records.json ──┘
```

- **閲覧用**: `records.json`からデータを読み込み、一般向けに地図を表示
- **管理者用**: LocalStorageでデータを管理、`records.json`としてエクスポート可能
- **データ同期**: 管理者がエクスポートした`records.json`を閲覧用サイトに配置

## 主な機能

### 閲覧用
- 制作済み地図の範囲表示
- 地域別・年別での記録整理
- 検索機能
- モバイル対応サイドバー

### 管理者用
- 地図範囲の追加・編集・削除
- **記録編集機能**: 既存記録の修正（制作中→完成、数値修正、範囲調整等）
- **フリードローイング**: 地図上でドラッグして直感的な範囲選択
- 制作情報の管理（年、住所、番号等）
- データのJSON形式エクスポート

### 技術的工夫
- **重なり選択UI**: 複数の範囲が重なる場合の候補選択機能
- **自動スクロール**: 地図選択時のサイドバー自動展開・スクロール
- **記録編集システム**: 既存データの柔軟な修正・更新機能
- **直感的なドラッグ操作**: シンプルで正確な範囲選択
- **パフォーマンス最適化**: 大量データ（1000件+）への対応準備

## 使用方法

このリポジトリをクローンして、ローカル環境で動作確認できます：

```bash
git clone https://github.com/your-username/kirie-map-osm.git
cd kirie-map-osm
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセスすると開発版が表示されます。

### 本番ビルド
```bash
# 閲覧用サイト
npm run build:view

# 管理者用サイト
npm run build:admin
```

## デプロイ

### 静的ホスティングサービスでのデプロイ

1. **閲覧用サイト**:
   - `dist/view/` の内容をルートディレクトリに配置
   - `records.json` を同じディレクトリに配置

2. **管理者用サイト**:
   - `dist/admin/` の内容を `/admin/` ディレクトリに配置
   - Basic認証等での保護を推奨

### 環境変数

本番環境では以下の環境変数を設定してください：

```bash
VITE_APP_MODE=view    # 閲覧用
VITE_APP_MODE=admin   # 管理者用
```

## カスタマイズ

### 1. 個人情報の設定
`index.html` の以下の箇所を編集：
```html
<meta name="author" content="Your Artist Name" />
<meta property="og:url" content="https://your-domain.com" />
<meta name="twitter:creator" content="@your-twitter-handle" />
```

### 2. 地図の初期位置
`src/constants.ts` で設定：
```typescript
export const DEFAULT_MAP_CENTER: [number, number] = [35.681236, 139.767125];
export const DEFAULT_MAP_ZOOM = 13;
```

## ライセンス

MIT License

## 貢献

Issue報告やPull Requestを歓迎します。

## 関連技術

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Leaflet](https://leafletjs.com/)
- [React-Leaflet](https://react-leaflet.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [OpenStreetMap](https://www.openstreetmap.org/)

## 更新履歴

### v1.3.0 (最新)
- **UIの簡素化**: フリードローイングのみに特化
- **複雑なフレーム機能を削除**: 位置ずれ問題を根本解決
- **操作性の向上**: 地図上でのドラッグ操作のみのシンプルな設計
- **コードの最適化**: 不要な機能削除による保守性向上

### v1.2.0
- 管理者向けレコード編集機能を追加
- 固定フレーム選択システム（mapframe-printer風操作）を実装
- フレーム倍率調整機能を追加
- サブタイトル「線はどこからきたのか」を追加
- 編集ボタン（ペンアイコン）をレコードに追加

### v1.1.0
- 基本的な地図記録・表示機能
- 閲覧用・管理者用の2モード対応
- 地域別・年別での記録整理機能