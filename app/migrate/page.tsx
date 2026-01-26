'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MigratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<any>(null);
  const [imageError, setImageError] = useState('');
  
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [cleanupError, setCleanupError] = useState('');

  const handleMigrate = async () => {
    if (!confirm('確定要將本地數據遷移到 Supabase 嗎？')) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '遷移失敗');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || '遷移失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateImages = async () => {
    if (!confirm('確定要將圖片遷移到 Supabase Storage 嗎？\n\n這可能需要幾分鐘時間。')) {
      return;
    }

    setImageLoading(true);
    setImageError('');
    setImageResult(null);

    try {
      const response = await fetch('/api/migrate-images', {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '圖片遷移失敗');
      }

      setImageResult(data);
    } catch (err: any) {
      setImageError(err.message || '圖片遷移失敗');
    } finally {
      setImageLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!confirm('確定要清理重複的衣服嗎？\n\n這會刪除所有圖片 URL 還是本地路徑（/uploads/...）的衣服。')) {
      return;
    }

    setCleanupLoading(true);
    setCleanupError('');
    setCleanupResult(null);

    try {
      const response = await fetch('/api/cleanup-duplicates', {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '清理失敗');
      }

      setCleanupResult(data);
    } catch (err: any) {
      setCleanupError(err.message || '清理失敗');
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">資料遷移工具</h1>
            <p className="text-stone-600">將本地 JSON 數據遷移到 Supabase 雲端資料庫</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">⚠️ 重要提示</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 這個操作會將你的本地數據（4 件衣服）導入到 Supabase</li>
              <li>• 數據會關聯到你目前登入的帳號</li>
              <li>• 本地 JSON 文件不會被刪除</li>
              <li>• 只需要執行一次即可</li>
              <li className="font-semibold mt-2">• 完成後請點擊「圖片遷移」按鈕遷移圖片</li>
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-900 font-medium mb-2">✅ {result.message}</div>
              {result.data && (
                <div className="text-sm text-green-800">
                  <p>已導入的衣服 ID：</p>
                  <ul className="mt-2 space-y-1">
                    {result.data.map((item: any) => (
                      <li key={item.id}>• {item.name || item.brand || item.category} (ID: {item.id})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {imageError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {imageError}
            </div>
          )}

          {imageResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-900 font-medium mb-2">✅ {imageResult.message}</div>
              <div className="text-sm text-green-800">
                <p>遷移了 {imageResult.migratedCount} 張圖片</p>
                <p>處理了 {imageResult.totalClothes} 件衣服</p>
              </div>
            </div>
          )}

          {cleanupError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {cleanupError}
            </div>
          )}

          {cleanupResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-900 font-medium mb-2">✅ {cleanupResult.message}</div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleMigrate}
              disabled={loading || !!result}
              className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '資料遷移中...' : result ? '✅ 資料遷移完成' : '1️⃣ 開始資料遷移'}
            </button>

            {result && !imageResult && (
              <button
                onClick={handleMigrateImages}
                disabled={imageLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {imageLoading ? '圖片遷移中（可能需要幾分鐘）...' : '2️⃣ 開始圖片遷移'}
              </button>
            )}

            {imageResult && !cleanupResult && (
              <button
                onClick={handleCleanupDuplicates}
                disabled={cleanupLoading}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cleanupLoading ? '清理中...' : '3️⃣ 清理重複資料'}
              </button>
            )}

            {cleanupResult && (
              <button
                onClick={() => router.push('/closet')}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                🎉 全部完成！前往衣櫥查看
              </button>
            )}

            <button
              onClick={() => router.push('/closet')}
              className="w-full py-3 px-4 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-medium transition"
            >
              返回衣櫥
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
