'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        // 先嘗試從 session 獲取用戶
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
        } else {
          // 如果沒有 session，嘗試刷新
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
        }
      } catch (error) {
        console.error('獲取用戶資訊失敗:', error);
      } finally {
        setLoading(false);
      }
    }
    getUser();
    
    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!confirm('確定要登出嗎？')) {
      return;
    }

    setLogoutLoading(true);
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('登出失敗:', error);
      alert('登出失敗，請重試');
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">我的帳號</h1>

        <div className="space-y-4">
          {/* 用戶資訊卡片 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  {user?.email || '訪客'}
                </h2>
                <p className="text-sm text-stone-500">
                  {user?.id ? `ID: ${user.id.slice(0, 8)}...` : ''}
                </p>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">註冊時間</span>
                <span className="text-stone-800">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-TW') : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">上次登入</span>
                <span className="text-stone-800">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('zh-TW') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 功能按鈕 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button
              onClick={() => router.push('/migrate')}
              className="w-full px-6 py-4 text-left hover:bg-stone-50 transition-colors border-b border-stone-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <div>
                    <div className="font-medium text-stone-800">資料遷移</div>
                    <div className="text-xs text-stone-500">將本地數據導入到雲端</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => router.push('/test-fitting')}
              className="w-full px-6 py-4 text-left hover:bg-stone-50 transition-colors"
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  <div>
                    <div className="font-medium text-stone-800">虛擬試衣間</div>
                    <div className="text-xs text-stone-500">AI 試穿功能</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* 登出按鈕 */}
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full bg-white hover:bg-red-50 text-red-600 font-medium py-4 px-6 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutLoading ? '登出中...' : '登出帳號'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
