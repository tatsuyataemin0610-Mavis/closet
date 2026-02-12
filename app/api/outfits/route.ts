import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { data: outfits, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // 轉換數據格式：cloth_ids -> clothIds
    const formattedOutfits = (outfits || []).map((outfit: any) => ({
      ...outfit,
      clothIds: outfit.cloth_ids,
      cloth_ids: undefined
    }));
    
    return NextResponse.json({ success: true, data: formattedOutfits });
  } catch (error: any) {
    console.error('取得穿搭列表失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得穿搭列表失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('outfits')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 轉換數據格式：cloth_ids -> clothIds
    const formattedData = data ? {
      ...data,
      clothIds: data.cloth_ids,
      cloth_ids: undefined
    } : data;
    
    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('新增穿搭失敗:', error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || '新增穿搭失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
