'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import FittingRoom from '@/components/FittingRoom';
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
}

interface Outfit {
  id: number;
  name?: string;
  clothIds: number[];
  notes?: string;
  date?: string;
  created_at: string;
  updated_at: string;
}

type TabType = 'drawers' | 'outfits' | 'fitting';

const CATEGORIES = [
  '全部', 'T恤', '襯衫', '針織衫', '連帽衫', '外套', '大衣', '羽絨服',
  '褲子', '短褲', '裙子', '洋裝', '內衣', '襪子', '配件', '包包', '其他'
];

export default function ClosetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('drawers');
  const [drawers, setDrawers] = useState<Drawer[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothes, setClothes] = useState<Cloth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState('');
  const [showAddOutfit, setShowAddOutfit] = useState(false);
  const [editingOutfitId, setEditingOutfitId] = useState<number | null>(null);
  const [newOutfitName, setNewOutfitName] = useState('');
  const [newOutfitNotes, setNewOutfitNotes] = useState('');
  const [selectedClothIds, setSelectedClothIds] = useState<Set<number>>(new Set());
  // 篩選狀態
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [filterColor, setFilterColor] = useState<string>('');
  const [filterBrand, setFilterBrand] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 試衣間相關狀態
  const [userProfile, setUserProfile] = useState<{ height?: number; weight?: number; gender?: string; avatar_url?: string } | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileHeight, setProfileHeight] = useState('');
  const [profileWeight, setProfileWeight] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [selectedFittingClothes, setSelectedFittingClothes] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // 當路由變化時（例如從抽屜詳情頁返回），重新載入數據
  useEffect(() => {
    if (pathname === '/closet') {
      fetchData();
    }
  }, [pathname]);

  const fetchData = async () => {
    try {
      // 獲取抽屜
      const drawersRes = await fetch('/api/drawers');
      if (drawersRes.ok) {
        const drawersResult = await drawersRes.json();
        if (drawersResult.success && Array.isArray(drawersResult.data)) {
          setDrawers(drawersResult.data);
        } else {
          setDrawers([]);
        }
      } else {
        setDrawers([]);
      }
      
      // 獲取穿搭
      const outfitsRes = await fetch('/api/outfits');
      if (outfitsRes.ok) {
        const outfitsResult = await outfitsRes.json();
        if (outfitsResult.success && Array.isArray(outfitsResult.data)) {
          setOutfits(outfitsResult.data);
        } else {
          setOutfits([]);
        }
      } else {
        setOutfits([]);
      }
      
      // 獲取衣服
      const clothesRes = await fetch('/api/clothes');
      if (clothesRes.ok) {
        const clothesResult = await clothesRes.json();
        if (clothesResult.success && Array.isArray(clothesResult.data)) {
          setClothes(clothesResult.data);
        } else {
          setClothes([]);
        }
      } else {
        setClothes([]);
      }
      
      // 獲取用戶資料
      const profileRes = await fetch('/api/user-profile');
      if (profileRes.ok) {
        const profileResult = await profileRes.json();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
          setProfileHeight(profileResult.data.height?.toString() || '');
          setProfileWeight(profileResult.data.weight?.toString() || '');
          setProfileGender(profileResult.data.gender || '');
        }
      }
    } catch (error) {
      console.error('載入失敗:', error);
      // 確保在錯誤情況下設置空數組
      setDrawers([]);
      setOutfits([]);
      setClothes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrawer = async () => {
    if (!newDrawerName.trim()) return;

    try {
      const response = await fetch('/api/drawers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDrawerName.trim() }),
      });

      const result = await response.json();
      if (result.success) {
        setNewDrawerName('');
        setShowAddDrawer(false);
        fetchData();
      }
    } catch (error) {
      console.error('新增抽屜失敗:', error);
    }
  };

  const handleDeleteDrawer = async (id: number) => {
    if (!confirm('確定要刪除這個抽屜嗎？')) return;

    try {
      const response = await fetch(`/api/drawers/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('刪除抽屜失敗:', error);
    }
  };

  const getDrawerClothes = (drawer: Drawer) => {
    if (!Array.isArray(clothes) || !Array.isArray(drawer.clothIds)) return [];
    return drawer.clothIds
      .map(id => clothes.find(c => c.id === id))
      .filter((c): c is Cloth => c !== undefined)
      .slice(0, 3); // 只顯示前3件
  };

  const getDrawerCount = (drawer: Drawer) => {
    if (!Array.isArray(drawer.clothIds)) return 0;
    return drawer.clothIds.length;
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newDrawers = [...drawers];
    const draggedItem = newDrawers[draggedIndex];
    newDrawers.splice(draggedIndex, 1);
    newDrawers.splice(dropIndex, 0, draggedItem);
    
    setDrawers(newDrawers);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // 保存新順序到後端
    try {
      const drawerIds = newDrawers.map(d => d.id);
      const response = await fetch('/api/drawers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawerIds }),
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('保存順序失敗:', result.error);
        // 如果失敗，重新載入數據
        fetchData();
      }
    } catch (error) {
      console.error('保存順序失敗:', error);
      // 如果失敗，重新載入數據
      fetchData();
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 穿搭相關函數
  const handleAddOutfit = async () => {
    if (selectedClothIds.size === 0) {
      alert('請至少選擇一件衣服');
      return;
    }

    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOutfitName.trim() || undefined,
          clothIds: Array.from(selectedClothIds),
          notes: newOutfitNotes.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNewOutfitName('');
        setNewOutfitNotes('');
        setSelectedClothIds(new Set());
        setShowAddOutfit(false);
        setFilterCategory('全部');
        setFilterColor('');
        setFilterBrand('');
        fetchData();
      }
    } catch (error) {
      console.error('新增穿搭失敗:', error);
    }
  };

  const handleEditOutfit = (outfit: Outfit) => {
    setEditingOutfitId(outfit.id);
    setNewOutfitName(outfit.name || '');
    setNewOutfitNotes(outfit.notes || '');
    setSelectedClothIds(new Set(outfit.clothIds));
    setShowAddOutfit(false);
    setFilterCategory('全部');
    setFilterColor('');
    setFilterBrand('');
  };

  const handleUpdateOutfit = async () => {
    if (!editingOutfitId) return;
    if (selectedClothIds.size === 0) {
      alert('請至少選擇一件衣服');
      return;
    }

    try {
      const response = await fetch(`/api/outfits/${editingOutfitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOutfitName.trim() || undefined,
          clothIds: Array.from(selectedClothIds),
          notes: newOutfitNotes.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNewOutfitName('');
        setNewOutfitNotes('');
        setSelectedClothIds(new Set());
        setEditingOutfitId(null);
        setFilterCategory('全部');
        setFilterColor('');
        setFilterBrand('');
        fetchData();
      }
    } catch (error) {
      console.error('更新穿搭失敗:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingOutfitId(null);
    setNewOutfitName('');
    setNewOutfitNotes('');
    setSelectedClothIds(new Set());
    setFilterCategory('全部');
    setFilterColor('');
    setFilterBrand('');
  };

  const handleDeleteOutfit = async (id: number) => {
    if (!confirm('確定要刪除這個穿搭嗎？')) return;

    try {
      const response = await fetch(`/api/outfits/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error('刪除穿搭失敗:', error);
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

  const getOutfitClothes = (outfit: Outfit) => {
    if (!Array.isArray(clothes) || !Array.isArray(outfit.clothIds)) return [];
    return outfit.clothIds
      .map(id => clothes.find(c => c.id === id))
      .filter((c): c is Cloth => c !== undefined);
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

  // 根據篩選條件過濾衣服
  const filteredClothesForOutfit = useMemo(() => {
    if (!Array.isArray(clothes)) return [];
    let filtered = clothes;
    
    // 類別篩選
    if (filterCategory !== '全部') {
      filtered = filtered.filter(cloth => cloth.category === filterCategory);
    }
    
    // 顏色篩選（使用顏色大分類）
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
  }, [clothes, filterCategory, filterColor, filterBrand]);

  // 試衣間相關函數
  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: profileHeight ? parseFloat(profileHeight) : undefined,
          weight: profileWeight ? parseFloat(profileWeight) : undefined,
          gender: profileGender || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setUserProfile(result.data);
        setShowProfileForm(false);
      }
    } catch (error) {
      console.error('保存用戶資料失敗:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data?.imageUrl) {
        const profileResponse = await fetch('/api/user-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: result.data.imageUrl }),
        });

        const profileResult = await profileResponse.json();
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
      }
    } catch (error) {
      console.error('上傳照片失敗:', error);
    }
  };

  const toggleFittingCloth = (clothId: number) => {
    setSelectedFittingClothes(prev => {
      if (prev.includes(clothId)) {
        return prev.filter(id => id !== clothId);
      } else {
        return [...prev, clothId];
      }
    });
  };

  const getSelectedFittingClothes = () => {
    return selectedFittingClothes
      .map(id => clothes.find(c => c.id === id))
      .filter((c): c is Cloth => c !== undefined);
  };

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 標題和狀態 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative p-4 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-2xl shadow-xl shadow-slate-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
              <svg className="w-10 h-10 text-white relative z-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-stone-800 via-slate-600 to-slate-700 bg-clip-text text-transparent">
              衣櫥
            </h1>
          </div>
        </div>

        {/* 子頁籤 */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 shadow-sm border border-stone-200">
          <button
            onClick={() => setActiveTab('drawers')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'drawers'
                ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            抽屜
          </button>
          <button
            onClick={() => setActiveTab('outfits')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'outfits'
                ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            穿搭
          </button>
          <button
            onClick={() => setActiveTab('fitting')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'fitting'
                ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            試衣間
          </button>
        </div>

        {/* 抽屜內容 */}
        {activeTab === 'drawers' && (
          <>
            <p className="text-stone-600 mb-8 text-lg">
              利用這個空間將衣櫥整理成你需要的樣子吧!
            </p>

        {/* 抽屜列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(drawers || []).map((drawer, index) => {
            const drawerClothes = getDrawerClothes(drawer);
            const count = getDrawerCount(drawer);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            
            return (
              <div
                key={drawer.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => router.push(`/closet/${drawer.id}`)}
                className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-stone-200 cursor-move group relative ${
                  isDragging ? 'opacity-50 scale-95' : ''
                } ${
                  isDragOver ? 'border-slate-400 border-2 shadow-lg scale-105' : ''
                }`}
              >
                {/* 拖拽手柄 */}
                <div className="absolute top-3 left-3 p-2 rounded-lg bg-stone-100 hover:bg-stone-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                {/* 抽屜標題和數量 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-stone-800 group-hover:text-slate-700 transition-colors">{drawer.name}</h3>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-gradient-to-r from-slate-100 to-stone-100 rounded-lg">
                      <span className="text-sm font-semibold text-stone-700">{count} 件</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDrawer(drawer.id);
                      }}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 衣服預覽 */}
                <div className="flex gap-3 mb-4">
                  {drawerClothes.length > 0 ? (
                    drawerClothes.map((cloth) => (
                      <div
                        key={cloth.id}
                        className="relative w-20 h-20 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm"
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
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="w-full h-20 bg-stone-50 rounded-lg flex items-center justify-center text-stone-400 text-sm border border-stone-200">
                      暫無衣服
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 新增抽屜按鈕 */}
        {showAddDrawer ? (
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-dashed border-stone-300">
            <input
              type="text"
              value={newDrawerName}
              onChange={(e) => setNewDrawerName(e.target.value)}
              placeholder="輸入抽屜名稱"
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 mb-4 text-stone-700"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddDrawer();
                } else if (e.key === 'Escape') {
                  setShowAddDrawer(false);
                  setNewDrawerName('');
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddDrawer}
                className="flex-1 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                確認
              </button>
              <button
                onClick={() => {
                  setShowAddDrawer(false);
                  setNewDrawerName('');
                }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-semibold transition-all"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddDrawer(true)}
            className="w-full border-2 border-dashed border-stone-300 rounded-2xl p-8 hover:border-slate-400 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
              <svg className="w-7 h-7 relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-slate-600 font-semibold group-hover:text-slate-700 transition-colors">新增抽屜</span>
          </button>
        )}
          </>
        )}

        {/* 穿搭內容 */}
        {activeTab === 'outfits' && (
          <>
            <p className="text-stone-600 mb-8 text-lg">
              記錄你的日常穿搭，打造專屬風格!
            </p>

            {/* 穿搭列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {(outfits || []).map((outfit) => {
                const outfitClothes = getOutfitClothes(outfit);
                
                return (
                  <div
                    key={outfit.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-stone-200"
                  >
                    {/* 穿搭標題 */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-stone-800">
                        {outfit.name || `穿搭 #${outfit.id}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOutfit(outfit);
                          }}
                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all"
                          title="編輯"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOutfit(outfit.id);
                          }}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                          title="刪除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* 衣服預覽 */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      {outfitClothes.length > 0 ? (
                        outfitClothes.map((cloth) => (
                          <div
                            key={cloth.id}
                            className="relative w-20 h-20 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm"
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
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="w-full h-20 bg-stone-50 rounded-lg flex items-center justify-center text-stone-400 text-sm border border-stone-200">
                          暫無衣服
                        </div>
                      )}
                    </div>

                    {/* 備註 */}
                    {outfit.notes && (
                      <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                        <p className="text-sm text-stone-600 line-clamp-2">{outfit.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 新增/編輯穿搭 */}
            {(showAddOutfit || editingOutfitId !== null) ? (
              <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-dashed border-stone-300">
                <h3 className="text-lg font-bold text-stone-800 mb-4">
                  {editingOutfitId !== null ? '編輯穿搭' : '新增穿搭'}
                </h3>
                
                <div className="space-y-4 mb-4">
                  <input
                    type="text"
                    value={newOutfitName}
                    onChange={(e) => setNewOutfitName(e.target.value)}
                    placeholder="穿搭名稱（可選）"
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700"
                  />
                  <textarea
                    value={newOutfitNotes}
                    onChange={(e) => setNewOutfitNotes(e.target.value)}
                    placeholder="備註（可選）"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700 resize-none"
                  />
                </div>

                {/* 選擇衣服 */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-stone-700 mb-3">
                    選擇衣服 ({selectedClothIds.size} 件已選)
                  </p>

                  {/* 篩選區域 */}
                  <div className="mb-4 space-y-3">
                    {/* 類別篩選 */}
                    <div>
                      <p className="text-xs font-semibold text-stone-600 mb-2">類別</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category}
                            onClick={() => setFilterCategory(category)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              filterCategory === category
                                ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                        <p className="text-xs font-semibold text-stone-600 mb-2">顏色</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterColor('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              filterColor === ''
                                ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            全部
                          </button>
                          {availableColors.map((colorCategory) => {
                            const displayColor = COLOR_CATEGORY_DISPLAY_COLORS[colorCategory] || '#999999';
                            return (
                              <button
                                key={colorCategory}
                                onClick={() => setFilterColor(colorCategory)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                                  filterColor === colorCategory
                                    ? 'border-slate-600 shadow-md scale-105'
                                    : 'border-stone-200 hover:border-stone-300'
                                }`}
                                style={{
                                  backgroundColor: filterColor === colorCategory ? displayColor : 'white',
                                  color: filterColor === colorCategory ? 'white' : '#57534e',
                                }}
                              >
                                {colorCategory}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 品牌篩選 */}
                    {availableBrands.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-stone-600 mb-2">品牌</p>
                        <select
                          value={filterBrand}
                          onChange={(e) => setFilterBrand(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm text-stone-700 bg-white"
                        >
                          <option value="">全部品牌</option>
                          {availableBrands.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 清除篩選 */}
                    {(filterCategory !== '全部' || filterColor !== '' || filterBrand !== '') && (
                      <button
                        onClick={() => {
                          setFilterCategory('全部');
                          setFilterColor('');
                          setFilterBrand('');
                        }}
                        className="text-xs text-slate-600 hover:text-slate-700 underline"
                      >
                        清除所有篩選
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-64 overflow-y-auto p-3 bg-stone-50 rounded-xl border border-stone-200">
                    {filteredClothesForOutfit.length > 0 ? (
                      filteredClothesForOutfit.map((cloth) => {
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
                        </div>
                      );
                    })
                    ) : (
                      <div className="col-span-full text-center py-8 text-stone-400 text-sm">
                        沒有符合篩選條件的衣服
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={editingOutfitId !== null ? handleUpdateOutfit : handleAddOutfit}
                    disabled={selectedClothIds.size === 0}
                    className="flex-1 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    {editingOutfitId !== null ? '更新' : '確認'}
                  </button>
                  <button
                    onClick={() => {
                      if (editingOutfitId !== null) {
                        handleCancelEdit();
                      } else {
                        setShowAddOutfit(false);
                        setNewOutfitName('');
                        setNewOutfitNotes('');
                        setSelectedClothIds(new Set());
                        setFilterCategory('全部');
                        setFilterColor('');
                        setFilterBrand('');
                      }
                    }}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-semibold transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAddOutfit(true);
                  setFilterCategory('全部');
                  setFilterColor('');
                  setFilterBrand('');
                }}
                className="w-full border-2 border-dashed border-stone-300 rounded-2xl p-8 hover:border-slate-400 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]"></div>
                  <svg className="w-7 h-7 relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-slate-600 font-semibold group-hover:text-slate-700 transition-colors">新增穿搭</span>
              </button>
            )}
          </>
        )}

        {/* 試衣間內容 */}
        {activeTab === 'fitting' && (
          <>
            <p className="text-stone-600 mb-8 text-lg">
              設定你的資料，試穿你的衣服搭配!
            </p>

            {/* 用戶資料設定 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-stone-800">個人資料</h3>
                <button
                  onClick={() => setShowProfileForm(!showProfileForm)}
                  className="px-4 py-2 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                >
                  {showProfileForm ? '取消' : '編輯'}
                </button>
              </div>

              {showProfileForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">身高 (cm)</label>
                    <input
                      type="number"
                      value={profileHeight}
                      onChange={(e) => setProfileHeight(e.target.value)}
                      placeholder="例如：165"
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">體重 (kg)</label>
                    <input
                      type="number"
                      value={profileWeight}
                      onChange={(e) => setProfileWeight(e.target.value)}
                      placeholder="例如：55"
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">性別</label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700"
                    >
                      <option value="">請選擇</option>
                      <option value="female">女性</option>
                      <option value="male">男性</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">照片</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-stone-700"
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userProfile?.height && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-600">身高：</span>
                      <span className="text-stone-800">{userProfile.height} cm</span>
                    </div>
                  )}
                  {userProfile?.weight && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-600">體重：</span>
                      <span className="text-stone-800">{userProfile.weight} kg</span>
                    </div>
                  )}
                  {userProfile?.gender && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-600">性別：</span>
                      <span className="text-stone-800">
                        {userProfile.gender === 'female' ? '女性' : userProfile.gender === 'male' ? '男性' : '其他'}
                      </span>
                    </div>
                  )}
                  {userProfile?.avatar_url && (
                    <div className="mt-4">
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-stone-200">
                        <Image
                          src={userProfile.avatar_url}
                          alt="用戶照片"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {!userProfile?.height && !userProfile?.weight && !userProfile?.avatar_url && (
                    <p className="text-stone-500 text-sm">尚未設定個人資料</p>
                  )}
                </div>
              )}
            </div>

            {/* 試衣間 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-8">
              <h3 className="text-xl font-bold text-stone-800 mb-4">選擇衣服試穿</h3>
              
              {/* 衣服選擇區域 */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-64 overflow-y-auto p-3 bg-stone-50 rounded-xl border border-stone-200 mb-6">
                {(clothes || []).map((cloth) => {
                  const isSelected = selectedFittingClothes.includes(cloth.id);
                  return (
                    <div
                      key={cloth.id}
                      onClick={() => toggleFittingCloth(cloth.id)}
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
                    </div>
                  );
                })}
              </div>

              {/* AI試衣效果顯示 */}
              <div className="relative bg-gradient-to-br from-stone-100 to-slate-100 rounded-xl p-8 min-h-[400px] flex items-center justify-center border-2 border-stone-200">
                {userProfile?.avatar_url ? (
                  <FittingRoom
                    avatarUrl={userProfile.avatar_url}
                    clothes={getSelectedFittingClothes()}
                    gender={userProfile.gender}
                  />
                ) : (
                  <div className="text-center">
                    <div className="inline-block p-8 bg-white rounded-2xl shadow-lg mb-4">
                      <svg className="w-32 h-32 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-stone-600 font-medium">請先上傳照片並選擇衣服</p>
                  </div>
                )}
              </div>

              {selectedFittingClothes.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-stone-200">
                  <p className="text-sm font-semibold text-stone-700 mb-2">已選擇 {selectedFittingClothes.length} 件衣服</p>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedFittingClothes().map((cloth) => (
                      <div
                        key={cloth.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-stone-200"
                      >
                        <span className="text-xs text-stone-600">{cloth.category || '衣服'}</span>
                        <button
                          onClick={() => toggleFittingCloth(cloth.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
