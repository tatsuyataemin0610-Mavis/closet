'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { useState } from 'react';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    
    if (!confirm('确定要登出吗？')) return;
    
    setLoading(true);
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('登出失败:', error);
      alert('登出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50 ${className}`}
    >
      {loading ? '登出中...' : '登出'}
    </button>
  );
}
