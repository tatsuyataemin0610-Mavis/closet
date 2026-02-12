'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiagnoseImagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingUrls, setTestingUrls] = useState<Set<string>>(new Set());
  const [urlTestResults, setUrlTestResults] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    runDiagnosis();
  }, []);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/diagnose-images');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '診斷失敗');
      }
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '診斷失敗');
      }
    } catch (err: any) {
      console.error('診斷失敗:', err);
      setError(err.message || '診斷失敗');
    } finally {
      setLoading(false);
    }
  };

  const testUrl = async (url: string) => {
    if (testingUrls.has(url)) return;
    
    setTestingUrls(prev => new Set(prev).add(url));
    
    try {
      const response = await fetch('/api/diagnose-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      setUrlTestResults(prev => {
        const newMap = new Map(prev);
        newMap.set(url, data);
        return newMap;
      });
    } catch (err: any) {
      console.error('測試 URL 失敗:', err);
      setUrlTestResults(prev => {
        const newMap = new Map(prev);
        newMap.set(url, { success: false, error: err.message });
        return newMap;
      });
    } finally {
      setTestingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  };

  const testAllUrls = async () => {
    if (!result) return;
    
    const allUrls = [
      ...result.issues.map((i: any) => i.url),
      ...result.validImages.map((i: any) => i.url),
    ];
    
    for (const url of allUrls) {
      await testUrl(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              圖片 URL 診斷工具
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
            >
              返回首頁
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            檢查資料庫中的圖片 URL 是否有效，並測試它們是否可以訪問
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">正在診斷圖片 URL...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ 錯誤</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={runDiagnosis}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              重新診斷
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* 概覽 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">診斷結果概覽</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">總衣服數量</p>
                  <p className="text-2xl font-bold text-blue-700">{result.totalClothes}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">有效圖片</p>
                  <p className="text-2xl font-bold text-green-700">{result.totalValid}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-1">問題圖片</p>
                  <p className="text-2xl font-bold text-red-700">{result.totalIssues}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Supabase URL</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{result.supabaseUrl}</p>
                </div>
              </div>
              
              {result.totalValid > 0 && (
                <button
                  onClick={testAllUrls}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  disabled={testingUrls.size > 0}
                >
                  {testingUrls.size > 0 ? '測試中...' : '測試所有 URL'}
                </button>
              )}
            </div>

            {/* 問題列表 */}
            {result.totalIssues > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ⚠️ 發現的問題 ({result.totalIssues})
                </h2>
                <div className="space-y-4">
                  {result.issues.map((issue: any, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {issue.category || '未分類'} (ID: {issue.clothId})
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            欄位: <span className="font-mono">{issue.field}</span>
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            問題: {issue.issue}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 font-mono break-all bg-white p-2 rounded">
                            {issue.url}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 有效圖片列表 */}
            {result.totalValid > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ✅ 有效的圖片 URL ({result.totalValid})
                </h2>
                <div className="space-y-3">
                  {result.validImages.slice(0, 10).map((img: any, index: number) => {
                    const testResult = urlTestResults.get(img.url);
                    const isTesting = testingUrls.has(img.url);
                    
                    return (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {img.category || '未分類'} (ID: {img.clothId})
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              欄位: <span className="font-mono">{img.field}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-2 font-mono break-all bg-white p-2 rounded">
                              {img.url}
                            </p>
                            
                            {testResult && (
                              <div className={`mt-3 p-2 rounded text-sm ${
                                testResult.data?.accessible 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {testResult.data?.accessible ? (
                                  <>
                                    ✅ 可訪問 (狀態: {testResult.data.status})
                                    {testResult.data.contentType && (
                                      <span className="ml-2">類型: {testResult.data.contentType}</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    ❌ 無法訪問 
                                    {testResult.data?.status && ` (狀態: ${testResult.data.status})`}
                                    {testResult.data?.error && ` - ${testResult.data.error}`}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => testUrl(img.url)}
                            disabled={isTesting}
                            className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isTesting ? '測試中...' : '測試'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {result.validImages.length > 10 && (
                    <p className="text-gray-500 text-center py-2">
                      還有 {result.validImages.length - 10} 個有效圖片未顯示
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-4">
              <button
                onClick={runDiagnosis}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                重新診斷
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                返回首頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
