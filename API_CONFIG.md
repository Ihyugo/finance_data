# API 設定ガイド

このプロジェクトでは、開発環境と本番環境で異なる API エンドポイントを使用するように設定されています。

## 設定方法

### 1. 自動判定（推奨）

現在の実装では、以下のルールで自動的に環境を判定します：

- **開発環境**: `localhost` または `127.0.0.1` でアクセスした場合
- **本番環境**: その他のホスト名でアクセスした場合

### 2. 環境変数を使用した設定

環境変数を使用して API のベース URL を設定することも可能です：

#### 開発環境用

```bash
# .env.development ファイルを作成
NODE_ENV=development
VUE_APP_API_BASE_URL=http://127.0.0.1:8000
```

#### 本番環境用

```bash
# .env.production ファイルを作成
NODE_ENV=production
VUE_APP_API_BASE_URL=https://fastapi-service-658417983475.us-central1.run.app
```

### 3. 手動での環境切り替え

`src/config/api.js` ファイルを編集して、デフォルトの URL を変更することも可能です。

## 使用方法

### API サービスの使用

```javascript
import apiService from "@/services/apiService.js";

// 株価情報を取得
const stockData = await apiService.getStockInfo("7203");
```

### 設定の確認

```javascript
import { logApiConfig } from "@/config/api.js";

// 現在のAPI設定をコンソールに出力
logApiConfig();
```

## ファイル構成

- `src/config/api.js`: API 設定と URL 構築ロジック
- `src/services/apiService.js`: API 呼び出し用のサービス
- `src/components/CompanyInfo.vue`: API サービスを使用した実装例

## 注意事項

- 環境変数 `VUE_APP_API_BASE_URL` が設定されている場合は、それが優先されます
- 開発環境ではローカル API サーバー（`http://127.0.0.1:8000`）に接続します
- 本番環境では Google Cloud Run の API（`https://fastapi-service-658417983475.us-central1.run.app`）に接続します
