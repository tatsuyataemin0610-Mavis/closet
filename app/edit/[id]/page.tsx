'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ClothForm from '@/components/ClothForm';
import BottomNav from '@/components/BottomNav';

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
}

export default function EditClothPage() {
  const router = useRouter();
  const params = useParams();
  const [cloth, setCloth] = useState<Cloth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCloth(String(params.id));
      // 保存當前編輯的衣服 ID 到 sessionStorage，以便返回時滾動
      sessionStorage.setItem('lastEditedClothId', String(params.id));
    }
  }, [params.id]);

  const fetchCloth = async (id: string) => {
    try {
      const response = await fetch(`/api/clothes/${id}`);
      const result = await response.json();
      if (result.success) {
        setCloth(result.data);
      }
    } catch (error) {
      console.error('載入失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/clothes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        // 返回結果，讓表單可以處理抽屜添加
        return { ...result, id: String(params.id) };
      } else {
        alert('更新失敗：' + result.error);
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('更新失敗:', error);
      alert('更新失敗');
      throw error;
    }
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

  if (!cloth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50">
        <div className="text-center">
          <div className="text-lg font-medium text-stone-700 mb-4">找不到該衣服</div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50 py-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-stone-800 to-stone-700 bg-clip-text text-transparent mb-2">
            編輯衣服
          </h1>
          <p className="text-stone-600">更新衣物資訊</p>
        </div>
        <ClothForm onSubmit={handleSubmit} initialData={cloth} />
      </div>
      
      <BottomNav />
    </div>
  );
}
