<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Azure Functions + Application Insights プロジェクト

このプロジェクトは、Azure Functions v4 と Application Insights v3 を使用して、エンドツーエンドトランザクション追跡を実装したWebAPIです。

## 重要な設定

- **ESM (ES Modules)** を使用
- **TypeScript + ES2023** ターゲット
- **Application Insights v3** のCommonJS互換性対応
- **分散トレース** とトランザクション相関の実装

## Application Insights の重要ポイント

1. **operation_Id** と **operation_ParentId** を適切に設定してトランザクション連携を確立
2. **DistributedTracingMode** を AI_AND_W3C に設定
3. **AutoDependencyCorrelation** を有効化
4. カスタムテレメトリで手動トランザクション追跡を実装

## トランザクションログ問題の解決策

- カスタムリクエストテレメトリの手動作成
- operation_Id の一貫した使用
- 依存関係追跡の適切な設定
- テレメトリデータの確実な送信（flush）
