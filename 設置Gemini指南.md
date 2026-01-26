# Gemini API 設置指南

## 為什麼使用 Gemini？

Gemini 3 支持：
- ✅ 圖像輸入和處理
- ✅ 根據自然語言指令處理圖片
- ✅ 生成高品質的處理結果
- ✅ 效果比本地處理更好

## 設置步驟

### 1. 獲取 Gemini API Key

1. **訪問 Google AI Studio**
   - 打開：https://aistudio.google.com/app/apikey
   - 登入你的 Google 帳號

2. **創建 API Key**
   - 點擊 "Create API Key"
   - 選擇項目（或創建新項目）
   - 複製 API Key

### 2. 設置環境變數

在項目根目錄的 `.env.local` 文件中添加：

```
GEMINI_API_KEY=你的gemini_api_key
```

**注意：** 如果需要在客戶端使用，也需要設置：
```
NEXT_PUBLIC_GEMINI_API_KEY=你的gemini_api_key
```

### 3. 完成！

設置完成後，系統會自動優先使用 Gemini API 處理圖片。

## 使用方式

1. **上傳衣服照片**
2. **勾選「同時攤平衣服」**
3. **點擊「一鍵去背」**
4. **系統會自動：**
   - 優先使用 Gemini API（如果已配置）
   - 如果 Gemini 未配置，使用本地處理

## 處理效果

Gemini 會根據你的指令：
- ✅ 完全移除背景，改為純白色
- ✅ 將衣服攤平，修正歪斜角度
- ✅ 保持衣服顏色、標籤、圖案
- ✅ 移除陰影和皺褶
- ✅ 生成高品質產品圖

## 費用

### 免費額度
- **Gemini 1.5 Flash**：每月 1,500 次（推薦，最便宜）
- **Gemini 1.5 Pro**：每月 60 次（效果最好）

### 付費價格
- **Gemini Flash**：約 $0.000375/次（$9 可用 21,000 次！）
- **Gemini Pro**：約 $0.006/次（$9 可用 1,500 次）

### 費用對比
- **比 Replicate 便宜 2-10 倍**
- **比 OpenAI 便宜 10-20 倍**
- **免費額度最多**

**結論：Gemini 是最便宜的選擇！**

## 優先級

系統會按以下順序嘗試：
1. **Gemini API**（如果已配置）← **優先**
2. OpenAI API（如果已配置）
3. Replicate API（如果已配置）
4. 本地處理（備用）

## 測試

設置完成後：
1. 上傳一張衣服照片
2. 查看 Console 日誌，確認是否使用了 Gemini
3. 查看處理結果

如果有問題，請檢查：
- API Key 是否正確
- `.env.local` 文件是否正確設置
- 網路連接是否正常
