import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-server';
import { uploadToStorage } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    // 驗證用戶
    const user = await getCurrentUser();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const shouldFlatten = formData.get('flatten') === 'true'; // 是否攤平
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '沒有上傳檔案' },
        { status: 400 }
      );
    }

    // 讀取上傳的圖片
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    
    console.log('收到圖片，大小:', (buf.length / 1024 / 1024).toFixed(2), 'MB');

    // 檢查圖片大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buf.length > maxSize) {
      return NextResponse.json(
        { success: false, error: `圖片太大（${(buf.length / 1024 / 1024).toFixed(2)}MB），最大 10MB` },
        { status: 400 }
      );
    }

    let finalBuffer = buf;
    let processed = false;

    // 暫時禁用攤平功能
    if (shouldFlatten) {
      console.warn('⚠️ 攤平功能暫時禁用');
      finalBuffer = buf;
      processed = false;
    }

    // 上傳到 Supabase Storage
    const result = await uploadToStorage(
      finalBuffer,
      'clothes-images',
      `${user.id}/processed` // 使用子資料夾分類
    );

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.url,
        flattened: processed,
        storagePath: result.path,
      },
    });
  } catch (error: any) {
    console.error('上傳失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '上傳失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
