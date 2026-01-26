'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { getColorCategory, COLOR_CATEGORY_DISPLAY_COLORS } from '@/lib/colorUtils';

interface Drawer {
  id: number;
  name: string;
  clothIds: number[];
  created_at: string;
  updated_at: string;
}

interface Cloth {
  id: number;
  category?: string;
  color?: string;
  brand?: string;
  image_url?: string;
  image_processed_url?: string;
  notes?: string;
}

const CATEGORIES = [
  '全部', 'T恤', '襯衫', '針織衫', '連帽衫', '外套', '大衣', '羽絨服',
  '褲子', '短褲', '裙子', '洋裝', '內衣', '襪子', '配件', '包包', '其他'
];

export default function DrawerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const drawerId = params.id ? String(params.id) : null;

  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [allClothes, setAllClothes] = useState<Cloth[]>([]);
  const [drawerClothes, setDrawerClothes] = useState<Cloth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMode, setShowAddMode] = useState(false);
  const [selectedClothIds, setSelectedClothIds] = useState<Set<number>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [filterColor, setFilterColor] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');

  useEffect(() => {
    if (drawerId) {
      fetchData();
    }
  }, [drawerId]);

  const fetchData = async () => {
    try {
      // 獲取抽屜資訊
      const drawerRes = await fetch(`/api/drawers/${drawerId}`);
      const drawerResult = await drawerRes.json();

      // 獲取所有衣服
      const clothesRes = await fetch('/api/clothes');
      const clothesResult = await clothesRes.json();

      if (drawerResult.success) {
        setDrawer(drawerResult.data);
        const drawerData = drawerResult.data;
        
        if (clothesResult.success) {
          const all = clothesResult.data || [];
          setAllClothes(all);
          
          // 獲取抽屜中的衣服
          const drawerItems = drawerData.clothIds
            .map((id: number) => all.find((c: Cloth) => c.id === id))
            .filter((c: Cloth | undefined): c is Cloth => c !== undefined);
          setDrawerClothes(drawerItems);
        }
      }
    } catch (error) {
      console.error('載入失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClothes = async () => {
    if (selectedClothIds.size === 0 || !drawerId) return;

    try {
      const currentClothIds = drawer?.clothIds || [];
      const newClothIds = [...currentClothIds, ...Array.from(selectedClothIds)];
      
      const response = await fetch(`/api/drawers/${drawerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothIds: newClothIds }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedClothIds(new Set());
        setShowAddMode(false);
        fetchData();
      }
    } catch (error) {
      console.error('添加衣服失敗:', error);
    }
  };

  const handleRemoveCloth = async (clothId: number) => {
    if (!drawerId) return;

    try {
      const currentClothIds = drawer?.clothIds || [];
      const newClothIds = currentClothIds.filter((id: number) => id !== clothId);
      
      const response = await fetch(`/api/drawers/${drawerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothIds: newClothIds }),
      });

      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('移除衣服失敗:', error);
    }
  };

  const toggleClothSelection = (clothId: number) => {
    setSelectedClothIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clothId)) {
        newSet.delete(clothId);
      } else {
        newSet.add(clothId);
      }
      return newSet;
    });
  };

  // 獲取不在抽屜中的衣服
  const getAvailableClothes = () => {
    const drawerClothIds = drawer?.clothIds || [];
    let filtered = allClothes.filter(cloth => !drawerClothIds.includes(cloth.id));
    
    // 類別篩選
    if (filterCategory !== '全部') {
      filtered = filtered.filter(cloth => cloth.category === filterCategory);
    }
    
    // 顏色篩選
    if (filterColor && filterColor.trim() !== '') {
      filtered = filtered.filter(cloth => {
        if (!cloth.color) return false;
        const colorCategory = getColorCategory(cloth.color);
        return colorCategory === filterColor;
      });
    }
    
    // 品牌篩選
    if (filterBrand && filterBrand.trim() !== '') {
      filtered = filtered.filter(cloth => cloth.brand === filterBrand);
    }
    
    return filtered;
  };

  // 從所有衣服中提取出現的顏色大分類
  const availableColors = useMemo(() => {
    const drawerClothIds = drawer?.clothIds || [];
    const available = allClothes.filter(cloth => !drawerClothIds.includes(cloth.id));
    const colorCategorySet = new Set<string>();
    available.forEach(cloth => {
      if (cloth.color) {
        const colorCategory = getColorCategory(cloth.color);
        colorCategorySet.add(colorCategory);
      }
    });
    return Array.from(colorCategorySet).sort();
  }, [allClothes, drawer?.clothIds]);

  // 從所有衣服中提取出現的品牌
  const availableBrands = useMemo(() => {
    const drawerClothIds = drawer?.clothIds || [];
    const available = allClothes.filter(cloth => !drawerClothIds.includes(cloth.id));
    const brandSet = new Set<string>();
    available.forEach(cloth => {
      if (cloth.brand && cloth.brand.trim() !== '') {
        brandSet.add(cloth.brand.trim());
      }
    });
    return Array.from(brandSet).sort();
  }, [allClothes, drawer?.clothIds]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-400 border-t-transparent mb-4"></div>
          <div className="text-lg font-medium text-stone-700">載入中...</div>
        </div>
      </div>
    );
  }

  if (!drawer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">找不到該抽屜</h2>
          <button
            onClick={() => router.push('/closet')}
            className="px-6 py-3 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            返回抽屜列表
          </button>
        </div>
      </div>
    );
  }

  const availableClothes = getAvailableClothes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 標題和返回按鈕 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/closet')}
              className="p-2.5 hover:bg-white/70 rounded-xl transition-all bg-white/50 shadow-sm"
            >
              <svg className="w-6 h-6 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-stone-800 via-slate-600 to-slate-700 bg-clip-text text-transparent">
              {drawer.name}
            </h1>
          </div>
          <button
            onClick={() => setShowAddMode(!showAddMode)}
            className="relative px-6 py-3 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]"></div>
            <svg className="w-5 h-5 relative z-10 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="relative z-10">{showAddMode ? '取消' : '添加衣服'}</span>
          </button>
        </div>

        {/* 添加模式 */}
        {showAddMode && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-md border-2 border-stone-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4">選擇要添加的衣服</h3>
            
            {/* 篩選器 */}
            <div className="mb-4 space-y-4">
              {/* 類別篩選 */}
              <div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setFilterCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterCategory === category
                          ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 顏色篩選 */}
              {availableColors.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(colorCategory => {
                      const displayColor = COLOR_CATEGORY_DISPLAY_COLORS[colorCategory] || '#808080';
                      return (
                        <button
                          key={colorCategory}
                          onClick={() => setFilterColor(filterColor === colorCategory ? '' : colorCategory)}
                          className={`w-10 h-10 rounded-xl border-2 transition-all ${
                            filterColor === colorCategory
                              ? 'border-slate-500 shadow-lg scale-110 ring-2 ring-slate-300/50'
                              : 'border-stone-300 hover:border-stone-400'
                          }`}
                          style={{ backgroundColor: displayColor }}
                          title={colorCategory}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 品牌篩選 */}
              {availableBrands.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {availableBrands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setFilterBrand(filterBrand === brand ? '' : brand)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterBrand === brand
                            ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {availableClothes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4 max-h-96 overflow-y-auto">
                  {availableClothes.map((cloth) => {
                    const isSelected = selectedClothIds.has(cloth.id);
                    return (
                      <div
                        key={cloth.id}
                        onClick={() => toggleClothSelection(cloth.id)}
                        className={`relative aspect-square bg-white rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm hover:shadow-md ${
                          isSelected
                            ? 'border-slate-500 shadow-lg scale-105 ring-2 ring-slate-300/50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {cloth.image_processed_url || cloth.image_url ? (
                          <Image
                            src={cloth.image_processed_url || cloth.image_url || ''}
                            alt={cloth.category || '衣服'}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
                            <svg className="w-4 h-4 text-white relative z-10 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 font-medium">
                    已選擇 {selectedClothIds.size} 件
                  </span>
                  <button
                    onClick={handleAddClothes}
                    disabled={selectedClothIds.size === 0}
                    className="relative px-6 py-2 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]"></div>
                    <span className="relative z-10">確認添加</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-stone-500 text-center py-8">沒有可添加的衣服</p>
            )}
          </div>
        )}

        {/* 抽屜中的衣服 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-stone-800">
              抽屜中的衣服 ({drawerClothes.length} 件)
            </h2>
          </div>

          {drawerClothes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {drawerClothes.map((cloth) => (
                <div
                  key={cloth.id}
                  className="relative group bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-stone-200"
                >
                  <div className="relative aspect-square bg-stone-50 rounded-lg overflow-hidden mb-2 border border-stone-100">
                    {cloth.image_processed_url || cloth.image_url ? (
                      <Image
                        src={cloth.image_processed_url || cloth.image_url || ''}
                        alt={cloth.category || '衣服'}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {cloth.category && (
                    <p className="text-xs text-stone-600 text-center mb-2 font-medium">{cloth.category}</p>
                  )}
                  <button
                    onClick={() => handleRemoveCloth(cloth.id)}
                    className="w-full mt-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>移除</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-md border border-stone-200">
              <div className="inline-block p-6 bg-gradient-to-br from-stone-100 to-slate-50 rounded-2xl mb-4">
                <svg className="w-24 h-24 text-stone-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-stone-600 text-lg mb-4 font-medium">這個抽屜還沒有衣服</p>
              <button
                onClick={() => setShowAddMode(true)}
                className="relative px-6 py-3 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]"></div>
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  添加衣服
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
