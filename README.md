# 數位衣櫥

一個本地數位衣櫥應用程式，讓您可以管理自己的衣服收藏。

## 功能特色

- 📸 上傳衣服照片
- ✂️ 自動去背處理
- 📱 響應式設計（支援手機和電腦）
- 🎨 自動顏色提取（可手動修改）
- 📝 完整的衣服資訊管理：
  - 類別、顏色、品牌、尺寸、材質、場合
  - 價格、購買日期、季節（可多選）、備註

## 技術棧

- **前端**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **後端**: Next.js API Routes
- **資料庫**: SQLite (better-sqlite3)
- **圖片處理**: Sharp

## 安裝步驟

1. 安裝依賴：
```bash
npm install
```

2. 啟動開發伺服器：
```bash
npm run dev
```

3. 開啟瀏覽器訪問：
```
http://localhost:3001
```

**注意**：此專案預設使用端口 3001，避免與其他專案衝突。如需更改端口，請修改 `package.json` 中的 `dev` 腳本。

## 使用說明

1. **新增衣服**：點擊「新增衣服」按鈕，上傳照片並填寫資訊
2. **查看衣櫥**：在主頁面瀏覽所有衣服
3. **編輯衣服**：點擊衣服卡片的「編輯」按鈕
4. **刪除衣服**：點擊衣服卡片的「刪除」按鈕

## 圖片去背功能

專案內建基礎的去背處理功能。如需更專業的去背效果，可以：

1. 註冊 [remove.bg](https://www.remove.bg/) 帳號
2. 取得 API Key
3. 在專案根目錄建立 `.env.local` 檔案
4. 加入以下內容：
```
REMOVE_BG_API_KEY=your_api_key_here
```

## 資料庫

資料庫檔案 `closet.db` 會自動建立在專案根目錄。所有資料都儲存在本地，不會上傳到任何伺服器。

## 專案結構

```
closet/
├── app/              # Next.js App Router
│   ├── api/         # API 路由
│   ├── add/         # 新增衣服頁面
│   ├── edit/        # 編輯衣服頁面
│   └── page.tsx     # 主頁面
├── components/       # React 元件
├── lib/             # 工具函數
│   ├── db.ts        # 資料庫操作
│   └── imageProcessor.ts  # 圖片處理
└── public/          # 靜態檔案
    └── uploads/     # 上傳的圖片
```

## 開發

```bash
# 開發模式
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start
```

## 授權

MIT License
