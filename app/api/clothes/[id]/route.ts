import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { data: cloth, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '找不到該衣服' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({ success: true, data: cloth });
  } catch (error: any) {
    console.error('取得衣服失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得衣服失敗' },
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
      .from('clothes')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '找不到該衣服' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('更新衣服失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新衣服失敗' },
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
      .from('clothes')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('刪除衣服失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '刪除衣服失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
