import OpenAI from "openai";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 同時返回 File 和 Buffer，避免重複 fetch
async function fetchAsFileAndBuffer(url: string, filename: string, origin: string) {
  const fullUrl = url.startsWith("http") ? url : `${origin}${url}`;
  const r = await fetch(fullUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`Fetch image failed: ${r.status} ${r.statusText}`);

  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  const ct = r.headers.get("content-type") || "image/jpeg";

  const file = new File([buf], filename, { type: ct });
  return { file, buf };
}

// 簡化版：只返回 File
async function fetchAsFile(url: string, filename: string, origin: string): Promise<File> {
  const fullUrl = url.startsWith("http") ? url : `${origin}${url}`;
  const r = await fetch(fullUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`Fetch image failed: ${r.status} ${r.statusText}`);

  const ab = await r.arrayBuffer();
  const buf = Buffer.from(ab);
  const ct = r.headers.get("content-type") || "image/jpeg";

  return new File([buf], filename, { type: ct });
}

// 將 dataURL 轉換為 File（使用 Node.js Buffer，避免 atob 問題）
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] || "image/png";
  // 使用 Buffer.from 而不是 atob（Node.js 環境更穩定）
  const buf = Buffer.from(base64, "base64");
  return new File([buf], filename, { type: mime });
}

// 將 dataURL 轉換為 Buffer
function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

// Buffer 轉 File
function bufferToFile(buf: Buffer, filename: string, mime = "image/png"): File {
  return new File([new Uint8Array(buf)], filename, { type: mime });
}

// 製作 board 拼圖（人物+衣服）和對應的 mask
async function makeBoardAndMask({
  personBuf,
  clothBuf,
  maskBuf, // 前端產生的 mask（人物尺寸）
}: {
  personBuf: Buffer;
  clothBuf: Buffer;
  maskBuf: Buffer;
}) {
  // 讀人物尺寸
  const meta = await sharp(personBuf).metadata();
  const w = meta.width!;
  const h = meta.height!;

  console.log(`人物尺寸: ${w}x${h}`);

  // 讓衣服圖縮放到跟人物同高，避免太小
  const clothResized = await sharp(clothBuf)
    .resize({ height: h, withoutEnlargement: true })
    .png()
    .toBuffer();

  // 算衣服 resize 後寬
  const clothMeta = await sharp(clothResized).metadata();
  const cw = clothMeta.width!;

  console.log(`衣服尺寸: ${cw}x${h}`);

  // board 尺寸：左人物 + 右衣服
  const boardW = w + cw;
  const boardH = h;

  // 做 board（白底）：左人物 + 右衣服
  const board = await sharp({
    create: {
      width: boardW,
      height: boardH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: await sharp(personBuf).resize(w, h).toBuffer(), left: 0, top: 0 },
      { input: clothResized, left: w, top: 0 },
    ])
    .png()
    .toBuffer();

  console.log(`Board 尺寸: ${boardW}x${boardH}`);

  // mask 要跟 board 同尺寸：左半邊放你的 mask，右半邊全黑（禁止改衣服參考區）
  const leftMask = await sharp(maskBuf).resize(w, h).png().toBuffer();
  const rightBlack = await sharp({
    create: {
      width: cw,
      height: h,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();

  const boardMask = await sharp({
    create: {
      width: boardW,
      height: boardH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: leftMask, left: 0, top: 0 },
      { input: rightBlack, left: w, top: 0 },
    ])
    .png()
    .toBuffer();

  console.log('✅ Board 和 Mask 已準備完成');

  return { board, boardMask, personW: w, personH: h, boardW, boardH };
}

// ✅ 更穩：使用 sharp 內建方法，處理 EXIF，避免裁切，添加羽化效果
async function forceCompositeStable({
  personBuf,
  resultBuf,
  maskBuf,
}: {
  personBuf: Buffer;
  resultBuf: Buffer;
  maskBuf: Buffer;
}): Promise<Buffer> {
  // ✅ 1) 先統一 EXIF 方向（超重要）
  const personFixed = await sharp(personBuf).rotate().ensureAlpha().png().toBuffer();
  const meta = await sharp(personFixed).metadata();
  const w = meta.width!;
  const h = meta.height!;

  console.log(`開始強制合成，尺寸: ${w}x${h}`);

  // ✅ 2) result 對齊尺寸（不能裁切，使用 fill）
  const resultRGB = await sharp(resultBuf)
    .rotate()              // 處理 EXIF
    .resize(w, h, { fit: "fill" }) // ★重點：不要裁切
    .removeAlpha()
    .toColourspace("srgb")
    .toBuffer();
  console.log('✅ Result 已調整尺寸（含 EXIF 修正，不裁切）');

  // ✅ 3) mask 變成乾淨 alpha（擴張 + 羽化，避免漏色）
  // 注意：mask 的透明區域（alpha=0）是可編輯區域，不透明區域（alpha=255）是保護區域
  // 所以我們需要：提取 alpha channel，然後反相（透明變白=可編輯，不透明變黑=保護）
  const alpha = await sharp(maskBuf)
    .rotate()              // 處理 EXIF（雖然 mask 是前端生成，但為了一致性也處理）
    .resize(w, h, { fit: "fill" }) // ★重點：不要裁切
    .ensureAlpha()
    .extractChannel(3)     // 提取 alpha channel
    .negate()              // 反相：透明區(0)變白(255)=可編輯，不透明區(255)變黑(0)=保護
    .threshold(10)         // 轉乾淨黑白
    .blur(4)               // ★羽化 4px（讓邊緣自然，較大的 blur 可以達到類似擴張的效果）
    .toBuffer();
  console.log('✅ Mask alpha 已準備（含羽化）');

  // ✅ 4) 把 alpha 當成 result 的透明度
  const maskedResult = await sharp(resultRGB)
    .joinChannel(alpha) // alpha = mask
    .png()
    .toBuffer();
  console.log('✅ Masked result 已準備');

  // ✅ 5) 疊回原圖（原圖永遠不變）
  const finalBuf = await sharp(personFixed)
    .ensureAlpha()
    .composite([{ input: maskedResult, blend: "over" }])
    .png()
    .toBuffer();
  console.log('✅ 強制合成完成');

  return finalBuf;
}

const OUT_W = 1024;
const OUT_H = 1536;

export async function POST(req: Request) {
  try {
    const { avatarUrl, clothUrl, maskDataUrl } = await req.json();
    if (!avatarUrl || !clothUrl || !maskDataUrl) {
      return NextResponse.json({ error: "Missing avatarUrl/clothUrl/maskDataUrl" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;

    // 1) 取原始 person buffer
    const personResp = await fetch(avatarUrl.startsWith("http") ? avatarUrl : `${origin}${avatarUrl}`, { cache: "no-store" });
    if (!personResp.ok) throw new Error(`Failed to fetch person image: ${personResp.status}`);
    const personBufRaw = Buffer.from(await personResp.arrayBuffer());

    // 2) 取 cloth
    const clothFile = await fetchAsFile(clothUrl, "cloth.png", origin);

    // 3) 把 person resize 成固定輸出尺寸（關鍵：統一座標系）
    // ✅ 先處理 EXIF 旋轉，確保尺寸對齊，使用 fill 避免裁切
    const personBuf = await sharp(personBufRaw)
      .rotate()              // ✅ 處理 EXIF orientation
      .resize(OUT_W, OUT_H, { fit: "fill" }) // ★重點：不要裁切
      .jpeg({ quality: 95 })
      .toBuffer();
    const personFile = bufferToFile(personBuf, "person.jpg", "image/jpeg");

    // 4) maskDataUrl => buffer => resize 成同尺寸
    // ✅ 注意：mask 不需要 rotate，因為它是前端生成的，沒有 EXIF
    const maskBufRaw = dataUrlToBuffer(maskDataUrl);
    const maskBuf = await sharp(maskBufRaw)
      .resize(OUT_W, OUT_H, { fit: "fill" }) // ★重點：不要裁切
      .png()
      .toBuffer();
    const maskFile = bufferToFile(maskBuf, "mask.png", "image/png");

    console.log(`✅ Person 和 Mask 已統一尺寸: ${OUT_W}x${OUT_H}`);

    // 5) 呼叫 images.edit（尺寸用直式）
    const prompt =
      "Only edit inside the masked region. Replace the garment with the reference clothing. Do not change face, body, or background outside the mask. Keep the clothing design/logo/colors.";

    console.log('調用 OpenAI API...');

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: [personFile, clothFile],
      mask: maskFile,
      prompt,
      size: "auto", // ✅ 不要硬固定尺寸，讓 API 自動決定
      input_fidelity: "high",
    });

    const first: any = result.data?.[0];
    if (!first?.b64_json) throw new Error("No b64_json returned");

    console.log('✅ OpenAI 生成完成，開始強制合成...');

    // 6) 強制合成保底：遮罩外一定回到原圖（但注意：這裡用的是 resize 後的 personBuf）
    const resultBuf = Buffer.from(first.b64_json, "base64");
    const finalBuf = await forceCompositeStable({ personBuf, resultBuf, maskBuf });

    console.log('✅ 強制合成完成，返回最終結果');
    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${finalBuf.toString("base64")}`,
    });
  } catch (err: any) {
    console.error("tryon route error:", err?.stack || err);
    return NextResponse.json({ error: String(err?.stack || err) }, { status: 500 });
  }
}
