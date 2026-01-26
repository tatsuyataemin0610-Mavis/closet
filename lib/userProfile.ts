import fs from 'fs';
import path from 'path';

const userProfilePath = path.join(process.cwd(), 'data', 'userProfile.json');

export interface UserProfile {
  height?: number; // 身高（cm）
  weight?: number; // 體重（kg）
  gender?: string; // 性別：'male' | 'female' | 'other'
  avatar_url?: string; // 用戶照片URL
  updated_at: string;
}

// 確保資料目錄存在
function ensureDataDir() {
  const dataDir = path.dirname(userProfilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 讀取用戶資料
export function readUserProfile(): UserProfile | null {
  ensureDataDir();
  if (!fs.existsSync(userProfilePath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(userProfilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取用戶資料失敗:', error);
    return null;
  }
}

// 寫入用戶資料
export function writeUserProfile(profile: UserProfile) {
  try {
    ensureDataDir();
    fs.writeFileSync(userProfilePath, JSON.stringify(profile, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('寫入用戶資料失敗:', error.message || error);
    throw error;
  }
}

// 取得用戶資料
export function getUserProfile(): UserProfile | null {
  return readUserProfile();
}

// 更新用戶資料
export function updateUserProfile(data: { height?: number; weight?: number; gender?: string; avatar_url?: string }) {
  const existing = readUserProfile();
  
  const profile: UserProfile = {
    height: data.height !== undefined ? data.height : existing?.height,
    weight: data.weight !== undefined ? data.weight : existing?.weight,
    gender: data.gender !== undefined ? data.gender : existing?.gender,
    avatar_url: data.avatar_url !== undefined ? data.avatar_url : existing?.avatar_url,
    updated_at: new Date().toISOString(),
  };
  
  writeUserProfile(profile);
  return profile;
}
