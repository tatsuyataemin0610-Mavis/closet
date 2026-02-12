import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

/**
 * 診斷圖片 URL 問題的 API
 * 檢查資料庫中的圖片 URL 是否有效
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    // 獲取所有衣服
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('id, category, image_url, image_processed_url, material_photo_url, care_label_url, brand_label_url, back_view_url')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    const issues: any[] = [];
    const validImages: any[] = [];
    
    // 檢查每件衣服的圖片 URL
    for (const cloth of clothes || []) {
      const imageFields = [
        { field: 'image_url', value: cloth.image_url },
        { field: 'image_processed_url', value: cloth.image_processed_url },
        { field: 'material_photo_url', value: cloth.material_photo_url },
        { field: 'care_label_url', value: cloth.care_label_url },
        { field: 'brand_label_url', value: cloth.brand_label_url },
        { field: 'back_view_url', value: cloth.back_view_url },
      ];
      
      for (const { field, value } of imageFields) {
        if (!value) continue;
        
        // 處理數組格式（某些欄位可能是 CSV 字串）
        const urls = typeof value === 'string' 
          ? value.split(',').filter(Boolean) 
          : Array.isArray(value) 
            ? value 
            : [value];
        
        for (const url of urls) {
          if (!url || typeof url !== 'string') continue;
          
          // 檢查 URL 格式
          const isValidFormat = url.startsWith('http') || url.startsWith('/');
          const hasSupabaseUrl = url.includes('supabase.co');
          
          if (!isValidFormat || !hasSupabaseUrl) {
            issues.push({
              clothId: cloth.id,
              category: cloth.category,
              field,
              url,
              issue: 'Invalid URL format',
            });
          } else {
            validImages.push({
              clothId: cloth.id,
              category: cloth.category,
              field,
              url,
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalClothes: clothes?.length || 0,
        totalIssues: issues.length,
        totalValid: validImages.length,
        issues,
        validImages,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
    });
  } catch (error: any) {
    console.error('診斷圖片失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '診斷圖片失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

/**
 * 測試單個圖片 URL 是否可訪問
 */
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: '缺少 URL 參數' },
        { status: 400 }
      );
    }
    
    // 嘗試獲取圖片
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      
      return NextResponse.json({
        success: true,
        data: {
          url,
          status: response.status,
          statusText: response.statusText,
          accessible: response.ok,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
        },
      });
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        data: {
          url,
          accessible: false,
          error: fetchError.message,
        },
      });
    }
  } catch (error: any) {
    console.error('測試圖片 URL 失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '測試失敗' },
      { status: 500 }
    );
  }
}
