import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

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
        message: '沒有衣服需要清理',
        deleted: 0
      });
    }
    
    // 找出所有圖片 URL 還是本地路徑的衣服（舊的重複資料）
    const toDelete: string[] = [];
    
    for (const cloth of clothes) {
      // 檢查主要圖片 URL
      const imageUrl = cloth.image_url;
      
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        // 這是舊的本地路徑，需要刪除
        toDelete.push(cloth.id);
      }
    }
    
    if (toDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有找到需要清理的重複資料',
        deleted: 0
      });
    }
    
    // 刪除這些衣服
    const { error: deleteError } = await supabase
      .from('clothes')
      .delete()
      .in('id', toDelete);
    
    if (deleteError) throw deleteError;
    
    return NextResponse.json({
      success: true,
      message: `成功清理 ${toDelete.length} 件重複的衣服`,
      deleted: toDelete.length,
      deletedIds: toDelete
    });
    
  } catch (error: any) {
    console.error('清理重複資料失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '清理失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
