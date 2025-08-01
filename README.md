# Azure Functions + Application Insights v3

Azure Functions v4 で Node.js v22 (TypeScript + ES2023 + ESM) を使用し、Application Insights v3 でエンドツーエンドトランザクション追跡を実装したプロジェクトです。

## 問題の解決

Application Insights v3 がCommonJSのため、ESM環境でトランザクションログが正しく表示されない問題を解決します。

### 主要な解決策

1. **分散トレースモードの設定**
   ```typescript
   .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
   ```

2. **operation_Id の一貫した管理**
   - カスタムテレメトリで operation_Id を明示的に設定
   - 依存関係追跡にも同じ operation_Id を使用

3. **手動リクエストテレメトリの作成**
   - Azure Functions の自動テレメトリに加えて手動でリクエストを追跡
   - エンドツーエンドトランザクションの可視化を改善

## セットアップ

### 前提条件

- Node.js v22+
- Azure Functions Core Tools v4
- Azure Application Insights リソース

### インストール

```bash
npm install
```

### 設定

1. `local.settings.json` で Application Insights の接続文字列を設定:
   ```json
   {
     "Values": {
       "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=your-key;IngestionEndpoint=https://..."
     }
   }
   ```

### 開発

```bash
# ビルド
npm run build

# 開発モード
npm run dev

# ローカル実行
npm start
```

## Azure Functions の実行

ローカルでテストする場合：

```bash
func start
```

## Application Insights の確認ポイント

### エンドツーエンドトランザクション

1. Azure Portal の Application Insights リソースを開く
2. 「調査」→「アプリケーション マップ」でサービス間の依存関係を確認
3. 「調査」→「エンドツーエンド トランザクション」で詳細なログ追跡を確認
4. 「監視」→「ライブ メトリック」でリアルタイム監視

### 重要な設定

- **AutoDependencyCorrelation**: 依存関係の自動相関
- **DistributedTracingMode**: 分散トレースモード (AI_AND_W3C)
- **operation_Id**: トランザクション追跡のための一意ID

## プロジェクト構造

```
├── src/
│   └── index.ts          # メイン関数とApplication Insights設定
├── host.json             # Azure Functions ホスト設定
├── local.settings.json   # ローカル開発設定
├── package.json          # ESM設定とnpm scripts
└── tsconfig.json         # TypeScript設定 (ES2023/ESM)
```

## トラブルシューティング

### トランザクションログが表示されない場合

1. `operation_Id` が一貫して使用されているか確認
2. `client.flush()` が適切に呼ばれているか確認
3. Application Insights の接続文字列が正しいか確認
4. 分散トレースモードが適切に設定されているか確認

### ESM環境での注意点

- `applicationinsights` はCommonJSのため `import appInsights from 'applicationinsights'` でインポート
- `package.json` に `"type": "module"` を設定
- TypeScript設定で `"module": "ESNext"` を使用
