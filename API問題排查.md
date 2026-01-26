# API 問題排查指南

## 問題描述

用戶遇到三個 API 都失敗的問題：
1. Gemini API 返回 500 錯誤
2. OpenAI API 失敗
3. Replicate API 失敗
4. 本地處理也失敗

## 可能原因

### 1. Gemini API 失敗

**原因**：
- Gemini API **不支持圖片生成**，只支持圖片理解和分析
- Gemini 無法根據指令生成或編輯圖片
- 只能返回文本描述，無法返回圖片

**解決方案**：
- 移除 Gemini API 的圖片生成功能
- 只使用 Gemini 進行圖片分析（如果需要）
- 專注於本地處理和 OpenAI/Replicate

### 2. OpenAI API 失敗

**原因**：
- API Key 未配置或錯誤
- DALL-E 3 不支持圖片編輯（只支持生成）
- 需要使用 DALL-E 2 的 inpainting 功能

**解決方案**：
- 檢查 `.env.local` 中的 `OPENAI_API_KEY`
- 確認 API Key 是否有效
- 確認帳號是否有餘額

### 3. Replicate API 失敗

**原因**：
- API Token 未配置或錯誤
- 需要公開的圖片 URL（localhost 不行）
- 需要使用 ngrok 或類似的服務

**解決方案**：
- 檢查 `.env.local` 中的 `REPLICATE_API_TOKEN`
- 設置 `NEXT_PUBLIC_BASE_URL`（使用 ngrok URL）
- 確認帳號是否有餘額

### 4. 本地處理失敗

**原因**：
- `@imgly/background-removal` 套件未安裝
- 套件載入失敗
- 圖片格式不支持

**解決方案**：
```bash
npm install @imgly/background-removal
npm run dev
```

## 建議的處理流程

### 優先級 1：本地處理（最可靠）
- 使用 `@imgly/background-removal` 進行去背
- 使用本地算法進行攤平
- **優點**：不需要 API，完全免費
- **缺點**：效果可能不如 AI

### 優先級 2：OpenAI API（如果配置）
- 使用 DALL-E 2 的 inpainting 功能
- **優點**：效果較好
- **缺點**：需要付費

### 優先級 3：Replicate API（如果配置）
- 使用 IDM-VTON 模型
- **優點**：專門用於虛擬試穿
- **缺點**：需要公開 URL，需要付費

### 不推薦：Gemini API
- **原因**：不支持圖片生成
- **建議**：移除 Gemini 的圖片生成功能

## 檢查清單

- [ ] 確認 `@imgly/background-removal` 已安裝
- [ ] 確認 `.env.local` 文件存在
- [ ] 確認 API Key/Token 格式正確（沒有多餘空格）
- [ ] 確認已重啟開發服務器
- [ ] 檢查瀏覽器控制台的錯誤訊息
- [ ] 檢查終端機的錯誤日誌

## 測試步驟

1. **測試本地處理**：
   - 移除所有 API Key
   - 上傳圖片
   - 應該能正常去背和攤平

2. **測試 OpenAI API**：
   - 設置 `OPENAI_API_KEY`
   - 上傳圖片
   - 檢查是否使用 OpenAI

3. **測試 Replicate API**：
   - 設置 `REPLICATE_API_TOKEN` 和 `NEXT_PUBLIC_BASE_URL`
   - 上傳圖片
   - 檢查是否使用 Replicate

## 常見錯誤

### 錯誤 1：`請先上傳圖片`
- **原因**：自動處理時 `formData.image_url` 還沒更新
- **解決**：已修復，使用 `imageUrlToProcess` 參數

### 錯誤 2：`Gemini API 調用失敗`
- **原因**：Gemini 不支持圖片生成
- **解決**：移除 Gemini 的圖片生成功能，只使用本地處理

### 錯誤 3：`去背套件尚未安裝`
- **原因**：`@imgly/background-removal` 未安裝
- **解決**：執行 `npm install @imgly/background-removal`

### 錯誤 4：`500 Internal Server Error`
- **原因**：服務器端錯誤
- **解決**：檢查終端機的錯誤日誌，確認 API Key 是否正確
