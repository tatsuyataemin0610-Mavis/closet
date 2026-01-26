import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-server';
import { uploadToStorage } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    // 驗證用戶
    const user = await getCurrentUser();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '沒有上傳檔案' },
        { status: 400 }
      );
    }

    // 檢查檔案大小（限制 10MB）
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 10) {
      return NextResponse.json(
        { success: false, error: '圖片檔案太大（最大 10MB）' },
        { status: 400 }
      );
    }

    // 上傳到 Supabase Storage
    const result = await uploadToStorage(
      file,
      'clothes-images',
      user.id // 使用 user_id 作為資料夾
    );

    // 暫時不進行自動處理
    const processedUrl = result.url; // 使用原圖
    const dominantColor = '#808080'; // 預設灰色

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.url,
        processedUrl,
        dominantColor,
        storagePath: result.path, // 保存路徑以便之後刪除
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
