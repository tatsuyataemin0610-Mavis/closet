import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({ id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return NextResponse.json({ success: true, data: newProfile });
      }
      throw error;
    }
    
    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('取得用戶資料失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得用戶資料失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...body,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('更新用戶資料失敗:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新用戶資料失敗' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
