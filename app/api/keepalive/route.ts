import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 免費方案一段時間沒有存取會自動暫停，由 Vercel Cron 每天呼叫一次保持喚醒
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 有設定 CRON_SECRET 時，只接受 Vercel Cron 帶來的授權標頭
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  // 只查筆數、不取資料，足以讓資料庫記到一次存取
  const { error } = await supabase.from('clothes').select('id', { count: 'exact', head: true });

  if (error) {
    console.error('Supabase 喚醒失敗:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, at: new Date().toISOString() });
}
