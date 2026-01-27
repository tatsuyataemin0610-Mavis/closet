'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('📝 表單提交，準備登入...');

    try {
      console.log('🔐 開始登入...', { email });
      const result = await signIn(email, password);
      console.log('✅ 登入成功！', result);
      
      // 短暫延遲確保 cookie 設置完成
      console.log('⏳ 等待 500ms 確保 cookie 設置完成...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 使用 window.location 強制完整頁面刷新，確保 session 被正確載入
      console.log('🔄 即將跳轉到 /closet...');
      console.log('當前 URL:', window.location.href);
      window.location.href = '/closet';
      console.log('✅ 跳轉指令已執行');
    } catch (err: any) {
      console.error('❌ 登入失敗:', err);
      setError(err.message || '登入失敗，請檢查帳號和密碼');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">歡迎回來</h1>
            <p className="text-stone-600">登入您的虛擬衣櫥</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                帳號（可輸入任意格式的信箱）
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                placeholder="myname@test.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-stone-600 hover:text-stone-800 transition"
              >
                忘記密碼？
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-600">
            還沒有帳號？{' '}
            <Link href="/auth/signup" className="text-stone-800 font-medium hover:underline">
              立即註冊
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
