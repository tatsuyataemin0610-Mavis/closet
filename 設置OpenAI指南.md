# 設置 OpenAI API Key 指南

## 📋 步驟 1：獲取 OpenAI API Key

1. **訪問 OpenAI 官網**
   - 打開：https://platform.openai.com/api-keys
   - 如果沒有帳號，先註冊一個

2. **登入並創建 API Key**
   - 登入後，點擊右上角的個人頭像
   - 選擇 "API keys" 或 "View API keys"
   - 點擊 "Create new secret key"
   - 輸入名稱（例如：closet-app）
   - **重要**：複製 API Key（只會顯示一次！）

## 📋 步驟 2：設置環境變數

### 方法 1：使用終端機（推薦）

在專案根目錄執行：

```bash
echo "OPENAI_API_KEY=你的api_key" >> .env.local
```

**注意**：將 `你的api_key` 替換成你剛才複製的實際 API Key

### 方法 2：手動編輯文件

1. 在專案根目錄（`/Users/minyu/closet`）找到 `.env.local` 文件
2. 如果沒有，創建一個新文件
3. 添加以下內容：

```
OPENAI_API_KEY=sk-你的實際api_key
```

**範例**：
```
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

## 📋 步驟 3：確認設置

### 檢查文件內容

```bash
cat .env.local
```

應該會看到：
```
OPENAI_API_KEY=sk-...
```

### 重啟開發服務器

設置完成後，**必須重啟開發服務器**才能生效：

1. 停止當前的服務器（按 `Ctrl + C`）
2. 重新啟動：
   ```bash
   npm run dev
   ```

## 📋 步驟 4：測試

1. 進入試衣間頁面
2. 上傳照片和選擇衣服
3. 點擊「嘗試 AI 模式」
4. 如果設置成功，會使用 OpenAI API 進行虛擬試穿

## ⚠️ 注意事項

1. **不要分享 API Key**
   - `.env.local` 文件已經在 `.gitignore` 中，不會被上傳到 Git
   - 不要將 API Key 分享給任何人

2. **API Key 格式**
   - OpenAI API Key 通常以 `sk-` 開頭
   - 例如：`sk-proj-abc123xyz789...`

3. **費用**
   - OpenAI API 是付費服務
   - 建議設置使用額度限制
   - 訪問 https://platform.openai.com/usage 查看使用情況

4. **如果設置失敗**
   - 確認 API Key 是否正確複製（沒有多餘空格）
   - 確認 `.env.local` 文件在專案根目錄
   - 確認已重啟開發服務器

## 🔍 故障排除

### 問題：API Key 未生效

**解決方法**：
1. 確認 `.env.local` 文件在專案根目錄
2. 確認文件內容格式正確（沒有引號）
3. 重啟開發服務器

### 問題：提示 "OPENAI_API_KEY 未配置"

**解決方法**：
1. 檢查 `.env.local` 文件是否存在
2. 檢查 API Key 是否正確
3. 確認變數名稱是 `OPENAI_API_KEY`（大寫）

### 問題：API 調用失敗

**解決方法**：
1. 確認 API Key 是否有效
2. 確認帳號是否有餘額
3. 檢查網路連接

## 📞 需要幫助？

如果遇到問題，可以：
1. 檢查瀏覽器控制台的錯誤訊息
2. 檢查終端機的錯誤日誌
3. 確認 OpenAI 帳號狀態
