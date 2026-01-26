import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getCurrentUser } from '@/lib/supabase-server';
import { uploadToStorage } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const maxDuration = 60; // 允許最多 60 秒執行時間

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: Request) {
  try {
    // 驗證用戶
    const user = await getCurrentUser();
    
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '缺少圖片 URL' },
        { status: 400 }
      );
    }

    console.log('🔄 開始使用 Replicate 去背...');
    console.log('圖片 URL:', imageUrl);

    // 使用 Replicate 的 rembg 模型進行去背
    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: imageUrl,
        }
      }
    ) as string;

    console.log('✅ Replicate 去背完成');
    console.log('輸出 URL:', output);

    // 在服務器端下載去背後的圖片
    console.log('📥 服務器端下載去背後的圖片...');
    const imageResponse = await fetch(output);
    if (!imageResponse.ok) {
      throw new Error('無法從 Replicate 下載圖片');
    }
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ 圖片下載成功，大小:', (buffer.length / 1024).toFixed(2), 'KB');

    // 上傳到 Supabase Storage
    console.log('🔄 上傳去背後的圖片到 Supabase...');
    const uploadResult = await uploadToStorage(
      buffer,
      'clothes-images',
      user.id
    );
    console.log('✅ 上傳成功！');
    console.log('圖片 URL:', uploadResult.url);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        storagePath: uploadResult.path,
      },
    });
  } catch (error: any) {
    console.error('❌ 去背處理失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '去背處理失敗',
      },
      { status: 500 }
    );
  }
}
