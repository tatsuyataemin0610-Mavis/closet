'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '發送失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-4 text-6xl">📧</div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">郵件已發送</h2>
            <p className="text-stone-600 mb-6">
              請檢查您的信箱 <strong>{email}</strong>，點擊郵件中的連結重設密碼。
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition"
            >
              回到登入頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">忘記密碼</h1>
            <p className="text-stone-600">輸入您的帳號，我們會發送重設密碼的連結</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                帳號
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '發送中...' : '發送重設連結'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-600">
            <Link href="/auth/login" className="text-stone-800 font-medium hover:underline">
              ← 回到登入頁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
