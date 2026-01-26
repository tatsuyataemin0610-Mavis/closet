// Supabase 客户端设置
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// 类型定义
export interface Cloth {
  id: string;
  user_id: string;
  name?: string;
  category?: string;
  color?: string;
  brand?: string;
  size?: string;
  material?: string;
  occasion?: string;
  price?: number;
  purchase_date?: string;
  seasons?: string;
  notes?: string;
  image_url?: string;
  image_processed_url?: string;
  care_label_url?: string;
  brand_label_url?: string;
  back_view_url?: string;
  material_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Drawer {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  cloth_ids: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}
