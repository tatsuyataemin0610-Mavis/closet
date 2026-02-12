'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CleanupEmptyUrlsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runCleanup = async () => {
    if (!confirm('確定要清理數據庫中的空字符串 URL 嗎？這個操作會將所有空字符串轉換為 null。')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/cleanup-empty-urls', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '清理失敗');
      }
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || '清理失敗');
      }
    } catch (err: any) {
      console.error('清理失敗:', err);
      setError(err.message || '清理失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              清理空字符串 URL
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
            >
              返回首頁
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            清理數據庫中的空字符串 URL，將它們轉換為 null，避免前端嘗試載入無效的圖片
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">說明</h2>
          <div className="space-y-2 text-gray-600">
            <p>這個工具會：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>掃描所有衣服記錄中的圖片 URL 欄位</li>
              <li>識別並移除空字符串（如 <code className="bg-gray-100 px-2 py-1 rounded">""</code>）</li>
              <li>將包含空字符串的欄位設置為 <code className="bg-gray-100 px-2 py-1 rounded">null</code></li>
              <li>清理 CSV 格式中的空值（如 <code className="bg-gray-100 px-2 py-1 rounded">"url1,,url2"</code>）</li>
            </ul>
          </div>
        </div>

        {!result && !loading && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <button
              onClick={runCleanup}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              開始清理
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">正在清理數據庫...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ 錯誤</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={runCleanup}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              重試
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-800 mb-2">✅ 清理完成</h3>
              <p className="text-green-700 mb-4">{result.message}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">總衣服數量</p>
                  <p className="text-2xl font-bold text-gray-800">{result.data.totalClothes}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">已清理數量</p>
                  <p className="text-2xl font-bold text-green-600">{result.data.cleanedCount}</p>
                </div>
              </div>
            </div>

            {result.data.cleanedItems && result.data.cleanedItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  清理詳情 ({result.data.cleanedItems.length} 件)
                </h3>
                <div className="space-y-3">
                  {result.data.cleanedItems.map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-800 mb-2">
                        {item.category || '未分類'} (ID: {item.id})
                      </p>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">已清理的欄位：</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {Object.entries(item.updates).map(([field, value]) => (
                            <li key={field}>
                              <code className="bg-white px-2 py-1 rounded">{field}</code>
                              {' → '}
                              <span className="text-green-600">
                                {value === null ? 'null' : `"${value}"`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/diagnose-images')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                查看診斷結果
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
