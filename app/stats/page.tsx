'use client';

import { useEffect, useState, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import { getColorCategory, COLOR_CATEGORY_DISPLAY_COLORS } from '@/lib/colorUtils';

interface Cloth {
  id: number;
  category?: string;
  color?: string;
  brand?: string;
  price?: number;
}

export default function StatsPage() {
  const [clothes, setClothes] = useState<Cloth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClothes();
  }, []);

  const fetchClothes = async () => {
    try {
      const response = await fetch('/api/clothes');
      const result = await response.json();
      if (result.success) {
        setClothes(result.data);
      }
    } catch (error) {
      console.error('載入失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 類別統計
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    clothes.forEach(cloth => {
      if (cloth.category) {
        stats[cloth.category] = (stats[cloth.category] || 0) + 1;
      }
    });
    return Object.entries(stats)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [clothes]);

  // 顏色統計（使用顏色大分類）
  const colorStats = useMemo(() => {
    const stats: Record<string, number> = {};
    clothes.forEach(cloth => {
      if (cloth.color) {
        const colorCategory = getColorCategory(cloth.color);
        stats[colorCategory] = (stats[colorCategory] || 0) + 1;
      }
    });
    return Object.entries(stats)
      .map(([colorCategory, count]) => ({ 
        color: colorCategory, 
        count,
        displayColor: COLOR_CATEGORY_DISPLAY_COLORS[colorCategory] || '#808080'
      }))
      .sort((a, b) => b.count - a.count);
  }, [clothes]);

  // 總件數和總價值
  const totalCount = clothes.length;
  const totalValue = useMemo(() => {
    return clothes.reduce((sum, cloth) => sum + (cloth.price || 0), 0);
  }, [clothes]);

  // 最多類別
  const topCategory = categoryStats[0]?.category || '無';
  const topCategoryCount = categoryStats[0]?.count || 0;

  // 最多顏色
  const topColor = colorStats[0]?.color || '無';
  const topColorCount = colorStats[0]?.count || 0;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 標題 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative p-4 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-2xl shadow-xl shadow-slate-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
              <svg className="w-10 h-10 text-white relative z-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-stone-800 via-slate-600 to-slate-700 bg-clip-text text-transparent">
              關於我的衣櫥
            </h1>
          </div>
        </div>

        {/* 總覽統計 */}
        <div className="glass-effect rounded-3xl p-6 md:p-8 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-stone-50 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-700 mb-2">{totalCount}</div>
              <div className="text-sm font-semibold text-stone-600">總件數</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-stone-50 to-slate-50 rounded-2xl border border-stone-200 shadow-sm">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-700 mb-2">
                ${totalValue.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-stone-600">總價值</div>
            </div>
          </div>
        </div>

        {/* 類別統計 */}
        {categoryStats.length > 0 && (
          <div className="glass-effect rounded-3xl p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
              <div className="relative p-3 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-xl shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_50%)]"></div>
                <svg className="w-6 h-6 text-white relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              類別統計
            </h2>
            
            {topCategory !== '無' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-stone-50 rounded-2xl border border-stone-200 shadow-sm">
                <p className="text-lg font-semibold text-stone-800">
                  你的衣物中最多的是 <span className="text-slate-700 font-bold">{topCategory}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {categoryStats.map((stat, index) => {
                const percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
                const maxCount = categoryStats[0]?.count || 1;
                const barWidth = (stat.count / maxCount) * 100;

                return (
                  <div key={stat.category} className="flex items-center gap-4">
                    <div className="w-24 md:w-32 text-sm font-semibold text-stone-700 flex-shrink-0">
                      {stat.category}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-stone-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${barWidth}%` }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow-sm">{stat.count}</span>
                          </div>
                        </div>
                        <div className="w-12 text-right text-sm font-bold text-stone-700">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 色彩統計 */}
        {colorStats.length > 0 && (
          <div className="glass-effect rounded-3xl p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
              <div className="relative p-3 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-xl shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_50%)]"></div>
                <svg className="w-6 h-6 text-white relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              色彩統計
            </h2>

            {topColor !== '無' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-stone-50 rounded-2xl border border-stone-200 shadow-sm">
                <p className="text-lg font-semibold text-stone-800">
                  <span 
                    className="inline-block w-6 h-6 rounded-full border-2 border-white shadow-md mr-2 align-middle" 
                    style={{ backgroundColor: COLOR_CATEGORY_DISPLAY_COLORS[topColor] || topColor }}
                  ></span>
                  <span className="text-slate-700 font-bold">{topColor}</span> 是你衣物中最多的顏色
                </p>
              </div>
            )}

            <div className="space-y-4">
              {colorStats.map((stat) => {
                const percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
                const maxCount = colorStats[0]?.count || 1;
                const barWidth = (stat.count / maxCount) * 100;

                return (
                  <div key={stat.color} className="flex items-center gap-4">
                    <div className="w-24 flex items-center gap-2 flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-md"
                        style={{ backgroundColor: stat.displayColor }}
                      ></div>
                      <span className="text-sm font-semibold text-stone-700">{stat.color}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-stone-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ 
                              width: `${barWidth}%`,
                              backgroundColor: stat.displayColor,
                            }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow-md">{stat.count}</span>
                          </div>
                        </div>
                        <div className="w-12 text-right text-sm font-bold text-stone-700">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {clothes.length === 0 && (
          <div className="text-center py-24 glass-effect rounded-3xl">
            <div className="inline-block p-8 bg-gradient-to-br from-stone-100/80 via-slate-50/50 to-stone-50/50 rounded-3xl mb-6 shadow-xl border border-white/50 backdrop-blur-md">
              <svg className="w-32 h-32 text-stone-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-700 mb-2">還沒有數據</h2>
            <p className="text-stone-500 mb-8 font-medium">新增一些衣服後再來查看統計吧！</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
