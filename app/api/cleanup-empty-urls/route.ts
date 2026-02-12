import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

/**
 * 清理數據庫中的空字符串 URL
 * 將空字符串轉換為 null，避免前端嘗試載入無效的圖片
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    // 獲取所有衣服
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    let cleanedCount = 0;
    const cleanedItems: any[] = [];
    
    // 需要清理的欄位
    const imageFields = [
      'image_url',
      'image_processed_url',
      'care_label_url',
      'brand_label_url',
      'back_view_url',
      'material_photo_url',
    ];
    
    for (const cloth of clothes || []) {
      const updates: any = {};
      let needsUpdate = false;
      
      for (const field of imageFields) {
        const value = cloth[field];
        
        if (value !== null && value !== undefined) {
          // 處理字符串類型的欄位
          if (typeof value === 'string') {
            // 分割 CSV 字符串
            const urls = value.split(',').map(url => url.trim()).filter(url => {
              // 過濾掉空字符串和無效的 URL
              if (!url) return false;
              if (url === '""' || url === "''") return false; // 過濾引號包裹的空字符串
              if (url.length < 5) return false; // 過濾太短的 URL
              return true;
            });
            
            // 如果過濾後沒有有效的 URL，設置為 null
            if (urls.length === 0) {
              if (value !== '') {
                updates[field] = null;
                needsUpdate = true;
              }
            } else if (urls.length !== value.split(',').length) {
              // 如果過濾後的數量不同，需要更新
              updates[field] = urls.join(',');
              needsUpdate = true;
            }
          }
          // 如果值本身就是空字符串，設置為 null
          else if (value === '') {
            updates[field] = null;
            needsUpdate = true;
          }
        }
      }
      
      // 如果需要更新
      if (needsUpdate) {
        console.log(`清理衣服 ${cloth.id}:`, updates);
        
        const { error: updateError } = await supabase
          .from('clothes')
          .update(updates)
          .eq('id', cloth.id);
        
        if (updateError) {
          console.error(`更新衣服 ${cloth.id} 失敗:`, updateError);
        } else {
          cleanedCount++;
          cleanedItems.push({
            id: cloth.id,
            category: cloth.category,
            updates,
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `已清理 ${cleanedCount} 件衣服的空字符串 URL`,
      data: {
        totalClothes: clothes?.length || 0,
        cleanedCount,
        cleanedItems,
      },
    });
  } catch (error: any) {
    console.error('清理空字符串 URL 失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '清理失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
