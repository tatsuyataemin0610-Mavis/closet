'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import BottomNav from '@/components/BottomNav';
import { getColorCategory, COLOR_CATEGORY_DISPLAY_COLORS } from '@/lib/colorUtils';

interface Cloth {
  id: number;
  name?: string;
  category?: string;
  color?: string;
  brand?: string;
  size?: string;
  material?: string;
  occasion?: string;
  price?: number;
  purchase_date?: string;
  seasons?: string;
  notes?: string;
  image_url?: string;
  image_processed_url?: string;
  created_at?: string;
}

const CATEGORIES = [
  '全部', 'T恤', '襯衫', '針織衫', '連帽衫', '外套', '大衣', '羽絨服',
  '褲子', '短褲', '裙子', '洋裝', '內衣', '襪子', '配件', '包包', '其他'
];

// 莫蘭迪色系 - 不同類別的顏色配置（柔和、低飽和度）
const CATEGORY_COLORS: Record<string, { from: string; via?: string; to: string; text?: string; shadow?: string }> = {
  '全部': { from: 'from-stone-400', to: 'to-stone-500', text: 'text-white', shadow: '0 20px 25px -5px rgba(120, 113, 108, 0.2), 0 10px 10px -5px rgba(120, 113, 108, 0.15)' },
  'T恤': { from: 'from-slate-300', via: 'via-slate-400', to: 'to-slate-500', text: 'text-white', shadow: '0 20px 25px -5px rgba(148, 163, 184, 0.25), 0 10px 10px -5px rgba(148, 163, 184, 0.15)' },
  '襯衫': { from: 'from-blue-200', via: 'via-blue-300', to: 'to-blue-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(147, 197, 253, 0.25), 0 10px 10px -5px rgba(147, 197, 253, 0.15)' },
  '針織衫': { from: 'from-purple-200', via: 'via-purple-300', to: 'to-purple-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(196, 181, 253, 0.25), 0 10px 10px -5px rgba(196, 181, 253, 0.15)' },
  '連帽衫': { from: 'from-indigo-200', via: 'via-indigo-300', to: 'to-indigo-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(165, 180, 252, 0.25), 0 10px 10px -5px rgba(165, 180, 252, 0.15)' },
  '外套': { from: 'from-amber-200', via: 'via-amber-300', to: 'to-amber-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(253, 230, 138, 0.25), 0 10px 10px -5px rgba(253, 230, 138, 0.15)' },
  '大衣': { from: 'from-stone-300', via: 'via-stone-400', to: 'to-stone-500', text: 'text-white', shadow: '0 20px 25px -5px rgba(168, 162, 158, 0.25), 0 10px 10px -5px rgba(168, 162, 158, 0.15)' },
  '羽絨服': { from: 'from-rose-200', via: 'via-rose-300', to: 'to-rose-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(253, 164, 175, 0.25), 0 10px 10px -5px rgba(253, 164, 175, 0.15)' },
  '褲子': { from: 'from-teal-200', via: 'via-teal-300', to: 'to-teal-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(153, 246, 228, 0.25), 0 10px 10px -5px rgba(153, 246, 228, 0.15)' },
  '短褲': { from: 'from-emerald-200', via: 'via-emerald-300', to: 'to-emerald-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(167, 243, 208, 0.25), 0 10px 10px -5px rgba(167, 243, 208, 0.15)' },
  '裙子': { from: 'from-pink-200', via: 'via-pink-300', to: 'to-pink-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(251, 207, 232, 0.25), 0 10px 10px -5px rgba(251, 207, 232, 0.15)' },
  '洋裝': { from: 'from-rose-200', via: 'via-rose-300', to: 'to-rose-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(253, 164, 175, 0.25), 0 10px 10px -5px rgba(253, 164, 175, 0.15)' },
  '內衣': { from: 'from-amber-200', via: 'via-amber-300', to: 'to-amber-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(253, 230, 138, 0.25), 0 10px 10px -5px rgba(253, 230, 138, 0.15)' },
  '襪子': { from: 'from-lime-200', via: 'via-lime-300', to: 'to-lime-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(217, 249, 157, 0.25), 0 10px 10px -5px rgba(217, 249, 157, 0.15)' },
  '配件': { from: 'from-violet-200', via: 'via-violet-300', to: 'to-violet-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(196, 181, 253, 0.25), 0 10px 10px -5px rgba(196, 181, 253, 0.15)' },
  '包包': { from: 'from-fuchsia-200', via: 'via-fuchsia-300', to: 'to-fuchsia-400', text: 'text-slate-700', shadow: '0 20px 25px -5px rgba(240, 171, 252, 0.25), 0 10px 10px -5px rgba(240, 171, 252, 0.15)' },
  '其他': { from: 'from-gray-300', via: 'via-gray-400', to: 'to-gray-500', text: 'text-white', shadow: '0 20px 25px -5px rgba(209, 213, 219, 0.25), 0 10px 10px -5px rgba(209, 213, 219, 0.15)' },
};

// 獲取類別顏色的函數
const getCategoryColor = (category: string) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['其他'];
};

export default function Home() {
  const router = useRouter();
  const [clothes, setClothes] = useState<Cloth[]>([]);
  const [filteredClothes, setFilteredClothes] = useState<Cloth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['全部']));
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAddToDrawer, setShowAddToDrawer] = useState(false);
  const [drawers, setDrawers] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedDrawerIds, setSelectedDrawerIds] = useState<Set<number>>(new Set());
  const [lastClickTime, setLastClickTime] = useState<{ id: number; time: number } | null>(null);

  useEffect(() => {
    fetchClothes();
    fetchDrawers();
  }, []);

  // 滾動到指定的衣服（從編輯頁返回時）
  useEffect(() => {
    if (clothes.length === 0) return;

    // 方式 1: 檢查 URL hash（點擊儲存/取消按鈕）
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // 清除 hash，避免重複滾動
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }, 300);
      return;
    }

    // 方式 2: 檢查 sessionStorage（使用瀏覽器返回按鈕）
    const lastEditedClothId = sessionStorage.getItem('lastEditedClothId');
    if (lastEditedClothId) {
      setTimeout(() => {
        const element = document.getElementById(`cloth-${lastEditedClothId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // 清除 sessionStorage，避免重複滾動
          sessionStorage.removeItem('lastEditedClothId');
        }
      }, 300);
    }
  }, [clothes]);

  const fetchDrawers = async () => {
    try {
      console.log('開始獲取抽屜列表...');
      const response = await fetch('/api/drawers');
      
      // 如果未授權（登出後），直接設為空數組
      if (response.status === 401) {
        console.log('未授權，清空抽屜列表');
        setDrawers([]);
        return;
      }
      
      console.log('抽屜 API 回應狀態:', response.status);
      const result = await response.json();
      console.log('首頁抽屜列表 API 回應:', result);
      if (result.success && Array.isArray(result.data)) {
        const drawersList = result.data;
        console.log('首頁載入的抽屜:', drawersList, '數量:', drawersList.length);
        setDrawers(drawersList);
      } else {
        console.warn('獲取抽屜列表失敗:', result.error);
        setDrawers([]);
      }
    } catch (error) {
      console.error('載入抽屜失敗:', error);
      setDrawers([]);
    }
  };

  // 切換類別選擇
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (category === '全部') {
        // 如果選擇「全部」，清除其他選擇
        return new Set(['全部']);
      } else {
        // 移除「全部」
        newSet.delete('全部');
        // 切換當前類別
        if (newSet.has(category)) {
          newSet.delete(category);
          // 如果沒有選擇任何類別，回到「全部」
          if (newSet.size === 0) {
            return new Set(['全部']);
          }
        } else {
          newSet.add(category);
        }
      }
      return newSet;
    });
  };

  // 切換顏色選擇
  const toggleColor = (color: string) => {
    setSelectedColors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(color)) {
        newSet.delete(color);
      } else {
        newSet.add(color);
      }
      return newSet;
    });
  };

  // 切換品牌選擇
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  };

  // 從所有衣服中提取出現的顏色大分類
  const availableColors = useMemo(() => {
    if (!Array.isArray(clothes)) return [];
    const colorCategorySet = new Set<string>();
    clothes.forEach(cloth => {
      if (cloth.color) {
        const colorCategory = getColorCategory(cloth.color);
        colorCategorySet.add(colorCategory);
      }
    });
    return Array.from(colorCategorySet).sort();
  }, [clothes]);

  // 從所有衣服中提取出現的品牌
  const availableBrands = useMemo(() => {
    if (!Array.isArray(clothes)) return [];
    const brandSet = new Set<string>();
    clothes.forEach(cloth => {
      if (cloth.brand && cloth.brand.trim() !== '') {
        brandSet.add(cloth.brand.trim());
      }
    });
    return Array.from(brandSet).sort();
  }, [clothes]);

  useEffect(() => {
    if (!Array.isArray(clothes)) {
      setFilteredClothes([]);
      return;
    }
    
    let filtered = clothes;
    
    // 類別篩選（複選）
    if (!selectedCategories.has('全部') && selectedCategories.size > 0) {
      filtered = filtered.filter(cloth => 
        cloth.category && selectedCategories.has(cloth.category)
      );
    }
    
    // 顏色篩選（複選，使用顏色大分類）
    if (selectedColors.size > 0) {
      filtered = filtered.filter(cloth => {
        if (!cloth.color) return false;
        const colorCategory = getColorCategory(cloth.color);
        return selectedColors.has(colorCategory);
      });
    }
    
    // 品牌篩選（複選）
    if (selectedBrands.size > 0) {
      filtered = filtered.filter(cloth => 
        cloth.brand && selectedBrands.has(cloth.brand)
      );
    }
    
    setFilteredClothes(filtered);
  }, [clothes, selectedCategories, selectedColors, selectedBrands]);

  const fetchClothes = async () => {
    try {
      // 添加超時處理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時
      
      const response = await fetch('/api/clothes', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 如果未授權（登出後），直接設為空數組
      if (response.status === 401) {
        console.log('未授權，清空衣服列表');
        setClothes([]);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setClothes(result.data);
      } else {
        console.error('載入失敗:', result.error);
        setClothes([]);
      }
    } catch (error: any) {
      console.error('載入失敗:', error);
      if (error.name === 'AbortError') {
        console.error('請求超時');
      }
      setClothes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這件衣服嗎？')) return;

    try {
      const response = await fetch(`/api/clothes/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        fetchClothes();
      }
    } catch (error) {
      console.error('刪除失敗:', error);
    }
  };

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 件衣服嗎？`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/clothes/${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const allResults = await Promise.all(results.map(res => res.json()));
      const allSuccess = allResults.every(result => result.success);

      if (allSuccess) {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        fetchClothes();
      } else {
        alert('部分刪除失敗');
      }
    } catch (error) {
      console.error('批量刪除失敗:', error);
      alert('批量刪除失敗');
    }
  };

  // 長按處理
  const handleLongPressStart = (id: number) => {
    const timer = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }, 500); // 500ms 長按
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 切換選擇狀態
  const toggleSelection = (id: number) => {
    if (!isSelectionMode) return;
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 取消選擇模式
  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setShowAddToDrawer(false);
    setSelectedDrawerIds(new Set());
  };

  // 加入抽屜
  const handleAddToDrawer = async () => {
    if (selectedDrawerIds.size === 0 || selectedIds.size === 0) return;

    try {
      let successCount = 0;
      const drawerNames: string[] = [];

      // 將衣服添加到所有選中的抽屜
      for (const drawerId of selectedDrawerIds) {
        const drawerRes = await fetch(`/api/drawers/${drawerId}`);
        const drawerResult = await drawerRes.json();

        if (drawerResult.success) {
          const drawer = drawerResult.data;
          const currentClothIds = drawer.clothIds || [];
          // 過濾掉已經在抽屜中的衣服
          const newClothIds = [...currentClothIds];
          Array.from(selectedIds).forEach(id => {
            if (!newClothIds.includes(id)) {
              newClothIds.push(id);
            }
          });
          
          const response = await fetch(`/api/drawers/${drawerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clothIds: newClothIds }),
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
            drawerNames.push(drawer.name);
          }
        }
      }

      if (successCount > 0) {
        alert(`已將 ${selectedIds.size} 件衣服加入 ${successCount} 個抽屜：${drawerNames.join('、')}`);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setShowAddToDrawer(false);
        setSelectedDrawerIds(new Set());
      }
    } catch (error) {
      console.error('加入抽屜失敗:', error);
      alert('加入抽屜失敗');
    }
  };

  const toggleDrawerSelection = (drawerId: number) => {
    setSelectedDrawerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drawerId)) {
        newSet.delete(drawerId);
      } else {
        newSet.add(drawerId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/40 via-purple-50/20 to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-slate-200/15 via-blue-100/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/15 via-pink-100/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-600 border-r-purple-600"></div>
          </div>
          <div className="text-xl font-bold bg-gradient-to-r from-gray-700 via-blue-600 to-purple-600 bg-clip-text text-transparent">載入中...</div>
          <div className="mt-2 text-sm text-gray-500 font-medium">正在整理您的衣櫥</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 via-purple-50/20 to-gray-50 relative overflow-hidden">
      {/* 裝飾性背景元素 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-slate-200/15 via-blue-100/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100/15 via-pink-100/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-slate-100/8 via-blue-50/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-12 pb-24 md:pb-32 max-w-7xl relative z-10">
        {/* 標題 */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative p-4 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-2xl shadow-xl shadow-slate-500/30 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
              <svg className="w-10 h-10 text-white relative z-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-stone-800 via-slate-600 to-slate-700 bg-clip-text text-transparent tracking-tight">
                我的衣櫥
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-12 h-0.5 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full"></div>
                <p className="text-stone-600 text-sm font-medium">管理您的衣物收藏</p>
              </div>
            </div>
          </div>
        </div>

        {/* 分類篩選 */}
        {clothes.length > 0 && (
          <div className="mb-10 md:mb-12 glass-effect rounded-3xl p-6 md:p-8 space-y-8">
            {/* 類別篩選 */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="relative p-3 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-xl shadow-lg shadow-slate-400/25 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_50%)]"></div>
                  <svg className="w-5 h-5 text-white relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 md:gap-3">
              {CATEGORIES.map(category => {
                const categoryColor = getCategoryColor(category);
                const gradientClass = categoryColor.via 
                  ? `bg-gradient-to-r ${categoryColor.from} ${categoryColor.via} ${categoryColor.to}`
                  : `bg-gradient-to-r ${categoryColor.from} ${categoryColor.to}`;
                const isSelected = selectedCategories.has(category);
                
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isSelected
                        ? `${gradientClass} text-white shadow-md`
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {category}
                    {isSelected && category !== '全部' && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
              </div>
            </div>

            {/* 顏色篩選 */}
            {availableColors.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-2.5 md:gap-3">
                  {/* 顏色大分類選項 */}
                  {availableColors.map(colorCategory => {
                    const displayColor = COLOR_CATEGORY_DISPLAY_COLORS[colorCategory] || '#808080';
                    const isSelected = selectedColors.has(colorCategory);
                    return (
                      <button
                        key={colorCategory}
                        onClick={() => toggleColor(colorCategory)}
                        className={`relative w-12 h-12 rounded-2xl transition-all duration-300 border-2 overflow-hidden group ${
                          isSelected
                            ? 'border-white shadow-xl scale-110 transform ring-4 ring-white/50'
                            : 'border-white/50 hover:border-white hover:scale-105 active:scale-95 hover:shadow-lg'
                        }`}
                        style={{
                          backgroundColor: displayColor,
                          boxShadow: isSelected ? `0 20px 25px -5px ${displayColor}40, 0 10px 10px -5px ${displayColor}30` : undefined
                        }}
                        title={colorCategory}
                      >
                        {isSelected && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white drop-shadow-2xl" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 品牌篩選 */}
            {availableBrands.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-2.5 md:gap-3">
                  {availableBrands.map(brand => {
                    const isSelected = selectedBrands.has(brand);
                    return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`relative px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border-2 overflow-hidden group ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white border-transparent shadow-xl scale-105 transform'
                          : 'bg-white/90 backdrop-blur-sm text-stone-700 border-stone-200 hover:border-slate-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-50 hover:scale-105 active:scale-95 hover:shadow-lg'
                      }`}
                      style={isSelected ? {
                        boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(99, 102, 241, 0.2)'
                      } : undefined}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {isSelected && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {brand}
                      </span>
                    </button>
                  );
                  })}
                </div>
              </div>
            )}

            {/* 統計資訊 */}
            <div className="text-sm font-medium text-gray-600 bg-gray-100/80 px-4 py-3 rounded-xl">
              {selectedCategories.has('全部') && selectedColors.size === 0 && selectedBrands.size === 0 ? (
                <span>共 <span className="font-bold text-blue-600">{clothes.length}</span> 件</span>
              ) : (
                <span>
                  {!selectedCategories.has('全部') && selectedCategories.size > 0 && (
                    <span className="font-bold text-blue-600">
                      {Array.from(selectedCategories).join(' + ')}
                    </span>
                  )}
                  {(!selectedCategories.has('全部') && selectedCategories.size > 0) && (selectedColors.size > 0 || selectedBrands.size > 0) && <span className="mx-2">+</span>}
                  {selectedColors.size > 0 && (
                    <span className="font-bold text-purple-600">
                      {Array.from(selectedColors).join(' + ')}
                    </span>
                  )}
                  {(!selectedCategories.has('全部') || selectedColors.size > 0) && selectedBrands.size > 0 && <span className="mx-2">+</span>}
                  {selectedBrands.size > 0 && (
                    <span className="font-bold text-indigo-600">
                      {Array.from(selectedBrands).join(' + ')}
                    </span>
                  )}
                  <span className="ml-2">：<span className="font-bold text-purple-600">{filteredClothes.length}</span> 件</span>
                </span>
              )}
            </div>
          </div>
        )}

        {clothes.length === 0 ? (
          <div className="text-center py-32 glass-effect rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200/5 via-slate-200/5 to-stone-200/5"></div>
            <div className="relative z-10">
              <div className="inline-block p-10 bg-gradient-to-br from-slate-200/10 via-slate-200/10 to-stone-200/10 rounded-3xl mb-8 shadow-2xl border border-white/50 backdrop-blur-md">
                <svg className="w-40 h-40 text-slate-400 mx-auto animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-stone-700 via-slate-600 to-slate-700 bg-clip-text text-transparent mb-3">還沒有衣服</h2>
              <p className="text-stone-600 text-lg mb-10 font-medium">開始新增您的第一件衣服吧！</p>
              <Link
                href="/add"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 shadow-2xl shadow-slate-400/30 hover:shadow-3xl hover:shadow-slate-500/40 hover:scale-110 active:scale-95 text-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">新增第一件衣服</span>
              </Link>
            </div>
          </div>
        ) : filteredClothes.length === 0 ? (
          <div className="text-center py-24 glass-effect rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-stone-300/5 via-slate-200/5 to-slate-200/5"></div>
            <div className="relative z-10">
              <div className="inline-block p-8 bg-gradient-to-br from-stone-100/80 via-slate-50/50 to-slate-50/50 rounded-3xl mb-6 shadow-xl border border-white/50 backdrop-blur-md">
                <svg className="w-24 h-24 text-stone-400 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-700 mb-2">
                沒有找到 
                {!selectedCategories.has('全部') && selectedCategories.size > 0 && (
                  <span className="text-blue-600">{Array.from(selectedCategories).join(' + ')}</span>
                )}
                {(!selectedCategories.has('全部') && selectedCategories.size > 0) && (selectedColors.size > 0 || selectedBrands.size > 0) && <span className="mx-2">+</span>}
                {selectedColors.size > 0 && (
                  <span className="text-purple-600">{Array.from(selectedColors).join(' + ')}</span>
                )}
                {(!selectedCategories.has('全部') || selectedColors.size > 0) && selectedBrands.size > 0 && <span className="mx-2">+</span>}
                {selectedBrands.size > 0 && (
                  <span className="text-indigo-600">{Array.from(selectedBrands).join(' + ')}</span>
                )}
                的衣服
              </h3>
              <p className="text-gray-500 mb-8 font-medium">試試選擇其他分類或新增衣服</p>
              <button
                onClick={() => {
                  setSelectedCategory('全部');
                  setSelectedColor('');
                  setSelectedBrand('');
                }}
                className="px-8 py-3 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                顯示全部
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 選擇模式工具欄 */}
            {isSelectionMode && (
              <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-500 via-slate-600 to-stone-500 text-white p-4 shadow-2xl z-50">
                <div className="container mx-auto max-w-7xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={cancelSelection}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <span className="text-lg font-bold">
                      已選擇 {selectedIds.size} 件
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedIds.size === filteredClothes.length) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(filteredClothes.map(c => c.id)));
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all font-semibold"
                    >
                      {selectedIds.size === filteredClothes.length ? '取消全選' : '全選'}
                    </button>
                    <button
                      onClick={() => {
                        console.log('點擊加入抽屜按鈕，當前抽屜數量:', drawers.length);
                        console.log('選中的衣服數量:', selectedIds.size);
                        setShowAddToDrawer(true);
                      }}
                      disabled={selectedIds.size === 0}
                      className="px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
                    >
                      加入抽屜 ({selectedIds.size})
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      disabled={selectedIds.size === 0}
                      className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
                    >
                      刪除 ({selectedIds.size})
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 ${isSelectionMode ? 'pt-20' : ''}`}>
              {filteredClothes.map((cloth) => {
                const isSelected = selectedIds.has(cloth.id);
                return (
                  <div
                    key={cloth.id}
                    id={`cloth-${cloth.id}`}
                    className={`group relative bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-all duration-500 border-2 flex flex-col max-h-[calc(85vh-100px)] ${
                      isSelectionMode
                        ? isSelected
                          ? 'border-blue-500 shadow-2xl shadow-blue-500/50 scale-105'
                          : 'border-gray-200/50 opacity-60'
                        : 'border-gray-200/50 hover:border-blue-300/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 hover:scale-[1.02]'
                    }`}
                    onTouchStart={() => handleLongPressStart(cloth.id)}
                    onTouchEnd={handleLongPressEnd}
                    onMouseDown={() => handleLongPressStart(cloth.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleSelection(cloth.id);
                      } else {
                        // 雙擊編輯功能
                        const now = Date.now();
                        if (lastClickTime && lastClickTime.id === cloth.id && now - lastClickTime.time < 300) {
                          router.push(`/edit/${cloth.id}`);
                          setLastClickTime(null);
                        } else {
                          setLastClickTime({ id: cloth.id, time: now });
                        }
                      }
                    }}
                  >
                    {/* 裝飾性邊框光暈 */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-slate-200/0 via-slate-200/0 to-stone-200/0 group-hover:from-slate-200/10 group-hover:via-slate-200/10 group-hover:to-stone-200/10 transition-all duration-500 pointer-events-none"></div>
                    
                    <div className="relative aspect-square bg-white rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-all duration-300 shadow-sm group-hover:shadow-lg">
                      {cloth.image_processed_url ? (
                        <Image
                          src={cloth.image_processed_url}
                          alt={cloth.category || '衣服'}
                          fill
                          style={{ objectFit: 'contain' }}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : cloth.image_url ? (
                        <Image
                          src={cloth.image_url}
                          alt={cloth.category || '衣服'}
                          fill
                          style={{ objectFit: 'contain' }}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                          <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs font-medium">無圖片</p>
                        </div>
                      )}
                      {/* 選擇標記 */}
                      {isSelectionMode && (
                        <div className={`absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-slate-600 to-slate-700 scale-110 ring-2 ring-slate-400/50'
                            : 'bg-white/95 backdrop-blur-sm scale-100'
                        }`}>
                          {isSelected && (
                            <>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
                              <svg className="w-5 h-5 text-white relative z-10 drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </>
                          )}
                        </div>
                      )}

                      {/* 類別標籤 */}
                      {cloth.category && (() => {
                        const categoryColor = getCategoryColor(cloth.category);
                        const gradientClass = categoryColor.via 
                          ? `bg-gradient-to-r ${categoryColor.from} ${categoryColor.via} ${categoryColor.to}`
                          : `bg-gradient-to-r ${categoryColor.from} ${categoryColor.to}`;
                        return (
                          <div className={`absolute top-3 ${isSelectionMode ? 'left-3' : 'left-3'} ${gradientClass} backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md`}>
                            <span className={`text-xs font-semibold ${categoryColor.text || 'text-white'} tracking-wide`}>
                              {cloth.category}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="relative p-5 bg-white flex-1 flex flex-col overflow-hidden">
                      {/* 可滾動的內容區域 */}
                      <div className="flex-1 overflow-y-auto overscroll-contain pr-1 -mr-1" style={{ scrollbarWidth: 'thin' }}>
                        {/* 品牌 */}
                        {cloth.brand && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-stone-50 to-slate-50 border border-stone-100 shadow-sm">
                              <div className="p-1.5 bg-gradient-to-br from-slate-400 to-slate-500 rounded-md shadow-sm">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-stone-700">{cloth.brand}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* 備註 */}
                        {cloth.notes ? (
                          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 mb-3">
                            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap break-words">{cloth.notes}</p>
                          </div>
                        ) : null}
                      </div>
                      
                      {/* 固定在底部的按鈕 */}
                      {!isSelectionMode && (
                        <div className="pt-4 mt-auto border-t border-stone-100 flex gap-2 flex-shrink-0">
                          <Link
                            href={`/edit/${cloth.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-center bg-gradient-to-r from-stone-100 to-stone-50 hover:from-stone-200 hover:to-stone-100 text-stone-700 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md relative z-10"
                          >
                            <div className="p-1 bg-white rounded-md shadow-sm">
                              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <span>編輯</span>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(cloth.id);
                            }}
                            className="flex-1 text-center bg-gradient-to-r from-red-50 to-red-50/50 hover:from-red-100 hover:to-red-50 text-red-600 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md relative z-10"
                          >
                            <div className="p-1 bg-white rounded-md shadow-sm">
                              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                            <span>刪除</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 加入抽屜彈窗 */}
      {showAddToDrawer && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddToDrawer(false);
              setSelectedDrawerIds(new Set());
            }
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-800">選擇抽屜</h3>
              <button
                onClick={() => {
                  setShowAddToDrawer(false);
                  setSelectedDrawerIds(new Set());
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">將選中的 {selectedIds.size} 件衣服加入抽屜（可多選）</p>
            <p className="text-xs text-gray-400 mb-4">當前有 {drawers.length} 個抽屜</p>
            
            <div className="flex-1 space-y-2 mb-6 overflow-y-auto">
              {(() => {
                if (Array.isArray(drawers) && drawers.length > 0) {
                  console.log('顯示抽屜列表，數量:', drawers.length);
                  return (
                    <>
                  <button
                    onClick={() => {
                      if (selectedDrawerIds.size === drawers.length) {
                        setSelectedDrawerIds(new Set());
                      } else {
                        setSelectedDrawerIds(new Set(drawers.map(d => d.id)));
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all mb-2"
                  >
                    {selectedDrawerIds.size === drawers.length ? '取消全選' : '全選'}
                  </button>
                  {drawers.map((drawer) => {
                    const isSelected = selectedDrawerIds.has(drawer.id);
                    return (
                      <button
                        key={drawer.id}
                        onClick={() => toggleDrawerSelection(drawer.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="font-semibold">{drawer.name}</span>
                        {isSelected && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                    </>
                  );
                } else {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg font-semibold mb-2">還沒有抽屜</p>
                      <p className="text-sm">請先到「衣櫥」頁面創建抽屜</p>
                      <button
                        onClick={() => {
                          window.location.href = '/closet';
                        }}
                        className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all"
                      >
                        前往創建抽屜
                      </button>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddToDrawer(false);
                  setSelectedDrawerIds(new Set());
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAddToDrawer}
                disabled={selectedDrawerIds.size === 0}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
              >
                確認加入 ({selectedDrawerIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}
