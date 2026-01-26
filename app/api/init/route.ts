import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    initDatabase();
    return NextResponse.json({ success: true, message: '資料庫初始化成功' });
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    return NextResponse.json(
      { success: false, error: '資料庫初始化失敗' },
      { status: 500 }
    );
  }
}
