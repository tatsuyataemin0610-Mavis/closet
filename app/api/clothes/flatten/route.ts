import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const provider = formData.get('provider') as string || 'openai'; // 'openai' 或 'gemini'
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '沒有上傳檔案' },
        { status: 400 }
      );
    }

    // 建立上傳目錄
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 讀取圖片
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    
    console.log('收到圖片，大小:', (buf.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('使用 AI 提供商:', provider);

    // 檢查圖片大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (buf.length > maxSize) {
      return NextResponse.json(
        { success: false, error: `圖片太大（${(buf.length / 1024 / 1024).toFixed(2)}MB），最大 10MB` },
        { status: 400 }
      );
    }

    let flattenedBuffer: Buffer | null = null;

    // 根據提供商選擇 AI 服務
    try {
      if (provider === 'openai') {
        console.log('開始 OpenAI 攤平處理...');
        // 添加超時保護（60秒）
        const flattenPromise = flattenWithOpenAI(buf);
        const timeoutPromise = new Promise<Buffer>((_, reject) => {
          setTimeout(() => reject(new Error('OpenAI 攤平處理超時（超過60秒）')), 60000);
        });
        flattenedBuffer = await Promise.race([flattenPromise, timeoutPromise]);
      } else if (provider === 'gemini') {
        console.log('開始 Gemini 攤平處理...');
        flattenedBuffer = await flattenWithGemini(buf);
      } else if (provider === 'replicate') {
        console.log('開始 Replicate 攤平處理...');
        flattenedBuffer = await flattenWithReplicate(buf);
      } else {
        return NextResponse.json(
          { success: false, error: '不支持的 AI 提供商' },
          { status: 400 }
        );
      }

      if (!flattenedBuffer) {
        return NextResponse.json(
          { success: false, error: 'AI 攤平處理失敗（返回 null）' },
          { status: 500 }
        );
      }
    } catch (flattenError: any) {
      console.error('攤平處理過程中的錯誤:', flattenError);
      console.error('錯誤堆疊:', flattenError.stack);
      return NextResponse.json(
        { success: false, error: flattenError.message || '攤平處理失敗' },
        { status: 500 }
      );
    }

    // 儲存攤平後的圖片
    const timestamp = Date.now();
    const filename = `${timestamp}_flattened.png`;
    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, flattenedBuffer);
    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        provider,
      },
    });
  } catch (error: any) {
    console.error('AI 攤平失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'AI 攤平處理失敗' },
      { status: 500 }
    );
  }
}

// OpenAI 攤平（使用 images.edit API，編輯原圖而非生成新圖）
async function flattenWithOpenAI(imageBuffer: Buffer): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未設置');
  }

  try {
    console.log('調用 OpenAI API 進行攤平（使用 images.edit + gpt-image-1）...');
    console.log('圖片大小:', (imageBuffer.length / 1024).toFixed(2), 'KB');
    
    // 構建提示詞：透明背景 + 置中留白 + 固定尺寸，不改變衣服本身
    const prompt = `Remove the background and output a PNG with a transparent background. Do NOT change the product at all: keep shape, color, texture, logo/text, and folds exactly. No retouching, no new objects. Center the garment on a 1024x1024 canvas with even margins around it (~8%). Do not crop any part of the garment.`;
    
    // 生成白色 mask（edit API 需要 mask）
    console.log('創建 mask...');
    let maskBuffer: Buffer;
    try {
      // 添加超時保護（10秒），避免 sharp 處理大圖片時崩潰
      const maskPromise = createWhiteMask(imageBuffer);
      const maskTimeout = new Promise<Buffer>((_, reject) => {
        setTimeout(() => reject(new Error('創建 mask 超時（超過10秒）')), 10000);
      });
      maskBuffer = await Promise.race([maskPromise, maskTimeout]);
      console.log('Mask 創建成功，大小:', (maskBuffer.length / 1024).toFixed(2), 'KB');
    } catch (maskError: any) {
      console.error('創建 mask 失敗:', maskError);
      console.error('錯誤堆疊:', maskError.stack);
      throw new Error(`創建 mask 失敗: ${maskError.message}`);
    }
    
    // 嘗試使用 OpenAI SDK（如果已安裝）
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      
      console.log('使用 OpenAI SDK 調用 images.edit...');
      
      // 將 Buffer 轉換為 File 對象（OpenAI SDK 需要）
      const imageUint8 = new Uint8Array(imageBuffer);
      const maskUint8 = new Uint8Array(maskBuffer);
      const imageFile = new File([imageUint8], 'image.png', { type: 'image/png' });
      const maskFile = new File([maskUint8], 'mask.png', { type: 'image/png' });
      
      // 使用標準格式（不帶 model 參數，讓 API 自動選擇）
      // 注意：images.edit 預設使用 dall-e-2，不支援 gpt-image-1
      console.log('準備調用 client.images.edit（標準格式，使用 dall-e-2）...');
      const result = await client.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt,
        size: '1024x1024',
        response_format: 'b64_json',
        n: 1,
      });
      
      console.log('OpenAI API 調用完成，檢查結果...');
        
      if (result.data && result.data[0]) {
        if (result.data[0].b64_json) {
          const b64 = result.data[0].b64_json;
          console.log('✅ OpenAI 攤平成功（b64_json）！');
          return Buffer.from(b64, 'base64');
        } else if (result.data[0].url) {
          // 下載 URL 格式的圖片
          console.log('下載 URL 格式的圖片:', result.data[0].url);
          const imageResponse = await fetch(result.data[0].url);
          if (!imageResponse.ok) {
            throw new Error(`無法下載圖片: ${imageResponse.status}`);
          }
          const imageBlob = await imageResponse.arrayBuffer();
          console.log('✅ OpenAI 攤平成功（URL 下載）！');
          return Buffer.from(imageBlob);
        }
      }
      
      throw new Error('OpenAI SDK 未返回有效的圖片數據');
    } catch (sdkError: any) {
      console.warn('OpenAI SDK 調用失敗，嘗試使用直接 API 調用:', sdkError.message);
      
      // 如果 SDK 不可用或出錯，嘗試使用 FormData 直接調用 API
      const formData = new FormData();
      // 將 Buffer 轉換為 Uint8Array 再轉為 Blob
      const imageBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' });
      const maskBlob = new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' });
      formData.append('image', imageBlob, 'image.png');
      formData.append('mask', maskBlob, 'mask.png');
      formData.append('prompt', prompt);
      formData.append('size', '1024x1024');
      formData.append('response_format', 'b64_json');
      
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Images API 錯誤:', errorText);
        throw new Error(`OpenAI API 錯誤: ${response.status} ${response.statusText}. 詳細: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.data && result.data[0]) {
        if (result.data[0].b64_json) {
          const b64 = result.data[0].b64_json;
          console.log('✅ OpenAI 攤平成功（使用 API）！');
          return Buffer.from(b64, 'base64');
        } else if (result.data[0].url) {
          const imageResponse = await fetch(result.data[0].url);
          const imageBlob = await imageResponse.arrayBuffer();
          console.log('✅ OpenAI 攤平成功（URL 下載）！');
          return Buffer.from(imageBlob);
        }
      }

      throw new Error('OpenAI 未返回有效的圖片數據');
    }
  } catch (error: any) {
    console.error('OpenAI 攤平錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    throw error;
  }
}

// 創建白色 mask（edit API 需要 mask，白色表示可編輯區域）
async function createWhiteMask(imageBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('開始創建 mask，圖片大小:', (imageBuffer.length / 1024).toFixed(2), 'KB');
    
    const sharp = (await import('sharp')).default;
    
    // 先讀取 metadata，添加錯誤處理
    let metadata;
    try {
      metadata = await sharp(imageBuffer).metadata();
      console.log('圖片 metadata:', { width: metadata.width, height: metadata.height });
    } catch (metaError: any) {
      console.error('讀取圖片 metadata 失敗:', metaError);
      throw new Error(`讀取圖片 metadata 失敗: ${metaError.message}`);
    }
    
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;
    
    // 限制尺寸，避免記憶體問題（圖片太大可能導致 sharp 崩潰）
    const maxSize = 2048;
    const finalWidth = Math.min(width, maxSize);
    const finalHeight = Math.min(height, maxSize);
    
    console.log('創建 mask，尺寸:', finalWidth, 'x', finalHeight);
    
    // 使用更安全的方式創建 mask
    let maskBuffer: Buffer;
    try {
      maskBuffer = await sharp({
        create: {
          width: finalWidth,
          height: finalHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 255 }
        }
      })
      .png()
      .toBuffer();
      
      console.log('Mask 創建成功，大小:', (maskBuffer.length / 1024).toFixed(2), 'KB');
    } catch (createError: any) {
      console.error('sharp 創建 mask 失敗:', createError);
      // 如果 sharp 失敗，使用簡單的 Canvas 方式（但這在 Node.js 環境中不可用）
      // 所以我們拋出錯誤
      throw new Error(`創建 mask 失敗: ${createError.message}`);
    }
    
    return maskBuffer;
  } catch (error: any) {
    console.error('createWhiteMask 函數錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    throw new Error(`創建 mask 失敗: ${error.message}`);
  }
}

// Replicate 攤平（使用專業的圖片編輯模型）
async function flattenWithReplicate(imageBuffer: Buffer): Promise<Buffer | null> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN 未設置');
  }

  try {
    // 先保存臨時文件，用於生成公開 URL
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const tempFilename = `temp_replicate_${Date.now()}.png`;
    const tempPath = path.join(uploadDir, tempFilename);
    await writeFile(tempPath, imageBuffer);
    
    // 生成公開訪問的 URL（開發環境使用 localhost，生產環境需要使用實際域名）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const imageUrl = `${baseUrl}/uploads/${tempFilename}`;
    
    console.log('調用 Replicate API 進行攤平...');
    console.log('圖片 URL:', imageUrl);
    
    // 動態導入 Replicate（如果未安裝會在運行時報錯）
    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({
      auth: apiToken,
    });

    // 使用 flux-kontext-pro 或 prunaai/p-image-edit 進行圖片編輯
    // 優先嘗試 flux-kontext-pro（效果更好，但可能更貴）
    let output: string | string[];
    
    try {
      console.log('嘗試使用 flux-kontext-pro 模型...');
      output = await replicate.run(
        'black-forest-labs/flux-kontext-pro',
        {
          input: {
            image: imageUrl,
            prompt: 'Flatten the clothing item, remove wrinkles and folds, create a professional flat lay product photography style. Maintain the original color, brand label, patterns, and fabric texture. White background, natural lighting, symmetric front view. Remove shadows and creases while preserving all details.',
            strength: 0.7, // 控制編輯強度（0-1），0.7 表示保留較多原圖特徵
          }
        }
      ) as string | string[];
    } catch (error: any) {
      console.warn('flux-kontext-pro 失敗，嘗試 prunaai/p-image-edit:', error.message);
      // 如果 flux-kontext-pro 失敗，嘗試備用模型
      output = await replicate.run(
        'prunaai/p-image-edit',
        {
          input: {
            image: imageUrl,
            prompt: 'Flatten the clothing item, remove wrinkles, maintain texture, white background, professional product photography',
            strength: 0.6,
          }
        }
      ) as string | string[];
    }

    // 清理臨時文件
    try {
      const fs = require('fs');
      if (existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (e) {
      console.warn('清理臨時文件失敗:', e);
    }

    // Replicate 返回的可能是字符串（URL）或字符串數組
    const outputUrl = Array.isArray(output) ? output[0] : output;
    
    if (!outputUrl) {
      throw new Error('Replicate 未返回圖片 URL');
    }

    console.log('Replicate 處理完成，下載結果...');
    
    // 下載生成的圖片
    const imageResponse = await fetch(outputUrl);
    if (!imageResponse.ok) {
      throw new Error(`無法下載處理後的圖片: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.arrayBuffer();
    console.log('攤平版本生成成功！');
    return Buffer.from(imageBlob);
  } catch (error: any) {
    console.error('Replicate 攤平錯誤:', error);
    throw error;
  }
}

// Gemini 攤平
async function flattenWithGemini(imageBuffer: Buffer): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 未設置');
  }

  try {
    // 將圖片轉換為 base64
    const base64Image = imageBuffer.toString('base64');
    
    console.log('調用 Gemini API 進行攤平...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: '請處理這張衣服圖片：完全移除背景，背景改為純白色。將衣服攤平，修正原本的歪斜角度，呈現對稱的正面平鋪視覺。保持衣服原本的顏色、標籤位置與圖案特徵。移除多餘的陰影與雜亂的皺褶，提升專業感。輸出處理後的圖片。'
              },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: base64Image,
                }
              }
            ]
          }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 錯誤:', errorText);
      throw new Error(`Gemini API 錯誤: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Gemini 返回的是文本描述，不是圖片
    // 需要檢查是否有圖片生成功能
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      console.warn('Gemini 返回文本，不是圖片。可能需要使用其他模型。');
      throw new Error('Gemini 當前不支持圖片生成，請使用 OpenAI');
    }

    throw new Error('Gemini 未返回有效結果');
  } catch (error: any) {
    console.error('Gemini 攤平錯誤:', error);
    throw error;
  }
}
