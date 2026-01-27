'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FittingRoom from '@/components/FittingRoom';

interface Cloth {
  id: number;
  category?: string;
  color?: string;
  brand?: string;
  image_url?: string;
  image_processed_url?: string;
}

export default function TestFittingPage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [clothes, setClothes] = useState<Cloth[]>([]);
  const [selectedClothIds, setSelectedClothIds] = useState<Set<number>>(new Set());
  const [gender, setGender] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI 試衣相關 state
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonError, setTryonError] = useState<string | null>(null);
  const [tryonResult, setTryonResult] = useState<string | null>(null);
  const [maskPreview, setMaskPreview] = useState<string | null>(null);

  // 載入所有衣服
  useEffect(() => {
    fetchClothes();
  }, []);

  const fetchClothes = async () => {
    try {
      console.log('開始載入衣服列表...');
      const response = await fetch('/api/clothes');
      console.log('API 回應狀態:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API 回應數據:', result);
      
      if (result.success) {
        const clothesList = result.data || [];
        console.log(`✅ 成功載入 ${clothesList.length} 件衣服`);
        setClothes(clothesList);
      } else {
        console.error('API 返回失敗:', result.error);
        setError(result.error || '載入衣服失敗');
      }
    } catch (error: any) {
      console.error('載入衣服失敗:', error);
      setError(`載入衣服失敗: ${error.message || error}`);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('沒有選擇檔案');
      return;
    }

    console.log('開始上傳照片:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('發送上傳請求到 /api/upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('上傳 API 回應狀態:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('上傳 API 回應數據:', result);
      
      if (result.success && result.data?.imageUrl) {
        console.log('✅ 上傳成功，圖片 URL:', result.data.imageUrl);
        setAvatarUrl(result.data.imageUrl);
        setAvatarFile(file);
        setError(null);
      } else {
        const errorMsg = result.error || '上傳失敗';
        console.error('❌ 上傳失敗:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ 上傳異常:', err);
      setError(err.message || '上傳失敗');
    } finally {
      setLoading(false);
    }
  };

  const toggleClothSelection = (clothId: number) => {
    setSelectedClothIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clothId)) {
        newSet.delete(clothId);
        // 取消選擇時清除試衣結果
        setTryonResult(null);
        setTryonError(null);
      } else {
        // 只允許選擇一件衣服
        newSet.clear();
        newSet.add(clothId);
        // ✅ 移除自動觸發試衣，改為按鈕觸發（避免誤觸扣錢）
      }
      return newSet;
    });
  };

  // 呼叫 API 的函式（包含 mask）
  async function runTryOnByUrl(avatarUrl: string, clothUrl: string, maskDataUrl?: string) {
    const r = await fetch("/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl, clothUrl, maskDataUrl }),
    });

    const json = await r.json();
    if (!r.ok) throw new Error(json?.error || "tryon failed");

    return json.imageDataUrl || json.imageUrl;
  }

  // 使用者點「開始試穿」按鈕時觸發
  const handleSelectCloth = async (cloth: Cloth) => {
    if (!avatarUrl) {
      setTryonError("請先上傳人物照片");
      return;
    }

    // ✅ 防重複調用保護
    if (tryonLoading) {
      console.warn('試衣進行中，忽略重複請求');
      return;
    }

    const clothUrl = cloth.image_processed_url || cloth.image_url;
    if (!clothUrl) {
      setTryonError("衣服圖片 URL 不存在");
      return;
    }

    // ✅ 同一組（avatar+cloth）不要重複打
    const key = `${avatarUrl}__${clothUrl}`;
    if ((window as any).__lastTryonKey === key) {
      console.warn('相同的試衣請求，忽略重複調用');
      return;
    }
    (window as any).__lastTryonKey = key;

    try {
      setTryonError(null);
      setTryonLoading(true);

      // 生成 mask（只換衣服）
      let maskDataUrl: string | undefined;
      try {
        const { generateTopMaskDataUrl } = await import('@/lib/maskGenerator');
        console.log('開始生成 mask...');
        maskDataUrl = await generateTopMaskDataUrl(avatarUrl);
        console.log('✅ Mask 生成成功');
        // 顯示 mask 預覽，確認是否正確
        setMaskPreview(maskDataUrl);
      } catch (maskError: any) {
        console.warn('Mask 生成失敗:', maskError);
        setMaskPreview(null);
        throw new Error('Mask 生成失敗，無法進行試衣');
      }

      if (!maskDataUrl) {
        throw new Error('Mask 生成失敗');
      }

      const out = await runTryOnByUrl(avatarUrl, clothUrl, maskDataUrl);
      setTryonResult(out);
    } catch (e: any) {
      console.error(e);
      setTryonError(e?.message || "試穿失敗");
      setTryonResult(null);
      // 清除 key，允許重試
      delete (window as any).__lastTryonKey;
    } finally {
      setTryonLoading(false);
    }
  };

  const getSelectedClothes = (): Cloth[] => {
    return Array.from(selectedClothIds)
      .map(id => clothes.find(c => c.id === id))
      .filter((c): c is Cloth => c !== undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent mb-2">
            試衣間功能測試
          </h1>
          <p className="text-gray-600">測試虛擬試穿功能，上傳人物照片並選擇衣服進行試穿</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：控制面板 */}
          <div className="space-y-6">
            {/* 上傳人物照片 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. 上傳人物照片</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    選擇照片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-slate-50 file:text-slate-700
                      hover:file:bg-slate-100
                      cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    性別（可選，用於調整試穿效果）
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700"
                  >
                    <option value="">不指定</option>
                    <option value="female">女性</option>
                    <option value="male">男性</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {loading && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-400 border-t-transparent"></div>
                    <p className="text-sm text-gray-600 mt-2">上傳中...</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    ❌ {error}
                  </div>
                )}

                {avatarUrl && (
                  <>
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-stone-200 bg-stone-50">
                      <Image
                        src={avatarUrl}
                        alt="人物照片"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    {maskPreview && (
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Mask 預覽（確認透明區域是否正確）：
                        </label>
                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-stone-200 bg-stone-50">
                          <img 
                            src={maskPreview} 
                            alt="Mask 預覽" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ⚠️ 確認：透明區域（可編輯）應該只在上衣位置，臉部和背景必須是不透明（保護區域）
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 選擇衣服 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                2. 選擇衣服 ({selectedClothIds.size} 件已選)
              </h2>
              
              {clothes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>尚未有衣服，請先到「新增衣服」頁面添加衣服</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-3 bg-stone-50 rounded-xl border border-stone-200">
                  {(clothes || []).map((cloth) => {
                    const isSelected = selectedClothIds.has(cloth.id);
                    return (
                      <div
                        key={cloth.id}
                        onClick={() => toggleClothSelection(cloth.id)}
                        className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-slate-500 shadow-md scale-105'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {cloth.image_processed_url || cloth.image_url ? (
                          <Image
                            src={cloth.image_processed_url || cloth.image_url || ''}
                            alt={cloth.category || '衣服'}
                            fill
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {cloth.category && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 text-center truncate">
                            {cloth.category}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedClothIds.size > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-stone-200">
                  <p className="text-sm font-semibold text-stone-700 mb-2">已選擇的衣服：</p>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedClothes().map((cloth) => (
                      <div
                        key={cloth.id}
                        className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-stone-200 text-xs"
                      >
                        <span className="text-stone-600">{cloth.category || '衣服'}</span>
                        <button
                          onClick={() => toggleClothSelection(cloth.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 使用說明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📝 使用說明：</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>上傳一張包含完整人體的照片（建議正面站立姿勢）</li>
                <li>系統會自動檢測人體位置和姿勢關鍵點</li>
                <li>如果檢測失敗，可以手動點擊照片標記肩膀位置</li>
                <li>選擇要試穿的衣服，系統會自動將衣服貼合到人體上</li>
                <li>如果檢測到多個人，可以選擇要試穿的人物</li>
                <li>衣服會根據類別自動調整位置和大小（上衣、褲子、裙子等）</li>
              </ul>
            </div>
          </div>

          {/* 右側：試衣效果 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">3. 試衣效果</h2>
            
            {!avatarUrl ? (
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-stone-500 font-medium">請先上傳人物照片</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-50">
                {tryonLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-400 border-t-transparent mb-4"></div>
                      <p className="text-stone-600 font-medium">AI 試穿中...</p>
                      <p className="text-stone-500 text-sm mt-2">請稍候，正在生成試穿效果</p>
                    </div>
                  </div>
                ) : tryonError ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="inline-block p-4 bg-red-50 rounded-full mb-4">
                        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-600 font-medium mb-2">{tryonError}</p>
                      <p className="text-stone-500 text-sm">請檢查圖片是否正確上傳</p>
                    </div>
                  </div>
                ) : tryonResult ? (
                  <Image
                    src={tryonResult}
                    alt="試衣效果"
                    fill
                    className="object-contain bg-stone-50"
                    unoptimized
                  />
                ) : (
                  <Image
                    src={avatarUrl}
                    alt="人物照片"
                    fill
                    className="object-contain bg-stone-50"
                    unoptimized
                  />
                )}
              </div>
            )}
            
            {/* 開始試穿按鈕 */}
            {avatarUrl && selectedClothIds.size > 0 && !tryonResult && (
              <button
                disabled={tryonLoading}
                onClick={() => {
                  const clothId = Array.from(selectedClothIds)[0];
                  const cloth = clothes.find(c => c.id === clothId);
                  if (cloth) {
                    handleSelectCloth(cloth);
                  }
                }}
                className="mt-4 w-full px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {tryonLoading ? '試衣中...' : '開始試穿（會呼叫 API）'}
              </button>
            )}
            
            {/* 操作按鈕 */}
            {tryonResult && !tryonLoading && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setTryonResult(null);
                    setTryonError(null);
                    if (selectedClothIds.size > 0) {
                      const clothId = Array.from(selectedClothIds)[0];
                      const cloth = clothes.find(c => c.id === clothId);
                      if (cloth) {
                        handleSelectCloth(cloth);
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  重新試穿
                </button>
                <button
                  onClick={() => {
                    setTryonResult(null);
                    setTryonError(null);
                    setSelectedClothIds(new Set());
                  }}
                  className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold transition-all"
                >
                  清除結果
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 調試信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-stone-50 border border-stone-200 rounded-lg p-4">
            <h3 className="font-semibold text-stone-800 mb-2">🔧 調試信息：</h3>
            <div className="text-xs text-stone-600 space-y-1">
              <p>• 打開瀏覽器控制台（F12）查看詳細的檢測和處理日誌</p>
              <p>• 開發模式下會顯示檢測到的關鍵點（紅色線條和點）</p>
              <p>• 如果試衣效果不理想，請檢查控制台的錯誤信息</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
