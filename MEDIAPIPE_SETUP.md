# MediaPipe Pose 安裝說明

## 方案 A：使用 npm 安裝（推薦）

如果您的系統允許，可以運行：

```bash
npm install @mediapipe/pose @mediapipe/camera_utils @mediapipe/drawing_utils
```

## 方案 B：使用 CDN（當前實現）

當前代碼已經配置為使用 CDN 載入 MediaPipe，無需安裝。

**注意**：
- 首次載入需要下載模型（約 10-20MB）
- 需要網路連接
- 如果 CDN 載入失敗，會自動降級到備用檢測方案

## 測試

1. 刷新頁面
2. 上傳照片
3. 查看控制台：
   - 如果看到 "✅ MediaPipe 檢測成功"，表示 MediaPipe 正常工作
   - 如果看到 "⚠️ MediaPipe 檢測失敗"，會自動使用備用方案

## 如果 MediaPipe 無法載入

系統會自動使用備用的膚色檢測方案，功能仍然可用，只是準確度較低。
