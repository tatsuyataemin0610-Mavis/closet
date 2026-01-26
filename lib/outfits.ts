import fs from 'fs';
import path from 'path';

const outfitsPath = path.join(process.cwd(), 'data', 'outfits.json');

export interface Outfit {
  id: number;
  name?: string;
  clothIds: number[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 確保資料目錄存在
function ensureDataDir() {
  const dataDir = path.dirname(outfitsPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 讀取穿搭資料
export function readOutfits(): Outfit[] {
  ensureDataDir();
  if (!fs.existsSync(outfitsPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(outfitsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取穿搭資料失敗:', error);
    return [];
  }
}

// 寫入穿搭資料
export function writeOutfits(outfits: Outfit[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(outfitsPath, JSON.stringify(outfits, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('寫入穿搭資料失敗:', error.message || error);
    throw error;
  }
}

// 取得所有穿搭
export function getAllOutfits(): Outfit[] {
  return readOutfits().sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // 最新的在前
  });
}

// 取得單個穿搭
export function getOutfitById(id: number): Outfit | undefined {
  const outfits = readOutfits();
  return outfits.find(o => o.id === id);
}

// 創建穿搭
export function createOutfit(data: { 
  name?: string; 
  clothIds?: number[];
  notes?: string;
}) {
  const outfits = readOutfits();
  const newId = outfits.length > 0 
    ? Math.max(...outfits.map(o => o.id)) + 1 
    : 1;
  
  const newOutfit: Outfit = {
    id: newId,
    name: data.name,
    clothIds: data.clothIds || [],
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  outfits.push(newOutfit);
  writeOutfits(outfits);
  
  return { id: newId };
}

// 更新穿搭
export function updateOutfit(id: number, data: { 
  name?: string; 
  clothIds?: number[];
  notes?: string;
}) {
  const outfits = readOutfits();
  const index = outfits.findIndex(o => o.id === id);
  
  if (index === -1) {
    return { changes: 0 };
  }
  
  outfits[index] = {
    ...outfits[index],
    ...(data.name !== undefined && { name: data.name }),
    ...(data.clothIds !== undefined && { clothIds: data.clothIds }),
    ...(data.notes !== undefined && { notes: data.notes }),
    updated_at: new Date().toISOString(),
  };
  
  writeOutfits(outfits);
  return { changes: 1 };
}

// 刪除穿搭
export function deleteOutfit(id: number) {
  const outfits = readOutfits();
  const filtered = outfits.filter(o => o.id !== id);
  
  if (filtered.length === outfits.length) {
    return { changes: 0 };
  }
  
  writeOutfits(filtered);
  return { changes: 1 };
}
