import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data: clothes || [] });
  } catch (error: any) {
    console.error('取得衣服列表失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得衣服列表失敗' },
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
      .from('clothes')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('新增衣服失敗:', error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || '新增衣服失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
