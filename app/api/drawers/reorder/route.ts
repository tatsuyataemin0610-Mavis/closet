import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    const body = await request.json();
    const { drawerIds } = body;

    if (!Array.isArray(drawerIds)) {
      return NextResponse.json(
        { success: false, error: 'drawerIds 必須是陣列' },
        { status: 400 }
      );
    }

    // Update order_index for each drawer
    const updates = drawerIds.map((id: string, index: number) => 
      supabase
        .from('drawers')
        .update({ order_index: index })
        .eq('id', id)
        .eq('user_id', user.id)
    );

    await Promise.all(updates);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('重新排序抽屜失敗:', error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || '重新排序抽屜失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
