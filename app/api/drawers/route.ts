import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { data: drawers, error } = await supabase
      .from('drawers')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data: drawers || [] });
  } catch (error: any) {
    console.error('取得抽屜列表失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得抽屜列表失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    const body = await request.json();
    
    // Get the max order_index to append new drawer at the end
    const { data: existingDrawers } = await supabase
      .from('drawers')
      .select('order_index')
      .eq('user_id', user.id)
      .order('order_index', { ascending: false })
      .limit(1);
    
    const nextOrderIndex = existingDrawers && existingDrawers.length > 0 
      ? existingDrawers[0].order_index + 1 
      : 0;
    
    const { data, error } = await supabase
      .from('drawers')
      .insert({
        ...body,
        user_id: user.id,
        order_index: nextOrderIndex,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('新增抽屜失敗:', error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || '新增抽屜失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
