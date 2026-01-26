import fs from 'fs';
import path from 'path';

const drawersPath = path.join(process.cwd(), 'data', 'drawers.json');

export interface Drawer {
  id: number;
  name: string;
  clothIds: number[];
  created_at: string;
  updated_at: string;
}

// 確保資料目錄存在
function ensureDataDir() {
  const dataDir = path.dirname(drawersPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 讀取抽屜資料
export function readDrawers(): Drawer[] {
  ensureDataDir();
  if (!fs.existsSync(drawersPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(drawersPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取抽屜資料失敗:', error);
    return [];
  }
}

// 寫入抽屜資料
export function writeDrawers(drawers: Drawer[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(drawersPath, JSON.stringify(drawers, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('寫入抽屜資料失敗:', error.message || error);
    throw error;
  }
}

// 取得所有抽屜
export function getAllDrawers(): Drawer[] {
  return readDrawers().sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

// 取得單個抽屜
export function getDrawerById(id: number): Drawer | undefined {
  const drawers = readDrawers();
  return drawers.find(d => d.id === id);
}

// 創建抽屜
export function createDrawer(data: { name: string; clothIds?: number[] }) {
  const drawers = readDrawers();
  const newId = drawers.length > 0 
    ? Math.max(...drawers.map(d => d.id)) + 1 
    : 1;
  
  const newDrawer: Drawer = {
    id: newId,
    name: data.name,
    clothIds: data.clothIds || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  drawers.push(newDrawer);
  writeDrawers(drawers);
  
  return { id: newId };
}

// 更新抽屜
export function updateDrawer(id: number, data: { name?: string; clothIds?: number[] }) {
  const drawers = readDrawers();
  const index = drawers.findIndex(d => d.id === id);
  
  if (index === -1) {
    return { changes: 0 };
  }
  
  drawers[index] = {
    ...drawers[index],
    ...(data.name !== undefined && { name: data.name }),
    ...(data.clothIds !== undefined && { clothIds: data.clothIds }),
    updated_at: new Date().toISOString(),
  };
  
  writeDrawers(drawers);
  return { changes: 1 };
}

// 刪除抽屜
export function deleteDrawer(id: number) {
  const drawers = readDrawers();
  const filtered = drawers.filter(d => d.id !== id);
  
  if (filtered.length === drawers.length) {
    return { changes: 0 };
  }
  
  writeDrawers(filtered);
  return { changes: 1 };
}

// 初始化抽屜（根據現有衣服的類別自動創建）
export function initDrawersFromClothes(clothes: Array<{ id: number; category?: string }>) {
  const drawers = readDrawers();
  
  // 如果已經有抽屜，就不自動創建
  if (drawers.length > 0) {
    return;
  }
  
  // 根據類別分組
  const categoryMap = new Map<string, number[]>();
  clothes.forEach(cloth => {
    if (cloth.category && cloth.category !== '其他') {
      if (!categoryMap.has(cloth.category)) {
        categoryMap.set(cloth.category, []);
      }
      categoryMap.get(cloth.category)!.push(cloth.id);
    }
  });
  
  // 創建抽屜
  let drawerId = 1;
  categoryMap.forEach((clothIds, category) => {
    if (clothIds.length > 0) {
      const drawer: Drawer = {
        id: drawerId++,
        name: category,
        clothIds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      drawers.push(drawer);
    }
  });
  
  if (drawers.length > 0) {
    writeDrawers(drawers);
  }
}
