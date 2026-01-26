# Replicate API 設置指南

## 步驟 1：註冊 Replicate 帳號

1. **訪問註冊頁面**
   - 打開：https://replicate.com/signup
   - 使用 Google、GitHub 或 Email 註冊

2. **驗證郵箱**（如果使用 Email 註冊）

---

## 步驟 2：獲取 API Token

1. **登入後訪問 API Tokens 頁面**
   - 直接訪問：https://replicate.com/account/api-tokens
   - 或點擊右上角頭像 → Account → API tokens

2. **創建新的 API Token**
   - 點擊 "Create token" 按鈕

   - 輸入名稱（例如：closet-app）
   - 複製 Token（格式：`r8_xxxxx...`）
   - ⚠️ **重要：Token 只會顯示一次，請立即複製保存！**

---

## 步驟 3：設置環境變數的

1. **在項目根目錄創建或編輯 `.env.local` 文件**
   ```bash
   cd /Users/minyu/closet
   ```

2. **添加 Replicate API Token**
   ```
   REPLICATE_API_TOKEN=r8_你的token
   ```

   **範例：**
   ```
   REPLICATE_API_TOKEN=r8_abc123def456ghi789
   ```

3. **如果同時有 OpenAI API Key，也可以添加：**
   ```
   OPENAI_API_KEY=sk-你的key
   REPLICATE_API_TOKEN=r8_你的token
   ```

---

## 步驟 4：安裝依賴

```bash
cd /Users/minyu/closet
npm install replicate
```

---

## 步驟 5：重啟開發服務器

```bash
npm run dev
```

---

## 步驟 6：測試

1. **打開應用**
   - 訪問：http://localhost:3001

2. **進入試衣間**
   - 點擊底部導航的 "衣櫥"
   - 選擇 "試衣間" 標籤

3. **上傳照片和選擇衣服**
   - 上傳你的照片
   - 選擇要試穿的衣服

4. **點擊 "嘗試 AI 模式" 按鈕**
   - 系統會自動使用 Replicate API
   - 等待 10-30 秒處理
   - 查看真實的試穿效果！

---

## 常見問題

### Q: Token 格式是什麼？
A: 格式是 `r8_` 開頭，後面跟著一串字符，例如：`r8_abc123def456`

### Q: 如何確認 Token 是否正確？
A: 如果 Token 錯誤，系統會顯示錯誤信息。正確的話會開始處理圖片。

### Q: 處理需要多久？
A: 通常 10-30 秒，取決於圖片大小和服務器負載。

### Q: 費用如何計算？
A: 每次試穿約 $0.01-0.05，Replicate 會自動從你的帳號扣款。

### Q: 如何查看使用量和費用？
A: 訪問：https://replicate.com/account/billing

### Q: 有免費額度嗎？
A: 通常新帳號有 $5-10 的免費額度可以試用。

---

## 系統優先級

系統會按以下順序嘗試：

1. **OpenAI API**（如果已配置）
2. **Replicate API**（如果已配置）← **推薦**
3. **Canvas 模式**（備用，不需要 API）

如果 OpenAI 和 Replicate 都配置了，系統會優先使用 OpenAI，如果失敗會自動切換到 Replicate。

---

## 完成！

設置完成後，你就可以享受真實的 AI 虛擬試穿效果了！🎉

如果有任何問題，請查看：
- `README_實際可行方案.md` - 詳細方案說明
- `費用計算.md` - 費用計算
- `虛擬試穿API服務清單.md` - 服務對比
