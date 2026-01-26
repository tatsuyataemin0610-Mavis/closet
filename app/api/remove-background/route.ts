import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'nodejs';
export const maxDuration = 60; // 允許最多 60 秒執行時間

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: Request) {
  try {
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

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: output,
      },
    });
  } catch (error: any) {
    console.error('❌ Replicate 去背失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '去背處理失敗',
      },
      { status: 500 }
    );
  }
}
