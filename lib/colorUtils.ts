// 顏色大分類工具函數

// 將精準色號（hex）轉換為顏色大分類
export function getColorCategory(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) {
    return '其他';
  }

  // 移除 # 並轉換為 RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 計算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 計算飽和度
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // 判斷顏色大分類
  // 先判斷黑色和深色（最暗的）
  if (brightness < 30) {
    return '黑色';
  }

  // 先判斷顏色系，再判斷灰色系（避免偏紅但被歸類為灰色）
  const diffRG = Math.abs(r - g);
  const diffGB = Math.abs(g - b);
  const diffRB = Math.abs(r - b);
  const maxDiff = Math.max(diffRG, diffGB, diffRB);

  // 計算相對比例，判斷主導色
  const total = r + g + b;
  const rRatio = r / total;
  const gRatio = g / total;
  const bRatio = b / total;

  // 優先判斷米色/米黃色（最高優先級，避免被誤判為紅色或灰色）
  // 米色/米黃色：中高亮度，R、G、B 都較高且接近，低飽和度
  // 特徵：R 和 G 接近，B 稍低，整體偏暖色調
  // 例如 #F5E6D3 (245, 230, 211) 或 #E6D5B8 (230, 213, 184) 或 #D2B48C (210, 180, 140) 應該被識別為米色
  if (brightness > 120) {
    // 情況1：R 和 G 非常接近（差異 < 50），且都較高，B 稍低
    if (Math.abs(r - g) < 50 && r > 110 && g > 110) {
      // B 可以稍低，但不能太低（> 70）
      if (b > 70 && b < r + 100 && b < g + 100) {
        // 飽和度較低
        if (saturation < 0.5) {
          return '米色';
        }
      }
    }
    // 情況2：R 稍高於 G（米黃色），但差異不大（< 70），且 B 也較高
    // 例如 #CDA17A (205, 161, 122): r=205, g=161, b=122, r-g=44, r-b=83
    if (r > g && r - g < 70 && r > 120 && g > 100 && b > 90) {
      // 確保不是紅色系（R 不能明顯高於 G 和 B）
      // 如果 r - g < 70 且 r - b < 100，且飽和度不太高，則是米色
      if (r - g < 70 && r - b < 100 && saturation < 0.5) {
        return '米色';
      }
    }
    // 情況3：更寬鬆的米色判斷：R、G、B 都較高且接近
    // 例如 #CDA17A (205, 161, 122): maxDiff = 83, saturation = 0.405
    if (r > 120 && g > 110 && b > 90) {
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      // 如果最大差異 < 95 且飽和度 < 0.5，則是米色
      if (maxDiff < 95 && saturation < 0.5) {
        return '米色';
      }
    }
    // 情況4：淺米色/米白色：高亮度，R、G、B 都很高且接近
    if (brightness > 200 && r > 200 && g > 190 && b > 160) {
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      if (maxDiff < 50 && saturation < 0.3) {
        return '米色';
      }
    }
  }

  // 判斷深紅褐色/酒紅色/暗紅色（在米色之後，紅色之前）
  // 特徵：R 明顯高於 G 和 B，亮度低或中等，R 主導，但 G 和 B 都較低
  // 例如 #4A2C36 (74, 44, 54) 或 #8B0000 (139, 0, 0) 或 #A52A2A (165, 42, 42) 應該被識別為深紅
  if (r > 50 && r > g + 15 && r > b + 15) {
    // 如果 R 明顯是主導色
    if (rRatio > 0.38) {
      // 深紅：亮度低，或 G 和 B 都很低，或整體偏暗
      if (brightness < 100 || (g < 80 && b < 80 && brightness < 140)) {
        return '深紅';
      }
      // 如果亮度在 100-140 之間，且 R 明顯高於 G 和 B，也可能是深紅
      if (brightness >= 100 && brightness < 140 && r > g + 30 && r > b + 30) {
        return '深紅';
      }
    }
  }

  // 判斷棕色/卡其（在紅色之前，避免淺棕色被誤判為紅色）
  // 棕色/卡其：R 和 G 都較高，B 較低，亮度中等，R 和 G 接近
  if (r > 100 && g > 80 && b < 120 && brightness < 200 && Math.abs(r - g) < 50) {
    // 排除紅色系（R 不能明顯高於 G 和 B）
    if (!(r > g + 25 && r > b + 30)) {
      if (brightness > 150 && saturation < 0.4) {
        return '卡其';
      } else if (brightness > 120) {
        return '棕色';
      }
    }
  }

  // 紅色系（在深紅、棕色、米色之後判斷）
  // 使用較寬鬆的條件：R 明顯大於 G 和 B
  if (r > g + 15 && r > b + 15) {
    // 如果 R 明顯是主導色（R 佔比 > 0.42），且不是棕色系或米色系
    // 排除條件1：如果 R 和 G 接近（差異 < 40），且 G 較高，可能是棕色系
    const isBrownLike = Math.abs(r - g) < 40 && g > 100 && brightness > 120 && brightness < 200;
    // 排除條件2：如果 R 和 G 接近（差異 < 70），且 B 也較高，可能是米色系
    // 例如 #CDA17A: r-g=44, r=205, g=161, b=122, saturation=0.405
    const isBeigeLike = (Math.abs(r - g) < 70 && r > 110 && g > 100 && b > 90 && saturation < 0.5) ||
                        (r > 120 && g > 110 && b > 90 && Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 95 && saturation < 0.5);
    
    if (rRatio > 0.42 && !isBrownLike && !isBeigeLike) {
      // 粉色：高亮度且低飽和度，R 很高，G 也較高
      if (brightness > 200 && saturation < 0.4 && r > 200 && g > 150) {
        return '粉色';
      } 
      // 深紅：已經在上面判斷過了，這裡只處理中等亮度的紅色
      // 如果亮度在 100-200 之間，且 R 明顯高於 G 和 B，則是紅色
      if (brightness >= 100 && brightness < 200) {
        return '紅色';
      }
      // 如果亮度很高（> 200），可能是淺紅色或粉色，但已經排除粉色，所以是紅色
      if (brightness >= 200 && !(saturation < 0.4 && r > 200 && g > 150)) {
        return '紅色';
      }
    }
  }

  // 藍色系
  if (b > r + 20 && b > g + 20) {
    if (brightness < 80) {
      return '深藍';
    }
    return '藍色';
  }

  // 綠色系
  if (g > r + 20 && g > b + 20) {
    if (brightness < 80) {
      return '深綠';
    }
    return '綠色';
  }

  // 黃色/橙色系
  if (r > 150 && g > 150 && b < 100) {
    if (r > g + 20) {
      return '橙色';
    }
    return '黃色';
  }

  // 紫色系
  if (r > 100 && b > 100 && g < 100) {
    return '紫色';
  }

  // 白色和淺色（在判斷灰色之前）
  if (brightness > 240 && saturation < 0.1) {
    return '白色';
  }

  // 灰色系（最後判斷，確保不是其他顏色系）
  // 灰色：飽和度非常低，且 R、G、B 非常接近
  // 提高閾值，避免將有色彩的顏色誤判為灰色
  // maxDiff < 30 太寬鬆，改為 maxDiff < 20 且 saturation < 0.15
  if (saturation < 0.15 && maxDiff < 20) {
    if (brightness < 100) {
      return '深灰';
    } else if (brightness > 200) {
      return '淺灰';
    }
    return '灰色';
  }
  
  // 如果飽和度很低但 maxDiff 較大，可能是淺色系的邊緣情況
  // 如果已經判斷過其他顏色但都不符合，且有低飽和度，可能是灰色
  if (saturation < 0.12 && maxDiff < 25) {
    if (brightness < 100) {
      return '深灰';
    } else if (brightness > 200) {
      return '淺灰';
    }
    return '灰色';
  }


  // 預設
  return '其他';
}

// 顏色大分類列表（用於篩選和統計）
export const COLOR_CATEGORIES = [
  '黑色', '白色', '灰色', '深灰', '淺灰', '米色', '卡其', '棕色',
  '藍色', '深藍', '綠色', '深綠', '紅色', '深紅', '粉色',
  '橙色', '黃色', '紫色', '其他'
];

// 顏色大分類的顯示顏色（用於視覺化）
export const COLOR_CATEGORY_DISPLAY_COLORS: Record<string, string> = {
  '黑色': '#000000',
  '白色': '#FFFFFF',
  '灰色': '#808080',
  '深灰': '#404040',
  '淺灰': '#C0C0C0',
  '米色': '#F5F5DC',
  '卡其': '#C3B091',
  '棕色': '#8B4513',
  '藍色': '#0066CC',
  '深藍': '#000080',
  '綠色': '#228B22',
  '深綠': '#006400',
  '紅色': '#FF4444', // 更鮮豔的紅色，與深紅區分更明顯
  '深紅': '#8B0000', // 深紅色/酒紅色
  '粉色': '#FFB6C1', // 更明顯的粉色
  '橙色': '#FF8C00',
  '黃色': '#FFD700',
  '紫色': '#800080',
  '其他': '#808080',
};
