import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';
import { uploadToStorage } from '@/lib/supabase-storage';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    // 取得該用戶的所有衣服
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    if (!clothes || clothes.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有需要遷移的衣服',
        migrated: 0
      });
    }
    
    let migratedCount = 0;
    const results: any[] = [];
    
    // 遷移每件衣服的圖片
    for (const cloth of clothes) {
      const updates: any = {};
      const clothResult: any = {
        id: cloth.id,
        brand: cloth.brand,
        category: cloth.category,
        migratedImages: []
      };
      
      // 需要遷移的圖片欄位
      const imageFields = [
        'image_url',
        'image_processed_url',
        'care_label_url',
        'brand_label_url'
      ];
      
      // 遷移單張圖片
      for (const field of imageFields) {
        const oldUrl = cloth[field];
        if (oldUrl && oldUrl.startsWith('/uploads/')) {
          try {
            const localPath = path.join(process.cwd(), 'public', oldUrl);
            
            if (fs.existsSync(localPath)) {
              const fileBuffer = fs.readFileSync(localPath);
              const result = await uploadToStorage(
                fileBuffer,
                'clothes-images',
                user.id
              );
              
              updates[field] = result.url;
              clothResult.migratedImages.push({ field, newUrl: result.url });
              migratedCount++;
            } else {
              console.warn(`File not found: ${localPath}`);
            }
          } catch (err) {
            console.error(`Failed to migrate ${field} for cloth ${cloth.id}:`, err);
          }
        }
      }
      
      // 遷移多張圖片（back_view_url, material_photo_url）
      const multiImageFields = ['back_view_url', 'material_photo_url'];
      
      for (const field of multiImageFields) {
        const oldUrls = cloth[field];
        if (Array.isArray(oldUrls) && oldUrls.length > 0) {
          const newUrls: string[] = [];
          
          for (const oldUrl of oldUrls) {
            if (oldUrl && oldUrl.startsWith('/uploads/')) {
              try {
                const localPath = path.join(process.cwd(), 'public', oldUrl);
                
                if (fs.existsSync(localPath)) {
                  const fileBuffer = fs.readFileSync(localPath);
                  const result = await uploadToStorage(
                    fileBuffer,
                    'clothes-images',
                    user.id
                  );
                  
                  newUrls.push(result.url);
                  migratedCount++;
                }
              } catch (err) {
                console.error(`Failed to migrate ${field} image for cloth ${cloth.id}:`, err);
              }
            } else {
              newUrls.push(oldUrl); // 保留非本地圖片
            }
          }
          
          if (newUrls.length > 0) {
            updates[field] = newUrls;
            clothResult.migratedImages.push({ field, count: newUrls.length });
          }
        }
      }
      
      // 更新資料庫
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('clothes')
          .update(updates)
          .eq('id', cloth.id);
        
        if (updateError) {
          console.error(`Failed to update cloth ${cloth.id}:`, updateError);
        } else {
          clothResult.updated = true;
        }
      }
      
      results.push(clothResult);
    }
    
    return NextResponse.json({
      success: true,
      message: `成功遷移 ${migratedCount} 張圖片`,
      migratedCount,
      totalClothes: clothes.length,
      results
    });
    
  } catch (error: any) {
    console.error('圖片遷移失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '圖片遷移失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
