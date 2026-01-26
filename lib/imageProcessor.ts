// 此文件已不再使用（去背現在在前端使用 @imgly/background-removal）
// 保留此文件僅供參考，未來可能需要服務端去背時使用

/**
 * 從圖片中提取主要顏色
 */
export async function extractDominantColor(imagePath: string): Promise<string> {
  try {
    const image = sharp(imagePath);
    
    // 縮小圖片以加快處理速度
    const resized = image.resize(100, 100, { fit: 'inside' });
    
    // 取得圖片統計資訊
    const stats = await resized.stats();
    
    // 檢查 stats 結構
    if (!stats || !stats.channels) {
      console.warn('無法取得顏色統計資訊');
      return '#808080';
    }
    
    // 取得主要顏色（使用第一個通道的 dominant）
    // sharp 的 stats 返回 channels 陣列
    const channels = stats.channels;
    if (!channels || channels.length < 3) {
      console.warn('顏色通道不足');
      return '#808080';
    }
    
    // 取得每個通道的主要值
    const r = Math.round(channels[0]?.mean || 128);
    const g = Math.round(channels[1]?.mean || 128);
    const b = Math.round(channels[2]?.mean || 128);
    
    // 將 RGB 轉換為十六進位顏色碼
    const hexR = Math.max(0, Math.min(255, r)).toString(16).padStart(2, '0');
    const hexG = Math.max(0, Math.min(255, g)).toString(16).padStart(2, '0');
    const hexB = Math.max(0, Math.min(255, b)).toString(16).padStart(2, '0');
    
    const colorCode = `#${hexR}${hexG}${hexB}`;
    console.log('提取的顏色:', colorCode, { r, g, b });
    return colorCode;
  } catch (error: any) {
    console.error('顏色提取失敗:', error.message || error);
    return '#808080'; // 灰色作為預設值
  }
}
