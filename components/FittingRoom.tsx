'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Cloth {
  id: number;
  category?: string;
  image_url?: string;
  image_processed_url?: string;
}

interface FittingRoomProps {
  avatarUrl: string;
  clothes: Cloth[];
  gender?: string;
}

// 檢測人體關鍵點
interface PoseKeypoints {
  leftShoulder?: { x: number; y: number };
  rightShoulder?: { x: number; y: number };
  leftHip?: { x: number; y: number };
  rightHip?: { x: number; y: number };
  leftElbow?: { x: number; y: number };
  rightElbow?: { x: number; y: number };
  leftKnee?: { x: number; y: number };
  rightKnee?: { x: number; y: number };
  leftAnkle?: { x: number; y: number };
  rightAnkle?: { x: number; y: number };
}

// 人體區域（用於多人檢測）
interface HumanRegion {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  pose: PoseKeypoints;
}

// 在指定區域內檢測一個人體
function detectPersonInRegion(
  pixels: { x: number; y: number }[],
  canvas: HTMLCanvasElement,
  data: Uint8ClampedArray,
  skinColorRanges: Array<{ rMin: number; rMax: number; gMin: number; gMax: number; bMin: number; bMax: number }>
): HumanRegion | null {
  if (pixels.length < 50) return null;

  const xs = pixels.map(p => p.x);
  const ys = pixels.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // 估算關鍵點位置
  const headHeight = height * 0.2;
  const shoulderY = minY + headHeight + height * 0.1;
  const hipY = minY + height * 0.55;
  const kneeY = minY + height * 0.75;

  const pose: PoseKeypoints = {
    leftShoulder: { x: centerX - width * 0.15, y: shoulderY },
    rightShoulder: { x: centerX + width * 0.15, y: shoulderY },
    leftHip: { x: centerX - width * 0.12, y: hipY },
    rightHip: { x: centerX + width * 0.12, y: hipY },
    leftKnee: { x: centerX - width * 0.1, y: kneeY },
    rightKnee: { x: centerX + width * 0.1, y: kneeY },
  };

  return {
    centerX,
    centerY,
    width,
    height,
    pose,
  };
}

// 使用 MediaPipe Pose 進行姿勢檢測（更準確）
// 注意：需要先安裝 @mediapipe/pose 套件才能使用
async function detectPoseWithMediaPipe(image: HTMLImageElement): Promise<PoseKeypoints | null> {
  // 暫時禁用 MediaPipe，避免編譯錯誤
  // 如果已安裝 @mediapipe/pose，可以取消註釋下面的代碼
  console.log('MediaPipe Pose 檢測已禁用（需要安裝 @mediapipe/pose 套件）');
  return null;
  
  /*
  // 取消註釋以下代碼以啟用 MediaPipe（需要先安裝套件）：
  try {
    // 動態導入 MediaPipe（僅在運行時）
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - MediaPipe 可能未安裝
    const mediapipe = await import('@mediapipe/pose');
    const Pose = mediapipe.Pose;

    if (!Pose) {
      return null;
    }

    return new Promise((resolve) => {
      const pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      let resolved = false;
      pose.onResults((results: any) => {
        if (resolved) return;
        resolved = true;
        
        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
          const landmarks = results.poseLandmarks;
          const poseKeypoints: PoseKeypoints = {
            leftShoulder: landmarks[11] ? {
              x: landmarks[11].x * image.width,
              y: landmarks[11].y * image.height
            } : undefined,
            rightShoulder: landmarks[12] ? {
              x: landmarks[12].x * image.width,
              y: landmarks[12].y * image.height
            } : undefined,
            leftHip: landmarks[23] ? {
              x: landmarks[23].x * image.width,
              y: landmarks[23].y * image.height
            } : undefined,
            rightHip: landmarks[24] ? {
              x: landmarks[24].x * image.width,
              y: landmarks[24].y * image.height
            } : undefined,
            leftElbow: landmarks[13] ? {
              x: landmarks[13].x * image.width,
              y: landmarks[13].y * image.height
            } : undefined,
            rightElbow: landmarks[14] ? {
              x: landmarks[14].x * image.width,
              y: landmarks[14].y * image.height
            } : undefined,
            leftKnee: landmarks[25] ? {
              x: landmarks[25].x * image.width,
              y: landmarks[25].y * image.height
            } : undefined,
            rightKnee: landmarks[26] ? {
              x: landmarks[26].x * image.width,
              y: landmarks[26].y * image.height
            } : undefined,
            leftAnkle: landmarks[27] ? {
              x: landmarks[27].x * image.width,
              y: landmarks[27].y * image.height
            } : undefined,
            rightAnkle: landmarks[28] ? {
              x: landmarks[28].x * image.width,
              y: landmarks[28].y * image.height
            } : undefined,
          };
          
          console.log('✅ MediaPipe 檢測到的姿勢:', poseKeypoints);
          resolve(poseKeypoints);
        } else {
          console.log('⚠️ MediaPipe 未檢測到姿勢');
          resolve(null);
        }
      });

      // 創建 canvas 來處理圖像
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        pose.send({ image: canvas }).catch((err: any) => {
          console.error('MediaPipe 處理錯誤:', err);
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        });
      }
      
      // 設置超時
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 15000);
    });
  } catch (error) {
    console.error('MediaPipe Pose 載入失敗:', error);
    return null;
  }
  */
}

// 改進的人體檢測（基於膚色和邊緣檢測，作為備用方案）
async function detectHumans(image: HTMLImageElement): Promise<HumanRegion[]> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve([]);
      return;
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // 獲取圖像數據進行分析
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 膚色檢測（簡化版）
    const skinPixels: { x: number; y: number }[] = [];
    const skinColorRanges = [
      // 膚色範圍（RGB）
      { rMin: 95, rMax: 255, gMin: 40, gMax: 200, bMin: 20, bMax: 180 },
    ];

    for (let y = 0; y < canvas.height; y += 4) { // 每4像素採樣一次以加快速度
      for (let x = 0; x < canvas.width; x += 4) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // 跳過透明像素
        if (a < 128) continue;

        // 檢查是否在膚色範圍內
        for (const range of skinColorRanges) {
          if (
            r >= range.rMin && r <= range.rMax &&
            g >= range.gMin && g <= range.gMax &&
            b >= range.bMin && b <= range.bMax
          ) {
            skinPixels.push({ x, y });
            break;
          }
        }
      }
    }

    // 如果沒有檢測到足夠的膚色像素，嘗試使用圖像分割來檢測多人
    // 降低閾值，嘗試檢測更多人
    if (skinPixels.length < 50) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // 使用更保守的默認位置，確保肩膀位置合理（約在圖片高度的 40% 處）
      const defaultPose: PoseKeypoints = {
        leftShoulder: { x: centerX - canvas.width * 0.15, y: canvas.height * 0.40 }, // 調整為 0.40，確保在頭部下方
        rightShoulder: { x: centerX + canvas.width * 0.15, y: canvas.height * 0.40 },
        leftHip: { x: centerX - canvas.width * 0.12, y: canvas.height * 0.55 },
        rightHip: { x: centerX + canvas.width * 0.12, y: canvas.height * 0.55 },
        leftKnee: { x: centerX - canvas.width * 0.1, y: canvas.height * 0.75 },
        rightKnee: { x: centerX + canvas.width * 0.1, y: canvas.height * 0.75 },
      };
      resolve([{
        centerX,
        centerY,
        width: canvas.width * 0.4,
        height: canvas.height * 0.7,
        pose: defaultPose,
      }]);
      return;
    }

    // 使用聚類算法找到多個人體區域
    const regions: HumanRegion[] = [];
    const processed = new Set<string>();
      for (const pixel of skinPixels) {
        const key = `${Math.floor(pixel.x / 20)}_${Math.floor(pixel.y / 20)}`;
        if (processed.has(key)) continue;

        const regionPixels: { x: number; y: number }[] = [pixel];
        const queue = [pixel];
        processed.add(key);

        while (queue.length > 0) {
          const current = queue.shift()!;
          const neighbors = [
            { x: current.x - 4, y: current.y },
            { x: current.x + 4, y: current.y },
            { x: current.x, y: current.y - 4 },
            { x: current.x, y: current.y + 4 },
          ];

          for (const neighbor of neighbors) {
            if (neighbor.x < 0 || neighbor.x >= canvas.width || neighbor.y < 0 || neighbor.y >= canvas.height) continue;
            
            const nKey = `${Math.floor(neighbor.x / 20)}_${Math.floor(neighbor.y / 20)}`;
            if (processed.has(nKey)) continue;

            const nIdx = (neighbor.y * canvas.width + neighbor.x) * 4;
            const nr = data[nIdx];
            const ng = data[nIdx + 1];
            const nb = data[nIdx + 2];
            const na = data[nIdx + 3];

            if (na < 128) continue;

            let isSkin = false;
            for (const range of skinColorRanges) {
              if (
                nr >= range.rMin && nr <= range.rMax &&
                ng >= range.gMin && ng <= range.gMax &&
                nb >= range.bMin && nb <= range.bMax
              ) {
                isSkin = true;
                break;
              }
            }

            if (isSkin) {
              regionPixels.push(neighbor);
              queue.push(neighbor);
              processed.add(nKey);
            }
          }
        }

        if (regionPixels.length > 100) {
          const region = detectPersonInRegion(regionPixels, canvas, data, skinColorRanges);
          if (region) regions.push(region);
        }
      }

    // 過濾和合併區域：如果兩個區域太接近或重疊，合併為一個
    const filteredRegions: HumanRegion[] = [];
    for (let i = 0; i < regions.length; i++) {
      let merged = false;
      for (let j = 0; j < filteredRegions.length; j++) {
        const r1 = regions[i];
        const r2 = filteredRegions[j];
        
        // 計算兩個區域的距離
        const distance = Math.sqrt(
          Math.pow(r1.centerX - r2.centerX, 2) + 
          Math.pow(r1.centerY - r2.centerY, 2)
        );
        
        // 如果距離小於兩個區域平均寬度的1.5倍，認為是同一個人
        const avgWidth = (r1.width + r2.width) / 2;
        if (distance < avgWidth * 1.5) {
          // 合併區域：使用較大的區域
          if (r1.width * r1.height > r2.width * r2.height) {
            filteredRegions[j] = r1;
          }
          merged = true;
          break;
        }
      }
      
      if (!merged) {
        filteredRegions.push(regions[i]);
      }
    }

    // 如果沒有檢測到區域，使用默認位置
    if (filteredRegions.length === 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // 使用更保守的默認位置，確保肩膀位置合理（約在圖片高度的 40% 處）
      const defaultPose: PoseKeypoints = {
        leftShoulder: { x: centerX - canvas.width * 0.15, y: canvas.height * 0.40 }, // 調整為 0.40，確保在頭部下方
        rightShoulder: { x: centerX + canvas.width * 0.15, y: canvas.height * 0.40 },
        leftHip: { x: centerX - canvas.width * 0.12, y: canvas.height * 0.55 },
        rightHip: { x: centerX + canvas.width * 0.12, y: canvas.height * 0.55 },
        leftKnee: { x: centerX - canvas.width * 0.1, y: canvas.height * 0.75 },
        rightKnee: { x: centerX + canvas.width * 0.1, y: canvas.height * 0.75 },
      };
      filteredRegions.push({
        centerX,
        centerY,
        width: canvas.width * 0.4,
        height: canvas.height * 0.7,
        pose: defaultPose,
      });
    }

    console.log('檢測結果：原始區域數:', regions.length, '過濾後區域數:', filteredRegions.length);
    resolve(filteredRegions);
  });
}

// 根據衣服類別和姿勢計算貼合位置
function calculateClothPosition(
  category: string,
  pose: PoseKeypoints,
  canvasWidth: number,
  canvasHeight: number,
  gender?: string
): { x: number; y: number; width: number; height: number; rotation?: number } {
  if (!pose.leftShoulder || !pose.rightShoulder) {
    return getDefaultPosition(category, canvasWidth, canvasHeight, gender);
  }

  // 此時已經確認 leftShoulder 和 rightShoulder 存在
  const leftShoulder = pose.leftShoulder;
  const rightShoulder = pose.rightShoulder;
  
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

  // 計算頭部位置：假設頭部高度約為肩膀寬度的 1.5 倍（更保守的估算）
  const headHeight = shoulderWidth * 1.5;
  // 頭部底部應該在肩膀上方，估算為肩膀 Y 位置減去頭部高度
  const estimatedHeadBottomY = shoulderCenterY - headHeight;
  
  // 衣服必須從肩膀位置開始，並且絕對不能覆蓋頭部
  // 關鍵：衣服的 Y 位置必須至少是 shoulderCenterY（肩膀中心），絕對不能更小
  // 為了確保不覆蓋臉部，我們使用更保守的計算：
  // 1. 衣服的頂部應該在肩膀中心位置或更低
  // 2. 如果估算的頭部底部在肩膀上方，衣服應該從肩膀中心開始
  const minShirtY = shoulderCenterY; // 直接使用肩膀中心 Y，確保衣服從肩膀開始
  
  console.log('衣服位置計算詳情:', {
    shoulderCenterY,
    shoulderWidth,
    headHeight,
    estimatedHeadBottomY,
    minShirtY,
    '肩膀寬度': shoulderWidth,
    '頭部高度': headHeight,
    '頭部底部Y': estimatedHeadBottomY,
    '最終衣服Y': minShirtY,
    '左肩位置': leftShoulder,
    '右肩位置': rightShoulder
  });

  // 根據類別計算位置（改進：更精確的尺寸計算）
  const positions: Record<string, () => { x: number; y: number; width: number; height: number }> = {
    'T恤': () => ({
      x: leftShoulder.x - shoulderWidth * 0.35, // 稍微擴大寬度，讓衣服更自然
      y: minShirtY, // 直接從肩膀中心開始，確保不覆蓋臉部
      width: shoulderWidth * 1.7, // 增加寬度，模擬布料自然垂墜
      height: shoulderWidth * 0.85, // 稍微增加高度
    }),
    '襯衫': () => ({
      x: leftShoulder.x - shoulderWidth * 0.35,
      y: minShirtY, // 直接從肩膀中心開始
      width: shoulderWidth * 1.7,
      height: shoulderWidth * 0.85,
    }),
    '針織衫': () => ({
      x: leftShoulder.x - shoulderWidth * 0.35,
      y: minShirtY, // 直接從肩膀中心開始
      width: shoulderWidth * 1.7,
      height: shoulderWidth * 0.85,
    }),
    '連帽衫': () => ({
      x: leftShoulder.x - shoulderWidth * 0.3,
      y: minShirtY, // 連帽衫也從肩膀中心開始，不向上延伸
      width: shoulderWidth * 1.6,
      height: shoulderWidth * 1.0,
    }),
    '外套': () => ({
      x: leftShoulder.x - shoulderWidth * 0.4,
      y: minShirtY, // 外套也從肩膀中心開始
      width: shoulderWidth * 1.8,
      height: shoulderWidth * 1.2,
    }),
    '大衣': () => ({
      x: leftShoulder.x - shoulderWidth * 0.4,
      y: minShirtY, // 大衣也從肩膀中心開始
      width: shoulderWidth * 1.8,
      height: shoulderWidth * 1.6,
    }),
    '羽絨服': () => ({
      x: leftShoulder.x - shoulderWidth * 0.4,
      y: minShirtY, // 羽絨服也從肩膀中心開始
      width: shoulderWidth * 1.8,
      height: shoulderWidth * 1.4,
    }),
    '褲子': () => {
      const hipCenterX = pose.leftHip && pose.rightHip 
        ? (pose.leftHip.x + pose.rightHip.x) / 2 
        : shoulderCenterX;
      const hipCenterY = pose.leftHip && pose.rightHip
        ? (pose.leftHip.y + pose.rightHip.y) / 2
        : shoulderCenterY + shoulderWidth * 1.2;
      const hipWidth = pose.leftHip && pose.rightHip
        ? Math.abs(pose.rightHip.x - pose.leftHip.x)
        : shoulderWidth;
      
      return {
        x: hipCenterX - hipWidth * 0.4,
        y: hipCenterY,
        width: hipWidth * 0.8,
        height: (pose.leftKnee && pose.leftAnkle) 
          ? Math.abs(pose.leftAnkle.y - hipCenterY)
          : shoulderWidth * 1.5,
      };
    },
    '短褲': () => {
      const hipCenterX = pose.leftHip && pose.rightHip 
        ? (pose.leftHip.x + pose.rightHip.x) / 2 
        : shoulderCenterX;
      const hipCenterY = pose.leftHip && pose.rightHip
        ? (pose.leftHip.y + pose.rightHip.y) / 2
        : shoulderCenterY + shoulderWidth * 1.2;
      const hipWidth = pose.leftHip && pose.rightHip
        ? Math.abs(pose.rightHip.x - pose.leftHip.x)
        : shoulderWidth;
      
      return {
        x: hipCenterX - hipWidth * 0.4,
        y: hipCenterY,
        width: hipWidth * 0.8,
        height: (pose.leftKnee) 
          ? Math.abs(pose.leftKnee.y - hipCenterY)
          : shoulderWidth * 0.8,
      };
    },
    '裙子': () => {
      const hipCenterX = pose.leftHip && pose.rightHip 
        ? (pose.leftHip.x + pose.rightHip.x) / 2 
        : shoulderCenterX;
      const hipCenterY = pose.leftHip && pose.rightHip
        ? (pose.leftHip.y + pose.rightHip.y) / 2
        : shoulderCenterY + shoulderWidth * 1.2;
      const hipWidth = pose.leftHip && pose.rightHip
        ? Math.abs(pose.rightHip.x - pose.leftHip.x)
        : shoulderWidth;
      
      return {
        x: hipCenterX - hipWidth * 0.5,
        y: hipCenterY,
        width: hipWidth * 1.0,
        height: (pose.leftKnee) 
          ? Math.abs(pose.leftKnee.y - hipCenterY) * 1.2
          : shoulderWidth * 1.2,
      };
    },
    '洋裝': () => ({
      x: leftShoulder.x - shoulderWidth * 0.3,
      y: minShirtY, // 洋裝也從肩膀中心開始
      width: shoulderWidth * 1.6,
      height: (pose.leftKnee) 
        ? Math.abs(pose.leftKnee.y - minShirtY) + shoulderWidth * 0.2
        : shoulderWidth * 2.0,
    }),
  };

  const positionFn = positions[category];
  if (positionFn) {
    return positionFn();
  }

  return getDefaultPosition(category, canvasWidth, canvasHeight, gender);
}

// 默認位置
function getDefaultPosition(
  category: string,
  canvasWidth: number,
  canvasHeight: number,
  gender?: string
): { x: number; y: number; width: number; height: number } {
  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {
    'T恤': { x: canvasWidth * 0.2, y: canvasHeight * 0.25, width: canvasWidth * 0.6, height: canvasHeight * 0.25 },
    '襯衫': { x: canvasWidth * 0.2, y: canvasHeight * 0.25, width: canvasWidth * 0.6, height: canvasHeight * 0.25 },
    '針織衫': { x: canvasWidth * 0.2, y: canvasHeight * 0.25, width: canvasWidth * 0.6, height: canvasHeight * 0.25 },
    '連帽衫': { x: canvasWidth * 0.2, y: canvasHeight * 0.22, width: canvasWidth * 0.6, height: canvasHeight * 0.30 },
    '外套': { x: canvasWidth * 0.15, y: canvasHeight * 0.22, width: canvasWidth * 0.7, height: canvasHeight * 0.35 },
    '大衣': { x: canvasWidth * 0.15, y: canvasHeight * 0.22, width: canvasWidth * 0.7, height: canvasHeight * 0.40 },
    '羽絨服': { x: canvasWidth * 0.15, y: canvasHeight * 0.22, width: canvasWidth * 0.7, height: canvasHeight * 0.40 },
    '褲子': { x: canvasWidth * 0.25, y: canvasHeight * 0.50, width: canvasWidth * 0.5, height: canvasHeight * 0.45 },
    '短褲': { x: canvasWidth * 0.25, y: canvasHeight * 0.50, width: canvasWidth * 0.5, height: canvasHeight * 0.25 },
    '裙子': { x: canvasWidth * 0.25, y: canvasHeight * 0.45, width: canvasWidth * 0.5, height: canvasHeight * 0.40 },
    '洋裝': { x: canvasWidth * 0.2, y: canvasHeight * 0.25, width: canvasWidth * 0.6, height: canvasHeight * 0.60 },
  };

  return positions[category] || { 
    x: canvasWidth * 0.3, 
    y: canvasHeight * 0.3, 
    width: canvasWidth * 0.4, 
    height: canvasHeight * 0.4 
  };
}

export default function FittingRoom({ avatarUrl, clothes, gender }: FittingRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedHumans, setDetectedHumans] = useState<HumanRegion[]>([]);
  const [selectedHumanIndex, setSelectedHumanIndex] = useState<number>(0);
  const [showHumanSelection, setShowHumanSelection] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualPose, setManualPose] = useState<PoseKeypoints | null>(null);

  // 檢測人體姿勢（優先使用 MediaPipe Pose）
  useEffect(() => {
    if (!avatarUrl) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      imageRef.current = img;
      
      // 優先嘗試使用 MediaPipe Pose
      console.log('嘗試使用 MediaPipe Pose 檢測姿勢...');
      const mediaPipePose = await detectPoseWithMediaPipe(img);
      
      if (mediaPipePose && mediaPipePose.leftShoulder && mediaPipePose.rightShoulder) {
        // MediaPipe 檢測成功，創建一個 HumanRegion
        const shoulderCenterX = (mediaPipePose.leftShoulder.x + mediaPipePose.rightShoulder.x) / 2;
        const shoulderCenterY = (mediaPipePose.leftShoulder.y + mediaPipePose.rightShoulder.y) / 2;
        const shoulderWidth = Math.abs(mediaPipePose.rightShoulder.x - mediaPipePose.leftShoulder.x);
        
        const humanRegion: HumanRegion = {
          centerX: shoulderCenterX,
          centerY: shoulderCenterY,
          width: shoulderWidth * 2,
          height: img.height * 0.7,
          pose: mediaPipePose,
        };
        
        console.log('✅ MediaPipe 檢測成功，使用 MediaPipe 姿勢');
        setDetectedHumans([humanRegion]);
        setSelectedHumanIndex(0);
        setShowHumanSelection(false);
        setIsManualMode(false);
      } else {
        // MediaPipe 檢測失敗，使用備用方案
        console.log('⚠️ MediaPipe 檢測失敗，使用備用檢測方案...');
        const humans = await detectHumans(img);
        console.log('檢測到的人體:', humans.length, humans);
        setDetectedHumans(humans);
        
        if (humans.length > 1) {
          setShowHumanSelection(true);
          setSelectedHumanIndex(0);
        } else if (humans.length === 1) {
          setSelectedHumanIndex(0);
          setShowHumanSelection(false);
          setIsManualMode(false);
        } else {
          setIsManualMode(true);
          setShowHumanSelection(false);
        }
      }
    };

    img.onerror = () => {
      setError('無法載入照片');
    };

    img.src = avatarUrl;
  }, [avatarUrl]);

  // 將 URL 轉換為 File 對象
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`無法載入圖片: ${response.statusText}`);
      }
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type || 'image/png' });
    } catch (error: any) {
      console.error('URL 轉 File 失敗:', error);
      throw error;
    }
  };

  // AI 試穿處理函數（使用 OpenAI Images Edits API）
  useEffect(() => {
    if (clothes.length === 0 || !avatarUrl) {
      setProcessedImage(null);
      return;
    }

    // 如果還在選擇人物，不處理
    if (showHumanSelection && detectedHumans.length > 1) {
      return;
    }

    console.log('開始 AI 試衣處理，衣服數量:', clothes.length);
    setIsProcessing(true);
    setError(null);

    // 使用 OpenAI API 進行 AI 試穿
    const handleAITryOn = async () => {
      try {
        // 目前先處理第一件衣服（未來可以擴展為多件）
        const firstCloth = clothes[0];
        const clothUrl = firstCloth.image_processed_url || firstCloth.image_url;
        
        if (!clothUrl) {
          throw new Error('衣服圖片不存在');
        }

        console.log('準備上傳圖片到 OpenAI API...');
        console.log('人物照片 URL:', avatarUrl);
        console.log('衣服圖片 URL:', clothUrl);

        // 將 URL 轉換為 File
        const personFile = await urlToFile(avatarUrl, 'person.png');
        const clothFile = await urlToFile(clothUrl, 'cloth.png');

        // 創建 FormData
        const formData = new FormData();
        formData.append('person', personFile);
        formData.append('cloth', clothFile);

        console.log('發送請求到 /api/tryon...');
        const response = await fetch('/api/tryon', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API 錯誤: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data?.imageUrl) {
          console.log('✅ AI 試衣成功');
          setProcessedImage(result.data.imageUrl);
        } else {
          throw new Error(result.error || 'AI 試衣失敗');
        }
      } catch (err: any) {
        console.error('AI 試衣錯誤:', err);
        setError(err.message || 'AI 試衣處理失敗');
        setProcessedImage(null);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAITryOn();

    // 使用 Canvas 模式進行試穿

    // 使用 Canvas 合成模式（當前實現）
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const avatarImg = imageRef.current;
      canvas.width = avatarImg.width;
      canvas.height = avatarImg.height;

      // 繪製背景
      ctx.drawImage(avatarImg, 0, 0, canvas.width, canvas.height);

      // 獲取選中的人體姿勢
      let pose: PoseKeypoints | null = null;
      if (isManualMode && manualPose) {
        pose = manualPose;
        console.log('使用手動姿勢:', pose);
      } else if (detectedHumans.length > 0 && selectedHumanIndex < detectedHumans.length) {
        pose = detectedHumans[selectedHumanIndex].pose;
        console.log('使用檢測到的姿勢 (人物', selectedHumanIndex, '):', pose);
        console.log('肩膀位置:', pose.leftShoulder, pose.rightShoulder);
      } else {
        console.log('沒有可用的姿勢，使用默認位置');
      }

      // 可選：繪製調試信息（檢測到的關鍵點）
      if (pose && process.env.NODE_ENV === 'development') {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        if (pose.leftShoulder && pose.rightShoulder) {
          ctx.beginPath();
          ctx.moveTo(pose.leftShoulder.x, pose.leftShoulder.y);
          ctx.lineTo(pose.rightShoulder.x, pose.rightShoulder.y);
          ctx.stroke();
          // 繪製肩膀點
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(pose.leftShoulder.x, pose.leftShoulder.y, 5, 0, Math.PI * 2);
          ctx.arc(pose.rightShoulder.x, pose.rightShoulder.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 定義衣服的層級順序
      const zIndexMap: Record<string, number> = {
        '內衣': 4,
        'T恤': 3,
        '襯衫': 3,
        '針織衫': 3,
        '連帽衫': 3,
        '外套': 2,
        '大衣': 2,
        '羽絨服': 2,
        '褲子': 3,
        '短褲': 3,
        '裙子': 3,
        '洋裝': 3,
        '配件': 5,
        '包包': 6,
      };

      const sortedClothes = [...clothes].sort((a, b) => {
        const zA = zIndexMap[a.category || '其他'] || 2;
        const zB = zIndexMap[b.category || '其他'] || 2;
        return zA - zB;
      });

      let loadedCount = 0;
      const totalClothes = sortedClothes.length;

      sortedClothes.forEach((cloth) => {
        const clothImg = new window.Image();
        clothImg.crossOrigin = 'anonymous';
        const imageUrl = cloth.image_processed_url || cloth.image_url;
        
        if (!imageUrl) {
          loadedCount++;
          if (loadedCount === totalClothes) {
            setIsProcessing(false);
            setProcessedImage(canvas.toDataURL('image/png'));
          }
          return;
        }

          clothImg.onload = () => {
            try {
              const position = pose
                ? calculateClothPosition(
                    cloth.category || '其他',
                    pose,
                    canvas.width,
                    canvas.height,
                    gender
                  )
                : getDefaultPosition(
                    cloth.category || '其他',
                    canvas.width,
                    canvas.height,
                    gender
                  );

              console.log('衣服位置計算:', {
                category: cloth.category,
                position,
                pose: pose ? { leftShoulder: pose.leftShoulder, rightShoulder: pose.rightShoulder } : null
              });

              // 創建一個臨時 canvas 來處理衣服圖像
              const clothCanvas = document.createElement('canvas');
              clothCanvas.width = clothImg.width;
              clothCanvas.height = clothImg.height;
              const clothCtx = clothCanvas.getContext('2d');
              if (!clothCtx) {
                loadedCount++;
                if (loadedCount === totalClothes) {
                  setIsProcessing(false);
                  setProcessedImage(canvas.toDataURL('image/png'));
                }
                return;
              }

              // 繪製衣服到臨時 canvas
              clothCtx.drawImage(clothImg, 0, 0);

              // 計算變形參數，讓衣服更貼合身體
              const clothAspect = clothImg.width / clothImg.height;
              const targetAspect = position.width / position.height;
              
              let drawWidth = position.width;
              let drawHeight = position.height;
              let drawX = position.x;
              let drawY = position.y;

              // 保持比例但貼合目標區域
              if (clothAspect > targetAspect) {
                drawHeight = position.height;
                drawWidth = position.height * clothAspect;
                drawX = position.x + (position.width - drawWidth) / 2;
              } else {
                drawWidth = position.width;
                drawHeight = position.width / clothAspect;
                drawY = position.y + (position.height - drawHeight) / 2;
              }

              // 根據衣服類別應用不同的變形和混合效果，實現真實的試穿效果
              ctx.save();
              
              // 上衣類：應用更自然的變形和混合
              if (['T恤', '襯衫', '針織衫', '連帽衫', '外套', '大衣', '羽絨服', '洋裝'].includes(cloth.category || '')) {
                if (pose && pose.leftShoulder && pose.rightShoulder) {
                  // 計算變形參數
                  const shoulderWidth = Math.abs(pose.rightShoulder.x - pose.leftShoulder.x);
                  const shoulderCenterX = (pose.leftShoulder.x + pose.rightShoulder.x) / 2;
                  const shoulderCenterY = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
                  
                  // 計算衣服中心點
                  const clothCenterX = drawX + drawWidth / 2;
                  const clothCenterY = drawY + drawHeight / 2;
                  
                  // 應用輕微的透視變形（模擬布料自然垂墜）
                  ctx.translate(clothCenterX, clothCenterY);
                  
                  // 根據肩膀位置調整變形，讓衣服更貼合身體曲線
                  const offsetX = (shoulderCenterX - clothCenterX) * 0.1; // 輕微偏移
                  const scaleX = 1.0 + Math.abs(offsetX) / drawWidth * 0.05; // 輕微縮放
                  
                  ctx.translate(offsetX, 0);
                  ctx.scale(scaleX, 1.0);
                  ctx.translate(-drawWidth / 2, -drawHeight / 2);
                  
                  // 使用 source-over 混合模式，保留衣服的顏色、版型和 logo
                  ctx.globalCompositeOperation = 'source-over';
                  ctx.globalAlpha = 0.98; // 高不透明度，保留衣服原始顏色和細節
                  
                  // 繪製衣服（保留所有細節：logo、顏色、版型）
                  ctx.drawImage(clothCanvas, 0, 0, drawWidth, drawHeight);
                } else {
                  // 沒有姿勢信息，使用簡單繪製
                  ctx.globalCompositeOperation = 'source-over';
                  ctx.globalAlpha = 0.98;
                  ctx.drawImage(clothCanvas, drawX, drawY, drawWidth, drawHeight);
                }
              } else {
                // 下裝類：使用標準繪製，保留細節
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.98;
                ctx.drawImage(clothCanvas, drawX, drawY, drawWidth, drawHeight);
              }

              // 添加輕微的陰影和光照效果，增加真實感和立體感
              if (pose && (pose.leftShoulder || pose.rightShoulder)) {
                ctx.save();
                
                // 在衣服邊緣添加輕微陰影（模擬布料厚度和立體感）
                ctx.globalCompositeOperation = 'multiply';
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = '#000000';
                
                // 在衣服下方添加陰影（模擬布料垂墜）
                const shadowBlur = 5;
                const shadowOffset = 2;
                
                // 創建陰影路徑
                ctx.beginPath();
                ctx.rect(
                  drawX - shadowOffset,
                  drawY + drawHeight - shadowOffset,
                  drawWidth + shadowOffset * 2,
                  shadowOffset * 2
                );
                ctx.fill();
                
                // 添加側面陰影（模擬立體感和光照）
                ctx.beginPath();
                ctx.rect(
                  drawX + drawWidth - shadowOffset,
                  drawY,
                  shadowOffset,
                  drawHeight
                );
                ctx.fill();
                
                ctx.restore();
              }

              ctx.restore();

            loadedCount++;
            if (loadedCount === totalClothes) {
              setIsProcessing(false);
              setProcessedImage(canvas.toDataURL('image/png'));
            }
          } catch (err) {
            console.error('繪製衣服失敗:', err);
            loadedCount++;
            if (loadedCount === totalClothes) {
              setIsProcessing(false);
              setProcessedImage(canvas.toDataURL('image/png'));
            }
          }
        };

        clothImg.onerror = () => {
          loadedCount++;
          if (loadedCount === totalClothes) {
            setIsProcessing(false);
            setProcessedImage(canvas.toDataURL('image/png'));
          }
        };

        clothImg.src = imageUrl;
      });
    } catch (err) {
      console.error('處理失敗:', err);
      setError('處理失敗，請重試');
      setIsProcessing(false);
    }
  }, [avatarUrl, clothes, gender, detectedHumans, selectedHumanIndex, isManualMode, manualPose, showHumanSelection]);

  // 手動點擊設定肩膀位置
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isManualMode || !imageRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = imageRef.current.width / rect.width;
    const scaleY = imageRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 第一次點擊：左肩，第二次點擊：右肩
    if (!manualPose || !manualPose.leftShoulder) {
      setManualPose({
        leftShoulder: { x, y },
        rightShoulder: undefined,
      });
    } else if (!manualPose.rightShoulder) {
      setManualPose({
        ...manualPose,
        rightShoulder: { x, y },
      });
      setIsManualMode(false);
    }
  };

  if (!avatarUrl) {
    return (
      <div className="text-center">
        <div className="inline-block p-8 bg-white rounded-2xl shadow-lg mb-4">
          <svg className="w-32 h-32 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-stone-600 font-medium">請先上傳照片並選擇衣服</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* 多人選擇界面 */}
      {showHumanSelection && detectedHumans.length > 1 && (
        <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-stone-200">
          <p className="text-sm text-stone-600 mb-3">檢測到 {detectedHumans.length} 個人，請選擇要試穿的人：</p>
          <div className="flex gap-2 flex-wrap">
            {detectedHumans.map((human, index) => (
              <button
                key={index}
                onClick={async () => {
                  console.log('點擊選擇人物:', index, '當前選擇:', selectedHumanIndex, '檢測到的人數:', detectedHumans.length);
                  // 先更新選擇
                  setSelectedHumanIndex(index);
                  setShowHumanSelection(false);
                  // 強制清除處理過的圖片，觸發重新處理
                  setProcessedImage(null);
                  // 等待狀態更新
                  await new Promise(resolve => setTimeout(resolve, 50));
                  console.log('選擇後 - 人物索引已更新為:', index);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedHumanIndex === index
                    ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                人物 {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 手動模式提示 */}
      {isManualMode && (
        <div className="mb-4 p-4 bg-amber-50 rounded-xl shadow-sm border border-amber-200">
          <p className="text-sm text-amber-800 mb-2">
            <strong>無法自動檢測人體位置</strong>
          </p>
          <p className="text-xs text-amber-700">
            {!manualPose || !manualPose.leftShoulder
              ? '請點擊照片中左肩的位置'
              : !manualPose.rightShoulder
              ? '請點擊照片中右肩的位置'
              : '位置已設定'}
          </p>
        </div>
      )}

      {isProcessing ? (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-4 border-white shadow-2xl bg-stone-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-400 border-t-transparent mb-4"></div>
            <p className="text-stone-600 font-medium">AI虛擬試穿處理中...</p>
            <p className="text-stone-500 text-sm mt-2">正在檢測人體位置並貼合衣服</p>
          </div>
        </div>
      ) : error ? (
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-4 border-white shadow-2xl bg-stone-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <p className="text-stone-500 text-sm">請確保照片清晰且包含完整人體</p>
          </div>
        </div>
      ) : processedImage ? (
        <div 
          className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-4 border-white shadow-2xl cursor-pointer"
          onClick={handleImageClick}
        >
          <Image
            src={processedImage}
            alt="AI試衣效果"
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div 
          className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-4 border-white shadow-2xl cursor-pointer"
          onClick={handleImageClick}
        >
          <Image
            src={avatarUrl}
            alt="試衣效果"
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
