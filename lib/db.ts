import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'closet.json');

interface Cloth {
  id: number;
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
  care_label_url?: string; // 存儲為逗號分隔的字符串，如 "url1,url2,url3"
  brand_label_url?: string; // 存儲為逗號分隔的字符串，如 "url1,url2,url3"
  back_view_url?: string; // 存儲為逗號分隔的字符串，如 "url1,url2,url3"
  material_photo_url?: string; // 存儲為逗號分隔的字符串，如 "url1,url2,url3"
  created_at?: string;
  updated_at?: string;
}

// 確保資料目錄存在
function ensureDataDir() {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 讀取資料
function readData(): Cloth[] {
  ensureDataDir();
  if (!fs.existsSync(dbPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取資料失敗:', error);
    return [];
  }
}

// 寫入資料
function writeData(data: Cloth[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('資料寫入失敗:', error.message || error);
    throw error;
  }
}

// 初始化資料庫
export function initDatabase() {
  ensureDataDir();
  if (!fs.existsSync(dbPath)) {
    writeData([]);
  }
}

// 取得所有衣服
export function getAllClothes(): Cloth[] {
  const data = readData();
  return data.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

// 取得單件衣服
export function getClothById(id: number): Cloth | undefined {
  const data = readData();
  return data.find(item => item.id === id);
}

// 新增衣服
export function createCloth(data: {
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
}) {
  try {
    const allData = readData();
    const newId = allData.length > 0 
      ? Math.max(...allData.map(item => item.id)) + 1 
      : 1;
    
    const newCloth: Cloth = {
      id: newId,
      name: data.name || undefined,
      category: data.category || undefined,
      color: data.color || undefined,
      brand: data.brand || undefined,
      size: data.size || undefined,
      material: data.material || undefined,
      occasion: data.occasion || undefined,
      price: data.price || undefined,
      purchase_date: data.purchase_date || undefined,
      seasons: data.seasons || undefined,
      notes: data.notes || undefined,
      image_url: data.image_url || undefined,
      image_processed_url: data.image_processed_url || undefined,
      care_label_url: data.care_label_url || undefined,
      brand_label_url: data.brand_label_url || undefined,
      back_view_url: data.back_view_url || undefined,
      material_photo_url: data.material_photo_url || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    allData.push(newCloth);
    writeData(allData);
    
    return { lastInsertRowid: newId };
  } catch (error: any) {
    console.error('createCloth 錯誤:', error.message || error);
    throw error;
  }
}

// 更新衣服
export function updateCloth(id: number, data: {
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
}) {
  const allData = readData();
  const index = allData.findIndex(item => item.id === id);
  
  if (index === -1) {
    return { changes: 0 };
  }
  
  const existing = allData[index];
  allData[index] = {
    ...existing,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.brand !== undefined && { brand: data.brand }),
    ...(data.size !== undefined && { size: data.size }),
    ...(data.material !== undefined && { material: data.material }),
    ...(data.occasion !== undefined && { occasion: data.occasion }),
    ...(data.price !== undefined && { price: data.price }),
    ...(data.purchase_date !== undefined && { purchase_date: data.purchase_date }),
    ...(data.seasons !== undefined && { seasons: data.seasons }),
    ...(data.notes !== undefined && { notes: data.notes }),
    ...(data.image_url !== undefined && { image_url: data.image_url }),
    ...(data.image_processed_url !== undefined && { image_processed_url: data.image_processed_url }),
    ...(data.care_label_url !== undefined && { care_label_url: data.care_label_url }),
    ...(data.brand_label_url !== undefined && { brand_label_url: data.brand_label_url }),
    ...(data.back_view_url !== undefined && { back_view_url: data.back_view_url }),
    ...(data.material_photo_url !== undefined && { material_photo_url: data.material_photo_url }),
    updated_at: new Date().toISOString(),
  };
  
  writeData(allData);
  return { changes: 1 };
}

// 刪除衣服
export function deleteCloth(id: number) {
  const allData = readData();
  const filtered = allData.filter(item => item.id !== id);
  const changes = allData.length - filtered.length;
  writeData(filtered);
  return { changes };
}

// 初始化資料庫（如果尚未初始化）
initDatabase();
