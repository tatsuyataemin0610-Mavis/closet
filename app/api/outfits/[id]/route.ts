import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { data: outfit, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '找不到該穿搭' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // 轉換數據格式：cloth_ids -> clothIds
    const formattedOutfit = outfit ? {
      ...outfit,
      clothIds: outfit.cloth_ids,
      cloth_ids: undefined
    } : outfit;
    
    return NextResponse.json({ success: true, data: formattedOutfit });
  } catch (error: any) {
    console.error('取得穿搭失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得穿搭失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('outfits')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '找不到該穿搭' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    // 轉換數據格式：cloth_ids -> clothIds
    const formattedData = data ? {
      ...data,
      clothIds: data.cloth_ids,
      cloth_ids: undefined
    } : data;
    
    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('更新穿搭失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新穿搭失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('刪除穿搭失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '刪除穿搭失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
