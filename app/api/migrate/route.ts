import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    // Read the local JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'closet.json');
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({
        success: false,
        error: '找不到本地數據文件'
      }, { status: 404 });
    }
    
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const clothes = JSON.parse(jsonData);
    
    if (!Array.isArray(clothes) || clothes.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有數據需要遷移',
        imported: 0
      });
    }
    
    // Transform the data to match Supabase schema
    const clothesToInsert = clothes.map((cloth: any) => {
      const { id, ...rest } = cloth; // Remove old id
      return {
        ...rest,
        user_id: user.id,
        // Transform back_view_url if it's an array
        back_view_url: Array.isArray(cloth.back_view_url) ? cloth.back_view_url : [],
        material_photo_url: Array.isArray(cloth.material_photo_url) ? cloth.material_photo_url : [],
      };
    });
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('clothes')
      .insert(clothesToInsert)
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: `成功導入 ${data.length} 件衣服`,
      imported: data.length,
      data
    });
    
  } catch (error: any) {
    console.error('數據遷移失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '數據遷移失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
