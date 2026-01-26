# Replicate API 問題排查

## 問題：衣服蓋在臉上

如果使用 Replicate API 後，衣服還是蓋在臉上，可能的原因：

### 1. Replicate API 沒有被正確調用

**檢查方法：**
- 打開瀏覽器開發者工具（F12）
- 查看 Console 標籤
- 查看 Network 標籤，確認是否有調用 `/api/fitting/replicate`

**如果看到錯誤：**
- "Replicate API Token 未配置" → 檢查 `.env.local` 文件
- "Replicate API 錯誤" → 查看具體錯誤信息

### 2. Replicate API 需要公開可訪問的圖片 URL

**問題：**
- Replicate 無法訪問 `localhost` 的圖片
- 需要圖片可以從互聯網訪問

**解決方案：**

#### 方案 A：使用 ngrok（推薦用於開發）

1. 安裝 ngrok：
```bash
brew install ngrok
# 或從 https://ngrok.com/download 下載
```

2. 啟動 ngrok：
```bash
ngrok http 3001
```

3. 複製 ngrok 提供的 URL（例如：`https://xxxx.ngrok.io`）

4. 在 `.env.local` 添加：
```
NEXT_PUBLIC_BASE_URL=https://xxxx.ngrok.io
```

#### 方案 B：上傳圖片到臨時圖床

修改代碼，先將圖片上傳到：
- Imgur API
- Cloudinary
- 或其他圖床服務

#### 方案 C：使用 Replicate 的文件上傳功能

Replicate 支持直接上傳文件，但需要修改 API 調用方式。

### 3. 檢查是否真的使用了 Replicate

**在 Console 中查看：**
- 如果看到 "✅ AI 試穿成功！使用服務: replicate-idm-vton" → 成功使用 Replicate
- 如果看到 "AI 服務未配置，使用 Canvas 模式" → 回退到了 Canvas 模式

### 4. Replicate API 參數問題

**當前使用的模型：** IDM-VTON
**參數：**
- `garm_img`: 衣服圖片 URL
- `human_img`: 人物圖片 URL
- `garment_des`: 衣服描述
- `is_checked`: true

**如果 Replicate 返回的結果有問題：**
- 嘗試不同的模型版本
- 調整參數
- 檢查圖片格式和大小

## 快速檢查清單

- [ ] `.env.local` 文件存在且包含 `REPLICATE_API_TOKEN`
- [ ] Token 格式正確（以 `r8_` 開頭）
- [ ] 已安裝 `replicate` 套件
- [ ] 服務器已重啟
- [ ] 瀏覽器 Console 沒有錯誤
- [ ] Network 標籤顯示調用了 `/api/fitting/replicate`
- [ ] 圖片 URL 可以從互聯網訪問（如果使用本地 URL）

## 下一步

如果確認 Replicate API 被正確調用，但效果還是不好：
1. 檢查 Replicate 返回的原始圖片（`originalOutput` URL）
2. 嘗試不同的模型
3. 調整圖片大小和格式
4. 檢查人物照片的姿勢和清晰度
