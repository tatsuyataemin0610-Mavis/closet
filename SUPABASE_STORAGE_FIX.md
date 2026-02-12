# Supabase Storage 圖片載入問題修復指南

## 問題描述
圖片 URL 返回 404 錯誤，無法載入圖片。

## 診斷步驟

### 1. 檢查 Supabase Storage Bucket 設置

前往 Supabase Dashboard：
1. 打開 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點擊左側選單的「Storage」
4. 查看 `clothes-images` bucket

### 2. 確認 Bucket 是公開的

點擊 `clothes-images` bucket 後：
1. 點擊右上角的「Settings」（設定）
2. 確認「Public bucket」選項已啟用
3. 如果未啟用，請啟用它

### 3. 檢查 Storage 政策

在 Supabase Dashboard：
1. 點擊左側選單的「Storage」
2. 選擇 `clothes-images` bucket
3. 點擊「Policies」標籤
4. 確認有以下政策：

```sql
-- 允許所有人查看公開圖片
CREATE POLICY "Anyone can view public images"
ON storage.objects FOR SELECT
USING (bucket_id = 'clothes-images');

-- 允許用戶上傳自己的圖片
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clothes-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允許用戶刪除自己的圖片
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clothes-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. 手動測試圖片 URL

從診斷工具中複製一個圖片 URL，然後：
1. 在新的瀏覽器標籤頁中打開該 URL
2. 如果返回 404，表示圖片不存在或權限有問題
3. 如果能看到圖片，表示 URL 是正確的，問題可能在前端

## 解決方案

### 方案 1：重新設置 Bucket 為公開

在 Supabase Dashboard 的 SQL Editor 中執行：

```sql
-- 確保 bucket 是公開的
UPDATE storage.buckets 
SET public = true 
WHERE id = 'clothes-images';
```

### 方案 2：添加缺失的 Storage 政策

如果政策不完整，執行：

```sql
-- 刪除舊政策（如果存在）
DROP POLICY IF EXISTS "Anyone can view public images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 重新創建政策
CREATE POLICY "Anyone can view public images"
ON storage.objects FOR SELECT
USING (bucket_id = 'clothes-images');

CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clothes-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clothes-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 方案 3：使用 Signed URLs（建議用於私有內容）

如果你希望圖片是私有的，需要使用 signed URLs。修改 API 路由：

```typescript
// app/api/clothes/route.ts
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createClient();
  const { data: clothes, error } = await supabase
    .from('clothes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // 為每個圖片 URL 生成 signed URL
  const clothesWithSignedUrls = await Promise.all(
    (clothes || []).map(async (cloth) => {
      const signedUrls: any = {};
      
      // 處理各種圖片欄位
      const imageFields = ['image_url', 'image_processed_url', 'care_label_url', 'brand_label_url', 'back_view_url', 'material_photo_url'];
      
      for (const field of imageFields) {
        const url = cloth[field];
        if (url && typeof url === 'string') {
          // 從 URL 提取路徑
          const path = extractPathFromSupabaseUrl(url);
          if (path) {
            const { data } = await supabase.storage
              .from('clothes-images')
              .createSignedUrl(path, 3600); // 1小時有效期
            
            if (data?.signedUrl) {
              signedUrls[field] = data.signedUrl;
            }
          }
        }
      }
      
      return {
        ...cloth,
        ...signedUrls,
      };
    })
  );
  
  return NextResponse.json({ success: true, data: clothesWithSignedUrls });
}

// 輔助函數：從 Supabase URL 提取路徑
function extractPathFromSupabaseUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // URL 格式：https://xxx.supabase.co/storage/v1/object/public/clothes-images/path/to/file.jpg
    const pathMatch = url.match(/\/storage\/v1\/object\/public\/clothes-images\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
```

### 方案 4：重新上傳圖片

如果以上方案都無法解決，可能是圖片檔案確實丟失了。需要：
1. 刪除資料庫中的無效 URL
2. 重新上傳圖片

可以創建一個清理腳本：

```typescript
// app/api/cleanup-invalid-images/route.ts
import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase-server';

export async function POST() {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    
    // 獲取所有衣服
    const { data: clothes, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    let cleanedCount = 0;
    
    for (const cloth of clothes || []) {
      const updates: any = {};
      let needsUpdate = false;
      
      // 檢查並清除無效的 image_url
      if (cloth.image_url) {
        try {
          const response = await fetch(cloth.image_url, { method: 'HEAD' });
          if (!response.ok) {
            updates.image_url = null;
            needsUpdate = true;
          }
        } catch {
          updates.image_url = null;
          needsUpdate = true;
        }
      }
      
      // 如果需要更新
      if (needsUpdate) {
        await supabase
          .from('clothes')
          .update(updates)
          .eq('id', cloth.id);
        cleanedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `已清理 ${cleanedCount} 件衣服的無效圖片 URL`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## 驗證修復

修復後，請：
1. 訪問 `/diagnose-images` 頁面
2. 點擊「測試所有 URL」
3. 確認所有圖片都可以訪問
4. 返回主頁面，確認圖片正常顯示

## 預防措施

為了避免未來出現類似問題：

1. **定期備份 Storage**
   - 設置定期備份策略
   - 考慮使用多個 storage provider

2. **添加圖片上傳驗證**
   - 上傳後立即驗證圖片是否可訪問
   - 如果失敗，重試上傳

3. **使用 CDN**
   - 考慮在 Supabase Storage 前面加一層 CDN
   - 可以提高載入速度並減少 404 錯誤

4. **監控圖片載入**
   - 添加錯誤追蹤（例如 Sentry）
   - 定期掃描並修復無效的圖片 URL
