import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('🔍 Middleware 執行:', req.nextUrl.pathname);
  console.log('📦 Cookies:', req.cookies.getAll().map(c => c.name));
  
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = req.cookies.get(name)?.value;
          console.log(`🍪 Get cookie: ${name} = ${value ? '有值' : '無值'}`);
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`🍪 Set cookie: ${name}`);
          // 確保 cookie 持久化（30 天）
          const cookieOptions = {
            ...options,
            maxAge: options.maxAge || 60 * 60 * 24 * 30, // 30 天
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
          };
          
          req.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          console.log(`🍪 Remove cookie: ${name}`);
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  console.log('👤 Session 狀態:', session ? '已登入' : '未登入');
  if (session) {
    console.log('👤 用戶:', session.user.email);
  }

  // 如果用户未登入，且不在认证页面，重定向到登入页
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    console.log('❌ 未登入，重定向到登入頁');
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 如果用户已登入，且在认证页面，重定向到衣柜页
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    console.log('✅ 已登入但在認證頁面，重定向到衣櫃頁');
    const redirectUrl = new URL('/closet', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  console.log('✅ 通過 middleware 檢查');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
