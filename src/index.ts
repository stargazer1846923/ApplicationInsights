import appInsights from 'applicationinsights';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

// Application Insights の初期化
// ESM環境での正しい設定
appInsights
  .setup()
  .setAutoDependencyCorrelation(true)  // 依存関係の相関を有効化
  .setAutoCollectRequests(true)        // リクエストの自動収集
  .setAutoCollectPerformance(true, true) // パフォーマンス データの自動収集
  .setAutoCollectExceptions(true)      // 例外の自動収集
  .setAutoCollectDependencies(true)    // 依存関係の自動収集
  .setAutoCollectConsole(true, true)   // コンソールログの自動収集
  .setUseDiskRetryCaching(true)        // ディスクキャッシュの使用
  .setSendLiveMetrics(true)            // ライブメトリクスの送信
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C) // 分散トレースモード
  .start();

const client = appInsights.defaultClient;

// Azure Functions v4 の HTTP トリガー関数
export async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // カスタムテレメトリの開始 - トランザクション追跡のため
  const startTime = Date.now();
  const operationId = context.invocationId;
  
  // カスタムリクエストテレメトリを手動で作成（エンドツーエンドトランザクション用）
  const requestTelemetry = {
    name: `${request.method} ${request.url}`,
    url: request.url,
    duration: 0,
    resultCode: '200',
    success: true,
    timestamp: new Date(),
    id: operationId,
    // 重要: operation_Id と operation_ParentId を設定してトランザクション連携を確立
    properties: {
      'operation_Id': operationId,
      'operation_ParentId': context.invocationId,
      'function_name': context.functionName
    }
  };

  try {
    context.log(`HTTP function processed request for url "${request.url}"`);
    
    // Application Insights にカスタムイベントを送信
    client.trackEvent({
      name: 'FunctionStarted',
      properties: {
        functionName: context.functionName,
        invocationId: context.invocationId,
        operation_Id: operationId
      }
    });

    // サンプル処理 - 外部依存関係をシミュレート
    await simulateExternalDependency(operationId);

    // 成功のメトリクスを送信
    client.trackMetric({
      name: 'ProcessingTime',
      value: Date.now() - startTime
    });

    // カスタムトレースを送信
    client.trackTrace({
      message: 'Function executed successfully',
      properties: {
        operation_Id: operationId,
        functionName: context.functionName
      }
    });

    const responseMessage = JSON.stringify({
      message: 'Hello from Azure Functions with Application Insights!',
      timestamp: new Date().toISOString(),
      operationId: operationId
    });

    // リクエストの終了時間を計算
    requestTelemetry.duration = Date.now() - startTime;
    
    // カスタムリクエストテレメトリを送信
    client.trackRequest(requestTelemetry);

    // 成功イベントを送信
    client.trackEvent({
      name: 'FunctionCompleted',
      properties: {
        functionName: context.functionName,
        invocationId: context.invocationId,
        operation_Id: operationId,
        duration: requestTelemetry.duration.toString()
      }
    });

    return { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: responseMessage 
    };

  } catch (error) {
    // エラーの場合の処理
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Application Insights にエラーを送信
    client.trackException({
      exception: error instanceof Error ? error : new Error(errorMessage),
      properties: {
        operation_Id: operationId,
        functionName: context.functionName
      }
    });

    // エラーリクエストテレメトリを送信
    requestTelemetry.resultCode = '500';
    requestTelemetry.success = false;
    requestTelemetry.duration = Date.now() - startTime;
    client.trackRequest(requestTelemetry);

    context.log(`Error in function: ${errorMessage}`);

    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: errorMessage })
    };
  } finally {
    // テレメトリデータを確実に送信
    client.flush();
  }
}

// 外部依存関係をシミュレートする関数
async function simulateExternalDependency(operationId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // 模擬的な外部API呼び出し（遅延をシミュレート）
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // 依存関係の成功を追跡
    client.trackDependency({
      target: 'external-api.example.com',
      name: 'GET /api/data',
      data: 'GET /api/data',
      duration: Date.now() - startTime,
      resultCode: 200,
      success: true,
      dependencyTypeName: 'HTTP',
      properties: {
        operation_Id: operationId
      }
    });
    
  } catch (error) {
    // 依存関係のエラーを追跡
    client.trackDependency({
      target: 'external-api.example.com',
      name: 'GET /api/data',
      data: 'GET /api/data',
      duration: Date.now() - startTime,
      resultCode: 500,
      success: false,
      dependencyTypeName: 'HTTP',
      properties: {
        operation_Id: operationId
      }
    });
    
    throw error;
  }
}

// Azure Functions v4 でのルート登録
app.http('httpTrigger', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: httpTrigger
});
