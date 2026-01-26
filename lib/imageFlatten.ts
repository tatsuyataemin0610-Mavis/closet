import sharp from "sharp";

/**
 * 攤平透明 PNG（後端使用 sharp）
 * 功能：找 alpha bbox → 裁切 → padding → 置中到固定畫布
 * @param inputPng 透明 PNG 的 Buffer
 * @param canvas 畫布大小（預設 1024）
 * @param paddingRatio padding 比例（預設 0.08）
 * @param alphaThreshold alpha 閾值（預設 8）
 * @returns 攤平後的 PNG Buffer
 */
export async function flattenTransparentPngBuffer(
  inputPng: Buffer,
  canvas: number = 1024,
  paddingRatio: number = 0.08,
  alphaThreshold: number = 8
) {
  try {
    const img = sharp(inputPng, { failOnError: false }).ensureAlpha();
    const meta = await img.metadata();
    
    if (!meta.hasAlpha) {
      throw new Error("不是透明 PNG（沒有 alpha 通道）");
    }

    // 限制圖片尺寸，避免內存問題（超過 4000px 的圖片先縮小）
    const maxDimension = 4000;
    let workingImage = img;
    if (meta.width && meta.height && (meta.width > maxDimension || meta.height > maxDimension)) {
      const scale = Math.min(maxDimension / meta.width!, maxDimension / meta.height!);
      const newWidth = Math.floor(meta.width! * scale);
      const newHeight = Math.floor(meta.height! * scale);
      console.log(`圖片太大 (${meta.width}x${meta.height})，先縮小到 (${newWidth}x${newHeight})`);
      workingImage = img.resize(newWidth, newHeight, { fit: 'inside' });
    }

    const { data, info } = await workingImage.raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const ch = info.channels; // 4

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * ch + 3];
        if (a >= alphaThreshold) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (maxX < minX || maxY < minY) {
      throw new Error("找不到主體（alpha 幾乎全透明）");
    }

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const pad = Math.max(1, Math.round(Math.max(bw, bh) * paddingRatio));

    return await workingImage
      .extract({ left: minX, top: minY, width: bw, height: bh })
      .extend({
        top: pad, bottom: pad, left: pad, right: pad,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .resize(canvas, canvas, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  } catch (error: any) {
    console.error('flattenTransparentPngBuffer 錯誤:', error);
    throw new Error(`攤平處理失敗: ${error.message || String(error)}`);
  }
}
