'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClothForm from '@/components/ClothForm';
import BottomNav from '@/components/BottomNav';

export default function AddClothPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/clothes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        // 返回結果，讓表單可以處理抽屜添加和跳轉
        return result;
      } else {
        alert('新增失敗：' + (result.error || '未知錯誤'));
        throw new Error(result.error || '新增失敗');
      }
    } catch (error: any) {
      console.error('新增失敗:', error);
      alert('新增失敗：' + (error.message || '網路錯誤'));
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50/30 to-stone-50 py-8 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-stone-800 to-stone-700 bg-clip-text text-transparent mb-2">
            新增衣服
          </h1>
          <p className="text-stone-600">為您的衣櫥添加新衣物</p>
        </div>
        <ClothForm onSubmit={handleSubmit} />
      </div>
      
      <BottomNav />
    </div>
  );
}
