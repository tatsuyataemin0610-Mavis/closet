'use client';

// lib/maskGenerator.ts
// 產生「上衣區」mask：透明=可改，不透明=不可改（OpenAI mask 規則）

function makeTopMaskTransparentEditable(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;

  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas context not available");

  // 1) 先畫「不透明黑」：代表不可改
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, w, h);

  // 2) 上衣區域：挖空成「透明」：代表可改
  // ✅ 加大 mask 區域，確保覆蓋兩側袖子、下擺、斜背包帶附近
  const x = w * 0.18;      // 左邊界更左（覆蓋袖子）
  const y = h * 0.28;      // 上邊界更上（避免漏掉領口）
  const ww = w * 0.64;     // 寬度更大（覆蓋兩側袖子外緣）
  const hh = h * 0.38;     // 高度更大（覆蓋下擺和斜背包帶附近）

  ctx.clearRect(x, y, ww, hh);

  return c.toDataURL("image/png"); // 會包含透明 alpha
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load avatar failed"));
    img.src = url;
  });
}

export async function generateTopMaskDataUrl(avatarUrl: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("generateTopMaskDataUrl must run in browser");
  }

  const img = await loadImage(avatarUrl);

  // ✅ 一定要用 naturalWidth / naturalHeight（真實像素尺寸）
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  if (!w || !h) throw new Error("avatar image has invalid size");

  return makeTopMaskTransparentEditable(w, h);
}
