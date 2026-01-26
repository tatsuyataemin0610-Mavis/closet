# AI 虛擬試穿服務設置指南

## 概述

本專案支持使用 **SDXL Inpainting** 實現真實的虛擬試穿效果，類似 ChatGPT 的效果。

## 方案架構

### 流程
1. **人物分割/衣物遮罩（mask）** - 識別上衣區域
2. **Pose/人體結構約束** - 使用 ControlNet 保持姿勢
3. **Inpainting** - 使用 SDXL 在 mask 區域生成穿上衣服的效果
4. **參考衣服圖** - 使用 IP-Adapter 讓生成更貼近衣服的 logo 與質感

## 設置步驟

### 方案 1：本地 Python 服務（推薦）

#### 1. 創建 Python 服務

創建 `ai-service/` 目錄和以下文件：

**ai-service/requirements.txt:**
```
torch>=2.0.0
diffusers>=0.21.0
transformers>=4.35.0
accelerate>=0.24.0
pillow>=10.0.0
opencv-python>=4.8.0
controlnet-aux>=0.4.0
```

**ai-service/tryon_service.py:**
```python
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import torch
from PIL import Image
import io
import base64
from diffusers import AutoPipelineForInpainting, ControlNetModel, StableDiffusionXLControlNetPipeline
from controlnet_aux import OpenposeDetector
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

# 載入模型（僅在啟動時載入一次）
print("載入 SDXL Inpainting 模型...")
pipe = None
controlnet = None
openpose = None

def init_models():
    global pipe, controlnet, openpose
    
    # 載入 ControlNet（用於保持姿勢）
    controlnet = ControlNetModel.from_pretrained(
        "diffusers/controlnet-openpose-sdxl-1.0",
        torch_dtype=torch.float16
    )
    
    # 載入 SDXL Inpainting Pipeline
    pipe = AutoPipelineForInpainting.from_pretrained(
        "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
        controlnet=controlnet,
        torch_dtype=torch.float16
    )
    
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print("使用 GPU")
    else:
        print("使用 CPU（較慢）")
    
    # 載入 OpenPose 檢測器
    openpose = OpenposeDetector.from_pretrained("lllyasviel/Annotators")
    
    print("模型載入完成")

# 生成人物 mask（簡化版，實際應該使用 human parsing）
def generate_mask(image: Image.Image, category: str) -> Image.Image:
    """生成上衣區域的 mask"""
    # 這裡使用簡化的方法，實際應該使用 human parsing 模型
    # 例如：LIP、SCHP、CIHP 或 SAM2
    
    img_array = np.array(image)
    height, width = img_array.shape[:2]
    
    # 簡化：假設上衣在圖像的上半部分（實際應該使用 human parsing）
    mask = np.zeros((height, width), dtype=np.uint8)
    
    if category in ['T恤', '襯衫', '針織衫', '連帽衫', '外套', '大衣', '羽絨服']:
        # 上衣區域：約在圖像的 20%-60% 位置
        mask[int(height * 0.2):int(height * 0.6), :] = 255
    
    return Image.fromarray(mask, mode='L')

@app.route('/tryon', methods=['POST'])
def tryon():
    try:
        avatar_file = request.files['avatar']
        cloth_file = request.files['cloth']
        category = request.form.get('category', 'T恤')
        color = request.form.get('color', '')
        brand = request.form.get('brand', '')
        
        # 讀取圖片
        person_img = Image.open(avatar_file).convert('RGB')
        cloth_img = Image.open(cloth_file).convert('RGB')
        
        # 生成 mask
        mask_img = generate_mask(person_img, category)
        
        # 檢測姿勢（使用 OpenPose）
        pose_img = openpose(person_img)
        
        # 構建提示詞
        prompt = (
            f"realistic photo, same person, same pose, same background, "
            f"wearing a {color} {category.lower()}, "
            f"{'with ' + brand + ' logo' if brand else ''}, "
            f"natural folds, realistic shadows, high quality, detailed"
        )
        
        negative_prompt = (
            "different face, different person, extra fingers, blurry, "
            "logo distorted, text artifacts, watermark, low quality, "
            "deformed, ugly, bad anatomy"
        )
        
        # 執行 Inpainting
        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=person_img,
            mask_image=mask_img,
            control_image=pose_img,
            strength=0.35,  # 較低的值保留更多原圖細節
            guidance_scale=6.0,
            num_inference_steps=30,
        ).images[0]
        
        # 保存結果
        output_path = f"output_{timestamp}.png"
        result.save(output_path)
        
        return jsonify({
            'success': True,
            'imageUrl': f'/output/{output_path}',
            'maskUrl': None
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    init_models()
    app.run(host='0.0.0.0', port=8000)
```

#### 2. 安裝和運行

```bash
cd ai-service
pip install -r requirements.txt
python tryon_service.py
```

#### 3. 設置環境變數

在 `.env.local` 中添加：
```
AI_TRYON_SERVICE_URL=http://localhost:8000
```

### 方案 2：使用現成的 AI API 服務

如果不想自己搭建，可以使用：
- **Replicate API** - 提供 SDXL Inpainting
- **Hugging Face Inference API** - 提供多種模型
- **Runway ML** - 商業 AI 服務

## 改進建議

### 1. 使用 Human Parsing 生成更準確的 Mask

推薦使用：
- **LIP (Look into Person)** - 語意分割
- **SCHP (Self-Correction for Human Parsing)**
- **SAM2 (Segment Anything Model 2)** - Meta 的最新模型

### 2. 使用 IP-Adapter 參考衣服圖

讓生成的結果更貼近參考衣服的：
- Logo 位置
- 顏色
- 質感
- 版型

### 3. 優化提示詞

根據衣服的實際屬性動態生成提示詞：
- 顏色
- 版型（oversized, fitted, etc.）
- Logo 位置
- 材質
- 袖長
- 領口類型

## 當前實現

目前前端會調用 `/api/fitting/ai-tryon`，如果 AI 服務未配置，會返回錯誤信息。

## 注意事項

1. **GPU 需求**：SDXL 模型需要較大的 GPU 內存（至少 8GB）
2. **處理時間**：每次試穿需要 10-30 秒（取決於硬件）
3. **成本**：如果使用雲端 API，可能產生費用
4. **模型大小**：SDXL 模型約 6-7GB，需要下載時間

## 快速開始（簡化版）

如果暫時無法設置完整的 AI 服務，可以：
1. 使用當前的 Canvas 合成方案（已實現）
2. 逐步改進變形和混合效果
3. 未來再集成 AI 服務
