// Supabase Storage helper functions
import { createClient } from './supabase-server';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * 上傳檔案到 Supabase Storage
 * @param file - 要上傳的檔案
 * @param bucket - bucket 名稱
 * @param folder - 資料夾路徑（可選）
 * @returns 上傳結果包含公開 URL 和路徑
 */
export async function uploadToStorage(
  file: File | Buffer,
  bucket: string,
  folder?: string
): Promise<UploadResult> {
  const supabase = createClient();
  
  // 生成唯一檔名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  // 從 File 物件取得檔名和副檔名，或使用預設值
  let ext = 'png';
  let originalName = 'file';
  
  if (file instanceof File) {
    const nameParts = file.name.split('.');
    ext = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'png';
    originalName = nameParts[0];
    
    // 清理文件名：移除中文、空格和特殊字符
    // 只保留字母、數字、連字符和下劃線
    originalName = originalName
      .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
      .replace(/[^\w\-]/g, '_') // 將非字母數字字符替換為下劃線
      .replace(/_{2,}/g, '_') // 將連續的下劃線替換為單個
      .replace(/^_+|_+$/g, '') // 移除開頭和結尾的下劃線
      .substring(0, 50); // 限制長度
    
    // 如果清理後為空，使用預設名稱
    if (!originalName) {
      originalName = 'image';
    }
  }
  
  const filename = `${timestamp}_${randomStr}_${originalName}.${ext}`;
  const filePath = folder ? `${folder}/${filename}` : filename;
  
  // 轉換 File 為 ArrayBuffer
  let fileData: ArrayBuffer | Buffer;
  if (file instanceof File) {
    fileData = await file.arrayBuffer();
  } else {
    fileData = file;
  }
  
  // 上傳到 Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileData, {
      contentType: file instanceof File ? file.type : 'image/png',
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`上傳失敗: ${error.message}`);
  }
  
  // 取得公開 URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * 從 Supabase Storage 刪除檔案
 * @param bucket - bucket 名稱
 * @param path - 檔案路徑
 */
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    console.error('Supabase Storage delete error:', error);
    throw new Error(`刪除失敗: ${error.message}`);
  }
}

/**
 * 從舊的 URL 路徑提取檔案路徑
 * 例如：/uploads/123456_image.jpg -> 123456_image.jpg
 */
export function extractPathFromUrl(url: string): string {
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '');
  }
  return url;
}
